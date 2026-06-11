require('dotenv').config();
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
require('./config/passport');

// Route imports
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const publisherRoutes = require('./routes/publisherRoutes');
const aiRoutes = require('./routes/aiRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const integrationsRoutes = require('./routes/integrationsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const cronRoutes = require('./routes/cronRoutes');

// Initialize app
const app = express();
app.set('trust proxy', 1); // Trust Vercel reverse proxy

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.CLIENT_URL, process.env.BASE_URL];
    if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Session & Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/posts', publisherRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/cron', cronRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Local development proxy — mirrors the Vercel Edge function in api/proxy-image.js
// Uses axios for reliable binary handling across all Node.js versions
const FLUX_SCHNELL_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";
const SD_FALLBACK_URL  = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

async function callHFAxios(modelUrl, prompt, hfToken, steps) {
  const response = await axios.post(
    modelUrl,
    {
      inputs: prompt,
      parameters: {
        num_inference_steps: steps,
        width: 1024,
        height: 1024
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json'
        // No x-wait-for-model — it holds the connection open (60s+) which causes
        // timeouts in both local Node and Vercel Edge environments
      },
      responseType: 'arraybuffer',
      timeout: 20000  // 20 second hard cap
    }
  );

  const contentType = response.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    const text = Buffer.from(response.data).toString('utf-8');
    return { success: false, buffer: null, status: response.status, errorBody: text };
  }

  return { success: true, buffer: Buffer.from(response.data), status: response.status, errorBody: null };
}

app.post('/api/proxy-image', async (req, res) => {
  try {
    const { prompt, hfToken } = req.body;
    if (!prompt || !hfToken) {
      return res.status(400).json({ error: 'Missing prompt or token' });
    }

    // --- Attempt 1: FLUX.1-schnell (free, 4 steps, ~4-6s when warm) ---
    let result;
    let usedModel = 'FLUX.1-schnell';
    try {
      console.log('[proxy] Trying FLUX.1-schnell...');
      result = await callHFAxios(FLUX_SCHNELL_URL, prompt, hfToken, 4);
      if (result.success) {
        console.log(`[proxy] ✅ FLUX.1-schnell success (${result.buffer.length} bytes)`);
      } else {
        console.warn(`[proxy] FLUX.1-schnell HTTP ${result.status}:`, result.errorBody?.slice(0, 150));
      }
    } catch (err) {
      const status = err.response?.status ?? (err.code === 'ECONNABORTED' ? 408 : 0);
      let errorBody = err.message;
      if (err.response?.data) {
        try { errorBody = Buffer.from(err.response.data).toString('utf-8'); } catch (_) {}
      }
      result = { success: false, buffer: null, status, errorBody };
      console.warn(`[proxy] FLUX.1-schnell threw (${status}):`, errorBody.slice(0, 150));
    }

    // --- Attempt 2: SDXL fallback ---
    if (!result.success) {
      try {
        usedModel = 'SDXL';
        console.log('[proxy] Trying SDXL fallback...');
        result = await callHFAxios(SD_FALLBACK_URL, prompt, hfToken, 20);
        if (result.success) {
          console.log(`[proxy] ✅ SDXL success (${result.buffer.length} bytes)`);
        } else {
          console.warn(`[proxy] SDXL HTTP ${result.status}:`, result.errorBody?.slice(0, 150));
        }
      } catch (err) {
        const status = err.response?.status ?? (err.code === 'ECONNABORTED' ? 408 : 0);
        let errorBody = err.message;
        if (err.response?.data) {
          try { errorBody = Buffer.from(err.response.data).toString('utf-8'); } catch (_) {}
        }
        result = { success: false, buffer: null, status, errorBody };
        console.warn(`[proxy] SDXL threw (${status}):`, errorBody.slice(0, 150));
      }
    }

    // --- Both failed: stock photo fallback ---
    if (!result.success) {
      console.warn(`[proxy] All AI models failed. Using LoremFlickr stock photo.`);
      const stopWords = new Set(['a','an','the','of','in','on','at','for','with','and','or','to','is','are','some']);
      const keywords = prompt.toLowerCase().split(/[^a-z0-9]+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
        .slice(0, 3)
        .join(',');
      const fallbackKeyword = encodeURIComponent(keywords || 'creative');
      const fallbackUrl = `https://loremflickr.com/1024/1024/${fallbackKeyword}?all=1&random=${Math.floor(Math.random() * 1000)}`;

      const fallbackResponse = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 10000 });

      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Fallback-Used', 'true');
      res.setHeader('X-HF-Status', String(result.status ?? 0));
      res.setHeader('X-HF-Error', (result.errorBody ?? 'unknown').slice(0, 500));
      return res.status(200).send(Buffer.from(fallbackResponse.data));
    }

    // --- AI success ---
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Used-Model', usedModel);
    return res.status(200).send(result.buffer);

  } catch (err) {
    console.error('[proxy] Unexpected error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use(errorHandler);

// Only listen if not running in Vercel serverless environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`SocioSync server running on port ${PORT}`);
  });
}

module.exports = app;

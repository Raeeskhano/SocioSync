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

// Local dev proxy — mirrors api/proxy-image.js (Vercel Edge function)
// PRIMARY: Pollinations.AI — free, no auth, uses FLUX model, simple GET
// SECONDARY: HF FLUX.1-schnell — free, needs HF_TOKEN
// LAST RESORT: LoremFlickr stock photo

function buildPollinationsUrl(prompt) {
  const encoded = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 999999);
  return `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=1024&height=1024&nologo=true&enhance=true&seed=${seed}`;
}

const HF_SCHNELL_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";

app.post('/api/proxy-image', async (req, res) => {
  try {
    const { prompt, hfToken } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    let result = { success: false, buffer: null, status: 0, errorBody: 'not attempted' };
    let usedModel = '';

    // ─── Attempt 1: Pollinations.AI (FLUX) ──────────────────────────────────
    try {
      console.log('[proxy] Trying Pollinations.AI FLUX...');
      const pollinationsUrl = buildPollinationsUrl(prompt);
      const polResponse = await axios.get(pollinationsUrl, {
        responseType: 'arraybuffer',
        timeout: 22000,
        headers: { 'Accept': 'image/*' }
      });
      const contentType = polResponse.headers['content-type'] || '';
      const buf = Buffer.from(polResponse.data);
      if (buf.length > 1000 && !contentType.includes('application/json')) {
        result = { success: true, buffer: buf, status: polResponse.status, errorBody: null };
        usedModel = 'pollinations-flux';
        console.log(`[proxy] ✅ Pollinations success (${buf.length} bytes)`);
      } else {
        result = { success: false, buffer: null, status: polResponse.status, errorBody: 'Response too small or JSON' };
        console.warn('[proxy] Pollinations returned invalid response');
      }
    } catch (err) {
      result = { success: false, buffer: null, status: err.response?.status ?? 0, errorBody: err.message };
      console.warn('[proxy] Pollinations threw:', err.message);
    }

    // ─── Attempt 2: HF FLUX.1-schnell ──────────────────────────────────────
    if (!result.success && hfToken) {
      try {
        console.log('[proxy] Trying HF FLUX.1-schnell...');
        const hfResponse = await axios.post(
          HF_SCHNELL_URL,
          { inputs: prompt, parameters: { num_inference_steps: 4, width: 1024, height: 1024 } },
          {
            headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
            responseType: 'arraybuffer',
            timeout: 20000
          }
        );
        const contentType = hfResponse.headers['content-type'] || '';
        const buf = Buffer.from(hfResponse.data);
        if (buf.length > 1000 && !contentType.includes('application/json')) {
          result = { success: true, buffer: buf, status: hfResponse.status, errorBody: null };
          usedModel = 'hf-flux-schnell';
          console.log(`[proxy] ✅ HF FLUX.1-schnell success (${buf.length} bytes)`);
        } else {
          const errText = buf.toString('utf-8');
          result = { success: false, buffer: null, status: hfResponse.status, errorBody: errText };
          console.warn('[proxy] HF schnell returned JSON error:', errText.slice(0, 150));
        }
      } catch (err) {
        const status = err.response?.status ?? (err.code === 'ECONNABORTED' ? 408 : 0);
        let errorBody = err.message;
        if (err.response?.data) {
          try { errorBody = Buffer.from(err.response.data).toString('utf-8'); } catch (_) {}
        }
        result = { success: false, buffer: null, status, errorBody };
        console.warn(`[proxy] HF schnell threw (${status}):`, errorBody.slice(0, 150));
      }
    }

    // ─── Success ─────────────────────────────────────────────────────────────
    if (result.success) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Used-Model', usedModel);
      return res.status(200).send(result.buffer);
    }

    // ─── All AI failed → LoremFlickr stock photo ─────────────────────────────
    console.warn('[proxy] All AI models failed. Using LoremFlickr stock photo.');
    const stopWords = new Set(['a','an','the','of','in','on','at','for','with','and','or','to','is','are','some']);
    const keywords = prompt.toLowerCase().split(/[^a-z0-9]+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
      .slice(0, 3)
      .join(',');
    const fallbackUrl = `https://loremflickr.com/1024/1024/${encodeURIComponent(keywords || 'creative')}?all=1&random=${Math.floor(Math.random() * 9999)}`;

    const fallbackResponse = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 10000 });
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Fallback-Used', 'true');
    res.setHeader('X-HF-Status', String(result.status ?? 0));
    res.setHeader('X-HF-Error', (result.errorBody ?? 'unknown').slice(0, 500));
    return res.status(200).send(Buffer.from(fallbackResponse.data));

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

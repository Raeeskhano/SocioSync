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

// Local development proxy for FLUX.1-dev via Hugging Face Inference API
// Uses axios instead of fetch for reliable SSL/TLS and binary handling across all Node versions
const FLUX_MODEL_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev";

app.post('/api/proxy-image', async (req, res) => {
  try {
    const { prompt, hfToken } = req.body;

    if (!prompt || !hfToken) {
      return res.status(400).json({ error: 'Missing prompt or token' });
    }

    let imageBuffer = null;
    let isHfSuccess = false;

    try {
      console.log('[FLUX proxy] Sending request to FLUX.1-dev via axios...');
      const hfResponse = await axios.post(
        FLUX_MODEL_URL,
        {
          inputs: prompt,
          parameters: {
            guidance_scale: 3.5,
            num_inference_steps: 28,
            width: 1024,
            height: 1024
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${hfToken}`,
            'Content-Type': 'application/json',
            'x-wait-for-model': 'true'   // Queue instead of returning 503 immediately
          },
          responseType: 'arraybuffer',   // Receive raw binary image data
          timeout: 120000                // 2-minute timeout for FLUX cold starts
        }
      );

      // If HF returns JSON inside arraybuffer, it's an error message
      const contentType = hfResponse.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const errorText = Buffer.from(hfResponse.data).toString('utf-8');
        console.warn('[FLUX proxy] HF returned JSON error:', errorText);
        isHfSuccess = false;
      } else {
        imageBuffer = Buffer.from(hfResponse.data);
        isHfSuccess = true;
        console.log(`[FLUX proxy] ✅ Success! Received ${imageBuffer.length} bytes from FLUX.1-dev`);
      }
    } catch (hfErr) {
      // Axios wraps HTTP error responses — check if we got a response body
      if (hfErr.response) {
        const statusCode = hfErr.response.status;
        let errBody = '';
        try {
          errBody = Buffer.from(hfErr.response.data).toString('utf-8');
        } catch (_) {}
        console.warn(`[FLUX proxy] FLUX.1-dev responded with HTTP ${statusCode}:`, errBody);
      } else {
        console.warn(`[FLUX proxy] FLUX.1-dev request failed: ${hfErr.message}`);
      }
      isHfSuccess = false;
    }

    if (!isHfSuccess) {
      console.warn('[FLUX proxy] Falling back to LoremFlickr stock photo...');
      const stopWords = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'at', 'for', 'with', 'and', 'or', 'to', 'is', 'are', 'some']);
      const keywords = prompt.toLowerCase().split(/[^a-z0-9]+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
        .slice(0, 3)
        .join(',');
      const fallbackKeyword = encodeURIComponent(keywords || 'beautiful');
      const fallbackUrl = `https://loremflickr.com/1024/1024/${fallbackKeyword}?all=1&random=${Math.floor(Math.random() * 1000)}`;

      const fallbackResponse = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 15000 });
      const fallbackBuffer = Buffer.from(fallbackResponse.data);

      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Fallback-Used', 'true');
      return res.status(200).send(fallbackBuffer);
    }

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).send(imageBuffer);
  } catch (err) {
    console.error('[FLUX proxy] Unexpected error:', err.message);
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

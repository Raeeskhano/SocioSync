export const config = {
  runtime: 'edge',
};

// FLUX.1-schnell: same FLUX architecture as dev, but:
//  - Free (Apache 2.0, no gating, no Pro subscription needed)
//  - Only 4 inference steps → ~4-6 seconds warm, well within Vercel's 25s Edge limit
//  - Excellent quality for social media / marketing images
const FLUX_SCHNELL_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";
// Reliable fallback if FLUX.1-schnell is cold/unavailable
const SD_FALLBACK_URL  = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

// Hard timeout: stay well inside Vercel Edge's 25-second wall-clock limit
const REQUEST_TIMEOUT_MS = 20000;

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function callHF(modelUrl, prompt, hfToken, steps) {
  // NOTE: Do NOT use x-wait-for-model — it holds the connection open for up to 60s,
  // which exceeds Vercel Edge's 25s hard limit and causes "internal error" crashes.
  const res = await fetchWithTimeout(
    modelUrl,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          num_inference_steps: steps,
          width: 1024,
          height: 1024
        }
      })
    },
    REQUEST_TIMEOUT_MS
  );

  const status = res.status;
  const contentType = res.headers.get('content-type') || '';

  if (res.ok && !contentType.includes('application/json')) {
    const buffer = await res.arrayBuffer();
    return { success: true, buffer, status, errorBody: null };
  }

  let errorBody = `HTTP ${status}`;
  try { errorBody = await res.text(); } catch (_) {}
  return { success: false, buffer: null, status, errorBody };
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { prompt, hfToken } = await req.json();
    if (!prompt || !hfToken) {
      return new Response(JSON.stringify({ error: 'Missing prompt or token' }), { status: 400 });
    }

    // --- Attempt 1: FLUX.1-schnell (primary — free, fast, same FLUX quality) ---
    let result;
    let usedModel = 'FLUX.1-schnell';
    try {
      console.log('[Edge] Trying FLUX.1-schnell...');
      result = await callHF(FLUX_SCHNELL_URL, prompt, hfToken, 4);
      if (result.success) {
        console.log(`[Edge] ✅ FLUX.1-schnell success (${result.buffer.byteLength} bytes)`);
      } else {
        console.warn(`[Edge] FLUX.1-schnell HTTP ${result.status}:`, result.errorBody?.slice(0, 200));
      }
    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      result = { success: false, buffer: null, status: isTimeout ? 408 : 0, errorBody: err.message };
      console.warn(`[Edge] FLUX.1-schnell threw (${err.name}):`, err.message);
    }

    // --- Attempt 2: SD-XL fallback if schnell fails for any reason ---
    if (!result.success) {
      try {
        usedModel = 'SDXL';
        console.log('[Edge] Trying SDXL fallback...');
        result = await callHF(SD_FALLBACK_URL, prompt, hfToken, 20);
        if (result.success) {
          console.log(`[Edge] ✅ SDXL success (${result.buffer.byteLength} bytes)`);
        } else {
          console.warn(`[Edge] SDXL HTTP ${result.status}:`, result.errorBody?.slice(0, 200));
        }
      } catch (err) {
        const isTimeout = err.name === 'AbortError';
        result = { success: false, buffer: null, status: isTimeout ? 408 : 0, errorBody: err.message };
        console.warn('[Edge] SDXL threw:', err.message);
      }
    }

    // --- If both AI models failed, fall back to LoremFlickr stock photo ---
    if (!result.success) {
      console.warn(`[Edge] All AI models failed. Status: ${result.status}, Error: ${result.errorBody?.slice(0, 200)}`);

      const stopWords = new Set(['a','an','the','of','in','on','at','for','with','and','or','to','is','are','some']);
      const keywords = prompt.toLowerCase().split(/[^a-z0-9]+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
        .slice(0, 3)
        .join(',');
      const fallbackKeyword = encodeURIComponent(keywords || 'creative');
      const fallbackUrl = `https://loremflickr.com/1024/1024/${fallbackKeyword}?all=1&random=${Math.floor(Math.random() * 1000)}`;

      let fallbackBuffer;
      try {
        const fallbackResponse = await fetchWithTimeout(fallbackUrl, {}, 10000);
        fallbackBuffer = await fallbackResponse.arrayBuffer();
      } catch (_) {
        // Even LoremFlickr failed — return a plain error
        return new Response(JSON.stringify({ error: 'All image sources unavailable.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(fallbackBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'no-cache',
          'X-Fallback-Used': 'true',
          'X-HF-Status': String(result.status ?? 0),
          'X-HF-Error': (result.errorBody ?? 'unknown').slice(0, 500)
        }
      });
    }

    // --- AI generation succeeded ---
    return new Response(result.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache',
        'X-Used-Model': usedModel
      }
    });

  } catch (err) {
    console.error("[Edge] Unexpected error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

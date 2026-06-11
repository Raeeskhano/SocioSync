export const config = {
  runtime: 'edge',
};

// ============================================================
// PRIMARY: Pollinations.AI — Free, no API key, uses FLUX model
// Simple GET request, no auth, no binary streaming issues
// Docs: https://image.pollinations.ai/
// ============================================================
function buildPollinationsUrl(prompt) {
  const encoded = encodeURIComponent(prompt);
  // seed adds variety; nologo removes watermark; enhance boosts quality
  const seed = Math.floor(Math.random() * 999999);
  return `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=1024&height=1024&nologo=true&enhance=true&seed=${seed}`;
}

// ============================================================
// SECONDARY: Hugging Face FLUX.1-schnell
// Free model, no gating — used only if Pollinations fails
// ============================================================
const HF_SCHNELL_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    )
  ]);
}

async function fetchImage(url, options = {}) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';

  if (res.ok && !contentType.includes('application/json')) {
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > 1000) { // sanity check — real images are >1KB
      return { success: true, buffer, status: res.status };
    }
    return { success: false, buffer: null, status: res.status, errorBody: 'Response too small to be a valid image' };
  }

  let errorBody = `HTTP ${res.status}`;
  try { errorBody = await res.text(); } catch (_) {}
  return { success: false, buffer: null, status: res.status, errorBody };
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { prompt, hfToken } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), { status: 400 });
    }

    let result = { success: false, buffer: null, status: 0, errorBody: 'not attempted' };
    let usedModel = '';

    // ─── Attempt 1: Pollinations.AI (FLUX) ────────────────────────────────────
    try {
      console.log('[Edge] Trying Pollinations.AI FLUX...');
      const pollinationsUrl = buildPollinationsUrl(prompt);
      result = await withTimeout(
        fetchImage(pollinationsUrl),
        22000  // 22s timeout — safely within Vercel's 25s Edge limit
      );

      if (result.success) {
        usedModel = 'pollinations-flux';
        console.log(`[Edge] ✅ Pollinations success (${result.buffer.byteLength} bytes)`);
      } else {
        console.warn(`[Edge] Pollinations failed — status ${result.status}:`, result.errorBody?.slice(0, 150));
      }
    } catch (err) {
      result = { success: false, buffer: null, status: 0, errorBody: err.message };
      console.warn('[Edge] Pollinations threw:', err.message);
    }

    // ─── Attempt 2: HF FLUX.1-schnell (if we still have budget time) ──────────
    if (!result.success && hfToken) {
      try {
        console.log('[Edge] Trying HF FLUX.1-schnell...');
        result = await withTimeout(
          fetchImage(HF_SCHNELL_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${hfToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: { num_inference_steps: 4, width: 1024, height: 1024 }
            })
          }),
          20000
        );

        if (result.success) {
          usedModel = 'hf-flux-schnell';
          console.log(`[Edge] ✅ HF FLUX.1-schnell success (${result.buffer.byteLength} bytes)`);
        } else {
          console.warn(`[Edge] HF schnell failed — status ${result.status}:`, result.errorBody?.slice(0, 150));
        }
      } catch (err) {
        result = { success: false, buffer: null, status: 0, errorBody: err.message };
        console.warn('[Edge] HF schnell threw:', err.message);
      }
    }

    // ─── Success ───────────────────────────────────────────────────────────────
    if (result.success) {
      return new Response(result.buffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'no-cache',
          'X-Used-Model': usedModel
        }
      });
    }

    // ─── All AI failed → LoremFlickr stock photo ──────────────────────────────
    console.warn('[Edge] All AI models failed. Using LoremFlickr stock photo.');
    const stopWords = new Set(['a','an','the','of','in','on','at','for','with','and','or','to','is','are','some']);
    const keywords = prompt.toLowerCase().split(/[^a-z0-9]+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
      .slice(0, 3)
      .join(',');
    const fallbackUrl = `https://loremflickr.com/1024/1024/${encodeURIComponent(keywords || 'creative')}?all=1&random=${Math.floor(Math.random() * 9999)}`;

    try {
      const fallbackRes = await withTimeout(fetch(fallbackUrl), 10000);
      const fallbackBuffer = await fallbackRes.arrayBuffer();

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
    } catch (_) {
      return new Response(JSON.stringify({ error: 'All image sources unavailable.' }), { status: 503 });
    }

  } catch (err) {
    console.error('[Edge] Unexpected error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

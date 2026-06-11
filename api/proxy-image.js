export const config = {
  runtime: 'edge',
};

// Primary: FLUX.1-dev (gated — requires license acceptance + HF Pro for Inference API)
// Fallback: FLUX.1-schnell (open, faster, free Inference API access)
const FLUX_DEV_URL     = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev";
const FLUX_SCHNELL_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";

async function callFlux(modelUrl, prompt, hfToken) {
  const res = await fetch(modelUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${hfToken}`,
      "Content-Type": "application/json",
      "x-wait-for-model": "true"
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        guidance_scale: modelUrl.includes('schnell') ? 0 : 3.5,
        num_inference_steps: modelUrl.includes('schnell') ? 4 : 28,
        width: 1024,
        height: 1024
      }
    })
  });

  const status = res.status;
  const contentType = res.headers.get('content-type') || '';

  if (res.ok && !contentType.includes('application/json')) {
    // Got real image bytes
    const buffer = await res.arrayBuffer();
    return { success: true, buffer, status, errorBody: null };
  }

  // Got an error — capture the body for debugging
  let errorBody = `HTTP ${status}`;
  try {
    errorBody = await res.text();
  } catch (_) {}

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

    // --- Attempt 1: FLUX.1-dev ---
    let result;
    try {
      console.log('[Edge] Trying FLUX.1-dev...');
      result = await callFlux(FLUX_DEV_URL, prompt, hfToken);
    } catch (err) {
      result = { success: false, buffer: null, status: 0, errorBody: err.message };
    }

    // --- Attempt 2: FLUX.1-schnell (if dev failed with 403/401/404) ---
    let usedSchnell = false;
    if (!result.success && (result.status === 403 || result.status === 401 || result.status === 404 || result.status === 0)) {
      try {
        console.log(`[Edge] FLUX.1-dev failed (${result.status}: ${result.errorBody?.slice(0, 100)}). Trying FLUX.1-schnell...`);
        const schnellResult = await callFlux(FLUX_SCHNELL_URL, prompt, hfToken);
        if (schnellResult.success) {
          result = schnellResult;
          usedSchnell = true;
          console.log('[Edge] ✅ FLUX.1-schnell succeeded!');
        } else {
          console.warn(`[Edge] FLUX.1-schnell also failed (${schnellResult.status}): ${schnellResult.errorBody?.slice(0, 100)}`);
          // Keep original result.errorBody for reporting
        }
      } catch (schnellErr) {
        console.warn('[Edge] FLUX.1-schnell threw:', schnellErr.message);
      }
    }

    // --- If both FLUX models failed, fall back to LoremFlickr ---
    if (!result.success) {
      console.warn(`[Edge] Both FLUX models failed. HF error: ${result.status} — ${result.errorBody?.slice(0, 200)}`);

      const stopWords = new Set(['a','an','the','of','in','on','at','for','with','and','or','to','is','are','some']);
      const keywords = prompt.toLowerCase().split(/[^a-z0-9]+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
        .slice(0, 3)
        .join(',');
      const fallbackKeyword = encodeURIComponent(keywords || 'beautiful');
      const fallbackUrl = `https://loremflickr.com/1024/1024/${fallbackKeyword}?all=1&random=${Math.floor(Math.random() * 1000)}`;

      const fallbackResponse = await fetch(fallbackUrl);
      const fallbackBuffer = await fallbackResponse.arrayBuffer();

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

    // --- Success ---
    return new Response(result.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache',
        'X-HF-Status': String(result.status),
        'X-Used-Model': usedSchnell ? 'FLUX.1-schnell' : 'FLUX.1-dev'
      }
    });

  } catch (err) {
    console.error("[Edge] Unexpected error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

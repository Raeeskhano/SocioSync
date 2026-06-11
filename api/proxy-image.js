export const config = {
  runtime: 'edge',
};

// FLUX.1-dev via Hugging Face Inference API
// NOTE: The HF account used to generate HF_TOKEN must have accepted the
// black-forest-labs/FLUX.1-dev license at huggingface.co/black-forest-labs/FLUX.1-dev
const FLUX_MODEL_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev";

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { prompt, hfToken } = await req.json();

    if (!prompt || !hfToken) {
      return new Response(JSON.stringify({ error: 'Missing prompt or token' }), { status: 400 });
    }

    let hfResponse;
    try {
      // Forward the request to FLUX.1-dev on Hugging Face.
      // Vercel Edge functions allow up to 25s on Hobby tier — enough for FLUX to warm up.
      hfResponse = await fetch(FLUX_MODEL_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true"   // Tell HF to queue instead of returning 503 immediately
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            guidance_scale: 3.5,       // Recommended for FLUX.1-dev
            num_inference_steps: 28,   // Good balance of quality vs. speed
            width: 1024,
            height: 1024
          }
        })
      });
    } catch (hfErr) {
      console.warn(`FLUX.1-dev fetch threw an error: ${hfErr.message}. Falling back...`);
      hfResponse = { ok: false, status: 500 };
    }

    let isHfSuccess = false;
    let imageBuffer = null;

    if (hfResponse.ok) {
      const contentType = hfResponse.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errorJson = await hfResponse.json();
        console.warn('FLUX.1-dev returned JSON (likely still loading):', errorJson);
        isHfSuccess = false;
      } else {
        imageBuffer = await hfResponse.arrayBuffer();
        isHfSuccess = true;
      }
    } else {
      console.warn(`FLUX.1-dev returned status: ${hfResponse.status}`);
    }

    if (!isHfSuccess) {
      console.warn(`FLUX.1-dev failed. Falling back to LoremFlickr stock photo...`);
      const stopWords = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'at', 'for', 'with', 'and', 'or', 'to', 'is', 'are', 'some']);
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
          'X-Fallback-Used': 'true'
        }
      });
    }

    // Return the FLUX-generated image blob
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (err) {
    console.error("Edge proxy-image error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

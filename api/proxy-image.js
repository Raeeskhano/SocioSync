export const config = {
  runtime: 'edge',
};

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
      // Forward the request to Hugging Face
      // Edge functions run up to 25s on Hobby, giving Hugging Face enough time to warm up.
      hfResponse = await fetch("https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt })
      });
    } catch (hfErr) {
      console.warn(`Hugging Face fetch threw an error: ${hfErr.message}. Falling back...`);
      hfResponse = { ok: false, status: 500 }; // Fake response to trigger fallback
    }

    let isHfSuccess = false;
    let imageBuffer = null;

    if (hfResponse.ok) {
      const contentType = hfResponse.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errorJson = await hfResponse.json();
        console.warn('Hugging Face returned JSON error:', errorJson);
        isHfSuccess = false; // Trigger fallback
      } else {
        imageBuffer = await hfResponse.arrayBuffer();
        isHfSuccess = true;
      }
    }

    if (!isHfSuccess) {
      console.warn(`Hugging Face API failed or returned JSON. Falling back to LoremFlickr stock photo...`);
      // Fallback: Fetch a stunning relevant stock photo using LoremFlickr based on the prompt
      const fallbackKeyword = encodeURIComponent(prompt.split(' ')[0] || 'beautiful');
      const fallbackUrl = `https://loremflickr.com/1024/1024/${fallbackKeyword}?random=${Math.floor(Math.random() * 1000)}`;
      
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

    // Return the image blob
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

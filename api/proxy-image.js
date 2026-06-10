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

    // Forward the request to Hugging Face
    // Edge functions run up to 25s on Hobby, giving Hugging Face enough time to warm up.
    const hfResponse = await fetch("https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      return new Response(errorText, { status: hfResponse.status });
    }

    // Return the image blob
    const imageBuffer = await hfResponse.arrayBuffer();
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

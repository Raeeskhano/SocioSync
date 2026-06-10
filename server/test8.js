require('dotenv').config();
const axios = require('axios');

async function testProxy() {
  try {
    const targetUrl = 'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5';
    const proxyUrl = `https://thingproxy.freeboard.io/fetch/${targetUrl}`;
    
    console.log("Fetching from:", proxyUrl);

    const res = await axios.post(proxyUrl, { inputs: "A cat" }, {
      headers: {
        'Authorization': `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer',
      timeout: 30000
    });

    console.log(`Success! Status: ${res.status}`);
    console.log(`Size: ${res.data.length} bytes`);
  } catch(e) {
    if (e.response) {
      console.log(`Failed! Status: ${e.response.status}`);
      // console.log(`Data:`, e.response.data.toString());
    } else {
      console.log(`Failed:`, e.message);
    }
  }
}
testProxy();

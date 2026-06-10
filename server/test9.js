require('dotenv').config();
const axios = require('axios');

async function testHF() {
  try {
    const url = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5";
    const res = await axios.post(url, { inputs: "A cat" }, {
      headers: {
        'Authorization': `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });
    console.log(`Success! Status: ${res.status}`);
  } catch(e) {
    if (e.response) {
      console.log(`Failed! Status: ${e.response.status}`);
      console.log(`Data:`, e.response.data.toString());
    } else {
      console.log(`Failed:`, e.message);
    }
  }
}
testHF();

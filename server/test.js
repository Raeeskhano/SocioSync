require('dotenv').config();
const axios = require('axios');

async function testHF() {
  try {
    const token = process.env.HF_TOKEN;
    console.log("Token exists:", !!token);
    const hfResponse = await axios.post(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      { inputs: "Futuristic storefront green sustainable brand" },
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer',
        timeout: 45000
      }
    );
    console.log("Success! Data length:", hfResponse.data.length);
  } catch (err) {
    if (err.response) {
      console.error("HF Error Data:", err.response.data.toString());
      console.error("HF Error Status:", err.response.status);
    } else {
      console.error("Axios Error:", err.message);
    }
  }
}
testHF();

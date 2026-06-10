require('dotenv').config({path: './server/.env'});
const axios = require('axios');

async function testHF() {
  const token = process.env.HF_TOKEN;
  if (!token) return console.log("No HF_TOKEN found");
  
  const prompt = "A futuristic storefront for a green sustainable brand";
  console.log("Using token:", token.substring(0, 5) + "...");
  
  try {
    const response = await axios.post(
      "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3.5-large",
      { inputs: prompt },
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer'
      }
    );
    console.log("Success! Bytes:", response.data.length);
  } catch (err) {
    console.error("Error:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data.toString());
    }
  }
}

testHF();

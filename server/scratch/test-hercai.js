const axios = require('axios');
async function test() {
  const prompt = "A futuristic storefront";
  const url = `https://hercai.onrender.com/v3/text2image?prompt=${encodeURIComponent(prompt)}`;
  
  console.log("Fetching:", url);
  try {
    const response = await axios.get(url, { timeout: 15000 });
    console.log("Success! Data:", response.data);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();

const axios = require('axios');
async function test() {
  const prompt = "A futuristic storefront";
  const target = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true`;
  const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
  
  console.log("Fetching:", url);
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    console.log("Success! Bytes:", response.data.length);
    console.log("Content-Type:", response.headers['content-type']);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();

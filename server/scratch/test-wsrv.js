const axios = require('axios');
async function test() {
  const prompt = "A futuristic storefront";
  const pollPath = `image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true`;
  const url = `https://wsrv.nl/?url=${encodeURIComponent(pollPath)}`;
  
  console.log("Fetching:", url);
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    console.log("Success! Bytes:", response.data.length);
    console.log("Content-Type:", response.headers['content-type']);
  } catch (err) {
    console.error("Error:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", Buffer.from(err.response.data).toString('utf-8'));
    }
  }
}
test();

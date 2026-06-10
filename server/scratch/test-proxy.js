const axios = require('axios');
async function test() {
  const prompt = "A futuristic storefront";
  const pollUrl = \`https://image.pollinations.ai/prompt/\${encodeURIComponent(prompt)}?width=1024&height=1024&seed=12345&nologo=true\`;
  const proxyUrl = \`https://corsproxy.io/?\${encodeURIComponent(pollUrl)}\`;
  
  console.log("Fetching:", proxyUrl);
  try {
    const response = await axios.get(proxyUrl, { responseType: 'arraybuffer', timeout: 15000 });
    console.log("Success! Bytes:", response.data.length);
    console.log("Content-Type:", response.headers['content-type']);
  } catch (err) {
    console.error("Error:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
    }
  }
}
test();

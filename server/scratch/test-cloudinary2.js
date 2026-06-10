const axios = require('axios');
async function test() {
  const pollUrl = "https://image.pollinations.ai/prompt/cat";
  const cloudinaryUrl = \`https://res.cloudinary.com/dantbaaus/image/fetch/\${pollUrl}\`;
  
  console.log("Fetching:", cloudinaryUrl);
  try {
    const response = await axios.get(cloudinaryUrl, { responseType: 'arraybuffer', timeout: 15000 });
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

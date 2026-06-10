const axios = require('axios');

async function testPoll() {
  try {
    const url = "https://image.pollinations.ai/prompt/test";
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    console.log(`Success! Size: ${res.data.length}`);
  } catch(e) {
    console.log(`Failed:`, e.message);
  }
}
testPoll();

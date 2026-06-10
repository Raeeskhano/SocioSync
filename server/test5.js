const axios = require('axios');

async function testPoll() {
  try {
    const url = "https://image.pollinations.ai/prompt/A%20futuristic%20storefront%20for%20a%20green%20sustainable%20brand%2C%20highly%20detailed%2C%20cinematic%20lighting?seed=800890";
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    console.log(`Success! Status: ${res.status}`);
    console.log(`Headers:`, res.headers);
    console.log(`Size: ${res.data.length} bytes`);
    console.log(`First 20 bytes:`, res.data.slice(0, 20).toString('hex'));
  } catch(e) {
    if (e.response) {
      console.log(`Failed! Status: ${e.response.status}`);
      console.log(`Headers:`, e.response.headers);
      console.log(`Data:`, e.response.data.toString());
    } else {
      console.log(`Failed:`, e.message);
    }
  }
}
testPoll();

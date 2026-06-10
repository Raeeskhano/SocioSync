const axios = require('axios');

async function testFlickr() {
  try {
    const res = await axios.get(`https://loremflickr.com/json/1024/1024/futuristic`);
    console.log(`Success! URL: ${res.data.file}`);
  } catch(e) {
    console.log(`Failed:`, e.message);
  }
}
testFlickr();

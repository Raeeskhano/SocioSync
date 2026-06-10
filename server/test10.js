const axios = require('axios');

async function testHercai() {
  try {
    const res = await axios.get(`https://hercai.onrender.com/v3/text2image?prompt=apple`);
    console.log(`Success! URL: ${res.data.url}`);
  } catch(e) {
    console.log(`Failed:`, e.message);
  }
}
testHercai();

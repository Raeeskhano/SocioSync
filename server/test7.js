const axios = require('axios');

async function testLexica() {
  try {
    const q = "A futuristic storefront for a green sustainable brand, highly detailed, cinematic lighting";
    const res = await axios.get(`https://lexica.art/api/v1/search?q=${encodeURIComponent(q)}`);
    console.log(`Success! Found ${res.data.images.length} images.`);
    if (res.data.images.length > 0) {
      console.log("First image URL:", res.data.images[0].src);
    }
  } catch(e) {
    console.log(`Failed:`, e.message);
  }
}
testLexica();

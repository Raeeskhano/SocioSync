require('dotenv').config();
const aiService = require('./services/aiService');

async function testGenerate() {
  try {
    const urls = await aiService.generateImages("A futuristic storefront for a green sustainable brand");
    console.log("Success! URLs:", urls);
  } catch (err) {
    console.error("Failed!", err);
  }
}
testGenerate();

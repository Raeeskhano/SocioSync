require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // There isn't a direct listModels in the common SDK snippet, but we can try a simple request
    console.log('Testing with gemini-1.5-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Hi');
    console.log('Success with gemini-1.5-flash:', (await result.response).text());
  } catch (e) {
    console.error('Failed with gemini-1.5-flash:', e.message);
    
    try {
        console.log('Testing with gemini-pro...');
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent('Hi');
        console.log('Success with gemini-pro:', (await result.response).text());
    } catch (e2) {
        console.error('Failed with gemini-pro:', e2.message);
    }
  }
}

listModels();

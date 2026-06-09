require('dotenv').config();
const axios = require('axios');

async function checkKey() {
    const key = process.env.GEMINI_API_KEY;
    console.log('Using key starting with:', key.substring(0, 10));
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const res = await axios.get(url);
        console.log('Available models:', res.data.models.map(m => m.name));
    } catch (e) {
        console.error('Error fetching models:', e.response?.data || e.message);
    }
}

checkKey();

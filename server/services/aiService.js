const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'missing_key');

/**
 * Strips markdown formatting from AI output so it looks clean on social media.
 * Converts **bold** → BOLD, removes # headings, cleans up formatting artifacts.
 */
const stripMarkdown = (text) => {
  if (!text) return text;
  return text
    .replace(/^#{1,6}\s+(.+)$/gm, (_, heading) => heading.toUpperCase()) // # Heading → HEADING
    .replace(/\*\*(.+?)\*\*/g, (_, bold) => bold.toUpperCase())           // **bold** → BOLD  
    .replace(/\*(.+?)\*/g, '$1')                                          // *italic* → italic
    .replace(/__(.+?)__/g, (_, bold) => bold.toUpperCase())               // __bold__ → BOLD
    .replace(/_(.+?)_/g, '$1')                                            // _italic_ → italic
    .replace(/^\s*[-*+]\s+/gm, '• ')                                     // - item → • item
    .replace(/```[\s\S]*?```/g, '')                                       // Remove code blocks
    .replace(/`([^`]+)`/g, '$1')                                          // `code` → code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')                              // [text](url) → text
    .replace(/\n{3,}/g, '\n\n')                                           // Collapse excess newlines
    .trim();
};

const getModel = () => {
  if (!process.env.GEMINI_API_KEY) {
    console.error('CRITICAL: GEMINI_API_KEY is missing from .env');
  }
  return genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
};

const TONE_SYSTEM_PROMPTS = {
  humanized: "You are a human social media creator. Write in first person with natural variance. Use contractions, rhetorical questions, and genuine emotion. Vary sentence length. Sound like a passionate person, not a robot. CRITICAL FORMATTING RULES: NEVER use markdown syntax like **, ##, *, _, or ``` in your output. Social media platforms do not render markdown. Instead, use ALL CAPS for emphasis, line breaks for structure, and emojis for visual appeal. Write plain text only.",
  professional: "You are a senior content strategist. Write clear, authoritative, brand-safe social media copy. Use active voice, concrete data points where possible, and a confident tone. CRITICAL FORMATTING RULES: NEVER use markdown syntax like **, ##, *, _, or ``` in your output. Social media platforms do not render markdown. Instead, use ALL CAPS for emphasis, line breaks for structure, and emojis sparingly. Write plain text only.",
  casual: "You are a Gen-Z social media manager. Write fun, conversational copy with energy. Use casual language, trending phrases (but not cringey), and a sense of humor. CRITICAL FORMATTING RULES: NEVER use markdown syntax like **, ##, *, _, or ``` in your output. Social media platforms do not render markdown. Instead, use ALL CAPS for emphasis, line breaks for structure, and emojis for visual appeal. Write plain text only."
};

const extractJsonArray = (text) => {
  const startIdx = text.indexOf('[');
  const endIdx = text.lastIndexOf(']');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const jsonSub = text.substring(startIdx, endIdx + 1);
    return JSON.parse(jsonSub);
  }
  throw new Error("No JSON array found in response");
};

const suggestContentDrafts = async (postTitles) => {
  try {
    const prompt = `Based on these recent post topics: [${postTitles}], suggest 3 new viral content ideas for social media. Return a raw JSON array of objects with exactly these keys: "title", "platform", "contentType". Do not include markdown formatting or backticks.`;

    const result = await getModel().generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      return extractJsonArray(text);
    } catch (jsonErr) {
      console.error("JSON parsing failed, attempting raw parse:", jsonErr);
      return JSON.parse(text);
    }
  } catch (error) {
    console.error("suggestContentDrafts Gemini failed, falling back to static viral drafts:", error);
    // Dynamic, premium post fallbacks so the feature never breaks for the user
    return [
      {
        title: "Top 5 Automation Hacks that saved our team 20+ hours a week. #Productivity #AI #SocioSync",
        platform: "linkedin",
        contentType: "image"
      },
      {
        title: "How we grew our social presence by 200% using AI-driven publication pipelines. 🚀✨ #Growth #Tech",
        platform: "instagram",
        contentType: "video"
      },
      {
        title: "Why relying solely on manual social scheduling is costing your business thousands in reach. Thread 👇",
        platform: "twitter",
        contentType: "image"
      }
    ];
  }
};

const generateTextWithTone = async (prompt, tone) => {
  const systemPrompt = TONE_SYSTEM_PROMPTS[tone] || TONE_SYSTEM_PROMPTS.humanized;
  const fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;
  
  const result = await getModel().generateContent(fullPrompt);
  const response = await result.response;
  return stripMarkdown(response.text());
};

const generateImages = async (userPrompt) => {
  console.log(`[AI Service] Generating FLUX.1-dev image for: "${userPrompt}"`);
  
  let enhancedPrompt = userPrompt;
  try {
    // FLUX.1-dev excels at natural language — we ask Gemini to write a rich,
    // descriptive sentence instead of the old comma-separated Stable Diffusion tag format.
    const geminiPrompt = `You are an expert prompt engineer for the FLUX.1-dev image generation model.
Convert the following user request into a single, highly detailed, natural language image prompt.
The prompt should be descriptive and specific — include lighting, mood, style, perspective, and key visual details.
Do NOT use comma-separated keyword tags. Write it as natural prose, max 2 sentences.

User request: "${userPrompt}"

Output ONLY the refined prompt text, nothing else.`;

    const result = await getModel().generateContent(geminiPrompt);
    const raw = result.response.text().trim();
    // Remove any surrounding quotes Gemini might add
    enhancedPrompt = raw.replace(/^["']|["']$/g, '');
    console.log(`[AI Service] FLUX-optimized prompt: ${enhancedPrompt}`);
  } catch (err) {
    console.warn('[AI Service] Gemini prompt enhancement failed, using original:', err.message);
  }

  if (!process.env.HF_TOKEN) {
    throw new Error('HF_TOKEN is missing in environment variables.');
  }

  // Return the enhanced prompt and token so the frontend can call the
  // Vercel Edge proxy, which handles the FLUX.1-dev API call.
  return {
    enhancedPrompt,
    hfToken: process.env.HF_TOKEN
  };
};

const rewriteCaption = async (caption, tone) => {
  try {
    const prompt = `Rewrite this social media caption in a ${tone || 'professional'} tone, keeping it under 2000 characters, optimized for engagement. Keep hashtags if present. NEVER use markdown formatting like **, ##, *, or _. Write plain text only, use ALL CAPS for emphasis and emojis for visual appeal. Caption: "${caption}"`;
    const result = await getModel().generateContent(prompt);
    const response = await result.response;
    return stripMarkdown(response.text());
  } catch (error) {
    console.error('Gemini Rewrite Error:', error);
    throw error;
  }
};

module.exports = {
  suggestContentDrafts,
  generateTextWithTone,
  generateImages,
  rewriteCaption
};

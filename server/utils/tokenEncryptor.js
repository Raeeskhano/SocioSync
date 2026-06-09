const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY || '636861725f6865785f737472696e675f666f725f616573323536', 'hex'); // fallback for safety, but should use env
const ivLength = 16;

/**
 * Encrypts a string using AES-256-CBC
 * @param {string} text 
 * @returns {string} iv:encryptedData
 */
const encrypt = (text) => {
  if (!text) return null;
  // Ensure we always have exactly 32 bytes for aes-256
  const rawKey = process.env.ENCRYPTION_KEY || 'fallback_secret_key_123';
  const key = crypto.createHash('sha256').update(rawKey).digest();
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  
  const rawKey = process.env.ENCRYPTION_KEY || 'fallback_secret_key_123';
  const key = crypto.createHash('sha256').update(rawKey).digest();

  const [ivHex, encryptedHex] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = { encrypt, decrypt };

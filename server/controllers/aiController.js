const AiCreation = require('../models/AiCreation');
const Post = require('../models/Post');
const aiService = require('../services/aiService');

const suggestDrafts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const recentPosts = await Post.find({ userId }).sort({ createdAt: -1 }).limit(5).select('caption');
    const postTitles = recentPosts.map(p => p.caption).join(', ');
    const drafts = await aiService.suggestContentDrafts(postTitles);

    const savedDrafts = [];
    for (const d of drafts) {
      const draftPost = await Post.create({
        userId,
        caption: d.title || 'New AI Suggested Topic',
        mediaType: d.contentType === 'video' ? 'video' : 'image',
        platforms: [{ name: d.platform || 'linkedin', status: 'pending' }],
        status: 'draft'
      });
      savedDrafts.push(draftPost);
    }

    res.status(200).json({ success: true, data: { drafts: savedDrafts } });
  } catch (error) {
    next(error);
  }
};

const generateCopy = async (req, res, next) => {
  try {
    const { prompt, tone } = req.body;
    const userId = req.user.id;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required.' });
    }

    const generatedText = await aiService.generateTextWithTone(prompt, tone);
    
    const creation = await AiCreation.create({
      userId,
      type: 'text',
      prompt,
      tone: tone || 'humanized',
      output: generatedText
    });

    res.status(200).json({ success: true, data: { generatedText, creationId: creation._id } });
  } catch (error) {
    next(error);
  }
};

const generateImages = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.id;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Visual prompt is required.' });
    }

    const imageUrls = await aiService.generateImages(prompt);
    
    const creation = await AiCreation.create({
      userId,
      type: 'image',
      prompt,
      imageUrls
    });

    res.status(200).json({ success: true, data: { imageUrls, creationId: creation._id } });
  } catch (error) {
    next(error);
  }
};

const getRecentCreations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 6;

    const creations = await AiCreation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    const formattedCreations = creations.map(c => ({
      id: c._id,
      type: c.type,
      title: c.title,
      thumbnailUrl: c.type === 'image' && c.imageUrls ? c.imageUrls[0] : null,
      prompt: c.prompt,
      tone: c.tone,
      output: c.output,
      imageUrls: c.imageUrls,
      createdAt: c.createdAt
    }));

    res.status(200).json({ success: true, data: formattedCreations });
  } catch (error) {
    next(error);
  }
};

const exportCreation = async (req, res, next) => {
  try {
    const { creationId, format } = req.body;
    const creation = await AiCreation.findById(creationId);

    if (!creation) {
      return res.status(404).json({ success: false, message: 'Creation not found.' });
    }

    const fileName = `SocioSync_${creation.title.replace(/\s+/g, '_')}.${format}`;
    
    if (creation.type === 'text') {
      res.setHeader('Content-Type', format === 'md' ? 'text/markdown' : 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      return res.send(creation.output);
    } else {
      // For images, we just return the URL for the frontend to handle or proxy the download
      return res.status(200).json({ success: true, data: { downloadUrl: creation.imageUrls[0], fileName } });
    }
  } catch (error) {
    next(error);
  }
};

const rewriteCaption = async (req, res, next) => {
  try {
    const { caption, tone } = req.body;
    if (!caption) {
      return res.status(400).json({ success: false, message: 'Caption is required.' });
    }
    const rewrittenCaption = await aiService.rewriteCaption(caption, tone);
    res.status(200).json({ success: true, data: { rewrittenCaption } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  suggestDrafts,
  generateCopy,
  generateImages,
  rewriteCaption,
  getRecentCreations,
  exportCreation
};

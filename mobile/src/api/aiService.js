import axiosInstance from './axiosInstance';

const aiService = {
  suggestDrafts: async () => {
    const response = await axiosInstance.post('/ai/suggest-drafts');
    return response.data.data.drafts;
  },

  rewriteCaption: async (caption, tone = 'professional') => {
    const response = await axiosInstance.post('/ai/rewrite-caption', { caption, tone });
    return response.data.data.rewrittenCaption;
  },

  generateCopy: async (prompt, tone = 'humanized') => {
    const response = await axiosInstance.post('/ai/generate-copy', { prompt, tone });
    return response.data.data;
  },

  generateImages: async (prompt) => {
    // This just returns the HF token and enhanced prompt
    const response = await axiosInstance.post('/ai/generate-images', { prompt });
    return response.data.data;
  },

  saveImageCreation: async (prompt, imageUrls) => {
    const response = await axiosInstance.post('/ai/save-image', { prompt, imageUrls });
    return response.data.data;
  },

  getRecentCreations: async (limit = 6) => {
    const response = await axiosInstance.get(`/ai/recent-creations?limit=${limit}`);
    return response.data.data;
  },

  exportCreation: async (creationId, format) => {
    const response = await axiosInstance.post('/ai/export', { creationId, format });
    return response.data.data;
  }
};

export default aiService;

import axiosInstance from './axiosInstance';

export const dashboardService = {
  getSummary: async () => {
    const response = await axiosInstance.get('/dashboard/summary');
    return response.data;
  },
  getGrowthChart: async (days = 30) => {
    const response = await axiosInstance.get(`/dashboard/growth-chart?days=${days}`);
    return response.data;
  },
  getChannels: async () => {
    const response = await axiosInstance.get('/dashboard/channels');
    return response.data;
  },
  getUsage: async () => {
    const response = await axiosInstance.get('/dashboard/usage');
    return response.data;
  },
  getRecentPosts: async (limit = 5) => {
    const response = await axiosInstance.get(`/posts/recent?limit=${limit}`);
    return response.data;
  },
  suggestDrafts: async () => {
    const response = await axiosInstance.post('/ai/suggest-drafts');
    return response.data;
  }
};

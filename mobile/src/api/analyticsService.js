import axiosInstance from './axiosInstance';

const buildParams = (period, from, to) => {
  const params = new URLSearchParams({ period });
  if (period === 'custom' && from && to) {
    params.append('from', from);
    params.append('to', to);
  }
  return params.toString();
};

const analyticsService = {
  getSummary: async (period = '30d', from, to) => {
    const response = await axiosInstance.get(`/analytics/summary?${buildParams(period, from, to)}`);
    return response.data.data;
  },

  getVelocity: async (period = '30d', from, to) => {
    const response = await axiosInstance.get(`/analytics/velocity?${buildParams(period, from, to)}`);
    return response.data.data;
  },

  getPlatformSplit: async (period = '30d', from, to) => {
    const response = await axiosInstance.get(`/analytics/platform-split?${buildParams(period, from, to)}`);
    return response.data.data;
  },

  getTopPosts: async (period = '30d', limit = 3, from, to) => {
    const response = await axiosInstance.get(`/analytics/top-posts?${buildParams(period, from, to)}&limit=${limit}`);
    return response.data.data;
  },

  getAudienceGeo: async () => {
    const response = await axiosInstance.get('/analytics/audience-geo');
    return response.data.data;
  },

  exportData: async (period = '30d', from, to) => {
    const response = await axiosInstance.get(`/analytics/export?${buildParams(period, from, to)}`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sociosync-analytics-${period}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  syncMetrics: async () => {
    const response = await axiosInstance.post('/analytics/sync');
    return response.data;
  }
};

export default analyticsService;

import axiosInstance from './axiosInstance';

const integrationService = {
  getIntegrations: async () => {
    const response = await axiosInstance.get('/integrations');
    return response.data.data;
  },

  getSecurityLogs: async (limit = 50) => {
    const response = await axiosInstance.get(`/integrations/security-logs?limit=${limit}`);
    return response.data.data;
  },

  disconnect: async (platform) => {
    const response = await axiosInstance.delete(`/integrations/${platform}`);
    return response.data;
  },

  reconnect: async (platform) => {
    const response = await axiosInstance.post(`/integrations/${platform}/reconnect`);
    return response.data;
  }
};

export default integrationService;

import axiosInstance from './axiosInstance';

const settingsService = {
  // ─── Profile ────────────────────────────────────────────────
  getProfile: async () => {
    const response = await axiosInstance.get('/settings/profile');
    return response.data.data;
  },

  updateProfile: async (data) => {
    const response = await axiosInstance.put('/settings/profile', data);
    return response.data.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await axiosInstance.post('/settings/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  },

  // ─── Session ────────────────────────────────────────────────
  getSession: async () => {
    const response = await axiosInstance.get('/settings/session');
    return response.data.data;
  },

  // ─── API Keys ───────────────────────────────────────────────
  getApiKeys: async () => {
    const response = await axiosInstance.get('/settings/api-keys');
    return response.data.data;
  },

  generateApiKey: async (name) => {
    const response = await axiosInstance.post('/settings/api-keys', { name });
    return response.data;
  },

  revokeApiKey: async (id) => {
    const response = await axiosInstance.delete(`/settings/api-keys/${id}`);
    return response.data;
  }
};

export default settingsService;

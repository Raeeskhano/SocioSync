import axiosInstance from './axiosInstance';

const publisherService = {
  publishPost: async (formData) => {
    const response = await axiosInstance.post('/posts/publish', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  schedulePost: async (formData) => {
    const response = await axiosInstance.post('/posts/schedule', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  saveDraft: async (data) => {
    const response = await axiosInstance.post('/posts/draft', data);
    return response.data;
  },

  getRecentPosts: async (limit = 5) => {
    const response = await axiosInstance.get(`/posts/recent?limit=${limit}`);
    return response.data.data;
  },

  getPosts: async () => {
    const response = await axiosInstance.get('/posts');
    return response.data.data;
  },

  getPost: async (id) => {
    const response = await axiosInstance.get(`/posts/${id}`);
    return response.data.data;
  },

  deletePost: async (id) => {
    const response = await axiosInstance.delete(`/posts/${id}`);
    return response.data;
  },

  updatePost: async (id, formData) => {
    const response = await axiosInstance.put(`/posts/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export default publisherService;

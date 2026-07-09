import axiosInstance from './axiosInstance';

export const authService = {
  register: async (firstName, lastName, email, password, confirmPassword) => {
    const response = await axiosInstance.post('/auth/register', {
      firstName,
      lastName,
      email,
      password,
      confirmPassword
    });
    return response.data;
  },
  login: async (email, password) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    return response.data;
  },
  getMe: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },
  logout: async () => {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
  }
};

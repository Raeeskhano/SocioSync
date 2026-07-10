import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const axiosInstance = axios.create({
  baseURL: 'https://socio-sync-pi.vercel.app/api',
  withCredentials: false,
});

// Request interceptor: add token
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('sociosync_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {}
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        await SecureStore.deleteItemAsync('sociosync_token');
        await SecureStore.deleteItemAsync('sociosync_user');
      } catch (e) {}
      if (router) {
        router.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

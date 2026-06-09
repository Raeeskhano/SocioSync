import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('sociosync_token');
const user = localStorage.getItem('sociosync_user');

let parsedUser = null;
try {
  if (user && user !== 'undefined') {
    parsedUser = JSON.parse(user);
  }
} catch (e) {
  console.error("Failed to parse user from localStorage:", e);
  localStorage.removeItem('sociosync_user');
}

const initialState = {
  isAuthenticated: !!token,
  currentUser: parsedUser,
  token: token || null,
  error: null,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // These will be replaced by async thunks when integrating the backend
    register: (state, action) => {
      // Stub for register
    },
    login: (state, action) => {
      state.isAuthenticated = true;
      state.currentUser = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      localStorage.setItem('sociosync_token', action.payload.token);
      localStorage.setItem('sociosync_user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.currentUser = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('sociosync_token');
      localStorage.removeItem('sociosync_user');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { register, login, logout, clearError } = authSlice.actions;
export default authSlice.reducer;

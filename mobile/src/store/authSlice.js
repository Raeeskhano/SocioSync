import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';

export const loadStoredAuth = createAsyncThunk('auth/loadStoredAuth', async () => {
  const token = await SecureStore.getItemAsync('sociosync_token');
  const user = await SecureStore.getItemAsync('sociosync_user');
  let parsedUser = null;
  if (user) {
    try {
      parsedUser = JSON.parse(user);
    } catch (e) {}
  }
  return { token, user: parsedUser };
});

const initialState = {
  isAuthenticated: false,
  currentUser: null,
  token: null,
  error: null,
  isLoading: true, // starts loading to check auth
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.currentUser = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    logoutSuccess: (state) => {
      state.isAuthenticated = false;
      state.currentUser = null;
      state.token = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.token && action.payload.user) {
          state.isAuthenticated = true;
          state.token = action.payload.token;
          state.currentUser = action.payload.user;
        } else {
          state.isAuthenticated = false;
        }
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });
  }
});

export const { loginSuccess, logoutSuccess, clearError } = authSlice.actions;

// Thunks
export const login = (email, password) => async (dispatch) => {
  const { authService } = require('../api/authService');
  try {
    const data = await authService.login(email, password);
    if (data.success && data.token) {
      await SecureStore.setItemAsync('sociosync_token', data.token);
      await SecureStore.setItemAsync('sociosync_user', JSON.stringify(data.user));
      dispatch(loginSuccess({ token: data.token, user: data.user }));
      return data;
    }
  } catch (err) {
    throw err;
  }
};

export const logout = () => async (dispatch) => {
  const { authService } = require('../api/authService');
  try {
    await authService.logout();
  } catch (e) {}
  await SecureStore.deleteItemAsync('sociosync_token');
  await SecureStore.deleteItemAsync('sociosync_user');
  dispatch(logoutSuccess());
};

export default authSlice.reducer;

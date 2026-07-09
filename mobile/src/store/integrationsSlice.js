import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import integrationService from '../api/integrationService';

export const fetchIntegrations = createAsyncThunk(
  'integrations/fetchIntegrations',
  async (_, { rejectWithValue }) => {
    try {
      return await integrationService.getIntegrations();
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const disconnectIntegration = createAsyncThunk(
  'integrations/disconnect',
  async (platform, { rejectWithValue }) => {
    try {
      await integrationService.disconnect(platform);
      return platform;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const reconnectIntegration = createAsyncThunk(
  'integrations/reconnect',
  async (platform, { rejectWithValue }) => {
    try {
      const response = await integrationService.reconnect(platform);
      if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
      }
      return platform;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const initialState = {
  connectedAccounts: [],
  upcomingPlatforms: [
    { name: 'TikTok', iconType: 'Music2', status: 'COMING SOON' },
    { name: 'YouTube', iconType: 'Video', status: 'COMING SOON' },
    { name: 'Threads', iconType: 'AtSign', status: 'BETA' },
    { name: 'Pinterest', iconType: 'Pin', status: 'Q3 2026' },
  ],
  loading: false,
  error: null
};

const integrationsSlice = createSlice({
  name: 'integrations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIntegrations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIntegrations.fulfilled, (state, action) => {
        state.loading = false;
        state.connectedAccounts = action.payload;
      })
      .addCase(fetchIntegrations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(disconnectIntegration.fulfilled, (state, action) => {
        state.connectedAccounts = state.connectedAccounts.filter(acc => acc.platform !== action.payload);
      });
  }
});

export default integrationsSlice.reducer;

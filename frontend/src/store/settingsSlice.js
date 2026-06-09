import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import settingsService from '../api/settingsService';

// ─── Async Thunks ───────────────────────────────────────────────────────────

export const fetchProfile = createAsyncThunk(
  'settings/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await settingsService.getProfile();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load profile.');
    }
  }
);

export const saveProfile = createAsyncThunk(
  'settings/saveProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      return await settingsService.updateProfile(profileData);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update profile.');
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'settings/uploadAvatar',
  async (file, { rejectWithValue }) => {
    try {
      return await settingsService.uploadAvatar(file);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to upload avatar.');
    }
  }
);

export const fetchSession = createAsyncThunk(
  'settings/fetchSession',
  async (_, { rejectWithValue }) => {
    try {
      return await settingsService.getSession();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load session.');
    }
  }
);

export const fetchApiKeys = createAsyncThunk(
  'settings/fetchApiKeys',
  async (_, { rejectWithValue }) => {
    try {
      return await settingsService.getApiKeys();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load API keys.');
    }
  }
);

export const generateApiKey = createAsyncThunk(
  'settings/generateApiKey',
  async (name, { rejectWithValue }) => {
    try {
      return await settingsService.generateApiKey(name);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to generate API key.');
    }
  }
);

export const revokeApiKey = createAsyncThunk(
  'settings/revokeApiKey',
  async (id, { rejectWithValue }) => {
    try {
      await settingsService.revokeApiKey(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to revoke API key.');
    }
  }
);

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatStorageLabel = (mb) => {
  if (mb >= 1024000) return `${(mb / 1024000).toFixed(1)}TB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)}GB`;
  return `${Math.round(mb)}MB`;
};

// ─── Slice ──────────────────────────────────────────────────────────────────

const initialState = {
  profile: {
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    timezone: 'America/New_York',
    avatarUrl: null,
    storageUsedMB: 0,
    storageLimitMB: 1024000,
    storagePercent: 0,
    plan: 'free',
    statusBadge: ''
  },
  preferences: {
    theme: localStorage.getItem('sociosync_theme') || 'dark',
  },
  usage: {
    storageUsed: 0,
    storageTotal: '1TB',
    percentage: 0
  },
  session: {
    browser: '',
    os: '',
    ip: '',
    lastActive: null
  },
  apiKeys: [],
  // Tracks the newly generated key (shown only once)
  newlyGeneratedKey: null,
  // Loading / error states
  loading: false,
  saving: false,
  error: null,
  successMessage: null
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.preferences.theme = action.payload;
      localStorage.setItem('sociosync_theme', action.payload);
    },
    clearNewKey: (state) => {
      state.newlyGeneratedKey = null;
    },
    clearSettingsError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    // ─── Fetch Profile ────────────────────────────────────────
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        const d = action.payload;
        state.profile = {
          firstName: d.firstName || '',
          lastName: d.lastName || '',
          email: d.email || '',
          bio: d.bio || '',
          timezone: d.timezone || 'America/New_York',
          avatarUrl: d.avatarUrl || null,
          storageUsedMB: d.storageUsedMB || 0,
          storageLimitMB: d.storageLimitMB || 1024000,
          storagePercent: d.storagePercent || 0,
          plan: d.plan || 'free',
          statusBadge: d.statusBadge || ''
        };
        state.usage = {
          storageUsed: d.storageUsedMB || 0,
          storageTotal: formatStorageLabel(d.storageLimitMB || 1024000),
          percentage: d.storagePercent || 0
        };
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ─── Save Profile ─────────────────────────────────────────
    builder
      .addCase(saveProfile.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.saving = false;
        const d = action.payload;
        state.profile = {
          ...state.profile,
          firstName: d.firstName,
          lastName: d.lastName,
          bio: d.bio,
          timezone: d.timezone,
          statusBadge: d.statusBadge || '',
          storagePercent: d.storagePercent
        };
        state.successMessage = 'Profile saved successfully.';
      })
      .addCase(saveProfile.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    // ─── Upload Avatar ────────────────────────────────────────
    builder
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.profile.avatarUrl = action.payload.avatarUrl;
        state.successMessage = 'Avatar updated.';
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ─── Fetch Session ────────────────────────────────────────
    builder
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.session = action.payload;
      });

    // ─── Fetch API Keys ───────────────────────────────────────
    builder
      .addCase(fetchApiKeys.fulfilled, (state, action) => {
        state.apiKeys = action.payload;
      });

    // ─── Generate API Key ─────────────────────────────────────
    builder
      .addCase(generateApiKey.fulfilled, (state, action) => {
        const { data, message } = action.payload;
        state.apiKeys.unshift({
          id: data.id,
          name: data.name,
          keyPrefix: data.keyPrefix,
          lastUsedAt: null,
          createdAt: data.createdAt,
          isActive: true
        });
        state.newlyGeneratedKey = {
          fullKey: data.fullKey,
          name: data.name,
          message
        };
      })
      .addCase(generateApiKey.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ─── Revoke API Key ───────────────────────────────────────
    builder
      .addCase(revokeApiKey.fulfilled, (state, action) => {
        state.apiKeys = state.apiKeys.filter(k => k.id !== action.payload);
        state.successMessage = 'API key revoked.';
      })
      .addCase(revokeApiKey.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { setTheme, clearNewKey, clearSettingsError, clearSuccessMessage } = settingsSlice.actions;
export default settingsSlice.reducer;

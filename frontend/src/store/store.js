import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import dashboardReducer from './dashboardSlice';
import userReducer from './userSlice';
import analyticsReducer from './analyticsSlice';
import publisherReducer from './publisherSlice';
import integrationsReducer from './integrationsSlice';
import settingsReducer from './settingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    user: userReducer,
    analytics: analyticsReducer,
    publisher: publisherReducer,
    integrations: integrationsReducer,
    settings: settingsReducer,
  },
});

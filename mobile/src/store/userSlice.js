import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: {
    name: 'Rebecca Kelly',
    initials: 'RK',
  },
  usage: {
    percentage: 84,
  },
  notifications: {
    hasUnread: true,
  },
  searchQuery: '',
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    markNotificationsRead: (state) => {
      state.notifications.hasUnread = false;
    },
  },
});

export const { setSearchQuery, markNotificationsRead } = userSlice.actions;

export default userSlice.reducer;

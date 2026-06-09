import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  content: '',
  selectedPlatforms: ['instagram'], // Default to instagram
  media: [],
  scheduleDate: '',
  scheduleTime: '',
  isScheduling: false,
};

const publisherSlice = createSlice({
  name: 'publisher',
  initialState,
  reducers: {
    setContent: (state, action) => {
      state.content = action.payload;
    },
    togglePlatform: (state, action) => {
      const platformId = action.payload;
      if (state.selectedPlatforms.includes(platformId)) {
        state.selectedPlatforms = state.selectedPlatforms.filter(id => id !== platformId);
      } else {
        state.selectedPlatforms.push(platformId);
      }
    },
    setMedia: (state, action) => {
      state.media = action.payload;
    },
    setScheduleDate: (state, action) => {
      state.scheduleDate = action.payload;
    },
    setScheduleTime: (state, action) => {
      state.scheduleTime = action.payload;
    },
    setIsScheduling: (state, action) => {
      state.isScheduling = action.payload;
    },
    resetPublisher: (state) => {
      return initialState;
    }
  }
});

export const { 
  setContent, 
  togglePlatform, 
  setMedia, 
  setScheduleDate, 
  setScheduleTime, 
  setIsScheduling,
  resetPublisher 
} = publisherSlice.actions;

export default publisherSlice.reducer;

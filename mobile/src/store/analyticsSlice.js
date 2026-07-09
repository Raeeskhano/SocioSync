import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  summaryStats: [
    { id: 'impressions', title: 'Total Impressions', value: '2.4M', change: '+12.5%', trend: 'up', iconType: 'Eye' },
    { id: 'shares', title: 'Total Shares', value: '48.2k', change: '+8.2%', trend: 'up', iconType: 'Share2' },
    { id: 'comments', title: 'Engaged Comments', value: '12.9k', change: '+15.1%', trend: 'up', iconType: 'MessageCircle' },
    { id: 'engagement', title: 'Avg. Engagement', value: '5.82%', change: '+2.1%', trend: 'up', iconType: 'BarChart2' },
  ],
  topPosts: [
    { id: 1, title: '10 AI Tools to Boost Productivity in 2024', roi: '+24%', status: 'high' },
    { id: 2, title: 'The Future of Remote Collaboration', roi: '+18%', status: 'high' },
    { id: 3, title: 'Why Storytelling Matters in SaaS', roi: '-2%', status: 'low' },
  ],
  audienceReach: {
    topRegion: 'North America (48%)',
    ageRange: '18-34',
    gender: 'Non-Binary',
    peakTime: '9 PM',
  },
  platformSplit: [
    { id: 'instagram', name: 'Instagram', value: 42, color: 'bg-gradient-to-r from-secondary to-error', iconType: 'Instagram' },
    { id: 'tiktok', name: 'TikTok', value: 28, color: 'bg-on-surface-variant/40', iconType: 'Music2' },
    { id: 'linkedin', name: 'LinkedIn', value: 18, color: 'bg-[#0077b5]', iconType: 'Linkedin' },
    { id: 'twitter', name: 'X (Twitter)', value: 12, color: 'bg-on-surface-variant/20', iconType: 'Twitter' },
  ],
  recommendation: {
    text: "Double down on Instagram Reels between 6-8 PM.",
  }
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {}
});

export default analyticsSlice.reducer;

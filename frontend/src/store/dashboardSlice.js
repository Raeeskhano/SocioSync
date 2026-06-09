import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  stats: [
    { id: 'totalLikes', title: 'Total Likes', value: '124.8K', change: '+8.2%', trend: 'up', iconType: 'Heart' },
    { id: 'totalViews', title: 'Total Views', value: '2.4M', change: '+14.5%', trend: 'up', iconType: 'Eye' },
    { id: 'engagementRate', title: 'Engagement Rate', value: '4.82%', change: '+2.1%', trend: 'up', iconType: 'BarChart2' },
    { id: 'weeklyPosts', title: 'Weekly Posts', value: '18', change: '/avg', hideTrend: true, iconType: 'Clock' },
  ],
  recentPosts: [
    {
      id: 1,
      title: 'The Future of AI in Creative Design: A ...',
      timeText: 'Published 2h ago • Instagram',
      iconType: 'FileText',
      iconColor: '#8aa67a',
      reach: '12.4K',
      eng: '4.2%'
    },
    {
      id: 2,
      title: 'Retro Minimalism: Why 90s Aesthetic I...',
      timeText: 'Published yesterday • Twitter / X',
      iconType: 'Box',
      iconColor: '#4ea09c',
      reach: '8.1K',
      eng: '5.1%'
    }
  ],
  channels: [
    {
      id: 1,
      name: 'Instagram Business',
      iconType: 'AtSign',
      status: 'active'
    },
    {
      id: 2,
      name: 'Twitter / X',
      iconType: 'Share2',
      status: 'active'
    },
    {
      id: 3,
      name: 'TikTok Creator',
      iconType: 'PlaySquare',
      status: 'error'
    }
  ]
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {}
});

export default dashboardSlice.reducer;

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { Heart, Eye, BarChart2, Clock, Sparkles, Share2, AlertCircle, Box } from 'lucide-react-native';
import { dashboardService } from '../../api/dashboardService';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import GrowthChart from '../../components/ui/GrowthChart';

const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://10.0.2.2:5000';

export default function DashboardHome() {
  const router = useRouter();
  const { searchQuery } = useSelector((state: any) => state.user || { searchQuery: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState({
    summary: null as any,
    growth: [],
    recentPosts: [] as any[],
    channels: [] as any[],
    usage: null as any
  });
  const [generatingDrafts, setGeneratingDrafts] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [summary, growth, recent, channels, usage] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getGrowthChart(30),
        dashboardService.getRecentPosts(5),
        dashboardService.getChannels(),
        dashboardService.getUsage()
      ]);

      setData({
        summary: summary.data,
        growth: growth.data,
        recentPosts: recent.data,
        channels: channels.data,
        usage: usage.data
      });
    } catch (err) {
      setError('Failed to load dashboard data. Please try again later.');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchDashboardData();
      setLoading(false);
    };
    init();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleGenerateDrafts = async () => {
    try {
      setGeneratingDrafts(true);
      await dashboardService.suggestDrafts();
      router.push('/(tabs)/publisher');
    } catch (err) {
      // ignore
    } finally {
      setGeneratingDrafts(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#bd9dff" />
        <Text className="text-on-surface-variant font-medium mt-4">Synchronizing your dashboard...</Text>
      </View>
    );
  }

  if (error || !data.summary) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <AlertCircle color="#ff6e84" size={32} />
        <Text className="text-on-surface font-medium mt-4 text-center">{error}</Text>
        <Button className="mt-4" onPress={() => { setLoading(true); fetchDashboardData().then(() => setLoading(false)); }}>Retry</Button>
      </View>
    );
  }

  const stats = [
    { 
      id: 1, 
      title: 'Total Likes', 
      value: formatNumber(data.summary.totalLikes || 12), 
      change: `${(data.summary.likesGrowthPct || 24.5) >= 0 ? '+' : ''}${(data.summary.likesGrowthPct || 24.5).toFixed(1)}%`, 
      trend: (data.summary.likesGrowthPct || 1) >= 0 ? 'up' : 'down', 
      icon: Heart 
    },
    { 
      id: 2, 
      title: 'Total Views', 
      value: formatNumber(data.summary.totalViews || 120), 
      change: `${(data.summary.viewsGrowthPct || 12.3) >= 0 ? '+' : ''}${(data.summary.viewsGrowthPct || 12.3).toFixed(1)}%`, 
      trend: (data.summary.viewsGrowthPct || 1) >= 0 ? 'up' : 'down', 
      icon: Eye 
    },
    { 
      id: 3, 
      title: 'Engagement Rate', 
      value: `${(data.summary.engagementRate || 14.5).toFixed(2)}%`, 
      change: `${(data.summary.engGrowthPct || 4.2) >= 0 ? '+' : ''}${(data.summary.engGrowthPct || 4.2).toFixed(1)}%`, 
      trend: (data.summary.engGrowthPct || 1) >= 0 ? 'up' : 'down', 
      icon: BarChart2 
    },
    { 
      id: 4, 
      title: 'Weekly Posts', 
      value: data.summary.weeklyPostsAvg, 
      change: 'avg', 
      trend: 'up', 
      hideTrend: true,
      icon: Clock 
    },
  ];

  return (
    <ScrollView 
      className="flex-1 bg-background" 
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#bd9dff" />}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* Header */}
      <View className="mb-6">
        <Text className="text-3xl font-display font-bold tracking-tight text-on-surface">{data.summary.greeting}</Text>
        <Text className="text-on-surface-variant mt-1 text-sm">
          Your global engagement is up {(data.summary.weeklyGrowthPct || 0).toFixed(1)}% this week.
        </Text>
        <Button 
          variant="surface" 
          className="mt-4 self-start"
          icon={<Sparkles color="#bd9dff" size={16} />}
          onPress={() => router.push('/(tabs)/creative-lab')}
        >
          Generate Content
        </Button>
      </View>

      {/* Stats Grid */}
      <View className="flex-row flex-wrap justify-between mb-6">
        {stats.map((stat, i) => (
          <View key={stat.id} style={{ width: '48%', marginBottom: 16 }}>
            <StatCard 
              title={stat.title} 
              value={stat.value} 
              change={stat.change} 
              trend={stat.trend} 
              hideTrend={stat.hideTrend} 
              icon={stat.icon} 
            />
          </View>
        ))}
      </View>

      {/* Chart Area */}
      <Card level="lowest" className="mb-6">
        <View className="mb-4">
          <Text className="text-xl font-display font-semibold text-on-surface">Growth Performance</Text>
          <Text className="text-sm text-on-surface-variant mt-1">Follows vs Shares over 30 days</Text>
        </View>
        <View className="flex-row items-center gap-4 mb-4">
          <View className="flex-row items-center gap-2">
            <View className="w-2.5 h-2.5 rounded-full bg-primary" />
            <Text className="text-sm font-medium text-primary">Follows</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-2.5 h-2.5 rounded-full bg-[#ff97b2]" />
            <Text className="text-sm font-medium text-[#ff97b2]">Shares</Text>
          </View>
        </View>
        <View className="h-[200px]">
          <GrowthChart data={data.growth} />
        </View>
      </Card>

      {/* Ready to Scale Card */}
      <View className="mb-6 rounded-2xl overflow-hidden bg-primary p-6">
        <Text className="font-display font-bold text-lg mb-2 text-on-primary">Ready to scale?</Text>
        <Text className="text-xs text-on-primary/90 leading-relaxed mb-4">
          Our AI suggested 3 new topics based on your recent audience growth.
        </Text>
        <Button 
          variant="surface"
          onPress={handleGenerateDrafts}
          disabled={generatingDrafts}
          icon={generatingDrafts ? <ActivityIndicator size="small" color="#bd9dff" /> : <Share2 color="#bd9dff" size={16} />}
        >
          {generatingDrafts ? 'Generating...' : 'Generate 3 Drafts'}
        </Button>
      </View>

      {/* Recent Posts */}
      <Card level="high" className="mb-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-lg font-display font-semibold text-on-surface">Recent Posts</Text>
          <Text className="text-sm font-medium text-primary">View All</Text>
        </View>
        
        {data.recentPosts.length > 0 ? data.recentPosts.map((post) => {
          const thumbnailSrc = post.thumbnail ? (post.thumbnail.startsWith('http') ? post.thumbnail : `${API_BASE}${post.thumbnail}`) : null;
          return (
            <View key={post.id} className="flex-row items-center justify-between p-3 rounded-xl bg-surface-container-highest mb-2">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-ghost overflow-hidden mr-3">
                  {thumbnailSrc ? (
                    <Image source={{ uri: thumbnailSrc }} className="w-full h-full" />
                  ) : (
                    <Box color="#6d758c" size={20} />
                  )}
                </View>
                <View className="flex-1 pr-2">
                  <Text className="text-sm font-medium text-on-surface" numberOfLines={1}>{post.title}</Text>
                  <Text className="text-xs text-on-surface-variant mt-0.5">{new Date(post.publishedAt).toLocaleDateString()} • {post.platform}</Text>
                </View>
              </View>
              <View className="flex-col items-end">
                <Text className="text-sm font-bold text-on-surface">{post.impressions || 0}</Text>
                <Text className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Views</Text>
              </View>
            </View>
          );
        }) : (
          <Text className="text-center text-on-surface-variant text-sm py-4">No recent posts found.</Text>
        )}
      </Card>
    </ScrollView>
  );
}

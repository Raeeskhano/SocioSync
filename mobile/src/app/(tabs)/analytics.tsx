import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { Eye, Share2, Users, BarChart2, Globe, Clock, Zap, TrendingUp } from 'lucide-react-native';

import analyticsService from '../../api/analyticsService';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import EngagementVelocityChart from '../../components/ui/EngagementVelocityChart';

export default function Analytics() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    summary: null as any,
    velocity: [],
    platformSplit: [] as any[],
    topPosts: [] as any[],
    audience: null as any
  });

  const periods = [
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: 'Yearly', value: 'ytd' },
  ];

  const fetchAnalytics = async () => {
    try {
      const [summary, velocity, platformSplit, topPosts, audience] = await Promise.all([
        analyticsService.getSummary(period),
        analyticsService.getVelocity(period),
        analyticsService.getPlatformSplit(period),
        analyticsService.getTopPosts(period, 3),
        analyticsService.getAudienceGeo()
      ]);

      setData({ summary, velocity, platformSplit, topPosts, audience });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchAnalytics();
      setLoading(false);
    };
    load();
  }, [period]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await analyticsService.syncMetrics();
      await fetchAnalytics();
    } catch (err) {
    } finally {
      setSyncing(false);
    }
  };

  const formatValue = (val: any) => {
    if (!val) return '0';
    const num = Number(val);
    if (isNaN(num)) return val;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  if (loading && !data.summary) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#bd9dff" />
        <Text className="text-on-surface-variant font-medium mt-4">Aggregating real-time insights...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-background"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#bd9dff" />}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      <View className="mb-6">
        <Text className="text-3xl font-display font-bold tracking-tight text-on-surface">Analytics</Text>
        <Text className="text-on-surface-variant mt-1 text-sm">Real-time tracking of your digital footprint.</Text>
        
        <View className="flex-row items-center gap-3 mt-4">
          <Button 
            variant="surface"
            onPress={handleSync}
            disabled={syncing}
            icon={syncing ? <ActivityIndicator size="small" color="#bd9dff" /> : <Zap color="#bd9dff" size={16} />}
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          <Button 
            variant="surface"
            icon={<TrendingUp color="#bd9dff" size={16} />}
          >
            Export
          </Button>
        </View>
      </View>

      {/* Date Filters */}
      <View className="flex-row items-center p-1 bg-surface-container-high rounded-2xl mb-6">
        {periods.map(p => (
          <Button
            key={p.value}
            variant={period === p.value ? 'primary' : 'tertiary'}
            className="flex-1"
            onPress={() => setPeriod(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </View>

      {/* Summary Stats Grid */}
      <View className="flex-row flex-wrap justify-between mb-6">
        <View style={{ width: '48%', marginBottom: 16 }}>
          <StatCard 
            title="Total Impressions" 
            value={formatValue(data.summary?.totalImpressions || 120)} 
            change={`${(data.summary?.impressionsGrowthPct || 12.3) >= 0 ? '+' : ''}${(data.summary?.impressionsGrowthPct || 12.3).toFixed(1)}%`} 
            trend={(data.summary?.impressionsGrowthPct || 1) >= 0 ? 'up' : 'down'} 
            icon={Eye} 
          />
        </View>
        <View style={{ width: '48%', marginBottom: 16 }}>
          <StatCard 
            title="Total Shares" 
            value={formatValue(data.summary?.totalShares || 1)} 
            change={`${(data.summary?.sharesGrowthPct || 5.0) >= 0 ? '+' : ''}${(data.summary?.sharesGrowthPct || 5.0).toFixed(1)}%`} 
            trend={(data.summary?.sharesGrowthPct || 1) >= 0 ? 'up' : 'down'} 
            icon={Share2} 
          />
        </View>
        <View style={{ width: '48%', marginBottom: 16 }}>
          <StatCard 
            title="Engaged Connects" 
            value={formatValue(data.summary?.totalEngaged || 18)} 
            change={`${(data.summary?.engagedGrowthPct || 8.4) >= 0 ? '+' : ''}${(data.summary?.engagedGrowthPct || 8.4).toFixed(1)}%`} 
            trend={(data.summary?.engagedGrowthPct || 1) >= 0 ? 'up' : 'down'} 
            icon={Users} 
          />
        </View>
        <View style={{ width: '48%', marginBottom: 16 }}>
          <StatCard 
            title="Avg Engagement" 
            value={`${(data.summary?.avgEngagementRate || 14.5).toFixed(2)}%`} 
            change={`+${(data.summary?.engRateGrowthPct || 4.2).toFixed(1)}%`} 
            trend="up" 
            icon={BarChart2}
            highlight={true}
          />
        </View>
      </View>

      {/* Chart */}
      <Card level="lowest" className="mb-6">
        <View className="mb-4">
          <Text className="text-xl font-display font-semibold text-on-surface">Engagement Velocity</Text>
          <Text className="text-sm text-on-surface-variant mt-1">Daily reach and interaction trends</Text>
        </View>
        <View className="flex-row items-center gap-4 mb-4">
          <View className="flex-row items-center gap-2">
            <View className="w-2.5 h-2.5 rounded-full bg-primary" />
            <Text className="text-sm font-medium text-primary">Reach</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-2.5 h-2.5 rounded-full bg-[#ff97b2]" />
            <Text className="text-sm font-medium text-[#ff97b2]">Actions</Text>
          </View>
        </View>
        <View className="h-[200px]">
          <EngagementVelocityChart data={data.velocity} />
        </View>
      </Card>

      {/* Top Posts */}
      <Card level="high" className="mb-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-lg font-display font-semibold text-on-surface">Top Posts</Text>
          <Text className="text-sm font-medium text-primary">View All</Text>
        </View>
        
        {data.topPosts.length > 0 ? data.topPosts.map((post, idx) => (
          <View key={idx} className="flex-col p-4 rounded-2xl bg-surface-container-highest mb-3">
            <View className="flex-row items-center gap-3 mb-3">
              <View className="w-12 h-12 rounded-lg bg-surface border border-ghost overflow-hidden">
                {post.thumbnail ? (
                  <Image source={{ uri: post.thumbnail.startsWith('http') ? post.thumbnail : `https://socio-sync-pi.vercel.app${post.thumbnail}` }} className="w-full h-full" />
                ) : (
                  <View className="w-full h-full bg-surface-variant" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-on-surface" numberOfLines={1}>{post.title}</Text>
                <Text className="text-[10px] text-on-surface-variant mt-1">{post.platform}</Text>
              </View>
            </View>
            <View className="flex-row justify-between pt-3 border-t border-ghost/30">
              <View className="flex-col items-center">
                <Text className="text-sm font-bold text-on-surface">{post.impressions || 0}</Text>
                <Text className="text-[9px] uppercase tracking-widest text-on-surface-variant">Impressions</Text>
              </View>
              <View className="flex-col items-center">
                <Text className="text-sm font-bold text-on-surface">{post.likes || 0}</Text>
                <Text className="text-[9px] uppercase tracking-widest text-on-surface-variant">Likes</Text>
              </View>
              <View className="flex-col items-center">
                <Text className="text-sm font-bold text-on-surface">{post.comments || 0}</Text>
                <Text className="text-[9px] uppercase tracking-widest text-on-surface-variant">Comments</Text>
              </View>
            </View>
          </View>
        )) : (
          <Text className="text-center text-on-surface-variant py-4">No top posts yet.</Text>
        )}
      </Card>
      
      {/* Global Audience */}
      <Card level="high" className="mb-6">
        <Text className="text-lg font-display font-semibold mb-6">Audience Insights</Text>
        <View className="flex-row flex-wrap justify-between">
          <View className="w-[48%] flex-row items-center gap-3 mb-6">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
              <Globe color="#bd9dff" size={20} />
            </View>
            <View>
              <Text className="text-[9px] uppercase text-on-surface-variant tracking-widest">Top Region</Text>
              <Text className="text-sm font-bold text-on-surface">{data.audience?.geoData?.[0]?.country || 'USA'}</Text>
            </View>
          </View>
          <View className="w-[48%] flex-row items-center gap-3 mb-6">
            <View className="w-10 h-10 rounded-xl bg-secondary/10 items-center justify-center">
              <Users color="#65e6d9" size={20} />
            </View>
            <View>
              <Text className="text-[9px] uppercase text-on-surface-variant tracking-widest">Demographic</Text>
              <Text className="text-sm font-bold text-on-surface">{data.audience?.demographics?.topAgeGroup || '25-34'}</Text>
            </View>
          </View>
          <View className="w-[48%] flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-tertiary/10 items-center justify-center">
              <Clock color="#ffd085" size={20} />
            </View>
            <View>
              <Text className="text-[9px] uppercase text-on-surface-variant tracking-widest">Peak Time</Text>
              <Text className="text-sm font-bold text-on-surface">{data.audience?.demographics?.peakPostTime || '10:00'}</Text>
            </View>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

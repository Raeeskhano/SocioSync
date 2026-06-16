import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import EngagementVelocityChart from '../components/ui/EngagementVelocityChart';
import { 
  Eye, 
  Share2, 
  Users, 
  BarChart2, 
  Globe,
  Clock,
  TrendingUp,
  MoreVertical,
  Loader2,
  ExternalLink,
  Zap,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { 
  InstagramIcon, 
  TikTokIcon, 
  LinkedinIcon, 
  XIcon 
} from '../components/ui/BrandIcons';
import analyticsService from '../api/analyticsService';
import { useToast } from '../context/ToastContext';

const Analytics = () => {
  const { showToast } = useToast();
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [customRange, setCustomRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [data, setData] = useState({
    summary: null,
    velocity: [],
    platformSplit: [],
    topPosts: [],
    audience: null
  });

  const periods = [
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: 'Yearly', value: 'ytd' },
    { label: 'Custom', value: 'custom' },
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [period, customRange.from, customRange.to]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const isCustom = period === 'custom';
      const from = isCustom ? customRange.from : undefined;
      const to = isCustom ? customRange.to : undefined;

      const [summary, velocity, platformSplit, topPosts, audience] = await Promise.all([
        analyticsService.getSummary(period, from, to),
        analyticsService.getVelocity(period, from, to),
        analyticsService.getPlatformSplit(period, from, to),
        analyticsService.getTopPosts(period, 3, from, to),
        analyticsService.getAudienceGeo()
      ]);

      setData({
        summary,
        velocity,
        platformSplit,
        topPosts,
        audience
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      showToast('Initiating real-time social metrics synchronization...', 'info');
      const res = await analyticsService.syncMetrics();
      if (res.success) {
        showToast(res.message || 'Metrics synchronized successfully!', 'sparkles');
        // Refresh analytics dashboard
        await fetchAnalytics();
      } else {
        showToast(res.message || 'Sync complete, but some platforms had errors.', 'info');
      }
    } catch (err) {
      console.error('Real-time sync failed:', err);
      showToast(err.response?.data?.message || 'Sync failed. Please check your social accounts connection.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async () => {
    try {
      const isCustom = period === 'custom';
      const from = isCustom ? customRange.from : undefined;
      const to = isCustom ? customRange.to : undefined;
      await analyticsService.exportData(period, from, to);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const formatValue = (val) => {
    if (!val) return '0';
    const num = Number(val);
    if (isNaN(num)) return val;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return InstagramIcon;
      case 'tiktok': return TikTokIcon;
      case 'linkedin': return LinkedinIcon;
      case 'twitter':
      case 'x': return XIcon;
      default: return Share2;
    }
  };

  if (loading && !data.summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-on-surface-variant font-medium animate-pulse">Aggregating real-time insights...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-on-surface">Analytics Performance</h1>
            <p className="text-on-surface-variant mt-1 max-w-2xl text-sm">
              Comprehensive real-time tracking of your cross-platform digital footprint.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 w-fit border-ghost hover:border-primary/30 transition-all duration-300"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <Zap className="w-4 h-4 text-primary" />
              )}
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button variant="surface" className="flex items-center gap-2 w-fit" onClick={handleExport}>
              <TrendingUp className="w-4 h-4 text-primary" />
              Full Export
            </Button>
          </div>
        </div>
        
        {/* Date Filters Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 bg-surface-container-low p-2 rounded-3xl border border-ghost">
          <div className="flex items-center p-1 bg-surface-container-high rounded-2xl w-full lg:w-fit overflow-x-auto scrollbar-hide">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  period === p.value 
                    ? 'bg-primary text-on-primary-fixed shadow-ambient scale-[1.02]' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-3 w-full lg:w-auto px-2 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="h-4 w-px bg-ghost hidden lg:block mx-2"></div>
              <div className="flex items-center gap-2 flex-1 lg:flex-none">
                <div className="relative flex-1 lg:flex-none">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
                  <input 
                    type="date" 
                    value={customRange.from}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, from: e.target.value }))}
                    className="bg-surface-container-highest border border-ghost rounded-xl pl-9 pr-3 py-2 text-[11px] font-bold text-on-surface focus:outline-none focus:border-primary/50 w-full"
                  />
                </div>
                <ChevronRight className="w-4 h-4 text-on-surface-variant opacity-30" />
                <div className="relative flex-1 lg:flex-none">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
                  <input 
                    type="date" 
                    value={customRange.to}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, to: e.target.value }))}
                    className="bg-surface-container-highest border border-ghost rounded-xl pl-9 pr-3 py-2 text-[11px] font-bold text-on-surface focus:outline-none focus:border-primary/50 w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Impressions" 
          value={formatValue(data.summary?.totalImpressions || 120)} 
          change={`${(data.summary?.impressionsGrowthPct || 12.3) >= 0 ? '+' : ''}${(data.summary?.impressionsGrowthPct || 12.3).toFixed(1)}%`} 
          trend={(data.summary?.impressionsGrowthPct || 1) >= 0 ? 'up' : 'down'} 
          icon={Eye} 
        />
        <StatCard 
          title="Total Shares" 
          value={formatValue(data.summary?.totalShares || 1)} 
          change={`${(data.summary?.sharesGrowthPct || 5.0) >= 0 ? '+' : ''}${(data.summary?.sharesGrowthPct || 5.0).toFixed(1)}%`} 
          trend={(data.summary?.sharesGrowthPct || 1) >= 0 ? 'up' : 'down'} 
          icon={Share2} 
        />
        <StatCard 
          title="Engaged Connects" 
          value={formatValue(data.summary?.totalEngaged || 18)} 
          change={`${(data.summary?.engagedGrowthPct || 8.4) >= 0 ? '+' : ''}${(data.summary?.engagedGrowthPct || 8.4).toFixed(1)}%`} 
          trend={(data.summary?.engagedGrowthPct || 1) >= 0 ? 'up' : 'down'} 
          icon={Users} 
        />
        <StatCard 
          title="Avg Engagement" 
          value={`${(data.summary?.avgEngagementRate || 14.5).toFixed(2)}%`} 
          change={`+${(data.summary?.engRateGrowthPct || 4.2).toFixed(1)}%`} 
          trend="up" 
          icon={BarChart2}
          highlight={true}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Velocity */}
        <Card level="lowest" className="lg:col-span-2 flex flex-col h-[420px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h3 className="text-lg font-display font-semibold text-on-surface tracking-tight">Engagement Velocity</h3>
              <p className="text-xs text-on-surface-variant mt-1">Daily reach and interaction trends</p>
            </div>
            <div className="flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-2xl border border-ghost">
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(127,119,221,0.5)]"></div>
                 <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Reach</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-[#FF97B2] shadow-[0_0_8px_rgba(255,151,178,0.5)]"></div>
                 <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Actions</span>
               </div>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <EngagementVelocityChart data={data.velocity} />
          </div>
        </Card>

        {/* Platform Split Card */}
        <Card level="high" className="flex flex-col h-[420px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-display font-semibold">Platform Split</h3>
            <button className="text-on-surface-variant hover:text-on-surface p-1 hover:bg-white/5 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col gap-6">
            {data.platformSplit.length > 0 ? data.platformSplit.map((platform, idx) => {
              const Icon = getPlatformIcon(platform.platform);
              const colors = ['bg-primary', 'bg-[#FF97B2]', 'bg-[#0077b5]', 'bg-[#1DA1F2]'];
              return (
                <div key={idx} className="flex flex-col gap-2 group cursor-default">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-4 h-4 text-on-surface" />
                      </div>
                      <span className="text-sm font-semibold text-on-surface">{platform.platform}</span>
                    </div>
                    <span className="text-xs font-bold text-on-surface-variant">{platform.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${colors[idx % colors.length]}`} 
                      style={{ width: `${platform.percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            }) : (
              <div className="flex-1 flex items-center justify-center text-xs text-on-surface-variant italic">
                No platform data available
              </div>
            )}
          </div>

          {/* Recommendation Box */}
          {data.platformSplit[0]?.recommendation && (
            <div className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform">
                  <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">Smart Recommendation</span>
                  <p className="text-xs font-semibold text-on-surface mt-0.5 leading-relaxed">
                      {data.platformSplit[0].recommendation}
                  </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Grid: Top Posts & Global Audience */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Posts */}
        <Card level="high" className="flex flex-col min-h-[480px]">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-display font-semibold">Top Performing Posts</h3>
                <button className="text-[11px] font-bold text-primary hover:underline">View All Posts</button>
            </div>
            <div className="space-y-3">
                {data.topPosts.length > 0 ? data.topPosts.map((post, idx) => {
                    const PlatformIcon = getPlatformIcon(post.platform);
                    return (
                        <div key={idx} className="flex flex-col xl:flex-row xl:items-center justify-between p-4 rounded-2xl bg-surface-container-low border border-transparent hover:border-ghost hover:bg-surface-container-high transition-all cursor-pointer group gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0 w-full xl:w-auto">
                                <div className="w-12 h-12 rounded-xl bg-surface-container-high overflow-hidden border border-ghost flex-shrink-0 relative">
                                    {post.thumbnail ? (
                                      <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <PlatformIcon className="w-5 h-5 text-on-surface-variant" />
                                      </div>
                                    )}
                                    <div className="absolute top-0 right-0 p-1 bg-black/50 backdrop-blur-sm rounded-bl-lg">
                                      <PlatformIcon className="w-2.5 h-2.5 text-white" />
                                    </div>
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">{post.title}</span>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                     <span className="text-[10px] font-bold px-1.5 py-0.5 bg-success/10 text-success rounded-md">+{post.growthPct?.toFixed(1) || '0.0'}% ROI</span>
                                     <span className="text-[10px] font-medium text-on-surface-variant">Last updated 6h ago</span>
                                  </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between xl:justify-end gap-3 sm:gap-6 xl:gap-10 w-full xl:w-auto xl:pr-2 pl-16 xl:pl-0">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-bold text-on-surface">{post.impressions || 0}</span>
                                    <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-widest">Impressions</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-bold text-on-surface">{post.likes || 0}</span>
                                    <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-widest">Likes</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-bold text-on-surface">{post.comments || 0}</span>
                                    <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-widest">Comments</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-bold text-on-surface">{post.shares || 0}</span>
                                    <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-widest">Shares</span>
                                </div>
                                <div className="text-on-surface-variant hover:text-primary transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30 italic text-sm">
                    <Loader2 className="w-6 h-6 mb-2 animate-spin" />
                    Determining top performers...
                  </div>
                )}
            </div>
        </Card>

        {/* Global Audience Reach */}
        <Card level="high" className="flex flex-col min-h-[480px]">
            <h3 className="text-lg font-display font-semibold mb-8">Global Audience Reach</h3>
            <div className="flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-x-8 gap-y-8 mb-8">
                    <div className="flex items-start gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Globe className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Top Region</p>
                            <p className="text-base font-bold text-on-surface mt-1">{data.audience?.geoData?.[0]?.country || 'Loading...'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/20 transition-colors">
                            <Users className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Demographic</p>
                            <p className="text-base font-bold text-on-surface mt-1">
                              {data.audience?.demographics?.topAgeGroup} / {data.audience?.demographics?.topGender}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-tertiary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-tertiary/20 transition-colors">
                            <Clock className="w-6 h-6 text-tertiary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Peak Activity</p>
                            <p className="text-base font-bold text-on-surface mt-1">{data.audience?.demographics?.peakPostTime} Local Time</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Growth Index</p>
                            <p className="text-base font-bold text-on-surface mt-1">+4.8% Monthly</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 w-full rounded-3xl overflow-hidden bg-surface-container-low border border-ghost relative shadow-inner p-4">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container-low/80 pointer-events-none z-10"></div>
                    <div className="w-full h-full opacity-40 grayscale hover:grayscale-0 transition-all duration-1000">
                        {/* Placeholder for actual interactive map */}
                        <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/30 rounded-2xl gap-4">
                           <Globe className="w-12 h-12 text-on-surface-variant/20 animate-pulse" />
                           <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.3em] text-center px-4">
                              Global Engagement Heatmap
                           </span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;

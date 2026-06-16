import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import GrowthChart from '../components/ui/GrowthChart';
import { dashboardService } from '../api/dashboardService';
import { 
  Heart,
  Eye,
  BarChart2,
  Clock,
  MoreVertical,
  Sparkles,
  AtSign,
  Share2,
  PlaySquare,
  FileText,
  Box,
  Loader2,
  AlertCircle
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const IconLinkedin = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const IconInstagram = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const IconTwitter = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.005 4.15H5.059z"/>
  </svg>
);

const IconFacebook = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const DashboardHome = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { searchQuery } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    summary: null,
    growth: [],
    recentPosts: [],
    channels: [],
    usage: null
  });
  const [generatingDrafts, setGeneratingDrafts] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
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
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleGenerateDrafts = async () => {
    try {
      setGeneratingDrafts(true);
      await dashboardService.suggestDrafts();
      // Remove alert completely since we redirect
      navigate('/publisher');
    } catch (err) {
      showToast('Failed to generate drafts. Check your Gemini API key.', 'error');
    } finally {
      setGeneratingDrafts(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-on-surface-variant animate-pulse font-medium">Synchronizing your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-8 h-8 text-error" />
        <p className="text-on-surface font-medium">{error}</p>
        <Button onClick={() => window.location.reload()} variant="primary">Retry</Button>
      </div>
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

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return { icon: IconInstagram, color: '#E1306C' };
      case 'twitter':
      case 'x': return { icon: IconTwitter, color: '#1DA1F2' };
      case 'facebook': return { icon: IconFacebook, color: '#1877F2' };
      case 'linkedin': return { icon: IconLinkedin, color: '#0A66C2' };
      case 'tiktok': return { icon: Share2, color: '#00F2EA' };
      default: return { icon: Box, color: '#7F77DD' };
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">{data.summary.greeting}</h1>
          <p className="text-on-surface-variant mt-1">Your global engagement is up {(data.summary.weeklyGrowthPct || 0).toFixed(1)}% this week.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="surface" 
            className="flex items-center gap-2"
            onClick={() => navigate('/ai-creative-lab')}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Generate Content
          </Button>
        </div>
      </div>

      {/* Top Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Stat Cards 2x2 */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-1">
          {stats.map((stat) => (
            <StatCard 
              key={stat.id}
              title={stat.title} 
              value={stat.value} 
              change={stat.change} 
              trend={stat.trend} 
              hideTrend={stat.hideTrend} 
              icon={stat.icon} 
            />
          ))}
        </div>

        {/* Chart Area */}
        <Card level="lowest" className="lg:col-span-2 border-ghost flex flex-col min-h-[340px] lg:h-[232px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-display font-semibold text-on-surface tracking-wide">Growth Performance</h2>
              <p className="text-sm text-on-surface-variant mt-1">Follows vs Shares over the last 30 days</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(189,157,255,0.6)]"></span>
                <span className="text-sm font-medium text-primary">Follows</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary shadow-[0_0_8px_rgba(255,151,178,0.6)]"></span>
                <span className="text-sm font-medium text-tertiary">Shares</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0 relative rounded-lg px-2 pb-4">
            <GrowthChart data={data.growth} />
          </div>
        </Card>

      </div>

      {/* Bottom Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Posts Area */}
        <Card level="high" className="lg:col-span-2 flex flex-col min-h-[360px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-display font-semibold">Recent Posts</h2>
            <button className="text-sm font-medium text-primary hover:text-primary-dim transition-colors">
              View All Posts
            </button>
          </div>
          <div className="flex flex-col gap-2">
            
            {(() => {
              const filteredPosts = data.recentPosts.filter(post => 
                post.title?.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                post.platform?.toLowerCase().includes((searchQuery || '').toLowerCase())
              );

              if (filteredPosts.length > 0) {
                return filteredPosts.map((post) => {
                  const { icon: PlatformIcon, color: iconColor } = getPlatformIcon(post.platform);
                  const thumbnailSrc = post.thumbnail
                    ? (post.thumbnail.startsWith('http') ? post.thumbnail : `${API_BASE}${post.thumbnail}`)
                    : null;
                  return (
                    <div key={post.id} className="flex flex-col xl:flex-row xl:items-center justify-between p-4 rounded-xl hover:bg-surface-container-highest transition-colors group cursor-pointer gap-4">
                      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 w-full xl:w-auto">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#151f33] flex items-center justify-center flex-shrink-0 border border-ghost overflow-hidden">
                          {thumbnailSrc ? (
                            <img src={thumbnailSrc} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <PlatformIcon className="w-4 h-4 md:w-5 md:h-5" style={{ color: iconColor }} />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate">{post.title}</span>
                          <span className="text-[11px] md:text-xs text-on-surface-variant mt-0.5 truncate">
                            {new Date(post.publishedAt).toLocaleDateString()} • {post.platform}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between xl:justify-end gap-3 sm:gap-6 xl:gap-8 w-full xl:w-auto xl:pr-2 pl-14 xl:pl-0">
                        <div className="flex flex-col items-end">
                          <span className="text-xs md:text-sm font-bold text-on-surface">{post.impressions || 0}</span>
                          <span className="text-[9px] md:text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Impressions</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs md:text-sm font-bold text-on-surface">{post.likes || 0}</span>
                          <span className="text-[9px] md:text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Likes</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs md:text-sm font-bold text-on-surface">{post.comments || 0}</span>
                          <span className="text-[9px] md:text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Comments</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs md:text-sm font-bold text-on-surface">{post.shares || 0}</span>
                          <span className="text-[9px] md:text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Shares</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs md:text-sm font-bold text-on-surface">{post.follows || 0}</span>
                          <span className="text-[9px] md:text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Follows</span>
                        </div>
                        <button className="text-on-surface-variant hover:text-on-surface p-1">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                });
              } else {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant text-sm italic">
                    {searchQuery ? `No posts found matching "${searchQuery}".` : 'No recent posts found. Start publishing to see metrics!'}
                  </div>
                );
              }
            })()}

          </div>
        </Card>

        {/* Side Panel Area */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          
          {/* Ready to Scale Card */}
          <Card level="highest" className="bg-gradient-to-br from-[#8a4cfc] to-[#612b8f] border-none flex flex-col justify-between p-6 h-[180px]">
            <div>
              <h3 className="font-display font-bold text-lg mb-2 text-white">Ready to scale?</h3>
              <p className="text-xs text-white/90 leading-relaxed max-w-[90%]">
                Our AI suggested 3 new topics based on your recent audience growth.
              </p>
            </div>
            <button 
              onClick={handleGenerateDrafts}
              disabled={generatingDrafts}
              className="w-full bg-white text-[#612b8f] hover:bg-white/90 disabled:opacity-70 rounded-lg py-2.5 px-4 flex justify-center items-center gap-2 font-semibold text-sm transition-colors mt-2"
            >
              {generatingDrafts ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              {generatingDrafts ? 'Generating...' : 'Generate 3 Drafts'}
            </button>
          </Card>

          {/* Channels Card */}
          <Card level="high">
            <h3 className="text-[11px] font-bold text-on-surface-variant tracking-wider uppercase mb-5">Channels</h3>
            <div className="space-y-4 mb-6">
              {data.channels.map((channel, idx) => {
                const { icon: PlatformIcon } = getPlatformIcon(channel.platform);
                return (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center">
                        <PlatformIcon className="w-4 h-4 text-on-surface-variant" />
                      </div>
                      <span className="text-sm font-medium text-on-surface">{channel.accountName || channel.platform}</span>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${channel.status === 'connected' ? 'bg-primary shadow-[0_0_8px_rgba(189,157,255,0.6)]' : 'bg-error shadow-[0_0_8px_rgba(255,110,132,0.6)]'}`}></div>
                  </div>
                );
              })}
            </div>
            <Button onClick={() => navigate('/integrations')} variant="secondary" className="w-full text-xs py-2.5 bg-surface-container-low border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors">Manage Connections</Button>
          </Card>

          {/* Usage Card */}
          {data.usage && (
            <Card level="high" className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Usage</span>
                <span className="text-[10px] font-bold text-primary uppercase">{data.usage.plan} Plan</span>
              </div>
              <div className="w-full bg-surface-variant rounded-full h-1.5 mb-2">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(data.usage.usagePercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-on-surface">Current usage: {data.usage.usagePercent.toFixed(0)}%</span>
                <button className="text-xs font-bold text-primary hover:underline">Upgrade</button>
              </div>
            </Card>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;

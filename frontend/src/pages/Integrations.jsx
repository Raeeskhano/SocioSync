import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Briefcase, 
  Camera, 
  Zap, 
  Plus, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  Globe,
  Video,
  Music2,
  AtSign,
  Pin,

  ShieldAlert,
  Loader2,
  X,
  Lock
} from 'lucide-react';
import Button from '../components/ui/Button';
import { fetchIntegrations, reconnectIntegration, disconnectIntegration } from '../store/integrationsSlice';
import integrationService from '../api/integrationService';
import { useToast } from '../context/ToastContext';

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

// Map for icon components based on platform string
const PlatformConfig = {
  linkedin: {
    name: 'LinkedIn Business',
    icon: IconLinkedin,
    color: 'text-[#0A66C2]',
    bg: 'bg-[#0A66C2]/10',
    span: 'md:col-span-1 lg:col-span-1'
  },
  instagram: {
    name: 'Instagram',
    icon: IconInstagram,
    color: 'text-[#E4405F]',
    bg: 'bg-[#E4405F]/10',
    span: 'md:col-span-1 lg:col-span-1'
  },
  facebook: {
    name: 'Facebook Page',
    icon: IconFacebook,
    color: 'text-[#1877F2]',
    bg: 'bg-[#1877F2]/10',
    span: 'md:col-span-1 lg:col-span-1'
  },
  twitter: {
    name: 'Twitter / X',
    icon: IconTwitter,
    color: 'text-on-surface',
    bg: 'bg-surface-bright',
    span: 'md:col-span-1 lg:col-span-1'
  }
};

const Integrations = () => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { connectedAccounts, upcomingPlatforms, loading } = useSelector((state) => state.integrations);

  
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const unconnectedPlatforms = Object.keys(PlatformConfig).filter(
    (platformKey) => !connectedAccounts.some(acc => acc.platform.toLowerCase() === platformKey)
  );

  useEffect(() => {
    dispatch(fetchIntegrations());

    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');

    if (connected) {
      showToast(`Successfully connected ${connected}!`, 'success');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      showToast(error, 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [dispatch, showToast]);

  const handleReconnect = (platform) => {
    dispatch(reconnectIntegration(platform));
  };

  const handleDisconnect = (platform) => {
    if (window.confirm(`Are you sure you want to disconnect ${platform}?`)) {
      dispatch(disconnectIntegration(platform));
    }
  };

  const handleOpenLogs = async () => {
    setShowLogsModal(true);
    setLoadingLogs(true);
    try {
      const logs = await integrationService.getSecurityLogs();
      setSecurityLogs(logs || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  if (loading && connectedAccounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-on-surface-variant font-medium animate-pulse">Syncing integration status...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-on-surface tracking-tight">Integrations Hub</h1>
        <p className="text-on-surface-variant max-w-2xl text-sm md:text-base leading-relaxed">
          Manage your social ecosystem. Connect channels to enable multi-platform publishing and unified analytics.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectedAccounts.map((account) => {
          const config = PlatformConfig[account.platform.toLowerCase()] || {
            name: account.platform,
            icon: Globe,
            color: 'text-primary',
            bg: 'bg-primary/10',
            span: 'md:col-span-1'
          };
          const Icon = config.icon;

          return (
            <div 
              key={account.platform} 
              className={`glass p-6 rounded-[2rem] border-ghost flex flex-col gap-6 group hover:border-primary/20 transition-all shadow-sm ${config.span}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${config.bg} flex items-center justify-center shadow-inner`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-display font-bold text-lg text-on-surface">{config.name}</h3>
                    <span className="text-xs text-on-surface-variant">
                      {account.accountHandle || account.accountName || 'Connected'}
                    </span>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  account.status === 'connected' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${account.status === 'connected' ? 'bg-success' : 'bg-error'}`}></div>
                  {account.status}
                </div>
              </div>

              {/* Error Message if any */}
              {account.status === 'error' && (
                <div className="p-3 rounded-xl bg-error/5 border border-error/10 text-[10px] text-error font-medium leading-relaxed">
                  {account.errorMessage || 'Connection lost. Please reconnect to resume service.'}
                </div>
              )}

              {/* Reconnect / Action Buttons */}
              <div className="flex flex-col gap-3 mt-auto">
                {account.status === 'error' ? (
                  <Button 
                    onClick={() => handleReconnect(account.platform)}
                    variant="secondary" 
                    className="w-full py-2.5 text-[10px] uppercase font-bold tracking-widest rounded-xl bg-primary/5 border-primary/20 hover:bg-primary/10"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-primary" /> Reconnect Account
                    </div>
                  </Button>
                ) : (
                   <div className="flex items-center justify-between">
                      <p className="text-[10px] text-success font-bold flex items-center gap-2 uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4" /> Fully Operational
                      </p>
                      
                        <button 
                          onClick={() => handleDisconnect(account.platform)}
                          className="text-[10px] font-bold text-on-surface-variant hover:text-error transition-colors uppercase"
                        >
                          Disconnect
                        </button>
                    </div>
                )}
              </div>
            </div>
          );
        })}

      </div>

      {/* Dynamic Available Integrations Section */}
      {unconnectedPlatforms.length > 0 && (
        <div className="flex flex-col gap-6 mt-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-display font-bold text-on-surface">Available Integrations</h2>
              <p className="text-xs text-on-surface-variant">Select a specific social media channel to link it to your SocioSync workspace.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {unconnectedPlatforms.map((platformKey) => {
              const config = PlatformConfig[platformKey];
              const Icon = config.icon;
              return (
                <div 
                  key={platformKey} 
                  onClick={() => handleReconnect(platformKey)}
                  className="glass p-6 rounded-[1.5rem] border-ghost border-dashed flex flex-col items-center gap-4 text-center group hover:bg-surface-container-low transition-all cursor-pointer hover:border-primary/30"
                >
                  <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-on-surface uppercase tracking-widest">{config.name}</span>
                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-2.5 py-1.5 rounded-full uppercase tracking-widest">Link Account</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Integrations Section */}
      <div className="flex flex-col gap-6 mt-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-display font-bold text-on-surface">Upcoming Integrations</h2>
            <p className="text-xs text-on-surface-variant">We're constantly adding new ways to synchronize your content.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingPlatforms.map((platform) => {
            const Icon = { Music2, Video, AtSign, Pin }[platform.iconType] || Globe;
            return (
              <div key={platform.name} className="glass p-6 rounded-[1.5rem] border-ghost flex flex-col items-center gap-4 text-center group hover:border-primary/20 transition-all">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-on-surface uppercase tracking-widest">{platform.name}</span>
                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">{platform.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enterprise Security Footer */}
      <div className="glass p-8 rounded-[2rem] border-ghost bg-gradient-to-r from-surface-container/50 to-surface-container-low/50 flex flex-col md:flex-row items-center gap-8 mt-4 overflow-hidden relative">
        <div className="absolute -right-8 -bottom-8 opacity-5">
          <ShieldCheck className="w-48 h-48" />
        </div>
        
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm border border-primary/10">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        
        <div className="flex flex-col gap-2 flex-1 text-center md:text-left">
          <h3 className="font-display font-bold text-lg text-on-surface">Enterprise-Grade Security</h3>
          <p className="text-xs leading-relaxed text-on-surface-variant max-w-2xl">
            SocioSync uses OAuth 2.0 and AES-256 encryption standards to ensure your account credentials never leave the source platform. 
            We only store encrypted access tokens, giving you full control over your data permissions at all times.
          </p>
        </div>

        <div className="flex flex-col gap-3 shrink-0 items-center md:items-end z-20">
          <Button 
            onClick={handleOpenLogs}
            variant="secondary" 
            className="px-6 py-2.5 text-[10px] uppercase font-bold tracking-widest rounded-xl"
          >
            Audit Security Logs
          </Button>
          <button 
            onClick={() => setShowPrivacyModal(true)}
            className="text-[10px] font-bold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest"
          >
            Privacy Policy
          </button>
        </div>
      </div>

      {/* Security Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-ghost w-full max-w-2xl rounded-[2rem] p-6 md:p-8 shadow-ambient flex flex-col gap-6 max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-on-surface">Security Audit Logs</h3>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Real-time connection event streaming</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLogsModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-[300px]">
              {loadingLogs ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-on-surface-variant">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider">Fetching logs...</span>
                </div>
              ) : securityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-on-surface-variant gap-2">
                  <ShieldAlert className="w-8 h-8 text-on-surface-variant/40" />
                  <p className="text-xs font-bold uppercase tracking-wider">No connection security events logged yet</p>
                  <p className="text-[10px] max-w-xs text-on-surface-variant/70">Linking or unlinking social media accounts will populate your security log stream.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {securityLogs.map((log) => {
                    const formattedDate = new Date(log.timestamp).toLocaleString();
                    return (
                      <div key={log._id} className="p-4 rounded-2xl bg-surface-container border border-ghost flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          log.event === 'connected' || log.event === 'reconnected' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-error/10 text-error'
                        }`}>
                          <Lock className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-on-surface capitalize">
                              Account {log.event}
                            </span>
                            <span className="text-[10px] text-on-surface-variant font-mono">
                              {formattedDate}
                            </span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant truncate">
                            Platform: <span className="font-bold text-on-surface capitalize">{log.platform}</span> • IP: {log.ip || 'Local'}
                          </p>
                          {log.errorMessage && (
                            <p className="text-[10px] text-error font-medium mt-1 font-mono">
                              Error: {log.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-ghost">
              <Button onClick={() => setShowLogsModal(false)} variant="secondary" className="px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-xl">
                Close Audit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-ghost w-full max-w-2xl rounded-[2rem] p-6 md:p-8 shadow-ambient flex flex-col gap-6 max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-on-surface">SocioSync Privacy Policy</h3>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Effective Date: May 17, 2026</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 text-xs text-on-surface-variant leading-relaxed">
              <div>
                <h4 className="font-bold text-on-surface text-sm mb-1.5">1. Information We Collect</h4>
                <p>
                  SocioSync collects and processes data necessary to authenticate, connect, and schedule content to your social media channels. 
                  This includes public profile information (such as your platform handle, name, avatar URL, and follower count) and secure authentication keys (OAuth access tokens).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-on-surface text-sm mb-1.5">2. Secure Token Storage & Encryption</h4>
                <p>
                  We prioritize your credential security. SocioSync employs industry-standard <strong>AES-256 encryption</strong> to encrypt your OAuth access tokens and refresh tokens at rest. 
                  We <strong>never</strong> store your raw passwords, nor do we request access to your password credentials.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-on-surface text-sm mb-1.5">3. Minimal Permissive Scopes</h4>
                <p>
                  SocioSync requests only the minimal set of API scopes required to perform requested actions on your behalf:
                </p>
                <ul className="list-disc pl-4 mt-1.5 flex flex-col gap-1">
                  <li><strong>LinkedIn</strong>: Publishing organic posts and fetching page subscriber/follower counts.</li>
                  <li><strong>Facebook Pages / Instagram</strong>: Publishing image/video posts to pages and reading base metrics.</li>
                  <li><strong>Twitter / X</strong>: Writing tweets and analyzing tweet impressions.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-on-surface text-sm mb-1.5">4. Audit Monitoring</h4>
                <p>
                  To keep you fully in control of your connections, we log every security event (like account linking, manual synchronization requests, and disconnect events). 
                  These logs are immediately viewable to you inside the <strong>Audit Security Logs</strong> interface.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-on-surface text-sm mb-1.5">5. Zero Third-Party Sharing</h4>
                <p>
                  SocioSync does not rent, sell, or trade your social media content, audience insights, or profile metrics with third-party advertisers or data brokers. 
                  All analytical data synthesized in your workspace is private to your authenticated user account.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-ghost">
              <Button onClick={() => setShowPrivacyModal(false)} variant="primary" className="px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-xl">
                I Understand
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;

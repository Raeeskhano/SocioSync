import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Key, Database, Monitor, Moon, Sun, ChevronRight, Camera,
  ShieldCheck, Plus, ArrowRight, Trash2, Copy, Check, Loader2, X, AlertTriangle
} from 'lucide-react';
import Button from '../components/ui/Button';
import {
  fetchProfile, saveProfile, uploadAvatar, fetchSession,
  fetchApiKeys, generateApiKey, revokeApiKey,
  setTheme, clearNewKey, clearSettingsError, clearSuccessMessage
} from '../store/settingsSlice';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET) - New York' },
  { value: 'America/Chicago', label: 'Central Time (CT) - Chicago' },
  { value: 'America/Denver', label: 'Mountain Time (MT) - Denver' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT) - Los Angeles' },
  { value: 'Europe/London', label: 'London (GMT) - United Kingdom' },
  { value: 'Europe/Paris', label: 'Central European (CET) - Paris' },
  { value: 'Asia/Dubai', label: 'Gulf Standard (GST) - Dubai' },
  { value: 'Asia/Kolkata', label: 'India Standard (IST) - Mumbai' },
  { value: 'Asia/Karachi', label: 'Pakistan Standard (PKT) - Karachi' },
  { value: 'Asia/Shanghai', label: 'China Standard (CST) - Shanghai' },
  { value: 'Asia/Tokyo', label: 'Japan Standard (JST) - Tokyo' },
  { value: 'Australia/Sydney', label: 'Australian Eastern (AEST) - Sydney' },
];

const timeAgo = (date) => {
  if (!date) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const Settings = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const { setUser } = useAuth();
  const {
    profile, preferences, usage, session, apiKeys,
    newlyGeneratedKey, loading, saving, error, successMessage
  } = useSelector((state) => state.settings);

  const [activeTab, setActiveTab] = useState('edit');
  const [form, setForm] = useState({ firstName: '', lastName: '', bio: '', timezone: '', statusBadge: '' });
  const [newKeyName, setNewKeyName] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchSession());
  }, [dispatch]);

  // Fetch API keys when switching to API tab
  useEffect(() => {
    if (activeTab === 'api') dispatch(fetchApiKeys());
  }, [activeTab, dispatch]);

  // Sync form when profile loads
  useEffect(() => {
    if (profile.firstName || profile.lastName) {
      setForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio,
        timezone: profile.timezone,
        statusBadge: profile.statusBadge || ''
      });
    }
  }, [profile.firstName, profile.lastName, profile.bio, profile.timezone, profile.statusBadge]);

  // Show toast on success/error
  useEffect(() => {
    if (successMessage) {
      setToast({ type: 'success', text: successMessage });
      const t = setTimeout(() => { setToast(null); dispatch(clearSuccessMessage()); }, 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      setToast({ type: 'error', text: error });
      const t = setTimeout(() => { setToast(null); dispatch(clearSettingsError()); }, 4000);
      return () => clearTimeout(t);
    }
  }, [error, dispatch]);

  // Show modal when new key is generated
  useEffect(() => {
    if (newlyGeneratedKey) setShowKeyModal(true);
  }, [newlyGeneratedKey]);

  const handleFormChange = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSave = async () => {
    try {
      const result = await dispatch(saveProfile(form)).unwrap();
      if (setUser) {
        setUser(prev => ({
          ...prev,
          firstName: result.firstName,
          lastName: result.lastName,
          bio: result.bio,
          timezone: result.timezone,
          statusBadge: result.statusBadge || ''
        }));
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };
  const handleDiscard = () => setForm({
    firstName: profile.firstName, lastName: profile.lastName,
    bio: profile.bio, timezone: profile.timezone, statusBadge: profile.statusBadge || ''
  });

  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await dispatch(uploadAvatar(file)).unwrap();
        if (setUser && result?.avatarUrl) {
          setUser(prev => ({
            ...prev,
            avatarUrl: result.avatarUrl
          }));
        }
      } catch (err) {
        console.error('Failed to upload avatar:', err);
      }
    }
  };

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) return;
    dispatch(generateApiKey(newKeyName.trim()));
    setNewKeyName('');
    setShowNewKeyDialog(false);
  };

  const handleCopyKey = () => {
    if (newlyGeneratedKey?.fullKey) {
      navigator.clipboard.writeText(newlyGeneratedKey.fullKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const avatarSrc = profile.avatarUrl
    ? (profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${API_BASE}${profile.avatarUrl}`)
    : `https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&background=7c3aed&color=fff&size=150`;

  const tzLabel = TIMEZONES.find(t => t.value === form.timezone)?.label || form.timezone;

  if (loading && !profile.email) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 min-h-screen relative">
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(var(--color-on-surface) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-5 py-3 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-right duration-300 ${
          toast.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* Page Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-display font-bold text-on-surface tracking-tight">Account Settings</h1>
          <p className="text-on-surface-variant text-sm">Manage your digital presence, API access, and workspace preferences.</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Tab Switcher */}
          <div className="flex items-center bg-surface-container rounded-full p-1 border border-ghost">
            {[{ id: 'edit', label: 'Edit' }, { id: 'api', label: 'API' }].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-1.5 rounded-full text-[10px] font-bold transition-all uppercase tracking-widest ${
                  activeTab === tab.id ? 'bg-surface-container-high text-on-surface shadow-md' : 'text-on-surface-variant hover:text-on-surface'
                }`}>{tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════ EDIT TAB ════════════ */}
      {activeTab === 'edit' && (
        <>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-2 bg-surface-container-high p-8 md:p-10 rounded-[2rem] border border-ghost flex flex-col gap-8 shadow-2xl">
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <img src={avatarSrc} alt="Profile avatar" className="w-20 h-20 rounded-2xl object-cover border-2 border-outline-variant shadow-lg" />
                  <button onClick={handleAvatarClick} className="absolute -bottom-2 -right-2 w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-on-primary shadow-lg border-2 border-surface-container-high">
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                  {form.statusBadge && (
                    <span className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded-md bg-primary text-on-primary text-[7px] font-bold uppercase tracking-widest shadow-lg">
                      {form.statusBadge}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-display font-bold text-on-surface tracking-tight">{form.firstName} {form.lastName}</h2>
                    <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[9px] font-bold uppercase tracking-widest">
                      {profile.plan} plan
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium">{profile.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[['firstName', 'First Name'], ['lastName', 'Last Name']].map(([field, label]) => (
                  <div key={field} className="flex flex-col gap-2.5">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">{label}</label>
                    <input type="text" value={form[field]} onChange={handleFormChange(field)} maxLength={50}
                      className="bg-surface-container-low border border-ghost rounded-xl p-4 text-sm text-on-surface focus:outline-none focus:border-primary/40 transition-all shadow-inner w-full" />
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Professional Bio</label>
                <textarea value={form.bio} onChange={handleFormChange('bio')} rows={4} maxLength={500}
                  className="bg-surface-container-low border border-ghost rounded-xl p-4 text-sm text-on-surface focus:outline-none focus:border-primary/40 transition-all shadow-inner resize-none leading-relaxed w-full" />
                <span className="text-[9px] text-on-surface-variant/50 text-right">{form.bio.length}/500</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2.5">
                  <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Primary Timezone</label>
                  <div className="relative">
                    <select value={form.timezone} onChange={handleFormChange('timezone')}
                      className="w-full bg-surface-container-low border border-ghost rounded-xl p-4 text-sm text-on-surface appearance-none focus:outline-none focus:border-primary/40 shadow-inner cursor-pointer">
                      {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 rotate-90 pointer-events-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Status Badge</label>
                  <input type="text" value={form.statusBadge} onChange={handleFormChange('statusBadge')} maxLength={20} placeholder="e.g. LIVE MKTNG"
                    className="bg-surface-container-low border border-ghost rounded-xl p-4 text-sm text-on-surface focus:outline-none focus:border-primary/40 transition-all shadow-inner w-full" />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-8">
              {/* Session Card */}
              <div className="bg-surface-container-high p-8 rounded-[2rem] border border-ghost flex flex-col gap-6 shadow-xl">
                <h3 className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Current Session</h3>
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-surface-container-low border border-ghost relative group hover:border-primary/20 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center shadow-lg">
                    <Monitor className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-on-surface">{session.browser || 'Loading...'} on {session.os || '...'}</span>
                    <span className="text-[10px] text-on-surface-variant">IP: {session.ip || '...'} • Active Now</span>
                  </div>
                  <div className="absolute right-4 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(189,157,255,0.5)]" />
                </div>
              </div>

              {/* Storage Card */}
              <div className="bg-surface-container-high p-8 rounded-[2rem] border border-ghost flex flex-col gap-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Storage Usage</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-display font-bold text-on-surface">{usage.percentage}%</span>
                    <span className="text-xs text-on-surface-variant font-medium">of {usage.storageTotal}</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden shadow-inner border border-ghost">
                  <div className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-1000"
                    style={{ width: `${usage.percentage}%` }} />
                </div>
                <button className="text-[9px] font-bold text-on-surface-variant hover:text-on-surface uppercase tracking-widest flex items-center gap-1.5 transition-colors group/btn">
                  Manage Storage <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
                <Database className="absolute -right-6 -bottom-6 w-32 h-32 text-on-surface/5 rotate-12 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Save / Discard */}
          <div className="relative z-10 flex items-center justify-end gap-6 mt-4 pb-4">
            <button onClick={handleDiscard} className="text-[10px] font-bold text-on-surface-variant hover:text-on-surface transition-colors uppercase tracking-widest px-4">
              Discard Changes
            </button>
            <Button variant="primary" onClick={handleSave} disabled={saving}
              className="px-12 py-3.5 rounded-xl text-[10px] uppercase font-bold tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </>
      )}

      {/* ════════════ API TAB ════════════ */}
      {activeTab === 'api' && (
        <div className="relative z-10 bg-surface-container-high p-8 md:p-10 rounded-[2rem] border border-ghost flex flex-col gap-8 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10 shadow-lg">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-display font-bold text-xl text-on-surface tracking-tight">API & Integrations</h3>
                <p className="text-xs text-on-surface-variant font-medium">Securely manage access for external tools and custom scripts.</p>
              </div>
            </div>
            <Button onClick={() => setShowNewKeyDialog(true)} variant="secondary"
              className="text-[10px] uppercase font-bold tracking-widest py-3 px-6 rounded-xl">
              <Plus className="w-3.5 h-3.5 mr-2" /> Generate New Key
            </Button>
          </div>

          {/* API Keys List */}
          <div className="grid grid-cols-1 gap-4">
            {apiKeys.length === 0 && (
              <div className="text-center py-12 text-on-surface-variant/40 text-sm italic">No API keys yet. Generate your first key above.</div>
            )}
            {apiKeys.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-6 rounded-2xl bg-surface-container-low border border-ghost group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-on-surface-variant/60 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-bold text-on-surface truncate">{item.name}</span>
                    <code className="text-[10px] text-on-surface-variant/40 font-mono tracking-tight truncate">{item.keyPrefix}••••••••••••</code>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[8px] text-on-surface-variant/40 uppercase font-bold tracking-widest">Last used</span>
                    <span className="text-[10px] font-bold text-on-surface-variant">{timeAgo(item.lastUsedAt)}</span>
                  </div>
                  <button onClick={() => dispatch(revokeApiKey(item.id))}
                    className="p-2 rounded-lg text-on-surface-variant/30 hover:text-error hover:bg-error/10 transition-all" aria-label="Revoke API key">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════ New Key Name Dialog ════════════ */}
      {showNewKeyDialog && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-high border border-ghost w-full max-w-md rounded-2xl shadow-2xl p-8 flex flex-col gap-6">
            <h3 className="font-display font-bold text-lg text-on-surface">Name Your API Key</h3>
            <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production Analytics Hook"
              className="bg-surface-container-low border border-ghost rounded-xl p-4 text-sm text-on-surface focus:outline-none focus:border-primary/40 w-full" autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateKey()} />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowNewKeyDialog(false); setNewKeyName(''); }}
                className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-4 py-2">Cancel</button>
              <Button variant="primary" onClick={handleGenerateKey} disabled={!newKeyName.trim()}
                className="px-6 py-2.5 rounded-xl text-[10px] uppercase font-bold tracking-widest">Generate</Button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ Generated Key Modal ════════════ */}
      {showKeyModal && newlyGeneratedKey && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-high border border-ghost w-full max-w-lg rounded-2xl shadow-2xl p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-on-surface">Your New API Key</h3>
              <button onClick={() => { setShowKeyModal(false); dispatch(clearNewKey()); }}
                className="p-1 rounded-lg hover:bg-surface-container-low text-on-surface-variant"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {newlyGeneratedKey.message}
            </div>
            <div className="flex items-center gap-2 bg-surface-container-low border border-ghost rounded-xl p-4">
              <code className="flex-1 text-xs text-on-surface font-mono break-all select-all">{newlyGeneratedKey.fullKey}</code>
              <button onClick={handleCopyKey} className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant flex-shrink-0">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <Button variant="primary" onClick={() => { setShowKeyModal(false); dispatch(clearNewKey()); }}
              className="w-full py-3 rounded-xl text-[10px] uppercase font-bold tracking-widest">I've Saved My Key</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

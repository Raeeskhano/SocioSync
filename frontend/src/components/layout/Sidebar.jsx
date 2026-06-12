import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  BarChart2, 
  Settings, 
  Share2, 
  Sparkles, 
  Users,
  HelpCircle,
  LogOut,
  Zap
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Sidebar = () => {
  const { user, logout: authLogout } = useAuth();

  const handleLogout = async () => {
    try {
      await authLogout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Integrations', path: '/integrations', icon: Users },
    { name: 'Creative Lab', path: '/ai-creative-lab', icon: Sparkles },
    { name: 'Publisher', path: '/publisher', icon: Share2 },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const mobileNavItems = navItems
    .filter(item => !item.hideOnMobile)
    .map(item => {
      if (item.name === 'Creative Lab') return { ...item, name: 'AI Lab' };
      return item;
    });

  const baseLinkClasses = "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-body text-sm font-medium";
  const activeLinkClasses = "bg-surface-container-highest text-primary border border-primary/40";
  const inactiveLinkClasses = "text-on-surface-variant hover:bg-surface-bright hover:text-on-surface";

  const avatarSrc = user?.avatarUrl
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${API_BASE}${user.avatarUrl}`)
    : null;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed md:sticky top-0 left-0 h-screen w-64 bg-surface-container z-40">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 p-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-ambient flex-shrink-0">
            <Zap className="w-5 h-5 text-on-primary" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-on-surface">SocioSync</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 flex flex-col gap-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Info + Footer Actions */}
        <div className="p-4 flex flex-col gap-3">
          {/* User Profile Summary */}
          {user && (
            <div className="p-3 rounded-xl bg-surface-container-high border border-ghost flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs overflow-hidden border border-primary/30">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  (user.firstName || 'U').charAt(0)
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-on-surface truncate">{user.firstName} {user.lastName}</span>
                <span className="text-[10px] text-on-surface-variant truncate capitalize">{user.plan} Plan</span>
              </div>
            </div>
          )}

          {/* Help & Logout */}
          <div className="flex flex-col gap-1 px-1">
            <button className="flex items-center gap-3 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors py-2 rounded-lg px-3 hover:bg-surface-bright">
              <HelpCircle className="w-4 h-4" />
              Help Center
            </button>
            <button onClick={handleLogout} className="flex items-center gap-3 text-sm font-medium text-error hover:opacity-80 transition-opacity py-2 rounded-lg px-3 hover:bg-surface-bright">
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface-container border-t border-ghost px-2 py-2 flex justify-between items-center">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 p-2 rounded-xl min-w-[60px] transition-all duration-200 ${
                isActive
                   ? 'bg-surface-container-highest text-primary'
                   : 'text-on-surface-variant hover:text-on-surface active:scale-95'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium mt-0.5">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;

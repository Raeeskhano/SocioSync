import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ClipboardList } from 'lucide-react';
import Button from '../ui/Button';
import { setSearchQuery, markNotificationsRead } from '../../store/userSlice';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, searchQuery } = useSelector((state) => state.user);
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const avatarSrc = user?.avatarUrl
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${API_BASE}${user.avatarUrl}`)
    : user 
      ? `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=7c3aed&color=fff&size=150`
      : `https://ui-avatars.com/api/?name=User&background=7c3aed&color=fff&size=150`;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/dashboard');
    }
  };

  const handleBellClick = () => {
    dispatch(markNotificationsRead());
    setShowNotifications(!showNotifications);
  };

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-ghost w-full px-4 md:px-8 py-3 flex items-center justify-between gap-2 md:gap-4">
      {/* Search Bar (Desktop) */}
      <div className="flex-1 max-w-md hidden md:block">
        <form onSubmit={handleSearchSubmit} className="relative group w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search analytics or posts..."
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="w-full bg-surface-container-low text-sm text-on-surface placeholder-on-surface-variant rounded-lg pl-10 pr-4 py-2 border border-ghost focus:border-primary/50 focus:bg-surface-container outline-none transition-all"
          />
        </form>
      </div>

      {/* Mobile Logo */}
      <div className="flex flex-1 md:hidden items-center gap-2">
        {/* User Profile */}
        <button onClick={() => navigate('/settings')} className="w-8 h-8 md:w-9 md:h-9 rounded-full ring-2 ring-primary/40 overflow-hidden flex-shrink-0 transition-transform hover:scale-105 bg-surface-container">
          <img src={avatarSrc} alt="User Avatar" className="w-full h-full object-cover" />
        </button>

        <span className="font-display font-bold text-lg tracking-tight text-on-surface truncate">SocioSync</span>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3 lg:gap-6 shrink-0">
        {/* Icons */}
        <div className="flex items-center gap-2 md:gap-3 text-on-surface-variant">
          <div className="relative">
            <button 
              onClick={handleBellClick}
              className={`relative hover:text-on-surface transition-colors p-1 ${showNotifications ? 'text-primary' : ''}`}
            >
              <Bell className="w-5 h-5" />
              {notifications.hasUnread && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border border-background"></span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full mt-3 right-0 w-72 bg-surface-container-high border border-ghost rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-on-surface">Notifications</h4>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">New</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-3 bg-surface-container-low p-3 rounded-xl border border-ghost hover:border-primary/30 transition-colors cursor-pointer">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-primary flex-shrink-0"></div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-on-surface">Welcome to SocioSync!</span>
                      <span className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">Your dashboard is ready. Try generating some content in the AI Creative Lab to get started!</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-center text-on-surface-variant/50 pt-2 italic">You're all caught up!</div>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => navigate('/ai-creative-lab')}
            title="Creative Lab"
            className="hover:text-primary transition-colors p-1 hidden sm:block"
          >
            <ClipboardList className="w-5 h-5" />
          </button>
        </div>

        {/* Create Post Button */}
        <Button 
          variant="surface" 
          onClick={() => navigate('/publisher')}
          className="flex items-center justify-center text-primary text-xs px-3 py-1.5 h-8 border border-outline-variant/30 bg-surface-container hover:bg-surface-bright"
        >
          Create Post
        </Button>
      </div>
    </header>
  );
};

export default Header;

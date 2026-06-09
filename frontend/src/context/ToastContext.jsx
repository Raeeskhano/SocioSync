import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Sparkles, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[9999] pointer-events-none">
        {toasts.map((toast) => {
          let bgColor = 'bg-surface-container';
          let borderColor = 'border-ghost';
          let textColor = 'text-on-surface';
          let Icon = Info;

          if (toast.type === 'success') {
            bgColor = 'bg-green-500/10 backdrop-blur-md';
            borderColor = 'border-green-500/20';
            textColor = 'text-green-400';
            Icon = CheckCircle2;
          } else if (toast.type === 'error') {
            bgColor = 'bg-red-500/10 backdrop-blur-md';
            borderColor = 'border-red-500/20';
            textColor = 'text-red-400';
            Icon = AlertCircle;
          } else if (toast.type === 'sparkles' || toast.type === 'primary') {
            bgColor = 'bg-primary/10 backdrop-blur-md';
            borderColor = 'border-primary/20';
            textColor = 'text-primary';
            Icon = Sparkles;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3.5 px-5 py-4 rounded-2xl border ${bgColor} ${borderColor} ${textColor} shadow-lg shadow-black/20 animate-in slide-in-from-bottom-5 duration-300 min-w-[320px] max-w-md cursor-pointer`}
              onClick={() => removeToast(toast.id)}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium leading-relaxed font-sans">{toast.message}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

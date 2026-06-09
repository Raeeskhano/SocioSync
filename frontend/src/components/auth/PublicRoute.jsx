import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d1117]">
        <div className="w-10 h-10 border-3 border-transparent border-t-[#534AB7] rounded-full animate-spin border-solid" style={{ borderTopColor: '#534AB7', borderWidth: '3px' }}></div>
        <span className="mt-4 text-[#7F77DD] text-sm font-display tracking-wide">SocioSync</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden pb-24 md:pb-0 flex flex-col">
        <Header />
        <div className="max-w-7xl mx-auto p-4 md:p-8 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

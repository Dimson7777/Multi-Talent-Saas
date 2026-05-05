import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { useState, useCallback } from 'react';
import { Layers } from 'lucide-react';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-600/30 animate-gradient bg-[length:200%_200%]">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white">Loading</p>
            <p className="text-xs text-slate-500 mt-0.5">Setting up your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/[0.02] rounded-full blur-3xl" />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={closeMobileSidebar}
          />
          <div className="relative h-full animate-slide-in-left">
            <Sidebar mobile onClose={closeMobileSidebar} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="lg:pl-[260px] relative">
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          <div className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { useState, useCallback } from 'react';
import { Layers } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

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
    <div className="min-h-screen bg-slate-950 relative overflow-x-hidden">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-[18%] w-[28rem] h-[28rem] bg-blue-600/[0.04] rounded-full blur-3xl" />
        <div className="absolute top-[28%] right-[18%] w-[32rem] h-[32rem] bg-indigo-600/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-[24%] w-[28rem] h-[28rem] bg-cyan-600/[0.04] rounded-full blur-3xl" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 35%, rgba(2,6,23,0.34) 100%)' }} />
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
      <div className="relative lg:pl-[110px] min-h-screen">
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="px-3 pb-8 pt-3 lg:px-6 xl:px-8">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

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
      {/* Atmospheric background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-24 left-[14%] w-[34rem] h-[34rem] bg-cyan-500/[0.08] rounded-full blur-3xl" />
        <div className="absolute top-[32%] right-[16%] w-[36rem] h-[36rem] bg-blue-500/[0.07] rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-[34%] w-[30rem] h-[30rem] bg-indigo-500/[0.06] rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(34,211,238,0.08),transparent_26%),radial-gradient(circle_at_84%_34%,rgba(59,130,246,0.09),transparent_30%),radial-gradient(ellipse_90%_86%_at_50%_50%,transparent_42%,rgba(2,6,23,0.45)_100%)]" />
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
      <div className="relative lg:pl-[96px] min-h-screen">
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="px-3 pb-10 pt-2 lg:px-5 xl:px-8">
          <div className="max-w-[1180px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 18, filter: 'blur(5px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="noise relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/45 backdrop-blur-[3px] shadow-[0_28px_95px_rgba(2,6,23,0.62)] p-3 sm:p-4 lg:p-5 xl:p-6">
                  <span className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/22 to-transparent" />
                  <Outlet />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

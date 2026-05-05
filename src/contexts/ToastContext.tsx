import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastContextType = {
  toast: (type: ToastType, title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: Toast = { id, type, title, message };
    setToasts((prev) => [...prev.slice(-4), newToast]);

    const timer = setTimeout(() => removeToast(id), 4000);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 380 }}>
        {toasts.map((t, i) => (
          <div
            key={t.id}
            className="pointer-events-auto"
            style={{
              animation: 'toastIn 0.3s ease-out',
              animationDelay: `${i * 50}ms`,
              animationFillMode: 'both',
            }}
          >
            <ToastItem toast={t} onDismiss={() => removeToast(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/20',
    error: 'border-red-500/20',
    info: 'border-blue-500/20',
  };

  const glows = {
    success: 'shadow-emerald-500/5',
    error: 'shadow-red-500/5',
    info: 'shadow-blue-500/5',
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl bg-slate-900/95 backdrop-blur-xl border ${borders[toast.type]} shadow-xl ${glows[toast.type]} relative overflow-hidden`}
    >
      {/* Animated accent line */}
      <div
        className={`absolute bottom-0 left-0 h-[2px] ${
          toast.type === 'success' ? 'bg-emerald-400' :
          toast.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
        }`}
        style={{
          animation: 'toastTimer 4s linear forwards',
        }}
      />
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/60 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

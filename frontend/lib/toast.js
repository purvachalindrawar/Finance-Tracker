import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    const t = { id, type: toast.type || 'info', message: toast.message || '' };
    setToasts((prev) => [...prev, t]);
    setTimeout(() => remove(id), toast.duration || 3000);
    return id;
  }, [remove]);
  const value = useMemo(() => ({ push, remove }), [push, remove]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-3 py-2 rounded shadow text-sm ${t.type==='error' ? 'bg-red-500 text-white' : t.type==='success' ? 'bg-green-500 text-black' : 'bg-neutral-800 text-gray-100'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastMessage, type ToastType } from './toast-context';

const AUTO_DISMISS_MS = 4200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = nextId.current;
      nextId.current += 1;

      setToasts((current) => [...current, { id, message, type }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

const TOAST_ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
} as const;

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = TOAST_ICONS[toast.type];

        return (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <Icon className="toast__icon" size={18} aria-hidden="true" />
            <span>{toast.message}</span>
            <button
              type="button"
              className="button button--ghost button--sm"
              onClick={() => onDismiss(toast.id)}
              aria-label="Fechar notificação"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

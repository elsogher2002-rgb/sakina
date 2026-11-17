import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, Info, Bell } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 bg-[#6B4A2F] dark:bg-[#2D2822] text-[#FDF8F0] px-4 py-3 rounded-2xl shadow-xl shadow-black/15 border border-[#E8D5B7]/30 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toast.type === 'reminder' ? (
              <Bell className="w-4 h-4 text-[#7BC0BE] shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-[#7BC0BE] shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#7BC0BE] shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium leading-relaxed truncate">
              {toast.text}
            </span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-[#E8D5B7] hover:text-white text-xs px-1.5 py-1 shrink-0 transition-colors"
            aria-label="إغلاق التنبيه"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

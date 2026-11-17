import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen flex items-center justify-center p-6 bg-[#FDF8F0] text-[#4A4A4A] text-center"
        >
          <div className="max-w-sm bg-white p-6 rounded-3xl border border-[#E8D5B7] shadow-md space-y-3">
            <h2 className="text-lg font-bold text-[#6B4A2F] font-cairo">
              حدث خطأ غير متوقع في الصفحة
            </h2>
            <p className="text-xs text-[#4A4A4A]/80 leading-relaxed">
              نعتذر عن هذا الخلل المؤقت. اضغط على الزر بالأسفل لإعادة تحميل موقع سَكِينة فوراً.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-2xl bg-[#7BC0BE] text-white text-xs font-bold"
            >
              إعادة تحميل الموقع
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Clear any stale Service Workers / old HTML caches that could serve outdated chunk references (white screen fix)
if (typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((reg) => {
          void reg.unregister();
        });
      })
      .catch(() => {});
  }
  if ('caches' in window) {
    caches
      .keys()
      .then((keys) => {
        keys.forEach((key) => {
          if (key.startsWith('sakina-v')) {
            void caches.delete(key);
          }
        });
      })
      .catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);

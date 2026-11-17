import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OnlineErrorStateProps {
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export const OnlineErrorState: React.FC<OnlineErrorStateProps> = ({
  message = 'مفيش نت، وصل النت وجرب تاني',
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/70 dark:border-white/10 shadow-xs text-center space-y-4">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
        <WifiOff className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-[#6B4A2F] dark:text-[#EED6BD] font-cairo">
          {message}
        </h3>
        <p className="text-xs text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 max-w-sm mx-auto leading-relaxed">
          يعتمد هذا القسم على جلب البيانات المباشرة والحية عبر الإنترنت لضمان الدقة الكاملة.
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-xs font-bold shadow-sm active:scale-95 transition-all disabled:opacity-60"
      >
        <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
        <span>{isRetrying ? 'جاري المحاولة...' : 'حاول تاني'}</span>
      </button>
    </div>
  );
};

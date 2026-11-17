import React from 'react';
import { AdhanAlertData } from '../types';
import { Volume2, Square, MapPin, Clock, Sparkles } from 'lucide-react';

interface AdhanAlertModalProps {
  alert: AdhanAlertData | null;
  isAdhanPlaying: boolean;
  onStopAdhan: () => void;
}

export const AdhanAlertModal: React.FC<AdhanAlertModalProps> = ({
  alert,
  isAdhanPlaying,
  onStopAdhan,
}) => {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-gradient-to-br from-white via-[#FFF9EB] to-[#F7EFE1] dark:from-[#24211D] dark:via-[#1F1C18] dark:to-[#171512] rounded-3xl p-6 shadow-2xl border-2 border-[#7BC0BE] text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#7BC0BE] text-white flex items-center justify-center shadow-lg shadow-[#7BC0BE]/30 relative">
          <Volume2 className={`w-8 h-8 ${isAdhanPlaying ? 'animate-pulse' : ''}`} />
          {isAdhanPlaying && (
            <span className="absolute inset-0 rounded-full border-4 border-[#7BC0BE] animate-ping opacity-40" />
          )}
        </div>

        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7BC0BE] bg-[#7BC0BE]/15 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{alert.isShortAlert ? 'تنبيه اقتراب الصلاة' : 'نداء الحق - حان وقت الصلاة'}</span>
          </span>

          <h2 className="text-2xl font-extrabold text-[#6B4A2F] dark:text-[#EED6BD] font-cairo pt-1">
            {alert.prayerName}
          </h2>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/85 dark:bg-[#1A1815]/85 border border-[#E8D5B7]/60 dark:border-white/10 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[#6B4A2F] dark:text-[#EED6BD]">
            <span className="flex items-center gap-1.5 text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">
              <Clock className="w-3.5 h-3.5 text-[#7BC0BE]" />
              <span>وقت الأذان:</span>
            </span>
            <span className="font-bold font-mono text-sm">{alert.prayerTime}</span>
          </div>

          <div className="flex items-center justify-between text-[#6B4A2F] dark:text-[#EED6BD]">
            <span className="flex items-center gap-1.5 text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">
              <MapPin className="w-3.5 h-3.5 text-[#7BC0BE]" />
              <span>المحافظة / المدينة:</span>
            </span>
            <span className="font-bold">{alert.locationName}</span>
          </div>

          <div className="flex items-center justify-between text-[#6B4A2F] dark:text-[#EED6BD]">
            <span className="text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">صوت المؤذن:</span>
            <span className="font-semibold text-[#7BC0BE]">{alert.muezzinLabel}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onStopAdhan}
          className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Square className="w-4 h-4 fill-current" />
          <span>إيقاف الأذان</span>
        </button>
      </div>
    </div>
  );
};

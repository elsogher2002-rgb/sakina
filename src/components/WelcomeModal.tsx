import React from 'react';
import { MapPin, Sparkles } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onAcceptGPS: () => void;
  onUseDefault: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onAcceptGPS,
  onUseDefault,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-[#24211D] rounded-3xl p-6 shadow-2xl border border-[#E8D5B7]/60 dark:border-white/10 text-center">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-br from-[#7BC0BE] to-[#559B99] flex items-center justify-center text-white shadow-lg shadow-[#7BC0BE]/25 mb-4">
          <Sparkles className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold text-[#6B4A2F] dark:text-[#EED6BD] font-cairo">
          أهلاً بك في سَكِينة
        </h3>
        <p className="text-xs font-medium text-[#7BC0BE] tracking-wide mt-0.5">
          Tranquility - رفيقك الهادئ
        </p>

        <p className="text-sm text-[#4A4A4A] dark:text-[#CFCBC3] mt-3 leading-relaxed">
          تحب نظبط مواقيت الصلاة واتجاه القبلة بدقة حسب مكانك الجغرافي؟
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={onAcceptGPS}
            className="w-full py-3 px-4 bg-[#7BC0BE] hover:bg-[#67AEA9] text-white font-semibold text-sm rounded-2xl shadow-md shadow-[#7BC0BE]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            <span>نعم، اضبط مكاني الآن</span>
          </button>

          <button
            onClick={onUseDefault}
            className="w-full py-2.5 px-4 bg-[#FDF8F0] dark:bg-[#1A1815] hover:bg-[#FFF9EB] dark:hover:bg-[#2D2822] text-[#6B4A2F] dark:text-[#EED6BD] border border-[#E8D5B7]/50 dark:border-white/10 font-medium text-xs rounded-2xl transition-all"
          >
            استخدم الافتراضي (القاهرة، مصر)
          </button>
        </div>
      </div>
    </div>
  );
};

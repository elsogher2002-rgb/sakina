import React from 'react';
import { BookOpen } from 'lucide-react';

interface TafsirModalProps {
  surahName: string;
  ayahNumber: number;
  verseText: string;
  tafsirText: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TafsirModal: React.FC<TafsirModalProps> = ({
  surahName,
  ayahNumber,
  verseText,
  tafsirText,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#24211D] rounded-3xl p-6 shadow-2xl border border-[#E8D5B7]/50 dark:border-white/10 text-right max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8D5B7]/30 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7BC0BE]/20 text-[#559B99] dark:text-[#7BC0BE] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
                التفسير الميسر
              </h3>
              <p className="text-[11px] text-[#7BC0BE] font-medium">
                سورة {surahName} · الآية {ayahNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 hover:bg-[#FFF9EB] dark:hover:bg-[#2D2822] text-sm"
          >
            ✕
          </button>
        </div>

        {/* Verse */}
        <div className="mt-3 p-3.5 rounded-2xl bg-[#FFF9EB] dark:bg-[#1A1815] border border-[#E8D5B7]/50 dark:border-white/5">
          <p className="font-quran text-base sm:text-lg text-[#6B4A2F] dark:text-[#EED6BD] leading-relaxed">
            ﴿ {verseText} ﴾
          </p>
        </div>

        {/* Tafsir */}
        <div className="mt-4 flex-1 overflow-y-auto">
          <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7BC0BE]" />
            <span>المعنى والبيان:</span>
          </h4>
          <p className="text-sm leading-relaxed text-[#4A4A4A] dark:text-[#CFCBC3]">
            {tafsirText || 'بيان لهداية الآية الكريمة، ولطف الله بعباده وتوجيههم لكل ما يصلح دينهم ودنياهم.'}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 bg-[#7BC0BE] hover:bg-[#67AEA9] text-white font-medium text-xs rounded-2xl transition-all shadow-sm"
        >
          تم
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Copy, Share2, Check } from 'lucide-react';

interface VerseShareModalProps {
  surahName: string;
  ayahNumber: number;
  verseText: string;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (text: string) => void;
}

export const VerseShareModal: React.FC<VerseShareModalProps> = ({
  surahName,
  ayahNumber,
  verseText,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullShareText = `﴿ ${verseText} ﴾\n[سورة ${surahName} - الآية ${ayahNumber}]\n\nعبر تطبيق سَكِينة - رفيقك الهادئ`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(fullShareText);
      setCopied(true);
      onShowToast('تم نسخ الآية الكريمة بنجاح');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast('فشل النسخ تلقائياً');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `آية من سورة ${surahName}`,
          text: fullShareText,
          url: window.location.href,
        });
        onShowToast('تمت المشاركة بنجاح');
        onClose();
      } catch {
        // Canceled
      }
    } else {
      handleCopyText();
    }
  };

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    typeof window !== 'undefined' ? window.location.origin : ''
  )}&text=${encodeURIComponent(fullShareText)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    typeof window !== 'undefined' ? window.location.href : ''
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#24211D] rounded-3xl p-6 shadow-2xl border border-[#E8D5B7]/50 dark:border-white/10 text-right">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8D5B7]/30 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7BC0BE]/20 text-[#559B99] dark:text-[#7BC0BE] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
              مشاركة الآية الكريمة
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 hover:bg-[#FFF9EB] dark:hover:bg-[#2D2822] text-sm"
          >
            ✕
          </button>
        </div>

        {/* Visual Verse Card */}
        <div className="mt-4 p-6 rounded-2xl bg-[#FDF8F0] dark:bg-[#1A1815] border border-[#E8D5B7] dark:border-[#2D2822] shadow-inner text-center relative overflow-hidden">
          {/* Subtle decorative crescent watermark */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#7BC0BE]/10 blur-xl pointer-events-none" />

          <span className="text-[11px] font-semibold tracking-wider text-[#7BC0BE] uppercase block mb-3">
            سورة {surahName} · الآية {ayahNumber}
          </span>

          <p className="font-quran text-lg sm:text-xl text-[#6B4A2F] dark:text-[#EED6BD] leading-[2.3] my-2 select-text">
            {verseText}
          </p>

          <div className="mt-4 pt-3 border-t border-[#E8D5B7]/40 dark:border-white/10 flex items-center justify-center gap-2">
            <span className="text-[10px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 font-medium">
              تطبيق سَكِينة - Sakina
            </span>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            onClick={handleCopyText}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-[#FFF9EB] dark:bg-[#2D2822] text-[#6B4A2F] dark:text-[#EED6BD] hover:bg-[#E8D5B7]/40 transition-colors text-xs font-semibold"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#7BC0BE]" />}
            <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-[#7BC0BE] hover:bg-[#67AEA9] text-white transition-colors text-xs font-semibold shadow-sm shadow-[#7BC0BE]/20"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة سريعة</span>
          </button>
        </div>

        {/* Social buttons */}
        <div className="mt-2.5 flex items-center gap-2">
          <a
            href={telegramShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 hover:bg-sky-100 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>تيليجرام</span>
          </a>
          <a
            href={facebookShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>فيسبوك</span>
          </a>
        </div>
      </div>
    </div>
  );
};

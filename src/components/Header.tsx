import React, { useState, useEffect } from 'react';
import { LocationInfo } from '../types';
import { 
  MapPin, 
  Sun, 
  Moon, 
  Volume2, 
  Sparkles, 
  ArrowRight, 
  Home, 
  RotateCw, 
  Search, 
  X, 
  Globe 
} from 'lucide-react';

interface HeaderProps {
  dateString: string;
  location: LocationInfo;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenLocationModal: () => void;
  isPlayingAudio: boolean;
  audioTitle?: string;
  onStopAudio?: () => void;
  onInstallClick?: () => void;
  showInstallBadge?: boolean;
  // Built-in Web Browser / Navigation controls
  currentWebUrl: string | null;
  canGoBack: boolean;
  isWebLoading?: boolean;
  onNavigateUrl: (input: string) => void;
  onNavBack: () => void;
  onNavHome: () => void;
  onNavRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dateString,
  location,
  isDark,
  onToggleTheme,
  onOpenLocationModal,
  isPlayingAudio,
  audioTitle,
  onStopAudio,
  onInstallClick,
  showInstallBadge,
  currentWebUrl,
  canGoBack,
  isWebLoading,
  onNavigateUrl,
  onNavBack,
  onNavHome,
  onNavRefresh,
}) => {
  const [urlInput, setUrlInput] = useState<string>(currentWebUrl || '');

  useEffect(() => {
    setUrlInput(currentWebUrl || '');
  }, [currentWebUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onNavigateUrl(urlInput);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FDF8F0]/95 dark:bg-[#1A1815]/95 backdrop-blur-md border-b border-[#E8D5B7]/50 dark:border-[#2D2822] transition-colors duration-200 shadow-2xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-2.5 pb-2.5 space-y-2">
        {/* Top Row: Brand, Date/Location, Theme */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand Zone */}
          <button
            onClick={onNavHome}
            className="flex items-center gap-2 text-right focus:outline-none group"
            title="العودة للرئيسية"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#7BC0BE] to-[#559B99] flex items-center justify-center shadow-sm shadow-[#7BC0BE]/20 shrink-0 group-active:scale-95 transition-transform">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-[#6B4A2F] dark:text-[#EED6BD] font-cairo">
                  سَكِينة
                </span>
                <span className="text-[10px] font-medium text-[#7BC0BE] tracking-wide uppercase">
                  Sakina
                </span>
              </div>
              <p className="text-[10px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 leading-none">
                Tranquility - رفيقك الهادئ
              </p>
            </div>
          </button>

          {/* Date & Location Zone (Visible on tablet & desktop) */}
          <div className="hidden md:flex flex-col items-center text-center">
            <span className="text-xs font-semibold text-[#6B4A2F] dark:text-[#EED6BD]">
              {dateString}
            </span>
            <button
              onClick={onOpenLocationModal}
              className="flex items-center gap-1 text-[11px] text-[#4A4A4A]/80 dark:text-[#CFCBC3]/80 hover:text-[#7BC0BE] dark:hover:text-[#7BC0BE] transition-colors mt-0.5"
              title="تغيير المكان"
            >
              <MapPin className="w-3 h-3 text-[#7BC0BE]" />
              <span>{location.city}، {location.region || location.country}</span>
            </button>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Audio Playing Pill if streaming */}
            {isPlayingAudio && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#7BC0BE]/15 text-[#559B99] dark:text-[#7BC0BE] text-xs animate-pulse">
                <Volume2 className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] hidden sm:inline max-w-[160px] sm:max-w-[220px] truncate">{audioTitle || 'بث مباشر'}</span>
                {onStopAudio && (
                  <button
                    onClick={onStopAudio}
                    className="hover:opacity-75 p-0.5 text-xs font-bold"
                    title="إيقاف الصوت"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Quick Location Trigger on Mobile */}
            <button
              onClick={onOpenLocationModal}
              className="md:hidden flex items-center gap-1 text-[11px] text-[#6B4A2F] dark:text-[#EED6BD] bg-white/80 dark:bg-[#24211D] border border-[#E8D5B7]/50 dark:border-white/10 px-2 py-1.5 rounded-xl transition-colors"
              title="تحديد المكان"
            >
              <MapPin className="w-3 h-3 text-[#7BC0BE]" />
              <span className="max-w-[64px] truncate">{location.city}</span>
            </button>

            {/* Install Prompt button */}
            {showInstallBadge && onInstallClick && (
              <button
                onClick={onInstallClick}
                className="flex items-center gap-1 bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-xs font-medium px-2.5 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                title="تثبيت الموقع على جهازك"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تثبيت</span>
              </button>
            )}

            {/* Theme Switcher */}
            <button
              onClick={onToggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-white/85 dark:bg-[#24211D] text-[#6B4A2F] dark:text-[#EED6BD] border border-[#E8D5B7]/50 dark:border-white/10 hover:bg-[#FFF9EB] dark:hover:bg-[#2D2822] transition-colors"
              aria-label={isDark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الليلي'}
              title={isDark ? 'الوضع الفاتح' : 'الوضع الليلي'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#6B4A2F]" />}
            </button>
          </div>
        </div>

        {/* Second Row: Built-in Web Search / Address Bar + Back / Home / Refresh */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Navigation Buttons: Back, Home, Refresh */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onNavBack}
              disabled={!canGoBack}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${
                canGoBack
                  ? 'bg-white dark:bg-[#24211D] text-[#6B4A2F] dark:text-[#EED6BD] border-[#E8D5B7]/70 dark:border-white/10 hover:border-[#7BC0BE] hover:text-[#7BC0BE]'
                  : 'bg-white/40 dark:bg-[#24211D]/40 text-[#4A4A4A]/30 dark:text-[#CFCBC3]/25 border-[#E8D5B7]/30 dark:border-white/5 cursor-not-allowed'
              }`}
              title="رجوع"
              aria-label="رجوع"
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onNavHome}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-[#24211D] text-[#6B4A2F] dark:text-[#EED6BD] border border-[#E8D5B7]/70 dark:border-white/10 hover:border-[#7BC0BE] hover:text-[#7BC0BE] transition-all active:scale-95"
              title="الرئيسية"
              aria-label="الرئيسية"
            >
              <Home className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onNavRefresh}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-[#24211D] text-[#6B4A2F] dark:text-[#EED6BD] border border-[#E8D5B7]/70 dark:border-white/10 hover:border-[#7BC0BE] hover:text-[#7BC0BE] transition-all active:scale-95"
              title="تحديث"
              aria-label="تحديث"
            >
              <RotateCw className={`w-4 h-4 ${isWebLoading ? 'animate-spin text-[#7BC0BE]' : ''}`} />
            </button>
          </div>

          {/* Search / URL Bar */}
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-1.5 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Globe className="w-3.5 h-3.5 text-[#7BC0BE] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                inputMode="url"
                dir="auto"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="اكتب أي رابط أو كلمة بحث لفتحها داخل الموقع..."
                className="w-full h-9 bg-white dark:bg-[#24211D] border border-[#E8D5B7]/70 dark:border-white/10 rounded-xl pr-8 pl-7 text-xs text-[#4A4A4A] dark:text-[#EED6BD] placeholder:text-[#4A4A4A]/45 dark:placeholder:text-[#CFCBC3]/45 focus:outline-none focus:ring-2 focus:ring-[#7BC0BE]/50 focus:border-[#7BC0BE] transition-all"
              />
              {urlInput && (
                <button
                  type="button"
                  onClick={() => setUrlInput('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 text-[#4A4A4A]/45 hover:text-[#6B4A2F] dark:text-[#CFCBC3]/50"
                  title="مسح"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="h-9 px-3 sm:px-4 rounded-xl bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs shrink-0 transition-all active:scale-95"
            >
              <Search className="w-3.5 h-3.5" />
              <span>بحث</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};

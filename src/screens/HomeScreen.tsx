import React, { useState, useEffect, useCallback } from 'react';
import {
  PrayerSchedule,
  LocationInfo,
  KhatmaTracker,
  ActiveTab,
  QuranBookmark,
} from '../types';
import { EGYPT_GOVERNORATES } from '../data/egyptGovernorates';
import { fetchDailyAyahLive, LiveDailyAyah } from '../utils/quranApi';
import { fetchDailyHadithLive, fetchDailyDuaaLive, LiveDailyHadith, LiveDailyDuaa } from '../utils/contentApi';
import { OnlineErrorState } from '../components/OnlineErrorState';
import { 
  Clock, 
  BookOpen, 
  BookMarked,
  ArrowLeft, 
  Sparkles, 
  Quote, 
  Heart, 
  MapPin, 
  ChevronLeft,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  DownloadCloud,
  Compass,
  Radio,
  Search,
  Loader2,
  Megaphone
} from 'lucide-react';

interface HomeScreenProps {
  schedule: PrayerSchedule | null;
  isLoadingPrayer: boolean;
  prayerError: string | null;
  onRetryPrayer: () => void;
  location: LocationInfo;
  onSelectLocation: (loc: LocationInfo) => void;
  khatma: KhatmaTracker;
  bookmark?: QuranBookmark | null;
  dateString: string;
  onNavigateTab: (tab: ActiveTab, subState?: unknown) => void;
  onOpenLocationModal: () => void;
  onShowToast: (text: string) => void;
  onlineRefreshTick: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  schedule,
  isLoadingPrayer,
  prayerError,
  onRetryPrayer,
  location,
  onSelectLocation,
  khatma,
  bookmark,
  dateString,
  onNavigateTab,
  onOpenLocationModal,
  onShowToast,
  onlineRefreshTick,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(schedule?.nextPrayer.remainingSeconds || 0);

  const [dailyAyah, setDailyAyah] = useState<LiveDailyAyah | null>(null);
  const [dailyHadith, setDailyHadith] = useState<LiveDailyHadith | null>(null);
  const [dailyDuaa, setDailyDuaa] = useState<LiveDailyDuaa | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(true);
  const [contentError, setContentError] = useState<string | null>(null);

  useEffect(() => {
    setSecondsRemaining(schedule?.nextPrayer.remainingSeconds || 0);
  }, [schedule?.nextPrayer.remainingSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDailyOnlineContent = useCallback(async () => {
    setIsLoadingContent(true);
    setContentError(null);
    try {
      const [ayahRes, hadithRes, duaaRes] = await Promise.all([
        fetchDailyAyahLive(),
        fetchDailyHadithLive(),
        fetchDailyDuaaLive(),
      ]);
      setDailyAyah(ayahRes);
      setDailyHadith(hadithRes);
      setDailyDuaa(duaaRes);
    } catch (err) {
      setDailyAyah(null);
      setDailyHadith(null);
      setDailyDuaa(null);
      setContentError(err instanceof Error ? err.message : 'مفيش نت، وصل النت وجرب تاني');
    } finally {
      setIsLoadingContent(false);
    }
  }, []);

  useEffect(() => {
    void loadDailyOnlineContent();
  }, [loadDailyOnlineContent, onlineRefreshTick]);

  const formatCountdown = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingMinutes = Math.max(1, Math.round(secondsRemaining / 60));
  const khatmaPercent = Math.min(100, Math.round((khatma.completedAyahs / 6236) * 100));

  const getPrayerIcon = (key: string) => {
    switch (key) {
      case 'fajr':
        return Sunrise;
      case 'sunrise':
      case 'dhuhr':
      case 'asr':
        return Sun;
      case 'maghrib':
        return Sunset;
      case 'isha':
      default:
        return Moon;
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Top Location & Governorate Quick Selector (All 27 Egypt Governorates + GPS + City Search) */}
      <div className="bg-[#FFF9EB] dark:bg-[#24211D] p-3.5 sm:p-4 rounded-3xl border border-[#E8D5B7]/60 dark:border-white/10 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold text-[#7BC0BE] tracking-wide block">
              {dateString || 'جاري تحميل التاريخ الهجري والميلادي...'}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-[#6B4A2F] dark:text-[#EED6BD] font-cairo">
              يوم مبارك مليء بالسكينة والطمأنينة
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenLocationModal}
              className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-xs font-bold transition-all active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>GPS</span>
            </button>
            <button
              onClick={onOpenLocationModal}
              className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-white dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] border border-[#E8D5B7]/60 dark:border-white/10 hover:border-[#7BC0BE] text-xs font-semibold transition-all"
            >
              <Search className="w-3.5 h-3.5 text-[#7BC0BE]" />
              <span>ابحث باسم مدينتك</span>
            </button>
          </div>
        </div>

        {/* 27-Governorates Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="home-gov-select" className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] shrink-0">
            محافظتك:
          </label>
          <select
            id="home-gov-select"
            value={EGYPT_GOVERNORATES.some((g) => g.city === location.city) ? location.city : ''}
            onChange={(e) => {
              const selected = EGYPT_GOVERNORATES.find((g) => g.city === e.target.value);
              if (selected) {
                onSelectLocation(selected);
                onShowToast(`تم تحديث المواقيت والقبلة لمحافظة ${selected.city}`);
              }
            }}
            className="flex-1 bg-white dark:bg-[#1A1815] border border-[#E8D5B7]/70 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#6B4A2F] dark:text-[#EED6BD] focus:outline-none focus:ring-2 focus:ring-[#7BC0BE]/50"
          >
            {!EGYPT_GOVERNORATES.some((g) => g.city === location.city) && (
              <option value="">{location.city} ({location.region || location.country})</option>
            )}
            {EGYPT_GOVERNORATES.map((gov) => (
              <option key={gov.city} value={gov.city}>
                {gov.city} - {gov.region}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Prayer Card or Loading / Error */}
      {isLoadingPrayer ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 text-center space-y-2.5">
          <Loader2 className="w-7 h-7 animate-spin text-[#7BC0BE] mx-auto" />
          <p className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
            جاري جلب مواقيت الصلاة المباشرة في {location.city}...
          </p>
        </div>
      ) : prayerError || !schedule ? (
        <OnlineErrorState
          message={prayerError || 'مفيش نت، وصل النت وجرب تاني'}
          onRetry={onRetryPrayer}
        />
      ) : (
        <>
          {/* Large Next Prayer Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFFFFF] via-[#FFF9EB] to-[#F7EFE1] dark:from-[#24211D] dark:via-[#201D19] dark:to-[#1A1815] p-5 sm:p-6 shadow-sm border border-[#E8D5B7]/60 dark:border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#7BC0BE] animate-ping" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7BC0BE]">
                    الصلاة القادمة في {location.city}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#6B4A2F] dark:text-[#EED6BD] font-cairo mt-1">
                  صلاة {schedule.nextPrayer.name}
                </h1>

                <p className="text-xs font-semibold text-[#559B99] dark:text-[#7BC0BE] mt-1">
                  باقي {remainingMinutes} دقيقة على {schedule.nextPrayer.name} في {location.city}
                </p>

                <p className="text-xs text-[#4A4A4A]/80 dark:text-[#CFCBC3]/80 mt-0.5">
                  موعد الأذان: <span className="font-semibold text-[#6B4A2F] dark:text-[#EED6BD]">{schedule.nextPrayer.time}</span>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-white/90 dark:bg-[#1A1815]/90 backdrop-blur-xs px-4 py-3 rounded-2xl border border-[#E8D5B7]/50 dark:border-white/10 shadow-xs text-center">
                  <span className="text-[10px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 font-medium block">
                    متبقي حتى الأذان
                  </span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-[#6B4A2F] dark:text-[#EED6BD] tracking-wider tabular-nums">
                    {formatCountdown(secondsRemaining)}
                  </span>
                </div>

                <div className="hidden xs:flex w-16 h-16 rounded-2xl bg-[#7BC0BE]/15 text-[#559B99] dark:text-[#7BC0BE] items-center justify-center shrink-0">
                  <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
                    <path d="M24 6 C20 12 18 18 18 24 L30 24 C30 18 28 12 24 6 Z" fill="currentColor" fillOpacity="0.25" />
                    <path d="M12 24 H36 V42 H12 Z" fill="currentColor" fillOpacity="0.15" />
                    <path d="M21 42 V32 C21 30.5 22.5 29 24 29 C25.5 29 27 30.5 27 32 V42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="24" cy="5" r="1.5" fill="#E8D5B7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-[#7BC0BE]/10 blur-2xl pointer-events-none" />
          </div>

          {/* Today's 6 Prayer Times Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7BC0BE]" />
                <h3 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
                  مواقيت صلاة اليوم ({location.city})
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('prayer')}
                className="text-xs text-[#7BC0BE] hover:underline font-medium flex items-center gap-0.5"
              >
                <span>الأذان والتنبيهات</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {schedule.items.map((item) => {
                const Icon = getPrayerIcon(item.key);
                const isNext = item.isNext;

                return (
                  <div
                    key={item.key}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
                      isNext
                        ? 'bg-[#7BC0BE] text-white shadow-md shadow-[#7BC0BE]/25 scale-[1.02]'
                        : 'bg-white dark:bg-[#24211D] border border-[#E8D5B7]/50 dark:border-white/5 text-[#4A4A4A] dark:text-[#CFCBC3]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1.5 ${isNext ? 'text-white' : 'text-[#7BC0BE]'}`} />
                    <span className={`text-xs font-semibold ${isNext ? 'text-white' : 'text-[#6B4A2F] dark:text-[#EED6BD]'}`}>
                      {item.name}
                    </span>
                    <span className={`text-[11px] mt-0.5 tabular-nums font-medium ${isNext ? 'text-white/90 font-bold' : 'text-[#4A4A4A]/80 dark:text-[#CFCBC3]/80'}`}>
                      {item.timeString}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Quick Access Services */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => onNavigateTab('names_of_allah')}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/5 hover:border-[#7BC0BE] shadow-2xs flex items-center gap-2.5 transition-all text-right active:scale-95 group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#FFF9EB] dark:bg-[#1A1815] text-[#7BC0BE] flex items-center justify-center shrink-0 group-hover:bg-[#7BC0BE] group-hover:text-white transition-colors">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] group-hover:text-[#7BC0BE]">
              أسماء الله الحسنى
            </h4>
            <p className="text-[10px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">99 اسماً وشرحها</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('downloads')}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/5 hover:border-[#7BC0BE] shadow-2xs flex items-center gap-2.5 transition-all text-right active:scale-95 group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#FFF9EB] dark:bg-[#1A1815] text-[#7BC0BE] flex items-center justify-center shrink-0 group-hover:bg-[#7BC0BE] group-hover:text-white transition-colors">
            <DownloadCloud className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] group-hover:text-[#7BC0BE]">
              تحميلاتي
            </h4>
            <p className="text-[10px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">السور المحملة</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('qibla')}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/5 hover:border-[#7BC0BE] shadow-2xs flex items-center gap-2.5 transition-all text-right active:scale-95 group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#FFF9EB] dark:bg-[#1A1815] text-[#7BC0BE] flex items-center justify-center shrink-0 group-hover:bg-[#7BC0BE] group-hover:text-white transition-colors">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] group-hover:text-[#7BC0BE]">
              اتجاه القبلة
            </h4>
            <p className="text-[10px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">حسب محافظتك</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('radio')}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/5 hover:border-[#7BC0BE] shadow-2xs flex items-center gap-2.5 transition-all text-right active:scale-95 group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#FFF9EB] dark:bg-[#1A1815] text-[#7BC0BE] flex items-center justify-center shrink-0 group-hover:bg-[#7BC0BE] group-hover:text-white transition-colors">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] group-hover:text-[#7BC0BE]">
              إذاعة القرآن
            </h4>
            <p className="text-[10px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">بث مباشر 24/7</p>
          </div>
        </button>
      </div>

      {/* Last Read Quran Position */}
      {bookmark && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-[#24211D] border border-[#7BC0BE]/50 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#7BC0BE]/15 text-[#559B99] dark:text-[#7BC0BE] flex items-center justify-center shrink-0">
              <BookMarked className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#7BC0BE] block">
                آخر ما وصلت إليه في المصحف
              </span>
              <h4 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD] truncate">
                سورة {bookmark.surahName} · الآية {bookmark.ayahNumber}
              </h4>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('quran', { surahNumber: bookmark.surahNumber })}
            className="px-4 py-2 bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-xs font-bold rounded-2xl shadow-xs shrink-0 transition-all active:scale-95"
          >
            متابعة القراءة
          </button>
        </div>
      )}

      {/* Live Daily Quran Verse, Hadith, and Duaa from Online APIs */}
      {isLoadingContent ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#7BC0BE] mx-auto" />
          <p className="text-xs text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">
            جاري تحديث الآية والحديث والدعاء اليومي من الإنترنت...
          </p>
        </div>
      ) : contentError ? (
        <OnlineErrorState
          message={contentError}
          onRetry={() => void loadDailyOnlineContent()}
        />
      ) : (
        <>
          {dailyAyah && (
            <div className="p-5 rounded-3xl bg-[#FFF9EB] dark:bg-[#201D19] border border-[#E8D5B7]/70 dark:border-white/5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8D5B7]/40 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#7BC0BE]" />
                  <span className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
                    وردك القرآني اليوم
                  </span>
                </div>
                <span className="text-[11px] text-[#7BC0BE] font-semibold">
                  سورة {dailyAyah.surahName} · الآية {dailyAyah.ayahNumber}
                </span>
              </div>

              <p className="font-quran text-lg sm:text-xl text-[#6B4A2F] dark:text-[#EED6BD] leading-[2.2] my-3.5 text-center">
                ﴿ {dailyAyah.text} ﴾
              </p>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => onNavigateTab('quran', { surahNumber: dailyAyah.surahNumber })}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-xs font-semibold rounded-2xl shadow-xs transition-all active:scale-95"
                >
                  <span>أكمل القراءة في المصحف</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dailyHadith && (
              <div className="p-5 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/10 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Quote className="w-3.5 h-3.5 text-[#7BC0BE]" />
                    <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
                      حديث اليوم
                    </h4>
                  </div>
                  <p className="text-xs leading-relaxed text-[#4A4A4A] dark:text-[#CFCBC3] my-2">
                    «{dailyHadith.text}»
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E8D5B7]/30 dark:border-white/5 flex items-center justify-between text-[10px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">
                  <span>{dailyHadith.narrator}</span>
                  <span className="font-medium text-[#7BC0BE]">{dailyHadith.source}</span>
                </div>
              </div>
            )}

            {dailyDuaa && (
              <div className="p-5 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/10 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-3.5 h-3.5 text-[#7BC0BE]" />
                    <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
                      دعاء اليوم
                    </h4>
                  </div>
                  <p className="text-xs leading-relaxed text-[#4A4A4A] dark:text-[#CFCBC3] my-2">
                    "{dailyDuaa.text}"
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E8D5B7]/30 dark:border-white/5 text-[10px] text-[#7BC0BE] font-medium text-left">
                  {dailyDuaa.source}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Khatma Progress Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-white to-[#FFF9EB] dark:from-[#24211D] dark:to-[#1A1815] border border-[#E8D5B7]/60 dark:border-white/10 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
              ختمة القرآن الكريم
            </h4>
            <p className="text-[11px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">
              أنجزت {khatma.completedAyahs} آية من أصل 6236 آية
            </p>
          </div>
          <span className="text-base font-bold text-[#7BC0BE] font-mono">
            {khatmaPercent}%
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-[#E8D5B7]/40 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#7BC0BE] to-[#559B99] rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, khatmaPercent)}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">
            الهدف: ختمة خلال {khatma.targetDays} يوم
          </span>
          <button
            onClick={() => onNavigateTab('more')}
            className="text-[#7BC0BE] hover:underline font-semibold"
          >
            تعديل خطة الختمة
          </button>
        </div>
      </div>

      {/* Advertise / Contact Developer Card */}
      <button
        type="button"
        onClick={() => onNavigateTab('ad_contact')}
        className="w-full p-4 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/10 hover:border-[#7BC0BE] shadow-2xs flex items-center justify-between gap-3 transition-all text-right active:scale-[0.99] group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#7BC0BE]/15 text-[#7BC0BE] flex items-center justify-center shrink-0 group-hover:bg-[#7BC0BE] group-hover:text-white transition-colors">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
              أعلن معنا · تواصل مع المطور
            </h4>
            <p className="text-[11px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">
              أرسل طلب إضافة إعلانك أو رسالتك مباشرة إلى مطور الموقع فقط
            </p>
          </div>
        </div>
        <ChevronLeft className="w-4 h-4 text-[#7BC0BE] shrink-0" />
      </button>
    </div>
  );
};

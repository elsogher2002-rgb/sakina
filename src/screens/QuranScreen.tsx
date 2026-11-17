import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Surah, Ayah, QuranBookmark, KhatmaTracker } from '../types';
import { 
  QURAN_RECITERS, 
  getSurahAudioUrl, 
  fetchAllSurahsLive, 
  fetchSurahVersesLive 
} from '../utils/quranApi';
import { VerseShareModal } from '../components/VerseShareModal';
import { TafsirModal } from '../components/TafsirModal';
import { OnlineErrorState } from '../components/OnlineErrorState';
import { 
  startDownloadSurah, 
  cancelDownload, 
  isSurahDownloaded, 
  getActiveProgress, 
  subscribeToDownloads, 
  getOfflineAudioUrl,
  getAllDownloadedSurahs 
} from '../utils/audioDownloader';
import { 
  Search, 
  BookMarked, 
  Star, 
  Play, 
  Pause, 
  Square,
  ArrowRight, 
  Share2, 
  Copy, 
  HelpCircle, 
  Bookmark, 
  Volume2,
  ChevronDown,
  DownloadCloud,
  CheckCircle2,
  X,
  Loader2
} from 'lucide-react';

interface QuranScreenProps {
  initialSurahNumber?: number;
  bookmark: QuranBookmark | null;
  onSaveBookmark: (bm: QuranBookmark) => void;
  favorites: { id: string }[];
  onToggleFavoriteSurah: (surah: Surah) => void;
  onShowToast: (text: string) => void;
  isPlayingAudio: boolean;
  isLoadingAudio: boolean;
  currentAudioTitle?: string;
  currentAudioUrl?: string;
  currentAudioTrackId?: string;
  audioCurrentTime: number;
  audioDuration: number;
  onSeekAudio: (seconds: number) => void;
  onPlayAudioStream: (url: string, title: string, trackId?: string) => void;
  onTogglePlayPause: () => void;
  onStopAudioStream: () => void;
  onOpenDownloads?: () => void;
  onlineRefreshTick: number;
  khatma?: KhatmaTracker;
  onToggleSurahInKhatma?: (surah: Surah) => void;
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '00:00';
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const QuranScreen: React.FC<QuranScreenProps> = ({
  initialSurahNumber,
  bookmark,
  onSaveBookmark,
  favorites,
  onToggleFavoriteSurah,
  onShowToast,
  isPlayingAudio,
  isLoadingAudio,
  currentAudioTitle,
  currentAudioUrl,
  currentAudioTrackId,
  audioCurrentTime,
  audioDuration,
  onSeekAudio,
  onPlayAudioStream,
  onTogglePlayPause,
  onStopAudioStream,
  onOpenDownloads,
  onlineRefreshTick,
  khatma,
  onToggleSurahInKhatma,
}) => {
  const [surahsList, setSurahsList] = useState<Surah[]>([]);
  const [isLoadingSurahs, setIsLoadingSurahs] = useState<boolean>(true);
  const [surahsError, setSurahsError] = useState<string | null>(null);

  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number | null>(
    initialSurahNumber || null
  );
  const [verses, setVerses] = useState<Ayah[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState<boolean>(false);
  const [versesError, setVersesError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sakina_quran_font_size');
      return saved ? parseInt(saved, 10) : 24;
    } catch {
      return 24;
    }
  });
  const [isSepiaMode, setIsSepiaMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sakina_quran_sepia') === 'true';
    } catch {
      return false;
    }
  });
  const [selectedReciterId, setSelectedReciterId] = useState<string>(() => {
    try {
      return localStorage.getItem('sakina_quran_reciter') || 'ar.alafasy';
    } catch {
      return 'ar.alafasy';
    }
  });
  const [showReciterDropdown, setShowReciterDropdown] = useState(false);
  const [, setDownloadTick] = useState(0);

  const [shareModalVerse, setShareModalVerse] = useState<{
    surahName: string;
    ayahNumber: number;
    verseText: string;
  } | null>(null);

  const [tafsirModalVerse, setTafsirModalVerse] = useState<{
    surahName: string;
    ayahNumber: number;
    verseText: string;
    tafsirText: string;
  } | null>(null);

  const readerContainerRef = useRef<HTMLDivElement>(null);
  const bookmarkRef = useRef(bookmark);
  bookmarkRef.current = bookmark;
  const onSaveBookmarkRef = useRef(onSaveBookmark);
  onSaveBookmarkRef.current = onSaveBookmark;

  const loadSurahsList = useCallback(async () => {
    setIsLoadingSurahs(true);
    setSurahsError(null);
    try {
      const list = await fetchAllSurahsLive();
      setSurahsList(list);
    } catch (err) {
      setSurahsList([]);
      setSurahsError(err instanceof Error ? err.message : 'مفيش نت، وصل النت وجرب تاني');
    } finally {
      setIsLoadingSurahs(false);
    }
  }, []);

  const loadSurahVerses = useCallback(async (surahNum: number) => {
    setIsLoadingVerses(true);
    setVersesError(null);
    setVerses([]);
    try {
      const data = await fetchSurahVersesLive(surahNum);
      setVerses(data);
    } catch (err) {
      setVerses([]);
      setVersesError(err instanceof Error ? err.message : 'مفيش نت، وصل النت وجرب تاني');
    } finally {
      setIsLoadingVerses(false);
    }
  }, []);

  // Load 114 surahs live on mount and auto-refresh on reconnect
  useEffect(() => {
    void loadSurahsList();
  }, [loadSurahsList, onlineRefreshTick]);

  // Load verses live whenever a Surah is opened or network reconnects
  useEffect(() => {
    if (selectedSurahNumber) {
      void loadSurahVerses(selectedSurahNumber);
    }
  }, [selectedSurahNumber, loadSurahVerses, onlineRefreshTick]);

  useEffect(() => {
    try {
      localStorage.setItem('sakina_quran_font_size', fontSizeLevel.toString());
    } catch {}
  }, [fontSizeLevel]);

  useEffect(() => {
    try {
      localStorage.setItem('sakina_quran_sepia', String(isSepiaMode));
    } catch {}
  }, [isSepiaMode]);

  useEffect(() => {
    try {
      localStorage.setItem('sakina_quran_reciter', selectedReciterId);
    } catch {}
  }, [selectedReciterId]);

  useEffect(() => {
    const unsub = subscribeToDownloads(() => {
      setDownloadTick((t) => t + 1);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialSurahNumber) {
      setSelectedSurahNumber(initialSurahNumber);
    }
  }, [initialSurahNumber]);

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return surahsList;
    const query = searchQuery.trim();
    return surahsList.filter(
      (s) =>
        s.name.includes(query) ||
        s.number.toString() === query ||
        s.englishName.toLowerCase().includes(query.toLowerCase())
    );
  }, [searchQuery, surahsList]);

  const currentSurahMeta = useMemo(() => {
    if (!selectedSurahNumber) return null;
    return surahsList.find((s) => s.number === selectedSurahNumber) || null;
  }, [selectedSurahNumber, surahsList]);

  const isCurrentSurahFavorited = currentSurahMeta
    ? favorites.some((f) => f.id === `surah_${currentSurahMeta.number}`)
    : false;

  const isCurrentSurahDownloaded = currentSurahMeta
    ? isSurahDownloaded(currentSurahMeta.number, selectedReciterId)
    : false;

  const currentSurahProgress = currentSurahMeta
    ? getActiveProgress(currentSurahMeta.number)
    : undefined;

  // Scroll to saved bookmark once verses load, and track visible verse
  useEffect(() => {
    if (!selectedSurahNumber || !currentSurahMeta || verses.length === 0) return;

    const currentBm = bookmarkRef.current;
    if (currentBm && currentBm.surahNumber === selectedSurahNumber && currentBm.ayahNumber > 1) {
      setTimeout(() => {
        const el = document.getElementById(`ayah-${currentBm.ayahNumber}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 280);
    }

    if (typeof IntersectionObserver === 'undefined') return;

    let observer: IntersectionObserver | null = null;
    const setupTimer = setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const ayahStr = entry.target.getAttribute('data-ayah');
              const ayahNum = ayahStr ? parseInt(ayahStr, 10) : 0;
              if (ayahNum > 0) {
                const prev = bookmarkRef.current;
                if (!prev || prev.surahNumber !== currentSurahMeta.number || prev.ayahNumber !== ayahNum) {
                  onSaveBookmarkRef.current({
                    surahNumber: currentSurahMeta.number,
                    surahName: currentSurahMeta.name,
                    ayahNumber: ayahNum,
                    timestamp: Date.now(),
                  });
                }
              }
              break;
            }
          }
        },
        { rootMargin: '-35% 0px -45% 0px', threshold: 0.1 }
      );

      const ayahElements = document.querySelectorAll('[data-ayah]');
      ayahElements.forEach((el) => observer?.observe(el));
    }, 600);

    return () => {
      clearTimeout(setupTimer);
      observer?.disconnect();
    };
  }, [selectedSurahNumber, currentSurahMeta, verses.length]);

  const handleSurahClick = (surahNum: number) => {
    const meta = surahsList.find((s) => s.number === surahNum);
    if (meta) {
      const existingAyah =
        bookmarkRef.current && bookmarkRef.current.surahNumber === surahNum
          ? bookmarkRef.current.ayahNumber
          : 1;
      onSaveBookmark({
        surahNumber: meta.number,
        surahName: meta.name,
        ayahNumber: existingAyah,
        timestamp: Date.now(),
      });
    }
    setSelectedSurahNumber(surahNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSavePlace = (ayahNumber: number) => {
    if (!currentSurahMeta) return;
    const newBm: QuranBookmark = {
      surahNumber: currentSurahMeta.number,
      surahName: currentSurahMeta.name,
      ayahNumber,
      timestamp: Date.now(),
    };
    onSaveBookmark(newBm);
    onShowToast(`تم حفظ مكان القراءة: سورة ${currentSurahMeta.name} - الآية ${ayahNumber}`);
  };

  const handleCopyAyah = async (text: string, ayahNum: number) => {
    if (!currentSurahMeta) return;
    const fullText = `﴿ ${text} ﴾ [سورة ${currentSurahMeta.name}: ${ayahNum}]`;
    try {
      await navigator.clipboard.writeText(fullText);
      onShowToast('تم نسخ الآية الكريمة');
    } catch {
      onShowToast('فشل النسخ تلقائياً');
    }
  };

  const playSurahByMeta = async (surah: Surah, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const expectedTrackId = `quran_${surah.number}_${selectedReciterId}`;
    const expectedUrl = getSurahAudioUrl(surah.number, selectedReciterId);
    const isThisUrlActive =
      currentAudioTrackId === expectedTrackId || currentAudioUrl === expectedUrl;

    if (isThisUrlActive && (isPlayingAudio || isLoadingAudio)) {
      onTogglePlayPause();
      return;
    }

    const offlineUrl = await getOfflineAudioUrl(surah.number, selectedReciterId);
    if (!offlineUrl && typeof navigator !== 'undefined' && !navigator.onLine) {
      onShowToast('مفيش نت، وصل النت وجرب تاني');
      return;
    }

    const streamUrl = offlineUrl || expectedUrl;
    const reciter = QURAN_RECITERS.find((r) => r.id === selectedReciterId) || QURAN_RECITERS[0];
    const title = `سورة ${surah.name} - ${reciter.nameAr}`;

    onPlayAudioStream(streamUrl, title, expectedTrackId);
    onShowToast(
      offlineUrl
        ? `جاري تشغيل سورة ${surah.name} من المحمل على جهازك`
        : `جاري تشغيل سورة ${surah.name} بصوت ${reciter.nameAr}`
    );
  };

  const handleDownloadClick = async (surahNum: number, surahName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      onShowToast('مفيش نت، وصل النت وجرب تاني');
      return;
    }

    const inProgress = getActiveProgress(surahNum);
    if (inProgress) {
      cancelDownload(surahNum);
      onShowToast(`تم إلغاء تحميل سورة ${surahName}`);
      return;
    }

    const padded = surahNum.toString().padStart(3, '0');
    onShowToast(`بدأ تحميل ملف ${padded}-${surahName}.mp3 على جهازك...`);
    const success = await startDownloadSurah(surahNum, surahName, selectedReciterId);
    if (success) {
      onShowToast(`تم تنزيل سورة ${surahName} (${padded}-${surahName}.mp3) بنجاح!`);
    } else {
      onShowToast('مفيش نت أو تعذر التنزيل، وصل النت وجرب تاني');
    }
  };

  const totalDownloadedCount = getAllDownloadedSurahs().length;
  const activeReciter = QURAN_RECITERS.find((r) => r.id === selectedReciterId) || QURAN_RECITERS[0];

  // Reader View
  if (selectedSurahNumber && currentSurahMeta) {
    const surahAudioUrl = getSurahAudioUrl(currentSurahMeta.number, selectedReciterId);
    const expectedTrackId = `quran_${currentSurahMeta.number}_${selectedReciterId}`;
    const isThisSurahActive =
      currentAudioTrackId === expectedTrackId || currentAudioUrl === surahAudioUrl;
    const isCompletedInKhatma = Boolean(khatma?.completedSurahs?.includes(currentSurahMeta.number));

    return (
      <div
        ref={readerContainerRef}
        className={`rounded-3xl p-4 sm:p-6 transition-colors ${
          isSepiaMode
            ? 'bg-[#F4EBD9] text-[#423122]'
            : 'bg-white dark:bg-[#201D19] text-[#4A4A4A] dark:text-[#EED6BD]'
        } border border-[#E8D5B7]/60 dark:border-white/5 shadow-sm space-y-5 pb-12`}
      >
        {/* Reader Top Controls */}
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#E8D5B7]/40 dark:border-white/10">
          <button
            onClick={() => setSelectedSurahNumber(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FDF8F0] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] hover:bg-[#E8D5B7]/30 text-xs font-semibold transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            <span>قائمة السور</span>
          </button>

          <div className="text-center">
            <h2 className="text-lg font-bold text-[#6B4A2F] dark:text-[#EED6BD] font-cairo">
              سورة {currentSurahMeta.name}
            </h2>
            <div className="flex items-center justify-center gap-2 text-[11px] text-[#7BC0BE]">
              <span>{currentSurahMeta.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
              <span>·</span>
              <span>{currentSurahMeta.numberOfAyahs} آية</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleFavoriteSurah(currentSurahMeta as Surah)}
              className={`p-2 rounded-xl transition-colors ${
                isCurrentSurahFavorited
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/20'
                  : 'text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 hover:bg-[#FFF9EB] dark:hover:bg-[#2D2822]'
              }`}
              title="إضافة للمفضلة"
            >
              <Star className={`w-4 h-4 ${isCurrentSurahFavorited ? 'fill-amber-500' : ''}`} />
            </button>

            <button
              onClick={() => setIsSepiaMode(!isSepiaMode)}
              className="p-2 rounded-xl text-xs font-medium bg-[#FDF8F0] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] hover:opacity-80 transition-opacity"
              title="وضع القراءة الدافئ"
            >
              {isSepiaMode ? 'عادي' : 'بيج'}
            </button>
          </div>
        </div>

        {/* Real Audio Player Bar + Progress Bar + Reciter + Real MP3 Download */}
        <div className="bg-[#FFF9EB] dark:bg-[#1A1815] p-3.5 sm:p-4 rounded-2xl border border-[#E8D5B7]/50 dark:border-white/5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => playSurahByMeta(currentSurahMeta)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                {isThisSurahActive && isLoadingAudio ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isThisSurahActive && isPlayingAudio ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>
                  {isThisSurahActive && isLoadingAudio
                    ? 'جاري التحميل...'
                    : isThisSurahActive && isPlayingAudio
                    ? 'إيقاف مؤقت'
                    : 'تشغيل السورة'}
                </span>
              </button>

              {isThisSurahActive && (isPlayingAudio || isLoadingAudio) && (
                <button
                  onClick={onStopAudioStream}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 text-xs font-bold border border-rose-200 dark:border-rose-800"
                  title="إيقاف نهائي"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>إيقاف</span>
                </button>
              )}

              {/* Reciter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowReciterDropdown(!showReciterDropdown)}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/10 text-xs text-[#6B4A2F] dark:text-[#EED6BD]"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#7BC0BE]" />
                  <span className="max-w-[120px] truncate">{activeReciter.nameAr}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {showReciterDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-[#24211D] rounded-2xl shadow-xl border border-[#E8D5B7] dark:border-white/10 p-1 z-30">
                    {QURAN_RECITERS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setSelectedReciterId(r.id);
                          setShowReciterDropdown(false);
                          onShowToast(`تم اختيار القارئ: ${r.nameAr}`);
                        }}
                        className={`w-full text-right px-3 py-2 rounded-xl text-xs transition-colors ${
                          r.id === selectedReciterId
                            ? 'bg-[#7BC0BE]/15 text-[#559B99] dark:text-[#7BC0BE] font-bold'
                            : 'hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815] text-[#4A4A4A] dark:text-[#CFCBC3]'
                        }`}
                      >
                        {r.nameAr}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Real Download MP3 Button */}
              {currentSurahProgress ? (
                <button
                  onClick={() => cancelDownload(currentSurahMeta.number)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#7BC0BE]/15 text-[#559B99] dark:text-[#7BC0BE] text-[11px] font-bold border border-[#7BC0BE]/40"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{currentSurahProgress.percent}% (إلغاء)</span>
                </button>
              ) : (
                <button
                  onClick={(e) => handleDownloadClick(currentSurahMeta.number, currentSurahMeta.name, e)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold transition-colors ${
                    isCurrentSurahDownloaded
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-white dark:bg-[#24211D] border-[#E8D5B7] text-[#6B4A2F] dark:text-[#EED6BD] hover:text-[#7BC0BE]'
                  }`}
                >
                  {isCurrentSurahDownloaded ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <DownloadCloud className="w-3.5 h-3.5 text-[#7BC0BE]" />
                  )}
                  <span>{isCurrentSurahDownloaded ? 'تنزيل MP3 مرة أخرى' : 'تحميل MP3'}</span>
                </button>
              )}
            </div>

            {/* Font Size Adjuster */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">حجم الخط:</span>
              <button
                onClick={() => setFontSizeLevel((prev) => Math.max(18, prev - 2))}
                className="w-7 h-7 rounded-lg bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/10 text-[#6B4A2F] dark:text-[#EED6BD] text-xs font-bold flex items-center justify-center"
              >
                -
              </button>
              <span className="text-xs font-mono tabular-nums">{fontSizeLevel}</span>
              <button
                onClick={() => setFontSizeLevel((prev) => Math.min(38, prev + 2))}
                className="w-7 h-7 rounded-lg bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/10 text-[#6B4A2F] dark:text-[#EED6BD] text-xs font-bold flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Audio Progress Bar when playing this surah */}
          {isThisSurahActive && (
            <div className="pt-2 border-t border-[#E8D5B7]/30 dark:border-white/10 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#7BC0BE]">
                <span>{isLoadingAudio ? 'جاري التحميل من السيرفر...' : isPlayingAudio ? 'يتم التشغيل الآن' : 'متوقف مؤقتاً'}</span>
                <span className="font-mono tabular-nums">
                  {formatTime(audioCurrentTime)} / {formatTime(audioDuration)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={audioDuration || 100}
                step={1}
                value={audioDuration ? Math.min(audioCurrentTime, audioDuration) : 0}
                onChange={(e) => onSeekAudio(parseFloat(e.target.value))}
                disabled={!audioDuration}
                className="w-full accent-[#7BC0BE] h-1.5 cursor-pointer rounded-lg"
                aria-label="شريط تقدم صوت السورة"
              />
            </div>
          )}

          {/* Real Download Progress Bar */}
          {currentSurahProgress && (
            <div className="pt-2 border-t border-[#E8D5B7]/30 space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-[#7BC0BE]">
                <span>جاري تنزيل ملف السورة MP3...</span>
                <span className="font-mono">{currentSurahProgress.percent}%</span>
              </div>
              <div className="w-full h-2 bg-[#E8D5B7]/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7BC0BE] transition-all duration-150"
                  style={{ width: `${currentSurahProgress.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Verses Loading / Error / Content */}
        {isLoadingVerses ? (
          <div className="p-10 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#7BC0BE] mx-auto" />
            <p className="text-xs font-semibold text-[#6B4A2F] dark:text-[#EED6BD]">
              جاري جلب آيات سورة {currentSurahMeta.name} والتفسير الميسر من الإنترنت...
            </p>
          </div>
        ) : versesError ? (
          <OnlineErrorState
            message={versesError}
            onRetry={() => void loadSurahVerses(currentSurahMeta.number)}
          />
        ) : (
          <>
            {currentSurahMeta.number !== 9 && currentSurahMeta.number !== 1 && (
              <div className="text-center py-4">
                <span className="font-quran text-2xl sm:text-3xl text-[#6B4A2F] dark:text-[#EED6BD]">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </span>
              </div>
            )}

            <div className="space-y-4">
              {verses.map((verse) => {
                const isBookmarked =
                  bookmark?.surahNumber === currentSurahMeta.number &&
                  bookmark?.ayahNumber === verse.numberInSurah;

                return (
                  <div
                    key={verse.numberInSurah}
                    id={`ayah-${verse.numberInSurah}`}
                    data-ayah={verse.numberInSurah}
                    className={`p-4 rounded-2xl transition-all ${
                      isBookmarked
                        ? 'bg-[#7BC0BE]/15 border-2 border-[#7BC0BE]'
                        : 'hover:bg-black/2 dark:hover:bg-white/2 border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <p
                        style={{ fontSize: `${fontSizeLevel}px` }}
                        className="font-quran leading-[2.4] text-[#6B4A2F] dark:text-[#EED6BD] text-justify select-text"
                      >
                        {verse.text}
                        <span className="inline-flex items-center justify-center mx-1.5 w-7 h-7 text-xs font-mono font-bold text-[#7BC0BE] border border-[#7BC0BE] rounded-full bg-[#7BC0BE]/10 align-middle">
                          {verse.numberInSurah}
                        </span>
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E8D5B7]/25 dark:border-white/5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSavePlace(verse.numberInSurah)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-colors ${
                              isBookmarked
                                ? 'bg-[#7BC0BE] text-white font-semibold'
                                : 'bg-[#FFF9EB] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] hover:bg-[#E8D5B7]/40'
                            }`}
                          >
                            <Bookmark className="w-3 h-3" />
                            <span className="text-[10px]">{isBookmarked ? 'مكاني المحفوظ' : 'حفظ مكاني'}</span>
                          </button>

                          <button
                            onClick={() =>
                              setTafsirModalVerse({
                                surahName: currentSurahMeta.name,
                                ayahNumber: verse.numberInSurah,
                                verseText: verse.text,
                                tafsirText: verse.tafsir || 'التفسير غير متوفر لهذه الآية حالياً.',
                              })
                            }
                            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#FFF9EB] dark:bg-[#1A1815] text-[#4A4A4A] dark:text-[#CFCBC3] hover:text-[#7BC0BE]"
                          >
                            <HelpCircle className="w-3 h-3 text-[#7BC0BE]" />
                            <span className="text-[10px]">التفسير</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyAyah(verse.text, verse.numberInSurah)}
                            className="p-1.5 rounded-xl hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815] text-[#4A4A4A] dark:text-[#CFCBC3] hover:text-[#7BC0BE]"
                            title="نسخ الآية"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              setShareModalVerse({
                                surahName: currentSurahMeta.name,
                                ayahNumber: verse.numberInSurah,
                                verseText: verse.text,
                              })
                            }
                            className="p-1.5 rounded-xl hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815] text-[#4A4A4A] dark:text-[#CFCBC3] hover:text-[#7BC0BE]"
                            title="مشاركة الآية كبطاقة"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {onToggleSurahInKhatma && (
              <div className="pt-4 border-t border-[#E8D5B7]/40 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
                    متابعة ختمة القرآن الكريم (على هذا المتصفح)
                  </h4>
                  <p className="text-[11px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">
                    سجّل إتمام قراءة سورة {currentSurahMeta.name} لحساب نسبة الختمة الخاصة بك
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleSurahInKhatma(currentSurahMeta)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
                    isCompletedInKhatma
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[#7BC0BE] hover:bg-[#67AEA9] text-white shadow-xs'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isCompletedInKhatma ? 'تم تسجيل قراءة السورة ✓' : 'أتممت قراءة السورة'}</span>
                </button>
              </div>
            )}
          </>
        )}

        {shareModalVerse && (
          <VerseShareModal
            isOpen={true}
            onClose={() => setShareModalVerse(null)}
            onShowToast={onShowToast}
            surahName={shareModalVerse.surahName}
            ayahNumber={shareModalVerse.ayahNumber}
            verseText={shareModalVerse.verseText}
          />
        )}

        {tafsirModalVerse && (
          <TafsirModal
            isOpen={true}
            onClose={() => setTafsirModalVerse(null)}
            surahName={tafsirModalVerse.surahName}
            ayahNumber={tafsirModalVerse.ayahNumber}
            verseText={tafsirModalVerse.verseText}
            tafsirText={tafsirModalVerse.tafsirText}
          />
        )}
      </div>
    );
  }

  // Surahs Catalog View
  if (isLoadingSurahs) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#7BC0BE] mx-auto" />
        <p className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
          جاري جلب سور القرآن الكريم الـ 114 من الإنترنت...
        </p>
      </div>
    );
  }

  if (surahsError || surahsList.length === 0) {
    return (
      <OnlineErrorState
        message={surahsError || 'مفيش نت، وصل النت وجرب تاني'}
        onRetry={() => void loadSurahsList()}
      />
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Top Reciter Selector Bar + Downloads Shortcut */}
      <div className="p-3.5 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/10 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Volume2 className="w-4 h-4 text-[#7BC0BE] shrink-0" />
          <label htmlFor="quran-reciter-select" className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] shrink-0">
            القارئ:
          </label>
          <select
            id="quran-reciter-select"
            value={selectedReciterId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedReciterId(id);
              const rec = QURAN_RECITERS.find((r) => r.id === id);
              if (rec) onShowToast(`تم اختيار القارئ: ${rec.nameAr}`);
            }}
            className="flex-1 bg-[#FDF8F0] dark:bg-[#1A1815] border border-[#E8D5B7]/60 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#6B4A2F] dark:text-[#EED6BD]"
          >
            {QURAN_RECITERS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nameAr}
              </option>
            ))}
          </select>
        </div>

        {onOpenDownloads && (
          <button
            onClick={onOpenDownloads}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FFF9EB] dark:bg-[#1A1815] border border-[#E8D5B7]/60 dark:border-white/10 hover:border-[#7BC0BE] text-[#6B4A2F] dark:text-[#EED6BD] hover:text-[#7BC0BE] text-xs font-bold transition-all shrink-0"
          >
            <DownloadCloud className="w-4 h-4 text-[#7BC0BE]" />
            <span>تحميلاتي</span>
            {totalDownloadedCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#7BC0BE] text-white text-[10px] flex items-center justify-center font-mono">
                {totalDownloadedCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Live Inline Audio Player Banner when a Surah is playing in catalog */}
      {currentAudioUrl && currentAudioTitle && currentAudioTitle.includes('سورة') && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF9EB] to-white dark:from-[#24211D] dark:to-[#1A1815] border border-[#7BC0BE] shadow-xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#7BC0BE] block">
                {isLoadingAudio ? 'جاري تحميل الصوت...' : isPlayingAudio ? 'يتم التشغيل الآن' : 'متوقف مؤقتاً'}
              </span>
              <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] truncate">
                {currentAudioTitle}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={onTogglePlayPause}
                className="p-2 rounded-xl bg-[#7BC0BE] text-white"
              >
                {isLoadingAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onStopAudioStream}
                className="p-2 rounded-xl bg-rose-50 text-rose-600"
                title="إيقاف"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tabular-nums">{formatTime(audioCurrentTime)}</span>
            <input
              type="range"
              min={0}
              max={audioDuration || 100}
              step={1}
              value={audioDuration ? Math.min(audioCurrentTime, audioDuration) : 0}
              onChange={(e) => onSeekAudio(parseFloat(e.target.value))}
              className="flex-1 accent-[#7BC0BE] h-1 cursor-pointer"
            />
            <span className="text-[10px] font-mono tabular-nums">{formatTime(audioDuration)}</span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#4A4A4A]/50 dark:text-[#CFCBC3]/50 absolute right-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث باسم السورة أو رقمها (مثال: الفاتحة، الإخلاص، 112)..."
          className="w-full bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/10 rounded-2xl py-3 pr-11 pl-4 text-xs sm:text-sm text-[#4A4A4A] dark:text-[#EED6BD] focus:outline-none focus:ring-2 focus:ring-[#7BC0BE]/50 shadow-2xs"
        />
      </div>

      {/* Bookmark quick resume */}
      {bookmark && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF9EB] to-white dark:from-[#24211D] dark:to-[#1A1815] border border-[#7BC0BE]/40 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7BC0BE]/20 text-[#559B99] dark:text-[#7BC0BE] flex items-center justify-center">
              <BookMarked className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#7BC0BE] font-bold uppercase tracking-wider block">
                آخر موضع قراءة محفوظ
              </span>
              <span className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
                سورة {bookmark.surahName} · الآية {bookmark.ayahNumber}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleSurahClick(bookmark.surahNumber)}
            className="px-3.5 py-1.5 bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
          >
            متابعة القراءة
          </button>
        </div>
      )}

      {/* 114 Surahs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSurahs.map((surah) => {
          const isFav = favorites.some((f) => f.id === `surah_${surah.number}`);
          const downloaded = isSurahDownloaded(surah.number, selectedReciterId);
          const progress = getActiveProgress(surah.number);
          const surahAudioUrl = getSurahAudioUrl(surah.number, selectedReciterId);
          const expectedTrackId = `quran_${surah.number}_${selectedReciterId}`;
          const isThisMatch =
            currentAudioTrackId === expectedTrackId || currentAudioUrl === surahAudioUrl;
          const isPlayingThis = isThisMatch && isPlayingAudio;
          const isLoadingThis = isThisMatch && isLoadingAudio;

          return (
            <div
              key={surah.number}
              onClick={() => handleSurahClick(surah.number)}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/50 dark:border-white/5 hover:border-[#7BC0BE] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99] relative overflow-hidden"
            >
              {progress && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-[#7BC0BE] transition-all duration-200"
                  style={{ width: `${progress.percent}%` }}
                />
              )}

              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-[#FFF9EB] dark:bg-[#1A1815] border border-[#E8D5B7]/60 dark:border-white/10 flex items-center justify-center font-bold text-xs text-[#6B4A2F] dark:text-[#EED6BD] font-mono shrink-0 group-hover:bg-[#7BC0BE] group-hover:text-white transition-colors">
                  {surah.number}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD] group-hover:text-[#7BC0BE] transition-colors truncate">
                      سورة {surah.name}
                    </h3>
                    {downloaded && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 mt-0.5">
                    <span>{surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                    <span>·</span>
                    <span>{surah.numberOfAyahs} آية</span>
                  </div>
                </div>
              </div>

              {/* Right: Direct Play, Download MP3, Favorite */}
              <div className="flex items-center gap-1 shrink-0">
                {isFav && <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />}

                {/* Direct Surah Play / Pause button */}
                <button
                  onClick={(e) => playSurahByMeta(surah, e)}
                  className={`p-1.5 rounded-xl transition-colors ${
                    isPlayingThis
                      ? 'bg-[#7BC0BE] text-white'
                      : 'text-[#7BC0BE] hover:bg-[#7BC0BE]/15'
                  }`}
                  title={isPlayingThis ? 'إيقاف مؤقت' : `تشغيل سورة ${surah.name}`}
                >
                  {isLoadingThis ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlayingThis ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                </button>

                {/* Real MP3 Download Button with % progress */}
                {progress ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelDownload(surah.number);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#7BC0BE]/15 text-[#559B99] dark:text-[#7BC0BE] text-[10px] font-bold font-mono"
                    title="جاري التحميل - اضغط للإلغاء"
                  >
                    <span>{progress.percent}%</span>
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleDownloadClick(surah.number, surah.name, e)}
                    className={`p-1.5 rounded-xl transition-colors ${
                      downloaded
                        ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                        : 'text-[#4A4A4A]/50 dark:text-[#CFCBC3]/50 hover:text-[#7BC0BE] hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815]'
                    }`}
                    title="تحميل ملف MP3 على الجهاز"
                  >
                    {downloaded ? <CheckCircle2 className="w-4 h-4" /> : <DownloadCloud className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

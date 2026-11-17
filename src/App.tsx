import React, { useState, useEffect, useRef, useTransition, useCallback, lazy, Suspense } from 'react';
import {
  ActiveTab,
  LocationInfo,
  AppSettings,
  QuranBookmark,
  UserStats,
  KhatmaTracker,
  ToastMessage,
  RadioStation,
  Surah,
  AdhanAlertData,
} from './types';
import { applyDynamicSeo } from './utils/seoManager';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredLocation,
  saveStoredLocation,
  getStoredBookmark,
  saveStoredBookmark,
  getStoredStats,
  saveStoredStats,
  getStoredKhatma,
  saveStoredKhatma,
  getFavorites,
  saveFavorites,
  FavoriteItem,
} from './utils/db';
import {
  fetchLivePrayerTimes,
  recomputePrayerScheduleFromRaw,
  LivePrayerBundle,
} from './utils/prayerApi';
import { fetchLiveRadioStations } from './utils/radioApi';
import { checkPrayerAlerts } from './utils/notifications';
import { stopRealAdhan, subscribeAdhanPlayback } from './utils/sound';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { LocationModal } from './components/LocationModal';
import { WelcomeModal } from './components/WelcomeModal';
import { PWAInstallModal, usePWAInstall } from './components/PWAInstallModal';
import { FavoritesModal } from './components/FavoritesModal';
import { MiniPlayerBar } from './components/MiniPlayerBar';
import { AdhanAlertModal } from './components/AdhanAlertModal';

// Home renders immediately; all secondary screens are code-split via React.lazy for instant initial load
import { HomeScreen } from './screens/HomeScreen';
const QuranScreen = lazy(() => import('./screens/QuranScreen').then((m) => ({ default: m.QuranScreen })));
const AzkarScreen = lazy(() => import('./screens/AzkarScreen').then((m) => ({ default: m.AzkarScreen })));
const QiblaScreen = lazy(() => import('./screens/QiblaScreen').then((m) => ({ default: m.QiblaScreen })));
const TasbihScreen = lazy(() => import('./screens/TasbihScreen').then((m) => ({ default: m.TasbihScreen })));
const RadioScreen = lazy(() => import('./screens/RadioScreen').then((m) => ({ default: m.RadioScreen })));
const PrayerScreen = lazy(() => import('./screens/PrayerScreen').then((m) => ({ default: m.PrayerScreen })));
const MoreScreen = lazy(() => import('./screens/MoreScreen').then((m) => ({ default: m.MoreScreen })));
const NamesOfAllahScreen = lazy(() => import('./screens/NamesOfAllahScreen').then((m) => ({ default: m.NamesOfAllahScreen })));
const DownloadsScreen = lazy(() => import('./screens/DownloadsScreen').then((m) => ({ default: m.DownloadsScreen })));
const AdContactScreen = lazy(() => import('./screens/AdContactScreen').then((m) => ({ default: m.AdContactScreen })));
import { Wifi, WifiOff, ExternalLink, X, Globe } from 'lucide-react';

export default function App() {
  const [, startTransition] = useTransition();

  // App state
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [quranInitialSurah, setQuranInitialSurah] = useState<number | undefined>(undefined);
  const [location, setLocation] = useState<LocationInfo>(getStoredLocation);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);
  const [bookmark, setBookmark] = useState<QuranBookmark | null>(getStoredBookmark);
  const [stats, setStats] = useState<UserStats>(getStoredStats);
  const [khatma, setKhatma] = useState<KhatmaTracker>(getStoredKhatma);
  const [favorites, setFavorites] = useState<FavoriteItem[]>(getFavorites);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnectedBanner, setShowReconnectedBanner] = useState<boolean>(false);
  const [onlineRefreshTick, setOnlineRefreshTick] = useState<number>(0);

  // Built-in Web Browser / Search Bar State
  const [webHistory, setWebHistory] = useState<string[]>([]);
  const [webHistoryIndex, setWebHistoryIndex] = useState<number>(-1);
  const [isWebLoading, setIsWebLoading] = useState<boolean>(false);
  const [webRefreshKey, setWebRefreshKey] = useState<number>(0);
  const [tabHistory, setTabHistory] = useState<ActiveTab[]>(['home']);

  const currentWebUrl =
    webHistoryIndex >= 0 && webHistory[webHistoryIndex] ? webHistory[webHistoryIndex] : null;

  // Modals
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [pwaModalOpen, setPwaModalOpen] = useState(false);
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);

  // Real Adhan Alert Modal & playback state
  const [adhanAlert, setAdhanAlert] = useState<AdhanAlertData | null>(null);
  const [isAdhanPlaying, setIsAdhanPlaying] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeAdhanPlayback((playing) => {
      setIsAdhanPlaying(playing);
    });
    return () => unsub();
  }, []);

  // Toast Helper
  const showToast = useCallback(
    (text: string, type: 'success' | 'info' | 'reminder' = 'success') => {
      const id = Date.now().toString() + Math.random().toString();
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3800);
    },
    []
  );

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial URL deep link (?tab=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as ActiveTab | null;
      if (tabParam) {
        const validPublicTabs: ActiveTab[] = [
          'home',
          'quran',
          'azkar',
          'qibla',
          'tasbih',
          'radio',
          'prayer',
          'more',
          'names_of_allah',
          'downloads',
          'ad_contact',
        ];
        if (validPublicTabs.includes(tabParam)) {
          setActiveTab(tabParam);
        }
      }
    }
  }, []);

  // Keep dynamic SEO metadata + JSON-LD synchronized on tab change
  useEffect(() => {
    applyDynamicSeo(activeTab);
  }, [activeTab]);

  // Live Prayer Times & Hijri Calendar State
  const [livePrayerBundle, setLivePrayerBundle] = useState<LivePrayerBundle | null>(null);
  const [isLoadingPrayer, setIsLoadingPrayer] = useState<boolean>(true);
  const [prayerError, setPrayerError] = useState<string | null>(null);

  const loadPrayerTimes = useCallback(async (loc: LocationInfo) => {
    setIsLoadingPrayer(true);
    setPrayerError(null);
    setLivePrayerBundle(null);
    try {
      const bundle = await fetchLivePrayerTimes(loc);
      setLivePrayerBundle(bundle);
    } catch (err) {
      setLivePrayerBundle(null);
      setPrayerError(err instanceof Error ? err.message : 'مفيش نت، وصل النت وجرب تاني');
    } finally {
      setIsLoadingPrayer(false);
    }
  }, []);

  useEffect(() => {
    void loadPrayerTimes(location);
  }, [location, loadPrayerTimes, onlineRefreshTick]);

  // Live Radio Stations State
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState<boolean>(true);
  const [stationsError, setStationsError] = useState<string | null>(null);

  const loadRadioStations = useCallback(async () => {
    setIsLoadingStations(true);
    setStationsError(null);
    try {
      const list = await fetchLiveRadioStations();
      setStations(list);
      setCurrentRadioStation((prev) => {
        if (prev && prev.id.startsWith('quran_')) return prev;
        if (prev && list.some((s) => s.id === prev.id)) return prev;
        return list[0] || null;
      });
    } catch (err) {
      setStations([]);
      setStationsError(err instanceof Error ? err.message : 'مفيش نت، وصل النت وجرب تاني');
    } finally {
      setIsLoadingStations(false);
    }
  }, []);

  useEffect(() => {
    void loadRadioStations();
  }, [loadRadioStations, onlineRefreshTick]);

  // Connectivity listener & auto-refresh when internet returns
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedBanner(true);
      setOnlineRefreshTick((t) => t + 1);
      setTimeout(() => setShowReconnectedBanner(false), 3800);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Audio Stream State (Continuous across all page navigation)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioErrorMessage, setAudioErrorMessage] = useState<string | null>(null);
  const [currentRadioStation, setCurrentRadioStation] = useState<RadioStation | null>(null);
  const [volume, setVolume] = useState<number>(0.85);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  const stationsRef = useRef<RadioStation[]>([]);
  stationsRef.current = stations;
  const currentStationRef = useRef<RadioStation | null>(null);
  currentStationRef.current = currentRadioStation;
  const failedRadioAttemptsRef = useRef<number>(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // PWA install hook
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Dark mode effect
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // First time welcome check
  useEffect(() => {
    const hasPrompted = localStorage.getItem('sakina_welcome_prompted');
    if (!hasPrompted) {
      setWelcomeModalOpen(true);
    }
  }, []);

  // Recompute remaining prayer countdown + check live Muezzin Adhan alerts every 15s
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setLivePrayerBundle((prev) => {
        if (!prev) return prev;
        const updatedSchedule = recomputePrayerScheduleFromRaw(prev.rawTimings, new Date());
        checkPrayerAlerts(
          updatedSchedule,
          settings,
          location.city,
          (title, body) => {
            showToast(`${title}: ${body}`, 'reminder');
          },
          (modalAlert) => {
            setAdhanAlert(modalAlert);
          }
        );
        return {
          ...prev,
          schedule: updatedSchedule,
        };
      });
    }, 15000);

    return () => clearInterval(clockInterval);
  }, [settings, location.city, showToast]);

  // Audio Playback Engine (Radio Stations)
  const playStation = useCallback(
    (station: RadioStation, resetAttempts: boolean = true) => {
      if (!audioRef.current) return;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsLoadingAudio(false);
        setIsPlayingAudio(false);
        setAudioErrorMessage('مفيش نت، جرب تاني');
        showToast('مفيش نت، وصل النت وجرب تاني', 'info');
        return;
      }

      if (resetAttempts) {
        failedRadioAttemptsRef.current = 0;
      }

      setIsLoadingAudio(true);
      setAudioErrorMessage(null);
      setAudioCurrentTime(0);
      setAudioDuration(0);
      setCurrentRadioStation(station);

      const audio = audioRef.current;
      audio.pause();
      audio.src = station.url;
      audio.load();

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlayingAudio(true);
            setIsLoadingAudio(false);
            setAudioErrorMessage(null);
            failedRadioAttemptsRef.current = 0;
          })
          .catch((err) => {
            console.warn('Playback initiation error:', err);
          });
      }
    },
    [showToast]
  );

  const handleNextRadioStation = useCallback(
    (isAutoFallback: boolean = false) => {
      const list = stationsRef.current;
      if (list.length === 0) {
        setIsLoadingAudio(false);
        setIsPlayingAudio(false);
        setAudioErrorMessage('مفيش نت، جرب تاني');
        return;
      }

      const activeId = currentStationRef.current?.id || list[0].id;
      const currentIndex = list.findIndex((s) => s.id === activeId);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % list.length : 0;
      const nextStation = list[nextIndex];
      playStation(nextStation, !isAutoFallback);
      if (!isAutoFallback) {
        showToast(`المحطة التالية: ${nextStation.name}`);
      }
    },
    [playStation, showToast]
  );

  const handlePrevRadioStation = useCallback(() => {
    const list = stationsRef.current;
    if (list.length === 0) return;

    const activeId = currentStationRef.current?.id || list[0].id;
    const currentIndex = list.findIndex((s) => s.id === activeId);
    const prevIndex = currentIndex >= 0 ? (currentIndex - 1 + list.length) % list.length : 0;
    const prevStation = list[prevIndex];
    playStation(prevStation, true);
    showToast(`المحطة السابقة: ${prevStation.name}`);
  }, [playStation, showToast]);

  // Audio Element Setup & Event Listeners
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    const onPlaying = () => {
      setIsPlayingAudio(true);
      setIsLoadingAudio(false);
      setAudioErrorMessage(null);
      failedRadioAttemptsRef.current = 0;
    };

    const onWaiting = () => {
      setIsLoadingAudio(true);
    };

    const onCanPlay = () => {
      setIsLoadingAudio(false);
    };

    const onTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime || 0);
      if (isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration);
      }
    };

    const onLoadedMetadata = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration);
      }
    };

    const onEnded = () => {
      setIsPlayingAudio(false);
      setIsLoadingAudio(false);
    };

    const onError = () => {
      setIsLoadingAudio(false);
      setIsPlayingAudio(false);

      // Ignore empty-src clears when user hits stop
      if (!audio.getAttribute('src')) return;

      const active = currentStationRef.current;
      const isQuranTrack = Boolean(active?.id.startsWith('quran_'));

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setAudioErrorMessage('مفيش نت، جرب تاني');
        showToast('مفيش نت، وصل النت وجرب تاني', 'info');
        return;
      }

      if (isQuranTrack) {
        setAudioErrorMessage('مفيش نت أو تعذر تشغيل السورة، جرب تاني');
        showToast('تعذر تشغيل السورة الآن، تأكد من الإنترنت وجرب تاني', 'info');
        return;
      }

      // Bounded auto-fallback for radio stations (max 5 attempts)
      const maxAttempts = Math.min(5, stationsRef.current.length || 0);
      failedRadioAttemptsRef.current += 1;

      if (failedRadioAttemptsRef.current < maxAttempts) {
        setAudioErrorMessage('تعذر الاتصال بهذه المحطة، جاري تجربة المحطة التالية...');
        retryTimeoutRef.current = setTimeout(() => {
          handleNextRadioStation(true);
        }, 900);
      } else {
        failedRadioAttemptsRef.current = 0;
        setAudioErrorMessage('مفيش نت أو تعذر الاتصال بالمحطات، جرب تاني');
        showToast('مفيش نت، جرب تاني', 'info');
      }
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
  }, [handleNextRadioStation, showToast]);

  // Audio volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleToggleRadioPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlayingAudio) {
      audio.pause();
      setIsPlayingAudio(false);
      setIsLoadingAudio(false);
      showToast('تم إيقاف البث مؤقتاً');
      return;
    }

    // Resume already loaded track (e.g., Quran recitation paused)
    const active = currentRadioStation || stations[0] || null;
    if (!active) {
      showToast('مفيش نت، جرب تاني', 'info');
      return;
    }

    if (audio.getAttribute('src') && audio.src === active.url && active.id.startsWith('quran_')) {
      setIsLoadingAudio(true);
      audio
        .play()
        .then(() => {
          setIsPlayingAudio(true);
          setIsLoadingAudio(false);
        })
        .catch(() => {
          setIsLoadingAudio(false);
          setAudioErrorMessage('مفيش نت، جرب تاني');
        });
      return;
    }

    playStation(active, true);
    showToast(`جاري تشغيل: ${active.name}`);
  }, [isPlayingAudio, currentRadioStation, stations, playStation, showToast]);

  const handleStopRadio = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    failedRadioAttemptsRef.current = 0;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    setIsPlayingAudio(false);
    setIsLoadingAudio(false);
    setAudioErrorMessage(null);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    showToast('تم إيقاف الصوت');
  }, [showToast]);

  const handleSeekAudio = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !isFinite(seconds)) return;
    try {
      audio.currentTime = Math.max(0, seconds);
      setAudioCurrentTime(Math.max(0, seconds));
    } catch {}
  }, []);

  const handlePlayQuranAudio = useCallback(
    (url: string, title: string, trackId?: string) => {
      if (!audioRef.current) return;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      const isOfflineBlob = url.startsWith('blob:');
      if (!isOfflineBlob && typeof navigator !== 'undefined' && !navigator.onLine) {
        showToast('مفيش نت، وصل النت وجرب تاني', 'info');
        return;
      }

      setIsLoadingAudio(true);
      setAudioErrorMessage(null);
      setAudioCurrentTime(0);
      setAudioDuration(0);

      const audio = audioRef.current;
      audio.pause();
      audio.src = url;
      audio.load();

      setCurrentRadioStation({
        id: trackId || `quran_reciter_${Date.now()}`,
        name: title,
        reciter: 'تلاوة عطرة من القرآن الكريم',
        url,
        description: 'تلاوة السورة',
      });

      audio
        .play()
        .then(() => {
          setIsPlayingAudio(true);
          setIsLoadingAudio(false);
        })
        .catch((err) => {
          console.warn('Recitation play error:', err);
          setIsLoadingAudio(false);
          setIsPlayingAudio(false);
        });
    },
    [showToast]
  );

  // Location handler
  const handleSelectLocation = (newLoc: LocationInfo) => {
    setLocation(newLoc);
    saveStoredLocation(newLoc);
  };

  // Welcome modal answers
  const handleAcceptWelcomeGPS = () => {
    localStorage.setItem('sakina_welcome_prompted', 'true');
    setWelcomeModalOpen(false);
    setLocationModalOpen(true);
  };

  const handleUseDefaultWelcome = () => {
    localStorage.setItem('sakina_welcome_prompted', 'true');
    setWelcomeModalOpen(false);
    showToast(`تم اعتماد التوقيت الحالي (${location.city})`);
  };

  // Initial history state
  useEffect(() => {
    window.history.replaceState({ tab: 'home' }, '');
  }, []);

  // Normalize user input into a loadable URL or Search URL
  const normalizeWebInput = (raw: string): string => {
    const trimmed = raw.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    if (!trimmed.includes(' ') && trimmed.includes('.')) {
      return `https://${trimmed}`;
    }
    return `https://www.google.com/search?igu=1&q=${encodeURIComponent(trimmed)}`;
  };

  // Navigate to URL inside site
  const handleNavigateUrl = useCallback(
    (rawInput: string) => {
      const targetUrl = normalizeWebInput(rawInput);
      setWebHistory((prev) => {
        const sliced = prev.slice(0, webHistoryIndex + 1);
        return [...sliced, targetUrl];
      });
      setWebHistoryIndex((prev) => prev + 1);
      setIsWebLoading(true);
      setWebRefreshKey((k) => k + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState({ webUrl: targetUrl }, '');
    },
    [webHistoryIndex]
  );

  // Tab switching with smooth transition and history push
  const handleTabChange = useCallback((tab: ActiveTab, subState?: unknown) => {
    startTransition(() => {
      setWebHistoryIndex(-1);
      setIsWebLoading(false);
      setActiveTab(tab);
      setTabHistory((prev) => (prev[prev.length - 1] === tab ? prev : [...prev.slice(-9), tab]));
      if (tab === 'quran' && subState && typeof subState === 'object' && 'surahNumber' in subState) {
        setQuranInitialSurah((subState as { surahNumber: number }).surahNumber);
      } else if (tab === 'quran' && !subState) {
        setQuranInitialSurah(undefined);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState({ tab, subState }, '');
    });
  }, []);

  // Top Bar: Back Button
  const handleNavBack = useCallback(() => {
    if (currentWebUrl) {
      if (webHistoryIndex > 0) {
        setWebHistoryIndex((idx) => idx - 1);
        setIsWebLoading(true);
      } else {
        setWebHistoryIndex(-1);
        setIsWebLoading(false);
      }
      return;
    }

    if (activeTab === 'names_of_allah' || activeTab === 'ad_contact') {
      setActiveTab('home');
      return;
    }
    if (activeTab === 'downloads') {
      setActiveTab('quran');
      return;
    }
    if (tabHistory.length > 1) {
      const nextHist = tabHistory.slice(0, -1);
      const prevTab = nextHist[nextHist.length - 1] || 'home';
      setTabHistory(nextHist);
      setActiveTab(prevTab);
      return;
    }
    if (activeTab !== 'home') {
      setActiveTab('home');
    }
  }, [currentWebUrl, webHistoryIndex, activeTab, tabHistory]);

  // Top Bar: Home Button
  const handleNavHome = useCallback(() => {
    setWebHistory([]);
    setWebHistoryIndex(-1);
    setIsWebLoading(false);
    setActiveTab('home');
    setQuranInitialSurah(undefined);
    setTabHistory(['home']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Top Bar: Refresh Button
  const handleNavRefresh = useCallback(() => {
    if (currentWebUrl) {
      setIsWebLoading(true);
      setWebRefreshKey((k) => k + 1);
      showToast('جاري تحديث الصفحة...');
    } else {
      setOnlineRefreshTick((t) => t + 1);
      showToast('جاري تحديث كافة البيانات من الإنترنت...');
    }
  }, [currentWebUrl, showToast]);

  const canGoBack = Boolean(currentWebUrl) || activeTab !== 'home' || tabHistory.length > 1;

  // Handle hardware & browser back button
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (adhanAlert) {
        stopRealAdhan();
        setAdhanAlert(null);
        return;
      }
      if (locationModalOpen) {
        setLocationModalOpen(false);
        return;
      }
      if (favoritesModalOpen) {
        setFavoritesModalOpen(false);
        return;
      }
      if (pwaModalOpen) {
        setPwaModalOpen(false);
        return;
      }
      if (welcomeModalOpen) {
        setWelcomeModalOpen(false);
        return;
      }

      if (currentWebUrl) {
        if (webHistoryIndex > 0) {
          setWebHistoryIndex((idx) => idx - 1);
          setIsWebLoading(true);
        } else {
          setWebHistoryIndex(-1);
          setIsWebLoading(false);
        }
        return;
      }

      if (activeTab === 'names_of_allah' || activeTab === 'ad_contact') {
        setActiveTab('home');
        return;
      }
      if (activeTab === 'downloads') {
        setActiveTab('quran');
        return;
      }
      if (activeTab === 'quran' && quranInitialSurah) {
        setQuranInitialSurah(undefined);
        return;
      }

      if (activeTab !== 'home') {
        setActiveTab('home');
        return;
      }

      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [
    adhanAlert,
    locationModalOpen,
    favoritesModalOpen,
    pwaModalOpen,
    welcomeModalOpen,
    currentWebUrl,
    webHistoryIndex,
    activeTab,
    quranInitialSurah,
  ]);

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextTheme: 'light' | 'dark' = settings.theme === 'light' ? 'dark' : 'light';
    const updated: AppSettings = { ...settings, theme: nextTheme };
    setSettings(updated);
    saveStoredSettings(updated);
    showToast(nextTheme === 'dark' ? 'تم تفعيل الوضع الليلي' : 'تم تفعيل الوضع الفاتح');
  };

  // Favorites
  const handleToggleFavoriteSurah = (surah: Surah) => {
    const id = `surah_${surah.number}`;
    const exists = favorites.some((f) => f.id === id);
    let updated: FavoriteItem[] = [];
    if (exists) {
      updated = favorites.filter((f) => f.id !== id);
      showToast(`تم إزالة سورة ${surah.name} من المفضلة`);
    } else {
      updated = [
        ...favorites,
        {
          id,
          type: 'surah',
          title: `سورة ${surah.name}`,
          subtitle: `${surah.numberOfAyahs} آية · ${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}`,
          surahNumber: surah.number,
          dateAdded: new Date().toISOString(),
        },
      ];
      showToast(`تمت إضافة سورة ${surah.name} إلى المفضلة`);
    }
    setFavorites(updated);
    saveFavorites(updated);
  };

  const handleRemoveFavorite = (id: string) => {
    const updated = favorites.filter((f) => f.id !== id);
    setFavorites(updated);
    saveFavorites(updated);
    showToast('تم الحذف من المفضلة');
  };

  // Khatma Surah completion handler (strictly per-browser in localStorage)
  const handleToggleSurahInKhatma = useCallback(
    (surah: Surah) => {
      const existing = Array.isArray(khatma.completedSurahs) ? khatma.completedSurahs : [];
      const alreadyCompleted = existing.includes(surah.number);
      const nextCompletedSurahs = alreadyCompleted
        ? existing.filter((n) => n !== surah.number)
        : [...existing, surah.number];
      const deltaAyahs = alreadyCompleted ? -surah.numberOfAyahs : surah.numberOfAyahs;
      const nextCompletedAyahs = Math.max(0, Math.min(6236, (khatma.completedAyahs || 0) + deltaAyahs));

      const nextKhatma: KhatmaTracker = {
        ...khatma,
        completedSurahs: nextCompletedSurahs,
        completedAyahs: nextCompletedAyahs,
      };
      setKhatma(nextKhatma);
      saveStoredKhatma(nextKhatma);
      showToast(
        alreadyCompleted
          ? `تم إلغاء تسجيل قراءة سورة ${surah.name} من ختمتك`
          : `ما شاء الله! تم تسجيل إتمام سورة ${surah.name} في ختمتك`
      );
    },
    [khatma, showToast]
  );

  const isMiniPlayerActive = isPlayingAudio || isLoadingAudio;
  const dateString = livePrayerBundle?.dateInfo.fullStringAr || (isLoadingPrayer ? 'جاري جلب التاريخ من الإنترنت...' : '');

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF8F0] dark:bg-[#1A1815] text-[#4A4A4A] dark:text-[#E2DFD8] transition-colors duration-200">
      {/* Top Fixed Header */}
      <Header
        dateString={dateString}
        location={location}
        isDark={settings.theme === 'dark'}
        onToggleTheme={handleToggleTheme}
        onOpenLocationModal={() => setLocationModalOpen(true)}
        isPlayingAudio={isPlayingAudio}
        audioTitle={currentRadioStation?.name || 'بث مباشر'}
        onStopAudio={handleStopRadio}
        onInstallClick={() => setPwaModalOpen(true)}
        showInstallBadge={!isInstalled && (isInstallable || isIOS)}
        currentWebUrl={currentWebUrl}
        canGoBack={canGoBack}
        isWebLoading={isWebLoading}
        onNavigateUrl={handleNavigateUrl}
        onNavBack={handleNavBack}
        onNavHome={handleNavHome}
        onNavRefresh={handleNavRefresh}
      />

      {/* Connectivity Notification Banners */}
      {!isOnline && (
        <div className="bg-amber-100/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-xs font-bold py-2 px-4 text-center border-b border-amber-300/60 dark:border-amber-800/60 flex items-center justify-center gap-2 animate-in fade-in">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>مفيش نت، وصل النت وجرب تاني لتحديث المواقيت والقرآن والأذكار والراديو</span>
        </div>
      )}

      {showReconnectedBanner && (
        <div className="bg-emerald-600 text-white text-xs font-semibold py-2 px-4 text-center shadow-xs flex items-center justify-center gap-2 animate-in fade-in">
          <Wifi className="w-3.5 h-3.5 shrink-0" />
          <span>رجع النت! جاري تحديث كل الأقسام تلقائياً من السيرفرات المباشرة</span>
        </div>
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 max-w-4xl w-full mx-auto px-4 pt-4 ${isMiniPlayerActive ? 'pb-36' : 'pb-24'}`}
      >
        {currentWebUrl ? (
          <div className="space-y-3">
            {/* Embedded Page Top Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#24211D] p-3 rounded-2xl border border-[#E8D5B7]/60 dark:border-white/10 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Globe className="w-4 h-4 text-[#7BC0BE] shrink-0" />
                <span className="text-xs font-mono text-[#6B4A2F] dark:text-[#EED6BD] truncate" dir="ltr">
                  {currentWebUrl}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={currentWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FFF9EB] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] hover:text-[#7BC0BE] border border-[#E8D5B7]/50 text-[11px] font-semibold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#7BC0BE]" />
                  <span>فتح خارجي</span>
                </a>
                <button
                  type="button"
                  onClick={handleNavHome}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-[11px] font-bold transition-all active:scale-95"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>العودة لسكينة</span>
                </button>
              </div>
            </div>

            {isWebLoading && (
              <div className="w-full h-1 bg-[#E8D5B7]/30 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-[#7BC0BE] rounded-full animate-pulse" />
              </div>
            )}

            <div className="rounded-3xl overflow-hidden border border-[#E8D5B7]/70 dark:border-white/10 bg-white shadow-sm">
              <iframe
                key={`${currentWebUrl}-${webRefreshKey}`}
                src={currentWebUrl}
                title="متصفح سَكِينة الداخلي"
                onLoad={() => setIsWebLoading(false)}
                className="w-full h-[72vh] min-h-[440px] border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <p className="text-[11px] text-center text-[#4A4A4A]/65 dark:text-[#CFCBC3]/65">
              ملاحظة: إذا رفض موقع خارجي العرض داخل الإطار لحماية خصوصيته، يمكنك الضغط على «فتح خارجي» بالأعلى.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                schedule={livePrayerBundle?.schedule || null}
                isLoadingPrayer={isLoadingPrayer}
                prayerError={prayerError}
                onRetryPrayer={() => void loadPrayerTimes(location)}
                location={location}
                onSelectLocation={handleSelectLocation}
                khatma={khatma}
                bookmark={bookmark}
                dateString={dateString}
                onNavigateTab={handleTabChange}
                onOpenLocationModal={() => setLocationModalOpen(true)}
                onShowToast={showToast}
                onlineRefreshTick={onlineRefreshTick}
              />
            )}

            {activeTab !== 'home' && (
              <Suspense
                fallback={
                  <div className="space-y-4 animate-pulse py-2">
                    <div className="h-16 rounded-3xl skeleton-shimmer" />
                    <div className="h-44 rounded-3xl skeleton-shimmer" />
                    <div className="h-32 rounded-3xl skeleton-shimmer" />
                  </div>
                }
              >
                {activeTab === 'quran' && (
                  <QuranScreen
                    initialSurahNumber={quranInitialSurah}
                    bookmark={bookmark}
                    onSaveBookmark={(bm) => {
                      setBookmark(bm);
                      saveStoredBookmark(bm);
                    }}
                    favorites={favorites}
                    onToggleFavoriteSurah={handleToggleFavoriteSurah}
                    onShowToast={showToast}
                    isPlayingAudio={isPlayingAudio}
                    isLoadingAudio={isLoadingAudio}
                    currentAudioTitle={currentRadioStation?.name}
                    currentAudioUrl={currentRadioStation?.url}
                    currentAudioTrackId={currentRadioStation?.id}
                    audioCurrentTime={audioCurrentTime}
                    audioDuration={audioDuration}
                    onSeekAudio={handleSeekAudio}
                    onPlayAudioStream={handlePlayQuranAudio}
                    onTogglePlayPause={handleToggleRadioPlay}
                    onStopAudioStream={handleStopRadio}
                    onOpenDownloads={() => handleTabChange('downloads')}
                    onlineRefreshTick={onlineRefreshTick}
                    khatma={khatma}
                    onToggleSurahInKhatma={handleToggleSurahInKhatma}
                  />
                )}

                {activeTab === 'azkar' && (
                  <AzkarScreen
                    onShowToast={showToast}
                    onZikrFinished={() => {
                      const todayStr = new Date().toDateString();
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      const nextStreakDays =
                        stats.lastActiveDate === todayStr
                          ? Math.max(1, stats.streakDays || 1)
                          : stats.lastActiveDate === yesterday.toDateString()
                          ? (stats.streakDays || 0) + 1
                          : 1;
                      const updated = {
                        ...stats,
                        streakDays: nextStreakDays,
                        lastActiveDate: todayStr,
                        completedAzkarCount: (stats.completedAzkarCount || 0) + 1,
                      };
                      setStats(updated);
                      saveStoredStats(updated);
                    }}
                    onlineRefreshTick={onlineRefreshTick}
                  />
                )}

                {activeTab === 'qibla' && (
                  <QiblaScreen
                    location={location}
                    onShowToast={showToast}
                    onlineRefreshTick={onlineRefreshTick}
                  />
                )}

                {activeTab === 'tasbih' && (
                  <TasbihScreen
                    stats={stats}
                    onUpdateStats={(newStats) => {
                      setStats(newStats);
                      saveStoredStats(newStats);
                    }}
                    onShowToast={showToast}
                  />
                )}

                {activeTab === 'radio' && (
                  <RadioScreen
                    stations={stations}
                    isLoadingStations={isLoadingStations}
                    stationsError={stationsError}
                    onRetryStations={() => void loadRadioStations()}
                    currentStation={currentRadioStation}
                    isPlaying={isPlayingAudio}
                    isLoading={isLoadingAudio}
                    errorMessage={audioErrorMessage}
                    volume={volume}
                    onSelectStation={(st) => playStation(st, true)}
                    onTogglePlay={handleToggleRadioPlay}
                    onStop={handleStopRadio}
                    onNextStation={() => handleNextRadioStation(false)}
                    onPrevStation={handlePrevRadioStation}
                    onVolumeChange={setVolume}
                    onShowToast={showToast}
                  />
                )}

                {activeTab === 'prayer' && (
                  <PrayerScreen
                    schedule={livePrayerBundle?.schedule || null}
                    isLoadingPrayer={isLoadingPrayer}
                    prayerError={prayerError}
                    onRetryPrayer={() => void loadPrayerTimes(location)}
                    location={location}
                    onSelectLocation={handleSelectLocation}
                    settings={settings}
                    onUpdateSettings={(newSettings) => {
                      setSettings(newSettings);
                      saveStoredSettings(newSettings);
                    }}
                    onOpenLocationModal={() => setLocationModalOpen(true)}
                    onShowToast={showToast}
                    onTriggerAdhanModal={(modalAlert) => setAdhanAlert(modalAlert)}
                  />
                )}

                {activeTab === 'names_of_allah' && (
                  <NamesOfAllahScreen
                    onBack={() => handleTabChange('home')}
                    onShowToast={showToast}
                  />
                )}

                {activeTab === 'ad_contact' && (
                  <AdContactScreen
                    onBack={() => handleTabChange('home')}
                    onShowToast={showToast}
                  />
                )}


                {activeTab === 'downloads' && (
                  <DownloadsScreen
                    onBack={() => handleTabChange('quran')}
                    onNavigateToSurah={(surahNum) =>
                      handleTabChange('quran', { surahNumber: surahNum })
                    }
                    onPlayAudioStream={handlePlayQuranAudio}
                    onStopAudioStream={handleStopRadio}
                    isPlayingAudio={isPlayingAudio}
                    currentPlayingTitle={currentRadioStation?.name}
                    onShowToast={showToast}
                  />
                )}

                {activeTab === 'more' && (
                  <MoreScreen
                    settings={settings}
                    onUpdateSettings={(newSettings) => {
                      setSettings(newSettings);
                      saveStoredSettings(newSettings);
                    }}
                    stats={stats}
                    khatma={khatma}
                    onUpdateKhatma={(newK) => {
                      setKhatma(newK);
                      saveStoredKhatma(newK);
                    }}
                    favorites={favorites}
                    onOpenFavorites={() => setFavoritesModalOpen(true)}
                    onShowToast={showToast}
                    onInstallPWA={() => setPwaModalOpen(true)}
                    onNavigateTab={handleTabChange}
                  />
                )}
              </Suspense>
            )}
          </>
        )}
      </main>

      {/* Floating Persistent Mini Player */}
      <MiniPlayerBar
        currentStation={currentRadioStation}
        isPlaying={isPlayingAudio}
        isLoading={isLoadingAudio}
        volume={volume}
        currentTime={audioCurrentTime}
        duration={audioDuration}
        onSeek={handleSeekAudio}
        onTogglePlay={handleToggleRadioPlay}
        onStop={handleStopRadio}
        onVolumeChange={setVolume}
        onNextStation={() => handleNextRadioStation(false)}
        onOpenRadioTab={() => handleTabChange('radio')}
      />

      {/* Fixed Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Modals & Dialogs */}
      <LocationModal
        currentLocation={location}
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSelectLocation={handleSelectLocation}
        onShowToast={showToast}
      />

      <WelcomeModal
        isOpen={welcomeModalOpen}
        onAcceptGPS={handleAcceptWelcomeGPS}
        onUseDefault={handleUseDefaultWelcome}
      />

      <PWAInstallModal
        isOpen={pwaModalOpen}
        onClose={() => setPwaModalOpen(false)}
        onInstallNative={install}
        isIOS={isIOS}
        isInstallable={isInstallable}
      />

      <FavoritesModal
        isOpen={favoritesModalOpen}
        onClose={() => setFavoritesModalOpen(false)}
        favorites={favorites}
        onRemoveFavorite={handleRemoveFavorite}
        onSelectSurah={(surahNum) => {
          handleTabChange('quran', { surahNumber: surahNum });
        }}
      />

      <AdhanAlertModal
        alert={adhanAlert}
        isAdhanPlaying={isAdhanPlaying}
        onStopAdhan={() => {
          stopRealAdhan();
          setAdhanAlert(null);
          showToast('تم إيقاف الأذان');
        }}
      />


      {/* Global Toast System */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

import { QuranBookmark, UserStats, KhatmaTracker, AppSettings, LocationInfo } from '../types';
import { EGYPT_GOVERNORATES, ARAB_HOLY_CITIES } from '../data/egyptGovernorates';

const DB_NAME = 'SakinaAppDB';
const DB_VERSION = 1;
const STORE_QURAN = 'quran_store';
const STORE_FAVORITES = 'favorites_store';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_QURAN)) {
        db.createObjectStore(STORE_QURAN, { keyPath: 'number' });
      }
      if (!db.objectStoreNames.contains(STORE_FAVORITES)) {
        db.createObjectStore(STORE_FAVORITES, { keyPath: 'id' });
      }
    };
  });
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  fontSize: 'medium',
  language: 'ar',
  azanSound: 'makkah',
  prayerAlerts: {
    fajr: true,
    sunrise: false,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
  alertMinutesBefore: 10,
  afterPrayerAlert: true,
  morningAzkarAlert: true,
  eveningAzkarAlert: true,
  fridayKahfAlert: true,
  qiyamAlert: false,
  fajrAlarmOffset: 20,
  fajrAlarmEnabled: false,
  hapticFeedback: true,
  tasbihSound: true,
  quranSepiaMode: false,
  selectedReciter: 'ar.alafasy',
};

export const DEFAULT_LOCATION: LocationInfo = EGYPT_GOVERNORATES[0];

export const POPULAR_LOCATIONS: LocationInfo[] = [
  ...EGYPT_GOVERNORATES,
  ...ARAB_HOLY_CITIES,
];

export function getStoredSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const raw = localStorage.getItem('sakina_settings');
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    const merged: AppSettings = { ...DEFAULT_SETTINGS, ...parsed };
    // Migrate deprecated non-azan sound option to real Makkah Adhan
    if ((merged.azanSound as string) === 'chime') {
      merged.azanSound = 'makkah';
    }
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sakina_settings', JSON.stringify(settings));
  }
}

export function getStoredLocation(): LocationInfo {
  if (typeof window === 'undefined') return DEFAULT_LOCATION;
  const raw = localStorage.getItem('sakina_location');
  if (!raw) return DEFAULT_LOCATION;
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_LOCATION;
  }
}

export function saveStoredLocation(loc: LocationInfo): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sakina_location', JSON.stringify(loc));
  }
}

export function getStoredBookmark(): QuranBookmark | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('sakina_quran_bookmark');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredBookmark(bm: QuranBookmark): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sakina_quran_bookmark', JSON.stringify(bm));
  }
}

export function getStoredStats(): UserStats {
  const defaultStats: UserStats = {
    streakDays: 0,
    lastActiveDate: '',
    totalVersesRead: 0,
    totalTasbihCount: 0,
    todayTasbihCount: 0,
    bestTasbihDay: 0,
    completedAzkarCount: 0,
    dailyTasbihHistory: {},
  };

  if (typeof window === 'undefined') return defaultStats;
  try {
    const raw = localStorage.getItem('sakina_user_stats');
    if (!raw) {
      localStorage.setItem('sakina_user_stats', JSON.stringify(defaultStats));
      return defaultStats;
    }
    const stats: UserStats = { ...defaultStats, ...JSON.parse(raw) };
    const todayStr = new Date().toDateString();

    if (stats.lastActiveDate && stats.lastActiveDate !== todayStr) {
      stats.todayTasbihCount = 0; // reset today's tasbih for new day
      localStorage.setItem('sakina_user_stats', JSON.stringify(stats));
    }
    return stats;
  } catch {
    return defaultStats;
  }
}

export function saveStoredStats(stats: UserStats): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('sakina_user_stats', JSON.stringify(stats));
    } catch {}
  }
}

export function getStoredKhatma(): KhatmaTracker {
  const defaultKhatma: KhatmaTracker = {
    targetDays: 30,
    startDate: new Date().toISOString(),
    completedAyahs: 0,
    completedSurahs: [],
    dailyWirdTarget: 208, // ayahs per day for 30 days khatma
  };
  if (typeof window === 'undefined') return defaultKhatma;
  try {
    const raw = localStorage.getItem('sakina_khatma_tracker');
    if (!raw) {
      localStorage.setItem('sakina_khatma_tracker', JSON.stringify(defaultKhatma));
      return defaultKhatma;
    }
    return JSON.parse(raw);
  } catch {
    return defaultKhatma;
  }
}

export function saveStoredKhatma(khatma: KhatmaTracker): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('sakina_khatma_tracker', JSON.stringify(khatma));
    } catch {}
  }
}

// Favorites storage
export interface FavoriteItem {
  id: string;
  type: 'surah' | 'ayah' | 'zikr';
  title: string;
  subtitle?: string;
  text?: string;
  surahNumber?: number;
  ayahNumber?: number;
  dateAdded: string;
}

export function getFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('sakina_favorites');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveFavorites(favs: FavoriteItem[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sakina_favorites', JSON.stringify(favs));
  }
}

export async function storeSurahInIndexedDB(surahNumber: number, data: unknown): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_QURAN, 'readwrite');
    const store = tx.objectStore(STORE_QURAN);
    store.put({ number: surahNumber, data });
  } catch {
    // Graceful fallback to memory/cache
  }
}

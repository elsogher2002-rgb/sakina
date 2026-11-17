export type ActiveTab =
  | 'home'
  | 'quran'
  | 'azkar'
  | 'qibla'
  | 'tasbih'
  | 'radio'
  | 'prayer'
  | 'more'
  | 'names_of_allah'
  | 'downloads'
  | 'ad_contact';

export interface Ayah {
  numberInSurah: number;
  text: string;
  tafsir?: string;
  juz: number;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
  page?: number;
  juz?: number;
  verses?: Ayah[];
}

export interface ZikrItem {
  id: string;
  text: string;
  count: number;
  virtue?: string;
  reference?: string;
}

export interface ZikrCategory {
  id: string;
  title: string;
  badge?: string;
  icon: string;
  audioUrl?: string;
  items: ZikrItem[];
}

export interface PrayerTimeItem {
  key: string;
  name: string;
  nameEn: string;
  timeString: string;
  dateObj: Date;
  isNext: boolean;
  isPassed: boolean;
}

export interface PrayerSchedule {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  sunset?: string;
  nextPrayer: {
    key: string;
    name: string;
    nameEn: string;
    time: string;
    remainingSeconds: number;
  };
  items: PrayerTimeItem[];
  sourceMethod?: string;
}

export interface RadioStation {
  id: string;
  name: string;
  reciter: string;
  url: string;
  description: string;
}

export interface LocationInfo {
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  apiCity?: string;
  isAutoDetected?: boolean;
}

export type AzanSoundOption = 'makkah' | 'aqsa' | 'alafasy' | 'egyptian' | 'silent';

export interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  language: 'ar' | 'en';
  azanSound: AzanSoundOption;
  prayerAlerts: {
    fajr: boolean;
    sunrise: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
  };
  alertMinutesBefore: number;
  afterPrayerAlert: boolean;
  morningAzkarAlert: boolean;
  eveningAzkarAlert: boolean;
  fridayKahfAlert: boolean;
  qiyamAlert: boolean;
  fajrAlarmOffset: number; // minutes before fajr
  fajrAlarmEnabled: boolean;
  hapticFeedback: boolean;
  tasbihSound: boolean;
  quranSepiaMode: boolean;
  selectedReciter: string;
}

export interface QuranBookmark {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  timestamp: number;
}

export interface KhatmaTracker {
  targetDays: number;
  startDate: string;
  completedAyahs: number;
  completedSurahs: number[];
  dailyWirdTarget: number;
}

export interface UserStats {
  streakDays: number;
  lastActiveDate: string;
  totalVersesRead: number;
  totalTasbihCount: number;
  todayTasbihCount: number;
  bestTasbihDay: number;
  completedAzkarCount: number;
  dailyTasbihHistory: { [dateStr: string]: number };
}

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'info' | 'reminder';
}

export interface AdhanAlertData {
  title: string;
  prayerName: string;
  prayerTime: string;
  locationName: string;
  muezzinLabel: string;
  isShortAlert?: boolean;
}

export type AdPlacementOption = 'slot1' | 'slot2' | 'both';
export type AdRequestStatus = 'new' | 'read' | 'published' | 'archived';

export interface AdRequestItem {
  id: string;
  senderName: string;
  contactInfo: string;
  adTitle: string;
  adLink?: string;
  message: string;
  placement: AdPlacementOption;
  status: AdRequestStatus;
  createdAtMs: number;
}

export interface PublishedAdItem {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  targetUrl: string;
  slotNumber: 1 | 2;
  active: boolean;
  updatedAtMs: number;
}

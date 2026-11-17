import { Ayah, Surah } from '../types';

export interface ReciterInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  serverUrl: string;
}

export const QURAN_RECITERS: ReciterInfo[] = [
  {
    id: 'ar.alafasy',
    nameAr: 'مشاري راشد العفاسي',
    nameEn: 'Mishary Rashid Alafasy',
    serverUrl: 'https://server8.mp3quran.net/afs',
  },
  {
    id: 'ar.abdulbasit',
    nameAr: 'عبد الباسط عبد الصمد',
    nameEn: 'Abdulbasit Abdulsamad',
    serverUrl: 'https://server7.mp3quran.net/basit',
  },
  {
    id: 'ar.ghamdi',
    nameAr: 'سعد الغامدي',
    nameEn: 'Saad Al-Ghamdi',
    serverUrl: 'https://server7.mp3quran.net/s_gmd',
  },
  {
    id: 'ar.maher',
    nameAr: 'ماهر المعيقلي',
    nameEn: 'Maher Al-Muaiqly',
    serverUrl: 'https://server12.mp3quran.net/maher',
  },
  {
    id: 'ar.husary',
    nameAr: 'محمود خليل الحصري',
    nameEn: 'Mahmoud Khalil Al-Husary',
    serverUrl: 'https://server13.mp3quran.net/husr',
  },
  {
    id: 'ar.minshawi',
    nameAr: 'محمد صديق المنشاوي',
    nameEn: 'Mohamed Siddiq El-Minshawi',
    serverUrl: 'https://server10.mp3quran.net/minsh',
  },
];

export function getSurahAudioUrl(surahNumber: number, reciterId: string = 'ar.alafasy'): string {
  const reciter = QURAN_RECITERS.find((r) => r.id === reciterId) || QURAN_RECITERS[0];
  const padded = surahNumber.toString().padStart(3, '0');
  return `${reciter.serverUrl}/${padded}.mp3`;
}

/**
 * Fetches all 114 Surahs metadata live from AlQuran.cloud API
 */
export async function fetchAllSurahsLive(): Promise<Surah[]> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('مفيش نت، وصل النت وجرب تاني');
  }

  const res = await fetch('https://api.alquran.cloud/v1/surah');
  if (!res.ok) {
    throw new Error('مفيش نت، وصل النت وجرب تاني');
  }

  const json = await res.json();
  if (json?.code !== 200 || !Array.isArray(json.data)) {
    throw new Error('تعذر جلب قائمة السور من السيرفر');
  }

  return json.data.map((s: any) => ({
    number: s.number,
    name: String(s.name || '').replace(/^سُورَةُ\s*/u, '').trim() || s.name,
    englishName: s.englishName,
    englishNameTranslation: s.englishNameTranslation,
    numberOfAyahs: s.numberOfAyahs,
    revelationType: s.revelationType === 'Medinan' ? 'Medinan' : 'Meccan',
  }));
}

/**
 * Fetches full Surah Uthmani text and Arabic Tafsir (Al-Muyassar) live from AlQuran.cloud API
 */
export async function fetchSurahVersesLive(surahNumber: number): Promise<Ayah[]> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('مفيش نت، وصل النت وجرب تاني');
  }

  const url = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,ar.muyassar`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('مفيش نت، وصل النت وجرب تاني');
  }

  const json = await res.json();
  if (json?.code !== 200 || !Array.isArray(json.data) || json.data.length === 0) {
    throw new Error('تعذر جلب آيات السورة من السيرفر');
  }

  const quranEdition = json.data[0];
  const tafsirEdition = json.data[1];

  const quranAyahs: any[] = quranEdition?.ayahs || [];
  const tafsirAyahs: any[] = tafsirEdition?.ayahs || [];

  return quranAyahs.map((ayah, idx) => ({
    numberInSurah: ayah.numberInSurah,
    text: String(ayah.text || '').replace(/^\uFEFF/, ''),
    juz: ayah.juz || 1,
    tafsir: tafsirAyahs[idx]?.text || '',
  }));
}

export interface LiveDailyAyah {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
}

/**
 * Fetches today's verse live from AlQuran.cloud API
 */
export async function fetchDailyAyahLive(): Promise<LiveDailyAyah> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('مفيش نت، وصل النت وجرب تاني');
  }

  const day = new Date().getDate();
  // Select well-known inspiring verses dynamically across the Quran
  const globalAyahIds = [
    293, // Al-Baqarah 286
    6095, // Ash-Sharh 5
    5220, // At-Talaq 3
    1735, // Ar-Ra'd 28
    4111, // Az-Zumar 53
    193, // Al-Baqarah 186
    262, // Ayat Al-Kursi
    5987, // Ad-Duha 5
  ];
  const ayahId = globalAyahIds[day % globalAyahIds.length];

  const res = await fetch(`https://api.alquran.cloud/v1/ayah/${ayahId}/quran-uthmani`);
  if (!res.ok) {
    throw new Error('مفيش نت، وصل النت وجرب تاني');
  }
  const json = await res.json();
  const data = json?.data;
  if (!data) {
    throw new Error('تعذر جلب الآية اليومية');
  }

  return {
    surahNumber: data.surah?.number || 1,
    surahName: String(data.surah?.name || '').replace(/^سُورَةُ\s*/u, '').trim() || 'القرآن',
    ayahNumber: data.numberInSurah || 1,
    text: String(data.text || '').replace(/^\uFEFF/, ''),
  };
}

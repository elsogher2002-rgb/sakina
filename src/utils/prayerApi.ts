import { LocationInfo, PrayerSchedule, PrayerTimeItem } from '../types';
import { FormattedDateInfo } from './hijriCalendar';

export interface LivePrayerBundle {
  schedule: PrayerSchedule;
  dateInfo: FormattedDateInfo;
  rawTimings: {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Sunset: string;
    Maghrib: string;
    Isha: string;
  };
}

function parseApiTimeToDate(baseDate: Date, hhmmRaw: string): Date {
  const clean = hhmmRaw.split(' ')[0].trim();
  const [hStr, mStr] = clean.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

function formatArabicTime12(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'م' : 'ص';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, '0')}:${m} ${period}`;
}

export function recomputePrayerScheduleFromRaw(
  rawTimings: LivePrayerBundle['rawTimings'],
  nowDate: Date = new Date()
): PrayerSchedule {
  const fajrDate = parseApiTimeToDate(nowDate, rawTimings.Fajr);
  const sunriseDate = parseApiTimeToDate(nowDate, rawTimings.Sunrise);
  const dhuhrDate = parseApiTimeToDate(nowDate, rawTimings.Dhuhr);
  const asrDate = parseApiTimeToDate(nowDate, rawTimings.Asr);
  const maghribDate = parseApiTimeToDate(nowDate, rawTimings.Maghrib || rawTimings.Sunset);
  const ishaDate = parseApiTimeToDate(nowDate, rawTimings.Isha);
  const sunsetDate = parseApiTimeToDate(nowDate, rawTimings.Sunset || rawTimings.Maghrib);

  const nowMs = nowDate.getTime();

  const prayersMeta = [
    { key: 'fajr', name: 'الفجر', nameEn: 'Fajr', dateObj: fajrDate },
    { key: 'sunrise', name: 'الشروق', nameEn: 'Sunrise', dateObj: sunriseDate },
    { key: 'dhuhr', name: 'الظهر', nameEn: 'Dhuhr', dateObj: dhuhrDate },
    { key: 'asr', name: 'العصر', nameEn: 'Asr', dateObj: asrDate },
    { key: 'maghrib', name: 'المغرب', nameEn: 'Maghrib', dateObj: maghribDate },
    { key: 'isha', name: 'العشاء', nameEn: 'Isha', dateObj: ishaDate },
  ];

  let nextPrayerMeta = prayersMeta.find((p) => p.dateObj.getTime() > nowMs);
  let remainingSeconds = 0;

  if (!nextPrayerMeta) {
    const tomorrowFajr = new Date(fajrDate);
    tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
    nextPrayerMeta = {
      key: 'fajr',
      name: 'الفجر',
      nameEn: 'Fajr',
      dateObj: tomorrowFajr,
    };
    remainingSeconds = Math.max(0, Math.floor((tomorrowFajr.getTime() - nowMs) / 1000));
  } else {
    remainingSeconds = Math.max(0, Math.floor((nextPrayerMeta.dateObj.getTime() - nowMs) / 1000));
  }

  const items: PrayerTimeItem[] = prayersMeta.map((p) => ({
    key: p.key,
    name: p.name,
    nameEn: p.nameEn,
    timeString: formatArabicTime12(p.dateObj),
    dateObj: p.dateObj,
    isNext: p.key === nextPrayerMeta!.key,
    isPassed: p.dateObj.getTime() < nowMs,
  }));

  return {
    fajr: formatArabicTime12(fajrDate),
    sunrise: formatArabicTime12(sunriseDate),
    dhuhr: formatArabicTime12(dhuhrDate),
    asr: formatArabicTime12(asrDate),
    maghrib: formatArabicTime12(maghribDate),
    isha: formatArabicTime12(ishaDate),
    sunset: formatArabicTime12(sunsetDate),
    nextPrayer: {
      key: nextPrayerMeta.key,
      name: nextPrayerMeta.name,
      nameEn: nextPrayerMeta.nameEn,
      time: formatArabicTime12(nextPrayerMeta.dateObj),
      remainingSeconds,
    },
    items,
    sourceMethod: 'الهيئة العامة المصرية للمساحة (AlAdhan API)',
  };
}

const GREGORIAN_MONTHS_AR: { [k: number]: string } = {
  1: 'يناير',
  2: 'فبراير',
  3: 'مارس',
  4: 'أبريل',
  5: 'مايو',
  6: 'يونيو',
  7: 'يوليو',
  8: 'أغسطس',
  9: 'سبتمبر',
  10: 'أكتوبر',
  11: 'نوفمبر',
  12: 'ديسمبر',
};

/**
 * Fetches live Prayer Times and Hijri/Gregorian calendar from AlAdhan API (Method 5: Egyptian General Authority of Survey)
 */
export async function fetchLivePrayerTimes(location: LocationInfo): Promise<LivePrayerBundle> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('مفيش نت، وصل النت وجرب تاني');
  }

  let jsonData: any = null;

  // Use timingsByCity when apiCity is configured (per requirement), otherwise / if rejected fall back to coordinates
  if (location.apiCity && location.country === 'مصر') {
    const cityUrl = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(location.apiCity)}&country=Egypt&method=5`;
    try {
      const res = await fetch(cityUrl);
      if (res.ok) {
        const parsed = await res.json();
        if (parsed && parsed.code === 200 && parsed.data?.timings) {
          jsonData = parsed.data;
        }
      }
    } catch {
      // Try coordinate endpoint before failing
    }
  }

  if (!jsonData) {
    const coordsUrl = `https://api.aladhan.com/v1/timings?latitude=${location.latitude}&longitude=${location.longitude}&method=5`;
    const res = await fetch(coordsUrl);
    if (!res.ok) {
      throw new Error('مفيش نت، وصل النت وجرب تاني');
    }
    const parsed = await res.json();
    if (!parsed || parsed.code !== 200 || !parsed.data?.timings) {
      throw new Error('تعذر جلب مواقيت الصلاة من السيرفر');
    }
    jsonData = parsed.data;
  }

  const timings = jsonData.timings;
  const rawTimings: LivePrayerBundle['rawTimings'] = {
    Fajr: timings.Fajr,
    Sunrise: timings.Sunrise,
    Dhuhr: timings.Dhuhr,
    Asr: timings.Asr,
    Sunset: timings.Sunset || timings.Maghrib,
    Maghrib: timings.Maghrib,
    Isha: timings.Isha,
  };

  const now = new Date();
  const schedule = recomputePrayerScheduleFromRaw(rawTimings, now);

  const hijri = jsonData.date?.hijri;
  const gregorian = jsonData.date?.gregorian;

  const hijriDay = parseInt(hijri?.day || '1', 10);
  const hijriMonthAr = hijri?.month?.ar || '';
  const hijriMonthEn = hijri?.month?.en || '';
  const hijriYear = parseInt(hijri?.year || '1448', 10);
  const weekdayAr = hijri?.weekday?.ar || '';

  const gregorianDay = parseInt(gregorian?.day || String(now.getDate()), 10);
  const gregorianMonthNum = parseInt(String(gregorian?.month?.number || now.getMonth() + 1), 10);
  const gregorianMonthAr = GREGORIAN_MONTHS_AR[gregorianMonthNum] || gregorian?.month?.en || '';
  const gregorianYear = parseInt(gregorian?.year || String(now.getFullYear()), 10);

  const dateInfo: FormattedDateInfo = {
    weekdayAr,
    hijriDay,
    hijriMonthAr,
    hijriMonthEn,
    hijriYear,
    gregorianDay,
    gregorianMonthAr,
    gregorianYear,
    fullStringAr: `${hijriDay} ${hijriMonthAr} ${hijriYear} هـ - ${weekdayAr} ${gregorianDay} ${gregorianMonthAr} ${gregorianYear}`,
    fullStringEn: `${hijriDay} ${hijriMonthEn} ${hijriYear} AH - ${gregorianDay} ${gregorian?.month?.en || ''} ${gregorianYear}`,
  };

  return {
    schedule,
    dateInfo,
    rawTimings,
  };
}

/**
 * Fetches Qibla bearing directly from AlAdhan Qibla API
 */
export async function fetchLiveQiblaDirection(latitude: number, longitude: number): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('مفيش نت، وصل النت وجرب تاني');
  }
  const res = await fetch(`https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`);
  if (!res.ok) {
    throw new Error('مفيش نت، وصل النت وجرب تاني');
  }
  const data = await res.json();
  if (data?.code === 200 && typeof data?.data?.direction === 'number') {
    return data.data.direction;
  }
  throw new Error('تعذر جلب اتجاه القبلة');
}

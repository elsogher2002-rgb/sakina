import { PrayerSchedule, PrayerTimeItem } from '../types';

/**
 * Offline Astronomical Prayer Times Calculation Engine
 * Egyptian General Authority of Survey (Method 5)
 * Fajr angle: 19.5°, Isha angle: 17.5°
 */

// Math helpers for spherical trigonometry
const dtr = (d: number) => (d * Math.PI) / 180.0;
const rtd = (r: number) => (r * 180.0) / Math.PI;
const sin = (d: number) => Math.sin(dtr(d));
const cos = (d: number) => Math.cos(dtr(d));
const tan = (d: number) => Math.tan(dtr(d));
const arcsin = (x: number) => rtd(Math.asin(x));
const arccos = (x: number) => rtd(Math.acos(x));
const arctan2 = (y: number, x: number) => rtd(Math.atan2(y, x));
const arccot = (x: number) => rtd(Math.atan(1.0 / x));
const fixAngle = (a: number) => {
  a = a - 360.0 * Math.floor(a / 360.0);
  return a < 0 ? a + 360.0 : a;
};
const fixHour = (a: number) => {
  a = a - 24.0 * Math.floor(a / 24.0);
  return a < 0 ? a + 24.0 : a;
};

// Julian date conversion
function getJulianDate(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

// Sun coordinates
function sunPosition(jd: number): { declination: number; equationOfTime: number } {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * sin(g) + 0.02 * sin(2 * g));
  const e = 23.439 - 0.00000036 * D;
  const RA = fixHour(arctan2(cos(e) * sin(L), cos(L)) / 15.0);
  const declination = arcsin(sin(e) * sin(L));
  const equationOfTime = (q / 15.0) - RA;
  return { declination, equationOfTime: fixHour(equationOfTime + 12) - 12 };
}

// Compute hour angle for given angle
function sunAngleTime(angle: number, decl: number, lat: number, isMorning: boolean): number {
  const cosH = (sin(-angle) - sin(lat) * sin(decl)) / (cos(lat) * cos(decl));
  if (cosH > 1) return isMorning ? 0 : 24;
  if (cosH < -1) return isMorning ? 24 : 0;
  const H = arccos(cosH) / 15.0;
  return isMorning ? -H : H;
}

// Compute Asr shadow time
function asrTime(shadowFactor: number, decl: number, lat: number): number {
  const angle = -arccot(shadowFactor + tan(Math.abs(lat - decl)));
  const cosH = (sin(-angle) - sin(lat) * sin(decl)) / (cos(lat) * cos(decl));
  if (cosH > 1 || cosH < -1) return 15;
  const H = arccos(cosH) / 15.0;
  return H;
}

export function calculatePrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  timeZoneOffsetHours?: number
): PrayerSchedule {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const timezone = timeZoneOffsetHours !== undefined ? timeZoneOffsetHours : -date.getTimezoneOffset() / 60;

  const jd = getJulianDate(year, month, day) - longitude / (15.0 * 24.0);
  const { declination, equationOfTime } = sunPosition(jd);

  // Noon (Dhuhr)
  const dhuhrHour = fixHour(12 + timezone - longitude / 15.0 - equationOfTime);

  // Egyptian General Authority of Survey: Fajr 19.5, Isha 17.5
  const fajrAngle = 19.5;
  const ishaAngle = 17.5;

  const fajrDiff = sunAngleTime(fajrAngle, declination, latitude, true);
  const sunriseDiff = sunAngleTime(0.833, declination, latitude, true);
  const asrDiff = asrTime(1, declination, latitude); // Standard Shafi/Hanbali shadow factor 1
  const maghribDiff = sunAngleTime(0.833, declination, latitude, false);
  const ishaDiff = sunAngleTime(ishaAngle, declination, latitude, false);

  const fajrHour = fixHour(dhuhrHour + fajrDiff);
  const sunriseHour = fixHour(dhuhrHour + sunriseDiff);
  const asrHour = fixHour(dhuhrHour + asrDiff);
  const maghribHour = fixHour(dhuhrHour + maghribDiff);
  const ishaHour = fixHour(dhuhrHour + ishaDiff);

  const toDateObj = (hourFloat: number): Date => {
    const d = new Date(date);
    const totalMinutes = Math.round(hourFloat * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const toTimeString = (d: Date): string => {
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const period = h >= 12 ? 'م' : 'ص';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, '0')}:${m} ${period}`;
  };

  const fajrDate = toDateObj(fajrHour);
  const sunriseDate = toDateObj(sunriseHour);
  const dhuhrDate = toDateObj(dhuhrHour);
  const asrDate = toDateObj(asrHour);
  const maghribDate = toDateObj(maghribHour);
  const ishaDate = toDateObj(ishaHour);

  const now = date.getTime();

  const prayersMeta = [
    { key: 'fajr', name: 'الفجر', nameEn: 'Fajr', dateObj: fajrDate },
    { key: 'sunrise', name: 'الشروق', nameEn: 'Sunrise', dateObj: sunriseDate },
    { key: 'dhuhr', name: 'الظهر', nameEn: 'Dhuhr', dateObj: dhuhrDate },
    { key: 'asr', name: 'العصر', nameEn: 'Asr', dateObj: asrDate },
    { key: 'maghrib', name: 'المغرب', nameEn: 'Maghrib', dateObj: maghribDate },
    { key: 'isha', name: 'العشاء', nameEn: 'Isha', dateObj: ishaDate },
  ];

  // Find next prayer
  let nextPrayerMeta = prayersMeta.find((p) => p.dateObj.getTime() > now);

  // If all prayers today have passed, next prayer is Fajr tomorrow
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
    remainingSeconds = Math.max(0, Math.floor((tomorrowFajr.getTime() - now) / 1000));
  } else {
    remainingSeconds = Math.max(0, Math.floor((nextPrayerMeta.dateObj.getTime() - now) / 1000));
  }

  const items: PrayerTimeItem[] = prayersMeta.map((p) => ({
    key: p.key,
    name: p.name,
    nameEn: p.nameEn,
    timeString: toTimeString(p.dateObj),
    dateObj: p.dateObj,
    isNext: p.key === nextPrayerMeta!.key,
    isPassed: p.dateObj.getTime() < now,
  }));

  return {
    fajr: toTimeString(fajrDate),
    sunrise: toTimeString(sunriseDate),
    dhuhr: toTimeString(dhuhrDate),
    asr: toTimeString(asrDate),
    maghrib: toTimeString(maghribDate),
    isha: toTimeString(ishaDate),
    nextPrayer: {
      key: nextPrayerMeta.key,
      name: nextPrayerMeta.name,
      nameEn: nextPrayerMeta.nameEn,
      time: toTimeString(nextPrayerMeta.dateObj),
      remainingSeconds,
    },
    items,
  };
}

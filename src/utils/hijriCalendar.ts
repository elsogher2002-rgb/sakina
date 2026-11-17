/**
 * Offline Hijri Date Calculator
 * Converts Gregorian dates to accurate Hijri dates with Arabic and English support
 */

const HIJRI_MONTHS_AR = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

const HIJRI_MONTHS_EN = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  'Sha\'ban',
  'Ramadan',
  'Shawwal',
  'Dhu al-Qi\'dah',
  'Dhu al-Hijjah',
];

const WEEKDAYS_AR = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

const GREGORIAN_MONTHS_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

export interface FormattedDateInfo {
  weekdayAr: string;
  hijriDay: number;
  hijriMonthAr: string;
  hijriMonthEn: string;
  hijriYear: number;
  gregorianDay: number;
  gregorianMonthAr: string;
  gregorianYear: number;
  fullStringAr: string;
  fullStringEn: string;
}

export function getHijriDate(date: Date = new Date(), adjustmentDays: number = 0): FormattedDateInfo {
  const adjustedDate = new Date(date.getTime() + adjustmentDays * 86400000);
  
  // Use Intl.DateTimeFormat with islamic-umalqura calendar if available in environment
  let hijriDay = 1;
  let hijriMonthIdx = 0;
  let hijriYear = 1447;

  try {
    const formatter = new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(adjustedDate);
    for (const part of parts) {
      if (part.type === 'day') hijriDay = parseInt(part.value, 10);
      if (part.type === 'month') hijriMonthIdx = Math.max(0, parseInt(part.value, 10) - 1);
      if (part.type === 'year') {
        const parsedYear = parseInt(part.value.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsedYear)) hijriYear = parsedYear;
      }
    }
  } catch {
    // Algorithmic Ku-Ku fallback calculation
    const jd = Math.floor((adjustedDate.getTime() / 86400000) + 2440587.5);
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = (Math.floor((10985 - l2) / 5316)) * (Math.floor((50 * l2) / 17719)) + (Math.floor(l2 / 5670)) * (Math.floor((43 * l2) / 15238));
    const l3 = l2 - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    const m = Math.floor((24 * l3) / 709);
    hijriDay = l3 - Math.floor((709 * m) / 24);
    hijriMonthIdx = Math.max(0, Math.min(11, m - 1));
    hijriYear = 30 * n + j - 30;
  }

  const weekdayAr = WEEKDAYS_AR[adjustedDate.getDay()];
  const hijriMonthAr = HIJRI_MONTHS_AR[hijriMonthIdx] || HIJRI_MONTHS_AR[0];
  const hijriMonthEn = HIJRI_MONTHS_EN[hijriMonthIdx] || HIJRI_MONTHS_EN[0];
  const gregorianDay = adjustedDate.getDate();
  const gregorianMonthAr = GREGORIAN_MONTHS_AR[adjustedDate.getMonth()];
  const gregorianYear = adjustedDate.getFullYear();

  return {
    weekdayAr,
    hijriDay,
    hijriMonthAr,
    hijriMonthEn,
    hijriYear,
    gregorianDay,
    gregorianMonthAr,
    gregorianYear,
    fullStringAr: `${hijriDay} ${hijriMonthAr} ${hijriYear} هـ - ${weekdayAr} ${gregorianDay} ${gregorianMonthAr} ${gregorianYear}`,
    fullStringEn: `${hijriDay} ${hijriMonthEn} ${hijriYear} AH - ${adjustedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}`,
  };
}

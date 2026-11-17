import { RadioStation } from '../types';

const MP3QURAN_RADIO_API = 'https://www.mp3quran.net/api/radio/radio_ar.json';

interface RawMp3QuranRadio {
  Id?: string;
  Name?: string;
  URL?: string;
}

const CAIRO_OFFICIAL_RADIO: RadioStation = {
  id: 'cairo_quran_live',
  name: 'إذاعة القرآن الكريم',
  reciter: 'البث المباشر الرسمي لإذاعة القرآن الكريم',
  url: 'https://stream.radiojar.com/8s5u5tpdtwzuv',
  description: 'بث مباشر 24 ساعة لإذاعة القرآن الكريم',
};

/**
 * Fetches live Quran radio stations directly from mp3quran.net API
 */
export async function fetchLiveRadioStations(): Promise<RadioStation[]> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('مفيش نت، وصل النت وجرب تاني');
  }

  const response = await fetch(MP3QURAN_RADIO_API);
  if (!response.ok) {
    throw new Error('مفيش نت، وصل النت وجرب تاني');
  }

  const data = await response.json();
  const rawList: RawMp3QuranRadio[] = Array.isArray(data?.Radios) ? data.Radios : [];
  if (rawList.length === 0) {
    throw new Error('تعذر جلب قائمة الإذاعات، جرب تاني');
  }

  const mapped: RadioStation[] = rawList
    .filter((item) => item.Name && item.URL)
    .map((item, index) => {
      const cleanName = (item.Name || '').trim().replace(/^-+|-+$/g, '').trim();
      const secureUrl = (item.URL || '').trim().replace(/^http:\/\//i, 'https://');
      return {
        id: item.Id ? `radio_${item.Id}` : `radio_idx_${index}`,
        name: cleanName.startsWith('إذاعة') || cleanName.includes('تلاوات') || cleanName.includes('الفتاوى') || cleanName.includes('المختصر')
          ? cleanName
          : `راديو الشيخ ${cleanName}`,
        reciter: cleanName,
        url: secureUrl,
        description: `بث مباشر من mp3quran.net: ${cleanName}`,
      };
    });

  // Prioritize famous stations while keeping all real API stations
  const priorityKeywords = [
    'السعودية',
    'مشاري العفاسي',
    'عبدالباسط عبدالصمد',
    'محمود خليل الحصري',
    'محمد صديق المنشاوي',
    'ماهر المعيقلي',
    'سعد الغامدي',
    'تلاوات خاشعة',
  ];

  const prioritized: RadioStation[] = [CAIRO_OFFICIAL_RADIO];
  const usedUrls = new Set<string>([CAIRO_OFFICIAL_RADIO.url]);

  for (const kw of priorityKeywords) {
    const match = mapped.find((s) => s.reciter.includes(kw) && !usedUrls.has(s.url));
    if (match) {
      prioritized.push(match);
      usedUrls.add(match.url);
    }
  }

  for (const st of mapped) {
    if (!usedUrls.has(st.url)) {
      prioritized.push(st);
      usedUrls.add(st.url);
    }
  }

  return prioritized;
}

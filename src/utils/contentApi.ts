import { ZikrCategory } from '../types';

const ADHKAR_API_URL = 'https://cdn.jsdelivr.net/gh/rn0x/Adhkar-json@main/adhkar.json';
const HADEETH_API_URL = 'https://hadeethenc.com/api/v1/hadeeths/list/?language=ar&category_id=1&page=1&per_page=30';

interface RawAdhkarCategory {
  id: number;
  category: string;
  audio?: string;
  filename?: string;
  array: Array<{
    id: number;
    text: string;
    count: number;
    audio?: string;
    filename?: string;
  }>;
}

function pickIconForCategory(title: string): string {
  if (title.includes('الصباح') || title.includes('الاستيقاظ')) return 'Sun';
  if (title.includes('النوم')) return 'BedDouble';
  if (title.includes('المساء')) return 'Moon';
  if (title.includes('المسجد') || title.includes('الآذان') || title.includes('الأذان') || title.includes('الصلاة')) return 'Sunrise';
  if (title.includes('المنزل')) return 'Home';
  if (title.includes('السفر')) return 'Plane';
  if (title.includes('الطعام')) return 'Utensils';
  if (title.includes('المرض') || title.includes('الكرب') || title.includes('الهم')) return 'HeartPulse';
  if (title.includes('الوضوء') || title.includes('المطر')) return 'Droplets';
  if (title.includes('الدعاء') || title.includes('دعاء')) return 'HeartHandshake';
  return 'Sparkles';
}

/**
 * Fetches complete Hisn Al-Muslim Azkar & Duaa categories live from Adhkar-json CDN
 */
export async function fetchLiveAzkarCategories(): Promise<ZikrCategory[]> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('مفيش نت، وصل النت وجرب تاني');
  }

  const res = await fetch(ADHKAR_API_URL);
  if (!res.ok) {
    throw new Error('مفيش نت، وصل النت وجرب تاني');
  }

  const data: RawAdhkarCategory[] = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('تعذر جلب الأذكار من السيرفر');
  }

  return data.map((cat) => ({
    id: `azkar_cat_${cat.id}`,
    title: cat.category,
    badge: `${cat.array.length} ذكر ودعاء من حصن المسلم`,
    icon: pickIconForCategory(cat.category),
    audioUrl: cat.audio ? `https://cdn.jsdelivr.net/gh/rn0x/Adhkar-json@main${cat.audio}` : undefined,
    items: (cat.array || []).map((item) => ({
      id: `zikr_${cat.id}_${item.id}`,
      text: item.text,
      count: item.count || 1,
      reference: 'حصن المسلم',
    })),
  }));
}

export interface LiveDailyHadith {
  text: string;
  source: string;
  narrator: string;
}

/**
 * Fetches authentic Hadith live from HadeethEnc API
 */
export async function fetchDailyHadithLive(): Promise<LiveDailyHadith> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('مفيش نت، وصل النت وجرب تاني');
  }

  const res = await fetch(HADEETH_API_URL);
  if (!res.ok) {
    throw new Error('مفيش نت، وصل النت وجرب تاني');
  }

  const json = await res.json();
  const list: Array<{ id: string; title: string }> = json?.data || [];
  if (list.length === 0) {
    throw new Error('تعذر جلب الحديث اليومي');
  }

  const day = new Date().getDate();
  const chosen = list[day % list.length];

  // Fetch detailed attribution for the chosen hadith
  try {
    const detailRes = await fetch(`https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${chosen.id}`);
    if (detailRes.ok) {
      const detail = await detailRes.json();
      return {
        text: detail.hadeeth || chosen.title,
        source: detail.attribution || 'موسوعة الأحاديث النبوية',
        narrator: detail.grade || 'حديث صحيح',
      };
    }
  } catch {
    // Fallback to list title if detail endpoint times out
  }

  return {
    text: chosen.title,
    source: 'موسوعة الأحاديث النبوية (HadeethEnc)',
    narrator: 'صحيح',
  };
}

export interface LiveDailyDuaa {
  text: string;
  source: string;
}

/**
 * Fetches live daily Duaa from Adhkar-json CDN
 */
export async function fetchDailyDuaaLive(): Promise<LiveDailyDuaa> {
  const categories = await fetchLiveAzkarCategories();
  const duaaPool = categories
    .filter((c) => c.title.includes('دعاء') || c.title.includes('الكرب') || c.title.includes('الصباح'))
    .flatMap((c) => c.items.map((it) => ({ text: it.text, source: c.title })));

  if (duaaPool.length === 0) {
    throw new Error('تعذر جلب دعاء اليوم');
  }

  const day = new Date().getDate();
  return duaaPool[day % duaaPool.length];
}

import { LocationInfo } from '../types';

/**
 * Complete list of all 27 Governorates of Egypt with accurate coordinates
 * and AlAdhan API city names.
 */
export const EGYPT_GOVERNORATES: LocationInfo[] = [
  { city: 'القاهرة', region: 'محافظة القاهرة', country: 'مصر', latitude: 30.0444, longitude: 31.2357, apiCity: 'Cairo' },
  { city: 'الجيزة', region: 'محافظة الجيزة', country: 'مصر', latitude: 30.0131, longitude: 31.2089, apiCity: 'Giza' },
  { city: 'القليوبية', region: 'بنها - القليوبية', country: 'مصر', latitude: 30.4660, longitude: 31.1848, apiCity: 'Benha' },
  { city: 'الإسكندرية', region: 'محافظة الإسكندرية', country: 'مصر', latitude: 31.2001, longitude: 29.9187, apiCity: 'Alexandria' },
  { city: 'البحيرة', region: 'دمنهور - البحيرة', country: 'مصر', latitude: 31.0379, longitude: 30.4697, apiCity: 'Damanhur' },
  { city: 'مطروح', region: 'مرسى مطروح', country: 'مصر', latitude: 31.3543, longitude: 27.2373, apiCity: 'Marsa Matruh' },
  { city: 'دمياط', region: 'محافظة دمياط', country: 'مصر', latitude: 31.4175, longitude: 31.8144, apiCity: 'Damietta' },
  { city: 'الدقهلية', region: 'المنصورة - الدقهلية', country: 'مصر', latitude: 31.0409, longitude: 31.3785 },
  { city: 'كفر الشيخ', region: 'محافظة كفر الشيخ', country: 'مصر', latitude: 31.1107, longitude: 30.9388, apiCity: 'Kafr El Sheikh' },
  { city: 'الغربية', region: 'طنطا - الغربية', country: 'مصر', latitude: 30.7865, longitude: 31.0004, apiCity: 'Tanta' },
  { city: 'المنوفية', region: 'شبين الكوم - المنوفية', country: 'مصر', latitude: 30.5503, longitude: 31.0106, apiCity: 'Shibin El Kom' },
  { city: 'الشرقية', region: 'الزقازيق - الشرقية', country: 'مصر', latitude: 30.5877, longitude: 31.5020 },
  { city: 'بورسعيد', region: 'محافظة بورسعيد', country: 'مصر', latitude: 31.2653, longitude: 32.3019, apiCity: 'Port Said' },
  { city: 'الإسماعيلية', region: 'محافظة الإسماعيلية', country: 'مصر', latitude: 30.5965, longitude: 32.2715, apiCity: 'Ismailia' },
  { city: 'السويس', region: 'محافظة السويس', country: 'مصر', latitude: 29.9668, longitude: 32.5498, apiCity: 'Suez' },
  { city: 'الفيوم', region: 'محافظة الفيوم', country: 'مصر', latitude: 29.3084, longitude: 30.8428 },
  { city: 'بني سويف', region: 'محافظة بني سويف', country: 'مصر', latitude: 29.0661, longitude: 31.0994 },
  { city: 'المنيا', region: 'محافظة المنيا', country: 'مصر', latitude: 28.0871, longitude: 30.7618 },
  { city: 'أسيوط', region: 'محافظة أسيوط', country: 'مصر', latitude: 27.1783, longitude: 31.1859, apiCity: 'Asyut' },
  { city: 'سوهاج', region: 'محافظة سوهاج', country: 'مصر', latitude: 26.5591, longitude: 31.6957, apiCity: 'Sohag' },
  { city: 'قنا', region: 'محافظة قنا', country: 'مصر', latitude: 26.1551, longitude: 32.7160, apiCity: 'Qena' },
  { city: 'الأقصر', region: 'محافظة الأقصر', country: 'مصر', latitude: 25.6872, longitude: 32.6396, apiCity: 'Luxor' },
  { city: 'أسوان', region: 'محافظة أسوان', country: 'مصر', latitude: 24.0889, longitude: 32.8998, apiCity: 'Aswan' },
  { city: 'البحر الأحمر', region: 'الغردقة - البحر الأحمر', country: 'مصر', latitude: 27.2579, longitude: 33.8116, apiCity: 'Hurghada' },
  { city: 'الوادي الجديد', region: 'الخارجة - الوادي الجديد', country: 'مصر', latitude: 25.4390, longitude: 30.5586, apiCity: 'Kharga' },
  { city: 'شمال سيناء', region: 'العريش - شمال سيناء', country: 'مصر', latitude: 31.1321, longitude: 33.8033, apiCity: 'Arish' },
  { city: 'جنوب سيناء', region: 'شرم الشيخ - جنوب سيناء', country: 'مصر', latitude: 27.9158, longitude: 34.3300, apiCity: 'Sharm El Sheikh' },
];

export const ARAB_HOLY_CITIES: LocationInfo[] = [
  { city: 'مكة المكرمة', region: 'مكة', country: 'السعودية', latitude: 21.4225, longitude: 39.8262 },
  { city: 'المدينة المنورة', region: 'المدينة', country: 'السعودية', latitude: 24.5247, longitude: 39.5692 },
  { city: 'القدس الشريف', region: 'القدس', country: 'فلسطين', latitude: 31.7683, longitude: 35.2137 },
  { city: 'الرياض', region: 'الرياض', country: 'السعودية', latitude: 24.7136, longitude: 46.6753 },
];

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestGovernorate(lat: number, lon: number): LocationInfo {
  let closest = EGYPT_GOVERNORATES[0];
  let minDist = Infinity;

  for (const gov of EGYPT_GOVERNORATES) {
    const d = haversineDistanceKm(lat, lon, gov.latitude, gov.longitude);
    if (d < minDist) {
      minDist = d;
      closest = gov;
    }
  }

  return closest;
}

/**
 * Online city/markaz/village search via Open-Meteo Geocoding API (Arabic + English, CORS *)
 */
export async function searchOnlineCities(query: string): Promise<LocationInfo[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=12&language=ar&format=json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('تعذر البحث عن المدينة');
  }
  const data = await res.json();
  const results: Array<{
    name: string;
    admin1?: string;
    country?: string;
    country_code?: string;
    latitude: number;
    longitude: number;
  }> = data.results || [];

  // Sort Egypt results first
  const sorted = [...results].sort((a, b) => {
    const aEg = a.country_code === 'EG' ? 0 : 1;
    const bEg = b.country_code === 'EG' ? 0 : 1;
    return aEg - bEg;
  });

  return sorted.map((item) => ({
    city: item.name,
    region: item.admin1 || '',
    country: item.country || 'مصر',
    latitude: item.latitude,
    longitude: item.longitude,
  }));
}

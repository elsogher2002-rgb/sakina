import React, { useState } from 'react';
import { LocationInfo } from '../types';
import { EGYPT_GOVERNORATES, ARAB_HOLY_CITIES, findNearestGovernorate, searchOnlineCities } from '../data/egyptGovernorates';
import { MapPin, Navigation, Search, Check, Loader2 } from 'lucide-react';

interface LocationModalProps {
  currentLocation: LocationInfo;
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: LocationInfo) => void;
  onShowToast: (text: string) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  currentLocation,
  isOpen,
  onClose,
  onSelectLocation,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<LocationInfo[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      onShowToast('خدمة تحديد الموقع الجغرافي غير مدعومة في متصفحك');
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const nearestGov = findNearestGovernorate(lat, lon);

        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ar`
          );
          if (res.ok) {
            const data = await res.json();
            const city = data.city || data.locality || nearestGov.city;
            const region = data.principalSubdivision || nearestGov.region;
            const country = data.countryName || 'مصر';

            const newLoc: LocationInfo = {
              city,
              region,
              country,
              latitude: lat,
              longitude: lon,
              apiCity: nearestGov.apiCity,
              isAutoDetected: true,
            };
            onSelectLocation(newLoc);
            onShowToast(`تم تحديد موقعك: ${city} (أقرب محافظة: ${nearestGov.city})`);
            setIsDetecting(false);
            onClose();
            return;
          }
        } catch {}

        const fallbackLoc: LocationInfo = {
          ...nearestGov,
          latitude: lat,
          longitude: lon,
          isAutoDetected: true,
        };
        onSelectLocation(fallbackLoc);
        onShowToast(`تم تحديد أقرب محافظة تلقائياً: ${nearestGov.city}`);
        setIsDetecting(false);
        onClose();
      },
      (err) => {
        setIsDetecting(false);
        onShowToast('لم نتمكن من الوصول للموقع. اختر محافظتك من القائمة أو ابحث باسم مدينتك');
        console.warn('Geolocation error:', err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleOnlineCitySearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSearchError('مفيش نت، وصل النت وجرب تاني');
      return;
    }

    setIsSearchingOnline(true);
    setSearchError(null);
    try {
      const results = await searchOnlineCities(q);
      setOnlineResults(results);
      if (results.length === 0) {
        setSearchError('لم يتم العثور على مدينة بهذا الاسم، جرب اسماً آخر');
      }
    } catch {
      setSearchError('مفيش نت، وصل النت وجرب تاني');
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const allLocalList = [...EGYPT_GOVERNORATES, ...ARAB_HOLY_CITIES];
  const filteredLocal = allLocalList.filter(
    (l) =>
      !searchQuery.trim() ||
      l.city.includes(searchQuery.trim()) ||
      l.region.includes(searchQuery.trim()) ||
      l.country.includes(searchQuery.trim())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#24211D] rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#E8D5B7]/50 dark:border-white/10 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8D5B7]/30 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7BC0BE]/20 text-[#559B99] dark:text-[#7BC0BE] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
                تحديد المحافظة أو المدينة
              </h3>
              <p className="text-[10px] text-[#4A4A4A]/65 dark:text-[#CFCBC3]/65">
                جميع محافظات مصر الـ 27 ومراكزها + GPS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 hover:bg-[#FFF9EB] dark:hover:bg-[#2D2822] text-sm"
          >
            ✕
          </button>
        </div>

        {/* GPS Button */}
        <div className="mt-3.5">
          <button
            type="button"
            onClick={handleUseGPS}
            disabled={isDetecting}
            className="w-full flex items-center justify-center gap-2 bg-[#7BC0BE] hover:bg-[#67AEA9] text-white py-2.5 px-4 rounded-2xl font-semibold text-xs sm:text-sm shadow-md shadow-[#7BC0BE]/20 active:scale-[0.99] transition-all disabled:opacity-60"
          >
            <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'جاري تحديد موقعك...' : 'حدد مكاني تلقائياً GPS'}</span>
          </button>
        </div>

        {/* Search by city / markaz / village */}
        <form onSubmit={handleOnlineCitySearch} className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#4A4A4A]/50 dark:text-[#CFCBC3]/50 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) {
                  setOnlineResults([]);
                  setSearchError(null);
                }
              }}
              placeholder="ابحث باسم مدينتك أو مركزك (طنطا، الزقازيق...)"
              className="w-full bg-[#FDF8F0] dark:bg-[#1A1815] border border-[#E8D5B7]/60 dark:border-white/10 rounded-2xl py-2.5 pr-9 pl-3 text-xs text-[#4A4A4A] dark:text-[#EED6BD] focus:outline-none focus:ring-2 focus:ring-[#7BC0BE]/50"
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingOnline || !searchQuery.trim()}
            className="px-3.5 py-2.5 rounded-2xl bg-[#6B4A2F] hover:bg-[#5A3E27] text-white text-xs font-bold shrink-0 disabled:opacity-50 flex items-center gap-1"
          >
            {isSearchingOnline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>ابحث بالنت</span>}
          </button>
        </form>

        {searchError && (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl text-center">
            {searchError}
          </p>
        )}

        {/* Results / Governorates List */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 pr-1">
          {onlineResults.length > 0 && (
            <div className="mb-3 space-y-1">
              <span className="text-[11px] font-bold text-[#7BC0BE] px-1 block">
                نتائج البحث المباشر عن المدن والمراكز:
              </span>
              {onlineResults.map((loc, idx) => (
                <button
                  key={`online_${loc.city}_${idx}`}
                  onClick={() => {
                    onSelectLocation(loc);
                    onShowToast(`تم ضبط الموقع على: ${loc.city}`);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl text-right bg-[#FFF9EB] dark:bg-[#1A1815] hover:border-[#7BC0BE] border border-[#E8D5B7]/60 transition-colors"
                >
                  <div>
                    <span className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">{loc.city}</span>
                    <span className="text-xs text-[#4A4A4A]/65 dark:text-[#CFCBC3]/65 mr-1.5">
                      ({loc.region ? `${loc.region}، ` : ''}{loc.country})
                    </span>
                  </div>
                  <MapPin className="w-4 h-4 text-[#7BC0BE]" />
                </button>
              ))}
            </div>
          )}

          <span className="text-[11px] font-bold text-[#6B4A2F]/70 dark:text-[#EED6BD]/70 px-1 block">
            محافظات مصر الـ 27 والمدن المقدسة:
          </span>

          {filteredLocal.map((loc) => {
            const isSelected =
              loc.city === currentLocation.city &&
              Math.abs(loc.latitude - currentLocation.latitude) < 0.05;

            return (
              <button
                key={`${loc.city}_${loc.latitude}`}
                onClick={() => {
                  onSelectLocation(loc);
                  onShowToast(`تم ضبط المحافظة على: ${loc.city}`);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-right transition-colors ${
                  isSelected
                    ? 'bg-[#7BC0BE]/15 text-[#559B99] dark:text-[#7BC0BE] font-bold'
                    : 'hover:bg-[#FFF9EB] dark:hover:bg-[#2D2822] text-[#4A4A4A] dark:text-[#CFCBC3]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{loc.city}</span>
                  <span className="text-xs text-[#4A4A4A]/50 dark:text-[#CFCBC3]/50">
                    ({loc.region}، {loc.country})
                  </span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#7BC0BE]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

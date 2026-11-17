import React, { useState, useEffect, useCallback } from 'react';
import { LocationInfo } from '../types';
import { calculateDistanceToKaaba } from '../utils/qibla';
import { fetchLiveQiblaDirection } from '../utils/prayerApi';
import { OnlineErrorState } from '../components/OnlineErrorState';
import { Compass, MapPin, Navigation, Info, ShieldCheck, Loader2 } from 'lucide-react';

interface QiblaScreenProps {
  location: LocationInfo;
  onShowToast: (text: string) => void;
  onlineRefreshTick: number;
}

export const QiblaScreen: React.FC<QiblaScreenProps> = ({
  location,
  onShowToast,
  onlineRefreshTick,
}) => {
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [compassPermissionGranted, setCompassPermissionGranted] = useState<boolean>(false);
  const [showMapView, setShowMapView] = useState<boolean>(false);

  const [liveQiblaAngle, setLiveQiblaAngle] = useState<number | null>(null);
  const [isLoadingQibla, setIsLoadingQibla] = useState<boolean>(true);
  const [qiblaError, setQiblaError] = useState<string | null>(null);

  const loadQibla = useCallback(async () => {
    setIsLoadingQibla(true);
    setQiblaError(null);
    try {
      const deg = await fetchLiveQiblaDirection(location.latitude, location.longitude);
      setLiveQiblaAngle(Math.round(deg));
    } catch (err) {
      setLiveQiblaAngle(null);
      setQiblaError(err instanceof Error ? err.message : 'مفيش نت، وصل النت وجرب تاني');
    } finally {
      setIsLoadingQibla(false);
    }
  }, [location.latitude, location.longitude]);

  useEffect(() => {
    void loadQibla();
  }, [loadQibla, onlineRefreshTick]);

  const qiblaAngle = liveQiblaAngle ?? 136;
  const distanceKm = calculateDistanceToKaaba(location.latitude, location.longitude);
  const relativeQiblaAngle = (qiblaAngle - deviceHeading + 360) % 360;

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading = 0;
      if (
        'webkitCompassHeading' in e &&
        typeof (e as unknown as { webkitCompassHeading: number }).webkitCompassHeading === 'number'
      ) {
        heading = (e as unknown as { webkitCompassHeading: number }).webkitCompassHeading;
      } else if (e.alpha !== null) {
        heading = 360 - e.alpha;
      }
      setDeviceHeading(Math.round(heading));
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  const requestCompassPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission!();
        if (response === 'granted') {
          setCompassPermissionGranted(true);
          onShowToast('تم تفعيل مستشعر البوصلة بنجاح');
        } else {
          onShowToast('تم رفض إذن البوصلة');
        }
      } catch {
        onShowToast('تعذر طلب إذن البوصلة');
      }
    } else {
      setCompassPermissionGranted(true);
      onShowToast('البوصلة مفعلة بالمتصفح');
    }
  };

  if (isLoadingQibla) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#7BC0BE] mx-auto" />
        <p className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
          جاري حساب اتجاه القبلة عبر الإنترنت لمحافظة {location.city}...
        </p>
      </div>
    );
  }

  if (qiblaError || liveQiblaAngle === null) {
    return (
      <OnlineErrorState
        message={qiblaError || 'مفيش نت، وصل النت وجرب تاني'}
        onRetry={() => void loadQibla()}
      />
    );
  }

  const isAlignedWithQibla = Math.abs(relativeQiblaAngle) <= 4 || Math.abs(relativeQiblaAngle - 360) <= 4;

  return (
    <div className="space-y-5 pb-8">
      <div className="p-4 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/50 dark:border-white/5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#7BC0BE]/20 text-[#559B99] dark:text-[#7BC0BE] flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
              اتجاه القبلة الشريفة
            </h2>
            <p className="text-[11px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">
              مباشرة حسب إحداثيات: <span className="font-semibold">{location.city} ({location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°)</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowMapView(!showMapView)}
          className="px-3 py-1.5 rounded-xl bg-[#FFF9EB] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] border border-[#E8D5B7]/60 text-xs font-semibold hover:border-[#7BC0BE] transition-colors"
        >
          {showMapView ? 'عرض البوصلة' : 'عرض الخريطة'}
        </button>
      </div>

      {showMapView ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#7BC0BE]" />
            <span>مسار القبلة المباشر إلى الكعبة المشرفة</span>
          </h3>

          <div className="relative w-full h-64 rounded-2xl bg-[#F7F2EA] dark:bg-[#1A1815] border border-[#E8D5B7] dark:border-white/10 overflow-hidden flex flex-col justify-between p-4">
            <div className="flex items-center justify-between z-10">
              <div className="bg-white dark:bg-[#24211D] px-3 py-1.5 rounded-xl shadow-xs border border-[#E8D5B7]/60 text-xs font-semibold text-[#6B4A2F] dark:text-[#EED6BD] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span>موقعك: {location.city} ({location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°)</span>
              </div>
            </div>

            <div className="my-auto text-center py-4 relative">
              <div className="w-0.5 h-20 border-l-2 border-dashed border-[#7BC0BE] mx-auto relative">
                <Navigation
                  className="w-5 h-5 text-[#7BC0BE] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ transform: `translate(-50%, -50%) rotate(${qiblaAngle}deg)` }}
                />
              </div>
              <span className="text-[11px] font-bold text-[#7BC0BE] bg-white/90 dark:bg-[#24211D]/90 px-2 py-0.5 rounded-full border border-[#7BC0BE]/30">
                المسافة المباشرة: {distanceKm.toLocaleString()} كم
              </span>
            </div>

            <div className="flex items-center justify-between z-10">
              <div className="bg-[#6B4A2F] text-white px-3.5 py-1.5 rounded-xl shadow-xs text-xs font-bold flex items-center gap-1.5">
                <div className="w-3 h-3 bg-amber-400 rounded-xs" />
                <span>المسجد الحرام - مكة المكرمة (21.42° N, 39.82° E)</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#FFF9EB] dark:bg-[#1A1815] text-xs text-[#4A4A4A] dark:text-[#CFCBC3] flex items-center justify-between">
            <span>زاوية الاتجاه من الشمال: <strong className="text-[#6B4A2F] dark:text-[#EED6BD]">{qiblaAngle}°</strong></span>
            <span className="text-[#7BC0BE] font-semibold">{distanceKm} كم إلى الحرم المكي</span>
          </div>
        </div>
      ) : (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/5 shadow-xs flex flex-col items-center text-center">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-4 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border-4 border-[#E8D5B7]/70 dark:border-white/10 flex items-center justify-center shadow-inner transition-transform duration-200"
              style={{ transform: `rotate(${-deviceHeading}deg)` }}
            >
              <span className="absolute top-2 font-bold text-xs text-red-500">N (شمال)</span>
              <span className="absolute bottom-2 font-bold text-xs text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">S (جنوب)</span>
              <span className="absolute right-3 font-bold text-xs text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">E (شرق)</span>
              <span className="absolute left-3 font-bold text-xs text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">W (غرب)</span>

              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <div
                  key={deg}
                  className="absolute w-0.5 h-2 bg-[#E8D5B7] dark:bg-white/20 origin-bottom"
                  style={{ transform: `rotate(${deg}deg) translateY(-120px)` }}
                />
              ))}
            </div>

            <div
              className="relative w-44 h-44 rounded-full flex items-center justify-center transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${relativeQiblaAngle}deg)` }}
            >
              <div className="absolute -top-3 flex flex-col items-center">
                <div className="w-8 h-8 rounded-xl bg-[#6B4A2F] text-amber-300 border-2 border-white dark:border-[#24211D] flex items-center justify-center shadow-md">
                  <div className="w-3.5 h-3.5 bg-amber-400 rounded-xs" />
                </div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[12px] border-b-[#7BC0BE]" />
                <div className="w-1 h-16 bg-[#7BC0BE] rounded-full" />
              </div>

              <div className="absolute -bottom-1 flex flex-col items-center">
                <div className="w-1 h-12 bg-[#E8D5B7] rounded-full" />
              </div>

              <div className="w-6 h-6 rounded-full bg-[#7BC0BE] border-3 border-white dark:border-[#24211D] shadow-md z-10" />
            </div>

            {isAlignedWithQibla && (
              <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-pulse pointer-events-none" />
            )}
          </div>

          {isAlignedWithQibla && (
            <div className="my-2 px-4 py-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5 animate-bounce">
              <ShieldCheck className="w-4 h-4" />
              <span>أنت تواجه القبلة الآن بالضبط!</span>
            </div>
          )}

          <div className="mt-2 text-center space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-[#6B4A2F] dark:text-[#EED6BD] font-cairo">
              اتجاه القبلة من {location.city}: <span className="text-[#7BC0BE]">{qiblaAngle}°</span>
            </h3>
            <p className="text-xs text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">
              المسافة إلى مكة المكرمة: {distanceKm.toLocaleString()} كم
            </p>
          </div>

          {!compassPermissionGranted && (
            <div className="mt-5 w-full max-w-xs">
              <button
                onClick={requestCompassPermission}
                className="w-full py-2.5 px-4 bg-[#7BC0BE] hover:bg-[#67AEA9] text-white font-semibold text-xs rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>تفعيل مستشعر البوصلة على الهاتف</span>
              </button>
            </div>
          )}

          <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 bg-[#FFF9EB] dark:bg-[#1A1815] p-2.5 rounded-2xl max-w-sm">
            <Info className="w-4 h-4 text-[#7BC0BE] shrink-0" />
            <span>
              ضع الهاتف بشكل أفقي مسطح وحركه على شكل رقم 8 لمعايرة البوصلة المغناطيسية بدقة.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

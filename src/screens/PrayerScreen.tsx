import React, { useState, useEffect } from 'react';
import { PrayerSchedule, AppSettings, LocationInfo, AzanSoundOption, AdhanAlertData } from '../types';
import { EGYPT_GOVERNORATES } from '../data/egyptGovernorates';
import { requestNotificationPermission, showLocalNotification } from '../utils/notifications';
import { getMuezzinInfo, playRealAdhan, stopRealAdhan, subscribeAdhanPlayback } from '../utils/sound';
import { OnlineErrorState } from '../components/OnlineErrorState';
import { 
  Bell, 
  BellRing, 
  MapPin, 
  Volume2, 
  VolumeX,
  Settings2, 
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Square,
  Loader2,
  Search
} from 'lucide-react';

interface PrayerScreenProps {
  schedule: PrayerSchedule | null;
  isLoadingPrayer: boolean;
  prayerError: string | null;
  onRetryPrayer: () => void;
  location: LocationInfo;
  onSelectLocation: (loc: LocationInfo) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenLocationModal: () => void;
  onShowToast: (text: string) => void;
  onTriggerAdhanModal?: (alert: AdhanAlertData) => void;
}

export const PrayerScreen: React.FC<PrayerScreenProps> = ({
  schedule,
  isLoadingPrayer,
  prayerError,
  onRetryPrayer,
  location,
  onSelectLocation,
  settings,
  onUpdateSettings,
  onOpenLocationModal,
  onShowToast,
  onTriggerAdhanModal,
}) => {
  const [isTestingAdhan, setIsTestingAdhan] = useState(false);

  useEffect(() => {
    const unsub = subscribeAdhanPlayback((playing) => {
      setIsTestingAdhan(playing);
    });
    return () => unsub();
  }, []);

  const handleTogglePrayer = (prayerKey: string) => {
    const updated = {
      ...settings.prayerAlerts,
      [prayerKey]: !settings.prayerAlerts[prayerKey as keyof typeof settings.prayerAlerts],
    };
    onUpdateSettings({ ...settings, prayerAlerts: updated });
    onShowToast('تم تحديث إعدادات التنبيه');
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      onShowToast('تم تفعيل إذن الإشعارات بنجاح');
    } else {
      onShowToast('لم يتم منح إذن الإشعارات من المتصفح');
    }
  };

  const handleTestAdhan = async () => {
    if (isTestingAdhan) {
      stopRealAdhan();
      onShowToast('تم إيقاف صوت الأذان');
      return;
    }

    const soundId: AzanSoundOption = settings.azanSound === 'silent' ? 'makkah' : settings.azanSound;
    const muezzin = getMuezzinInfo(soundId);

    onShowToast(`جاري تشغيل ${muezzin.label}...`);
    const ok = await playRealAdhan(soundId, {
      onError: (msg) => onShowToast(msg),
    });

    if (ok) {
      showLocalNotification(
        `سَكِينة - تجربة ${muezzin.label}`,
        `مواقيت الصلاة في ${location.city}`,
        '#prayer',
        'silent'
      );
      onTriggerAdhanModal?.({
        title: 'تجربة صوت الأذان الحقيقي',
        prayerName: schedule ? `صلاة ${schedule.nextPrayer.name}` : 'صلاة الظهر',
        prayerTime: schedule ? schedule.nextPrayer.time : '12:00 م',
        locationName: location.city,
        muezzinLabel: muezzin.label,
      });
    }
  };

  const getPrayerIcon = (key: string) => {
    switch (key) {
      case 'fajr':
        return Sunrise;
      case 'sunrise':
      case 'dhuhr':
      case 'asr':
        return Sun;
      case 'maghrib':
        return Sunset;
      case 'isha':
      default:
        return Moon;
    }
  };

  const remainingMinutesText = schedule
    ? Math.max(1, Math.round(schedule.nextPrayer.remainingSeconds / 60))
    : 0;

  return (
    <div className="space-y-5 pb-10">
      {/* Governorate Selector Card (All 27 Egypt Governorates + GPS + City Search) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/10 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold text-[#7BC0BE] block">
              الهيئة العامة المصرية للمساحة (مواقيت حية عبر الإنترنت)
            </span>
            <h2 className="text-base font-bold text-[#6B4A2F] dark:text-[#EED6BD] font-cairo mt-0.5">
              مواقيت الصلاة في {location.city}، {location.region || location.country}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenLocationModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-xs font-bold rounded-2xl transition-all active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>GPS</span>
            </button>
            <button
              onClick={onOpenLocationModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#FFF9EB] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] border border-[#E8D5B7]/60 text-xs font-semibold rounded-2xl hover:border-[#7BC0BE] transition-all"
            >
              <Search className="w-3.5 h-3.5 text-[#7BC0BE]" />
              <span>ابحث باسم مدينتك</span>
            </button>
          </div>
        </div>

        {/* Direct 27-Governorate Select Dropdown */}
        <div className="flex items-center gap-2 pt-1">
          <label htmlFor="prayer-gov-select" className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] shrink-0">
            محافظتك:
          </label>
          <select
            id="prayer-gov-select"
            value={EGYPT_GOVERNORATES.some((g) => g.city === location.city) ? location.city : ''}
            onChange={(e) => {
              const selected = EGYPT_GOVERNORATES.find((g) => g.city === e.target.value);
              if (selected) {
                onSelectLocation(selected);
                onShowToast(`تم تحديث المواقيت لمحافظة ${selected.city}`);
              }
            }}
            className="flex-1 bg-[#FDF8F0] dark:bg-[#1A1815] border border-[#E8D5B7]/70 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-[#6B4A2F] dark:text-[#EED6BD] focus:outline-none focus:ring-2 focus:ring-[#7BC0BE]/50"
          >
            {!EGYPT_GOVERNORATES.some((g) => g.city === location.city) && (
              <option value="">{location.city} ({location.region || location.country})</option>
            )}
            {EGYPT_GOVERNORATES.map((gov) => (
              <option key={gov.city} value={gov.city}>
                {gov.city} - {gov.region}
              </option>
            ))}
          </select>
        </div>

        {schedule && (
          <div className="pt-2 border-t border-[#E8D5B7]/30 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-[#7BC0BE]">
              باقي {remainingMinutesText} دقيقة على {schedule.nextPrayer.name} في {location.city}
            </span>
            <span className="text-[11px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">
              الشروق: {schedule.sunrise} · الغروب: {schedule.sunset || schedule.maghrib}
            </span>
          </div>
        )}
      </div>

      {/* Live Prayer Times or Loading / Error */}
      {isLoadingPrayer ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 text-center space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#7BC0BE] mx-auto" />
          <p className="text-xs font-semibold text-[#6B4A2F] dark:text-[#EED6BD]">
            جاري جلب مواقيت الصلاة المباشرة لمحافظة {location.city}...
          </p>
        </div>
      ) : prayerError || !schedule ? (
        <OnlineErrorState
          message={prayerError || 'مفيش نت، وصل النت وجرب تاني'}
          onRetry={onRetryPrayer}
        />
      ) : (
        <div className="space-y-3">
          {schedule.items.map((item) => {
            const Icon = getPrayerIcon(item.key);
            const isAlertActive = settings.prayerAlerts[item.key as keyof typeof settings.prayerAlerts];
            const isNext = item.isNext;

            return (
              <div
                key={item.key}
                className={`p-4 rounded-3xl flex items-center justify-between transition-all border ${
                  isNext
                    ? 'bg-gradient-to-r from-[#FFF9EB] to-white dark:from-[#24211D] dark:to-[#1A1815] border-[#7BC0BE] shadow-xs'
                    : 'bg-white dark:bg-[#24211D] border-[#E8D5B7]/50 dark:border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                      isNext
                        ? 'bg-[#7BC0BE] text-white shadow-xs'
                        : 'bg-[#FFF9EB] dark:bg-[#1A1815] text-[#7BC0BE]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
                        صلاة {item.name}
                      </h3>
                      {isNext && (
                        <span className="text-[10px] font-bold text-[#7BC0BE] bg-[#7BC0BE]/15 px-2 py-0.5 rounded-full">
                          القادمة
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 font-mono tabular-nums">
                      {item.timeString}
                    </span>
                  </div>
                </div>

                {item.key !== 'sunrise' && (
                  <button
                    onClick={() => handleTogglePrayer(item.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium transition-all ${
                      isAlertActive
                        ? 'bg-[#7BC0BE]/15 text-[#559B99] dark:text-[#7BC0BE] border border-[#7BC0BE]/30'
                        : 'bg-[#FDF8F0] dark:bg-[#1A1815] text-[#4A4A4A]/50 dark:text-[#CFCBC3]/50'
                    }`}
                  >
                    {isAlertActive ? (
                      <BellRing className="w-3.5 h-3.5 text-[#7BC0BE]" />
                    ) : (
                      <Bell className="w-3.5 h-3.5" />
                    )}
                    <span>{isAlertActive ? 'أذان مفعل' : 'صامت'}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Real Muezzin Adhan Notification Preferences */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8D5B7]/30 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-[#7BC0BE]" />
            <h3 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
              إعدادات الأذان والتنبيهات (بصوت مؤذن حقيقي)
            </h3>
          </div>

          <button
            onClick={handleRequestPermission}
            className="text-[11px] font-bold text-[#7BC0BE] hover:underline"
          >
            تفعيل إذن الإشعارات
          </button>
        </div>

        {/* Enable / Disable Adhan Sound in Alerts */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            {settings.azanSound !== 'silent' ? (
              <Volume2 className="w-4 h-4 text-[#7BC0BE]" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-500" />
            )}
            <div>
              <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
                تشغيل صوت الأذان في التنبيهات
              </h4>
              <p className="text-[11px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">
                كل التنبيهات تصدح بصوت الأذان الحقيقي عند تفعيله
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const nextSound: AzanSoundOption = settings.azanSound === 'silent' ? 'makkah' : 'silent';
              onUpdateSettings({ ...settings, azanSound: nextSound });
              if (nextSound === 'silent') stopRealAdhan();
              onShowToast(nextSound === 'silent' ? 'تم كتم صوت الأذان في التنبيهات' : 'تم تفعيل صوت الأذان في التنبيهات');
            }}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              settings.azanSound !== 'silent' ? 'bg-[#7BC0BE]' : 'bg-[#E8D5B7]/60 dark:bg-white/10'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.azanSound !== 'silent' ? 'left-1' : 'right-1'
              }`}
            />
          </button>
        </div>

        {/* Muezzin Selection */}
        <div className="space-y-2 pt-2 border-t border-[#E8D5B7]/25 dark:border-white/5">
          <label className="text-xs font-semibold text-[#6B4A2F] dark:text-[#EED6BD] block">
            اختيار صوت التنبيه (المؤذن):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { id: 'makkah', label: 'أذان الحرم المكي' },
              { id: 'aqsa', label: 'أذان المسجد الأقصى' },
              { id: 'alafasy', label: 'أذان مشاري العفاسي' },
              { id: 'egyptian', label: 'أذان مصري - إذاعة القرآن الكريم' },
            ].map((snd) => (
              <button
                key={snd.id}
                onClick={() => {
                  onUpdateSettings({ ...settings, azanSound: snd.id as AzanSoundOption });
                  onShowToast(`تم اختيار صوت: ${snd.label}`);
                }}
                className={`py-2.5 px-3 rounded-2xl text-xs font-semibold transition-all text-right ${
                  settings.azanSound === snd.id
                    ? 'bg-[#7BC0BE] text-white shadow-xs'
                    : 'bg-[#FFF9EB] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] hover:bg-[#E8D5B7]/40'
                }`}
              >
                {snd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advance Alert */}
        <div className="flex items-center justify-between py-2 border-t border-[#E8D5B7]/25 dark:border-white/5">
          <div>
            <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
              تنبيه قبل الصلاة بـ {settings.alertMinutesBefore} دقائق (تكبير وأذان قصير)
            </h4>
            <p className="text-[11px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">
              يصدر بصوت المؤذن المختار
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {[5, 10, 15].map((m) => (
              <button
                key={m}
                onClick={() => {
                  onUpdateSettings({ ...settings, alertMinutesBefore: m });
                  onShowToast(`التنبيه قبل الصلاة بـ ${m} دقائق`);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-semibold ${
                  settings.alertMinutesBefore === m
                    ? 'bg-[#7BC0BE] text-white'
                    : 'bg-[#FFF9EB] dark:bg-[#1A1815] text-[#4A4A4A]'
                }`}
              >
                {m} د
              </button>
            ))}
          </div>
        </div>

        {/* Morning & Evening Azkar alerts */}
        <div className="flex items-center justify-between py-2 border-t border-[#E8D5B7]/25 dark:border-white/5">
          <div>
            <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
              تنبيه أذكار الصباح والمساء (بصوت أذان خفيف)
            </h4>
            <p className="text-[11px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">
              الصباح (6:00 ص) والمساء (5:00 م)
            </p>
          </div>

          <button
            onClick={() => {
              const newVal = !settings.morningAzkarAlert;
              onUpdateSettings({
                ...settings,
                morningAzkarAlert: newVal,
                eveningAzkarAlert: newVal,
              });
              onShowToast('تم تحديث تنبيه الأذكار');
            }}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              settings.morningAzkarAlert ? 'bg-[#7BC0BE]' : 'bg-[#E8D5B7]/60 dark:bg-white/10'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.morningAzkarAlert ? 'left-1' : 'right-1'
              }`}
            />
          </button>
        </div>

        {/* Test Real Adhan Button */}
        <div className="pt-3 border-t border-[#E8D5B7]/30 dark:border-white/5">
          <button
            onClick={handleTestAdhan}
            className={`w-full py-3.5 font-bold text-xs rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 ${
              isTestingAdhan
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                : 'bg-[#7BC0BE] hover:bg-[#67AEA9] text-white shadow-[#7BC0BE]/20'
            }`}
          >
            {isTestingAdhan ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
            <span>{isTestingAdhan ? 'إيقاف صوت الأذان' : 'جرب صوت الأذان'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import { AdhanAlertData, AppSettings, AzanSoundOption, PrayerSchedule } from '../types';
import { getMuezzinInfo, playRealAdhan, triggerHaptic } from './sound';

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
  return false;
}

export function showLocalNotification(
  title: string,
  body: string,
  targetUrl: string = '/#prayer',
  azanSound: AzanSoundOption = 'makkah',
  options?: { shortDurationMs?: number; lowVolume?: boolean; onError?: (msg: string) => void }
): void {
  if (azanSound !== 'silent') {
    void playRealAdhan(azanSound, options);
  }
  triggerHaptic([300, 150, 300, 150, 500]);

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            vibrate: [300, 150, 300, 150, 500],
            data: { url: targetUrl },
            tag: 'sakina-alert-' + Date.now(),
          } as unknown as NotificationOptions);
        });
      } else {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.svg',
          data: { url: targetUrl },
        });
        notif.onclick = () => {
          window.focus();
          window.location.hash = targetUrl;
          notif.close();
        };
      }
    } catch {}
  }
}

/**
 * Checks live prayer times against current time and triggers real Adhan alerts + modal
 */
export function checkPrayerAlerts(
  schedule: PrayerSchedule | null,
  settings: AppSettings,
  locationName: string,
  onNotifyTriggered?: (title: string, body: string) => void,
  onOpenAdhanModal?: (alert: AdhanAlertData) => void
): void {
  if (!schedule) return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();

  // Check in the first 20 seconds of a minute so a 15s polling interval never misses a minute
  if (currentSeconds > 20) return;

  const storageKey = `sakina_alert_sent_${now.toDateString()}`;
  let sentAlerts: { [key: string]: boolean } = {};
  try {
    const raw = localStorage.getItem(storageKey);
    sentAlerts = raw ? JSON.parse(raw) : {};
  } catch {}

  const muezzinLabel = settings.azanSound === 'silent' ? 'صامت' : getMuezzinInfo(settings.azanSound).label;

  // Check Each Prayer
  schedule.items.forEach((item) => {
    if (item.key === 'sunrise') return;

    const prayerMinutes = item.dateObj.getHours() * 60 + item.dateObj.getMinutes();
    const diff = prayerMinutes - currentMinutes;

    const prayerAllowed = settings.prayerAlerts[item.key as keyof typeof settings.prayerAlerts];
    if (!prayerAllowed) return;

    // 1. Before prayer notification (e.g. 10 minutes before -> short Takbir / Adhan opening)
    if (diff === settings.alertMinutesBefore) {
      const alertId = `${item.key}_before_${settings.alertMinutesBefore}`;
      if (!sentAlerts[alertId]) {
        const title = `سَكِينة - اقتربت صلاة ${item.name} في ${locationName}`;
        const body = `استعد، صلاة ${item.name} بعد ${settings.alertMinutesBefore} دقائق (${item.timeString})`;
        showLocalNotification(title, body, '#prayer', settings.azanSound, { shortDurationMs: 14000 });
        sentAlerts[alertId] = true;
        onNotifyTriggered?.(title, body);
        onOpenAdhanModal?.({
          title,
          prayerName: `اقتربت صلاة ${item.name}`,
          prayerTime: item.timeString,
          locationName,
          muezzinLabel,
          isShortAlert: true,
        });
      }
    }

    // 2. Exact prayer time -> Full real Adhan + Alert Modal
    if (diff === 0) {
      const alertId = `${item.key}_exact`;
      if (!sentAlerts[alertId]) {
        const title = `حان الآن موعد صلاة ${item.name}`;
        const body = `الله أكبر، حان الآن وقت أذان صلاة ${item.name} في ${locationName}`;
        showLocalNotification(title, body, '#prayer', settings.azanSound);
        sentAlerts[alertId] = true;
        onNotifyTriggered?.(title, body);
        onOpenAdhanModal?.({
          title,
          prayerName: `صلاة ${item.name}`,
          prayerTime: item.timeString,
          locationName,
          muezzinLabel,
        });
      }
    }

    // 3. After prayer (5 minutes after) -> gentle short Adhan/Takbir reminder
    if (diff === -5 && settings.afterPrayerAlert) {
      const alertId = `${item.key}_after_5`;
      if (!sentAlerts[alertId]) {
        const title = `سَكِينة - تقبل الله صلاتك`;
        const body = `تقبل الله طاعتكم، لا تنسَ أذكار ما بعد صلاة ${item.name}`;
        showLocalNotification(title, body, '#azkar', settings.azanSound, {
          shortDurationMs: 8000,
          lowVolume: true,
        });
        sentAlerts[alertId] = true;
        onNotifyTriggered?.(title, body);
      }
    }
  });

  // Morning Azkar (6:00 AM) -> soft Adhan opening instead of chime
  if (settings.morningAzkarAlert && now.getHours() === 6 && now.getMinutes() === 0) {
    if (!sentAlerts['morning_azkar']) {
      const title = 'سَكِينة - أذكار الصباح';
      const body = 'أصبحنا وأصبح الملك لله.. حان موعد أذكار الصباح';
      showLocalNotification(title, body, '#azkar', settings.azanSound, {
        shortDurationMs: 10000,
        lowVolume: true,
      });
      sentAlerts['morning_azkar'] = true;
      onNotifyTriggered?.(title, body);
    }
  }

  // Evening Azkar (5:00 PM) -> soft Adhan opening instead of chime
  if (settings.eveningAzkarAlert && now.getHours() === 17 && now.getMinutes() === 0) {
    if (!sentAlerts['evening_azkar']) {
      const title = 'سَكِينة - أذكار المساء';
      const body = 'أمسينا وأمسى الملك لله.. حان موعد أذكار المساء';
      showLocalNotification(title, body, '#azkar', settings.azanSound, {
        shortDurationMs: 10000,
        lowVolume: true,
      });
      sentAlerts['evening_azkar'] = true;
      onNotifyTriggered?.(title, body);
    }
  }

  // Friday Surah Al-Kahf (Friday 9:00 AM)
  if (settings.fridayKahfAlert && now.getDay() === 5 && now.getHours() === 9 && now.getMinutes() === 0) {
    if (!sentAlerts['friday_kahf']) {
      const title = 'سَكِينة - نور ما بين الجمعتين';
      const body = 'اليوم الجمعة، لا تنسَ قراءة سورة الكهف والصلاة على النبي ﷺ';
      showLocalNotification(title, body, '#quran', settings.azanSound, {
        shortDurationMs: 8000,
        lowVolume: true,
      });
      sentAlerts['friday_kahf'] = true;
      onNotifyTriggered?.(title, body);
    }
  }

  // Qiyam Al-Layl (2:30 AM)
  if (settings.qiyamAlert && now.getHours() === 2 && now.getMinutes() === 30) {
    if (!sentAlerts['qiyam_layl']) {
      const title = 'سَكِينة - قيام الليل';
      const body = 'الثلث الأخير من الليل.. ينزل ربنا ويقول: هل من داعٍ فأستجيب له؟';
      showLocalNotification(title, body, '#home', settings.azanSound, {
        shortDurationMs: 8000,
        lowVolume: true,
      });
      sentAlerts['qiyam_layl'] = true;
      onNotifyTriggered?.(title, body);
    }
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(sentAlerts));
  } catch {}
}

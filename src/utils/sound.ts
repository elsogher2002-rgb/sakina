import { AzanSoundOption } from '../types';

/**
 * Sound utilities:
 * - Authentic real-voice Adhan MP3 playback for ALL prayer & Islamic alerts (NO oscillator beeps for Adhan)
 * - Soft Tasbih click & completion chime for Tasbih counter only
 */

export interface MuezzinInfo {
  id: Exclude<AzanSoundOption, 'silent'>;
  label: string;
  subtitle: string;
  url: string;
  fallbackUrl: string;
}

export const MUEZZIN_OPTIONS: MuezzinInfo[] = [
  {
    id: 'makkah',
    label: 'أذان الحرم المكي',
    subtitle: 'المسجد الحرام بمكة المكرمة',
    url: 'https://cdn.jsdelivr.net/gh/abodehq/Athan-MP3@master/Sounds/Athan%20Makkah.mp3',
    fallbackUrl: 'https://cdn.aladhan.com/audio/adhans/a1.mp3',
  },
  {
    id: 'aqsa',
    label: 'أذان المسجد الأقصى',
    subtitle: 'القدس الشريف',
    url: encodeURI('https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Adhan_Al_Aqsa_-_Jerusalem_(أذان_المسجد_الأقصى_-_القدس).mp3'),
    fallbackUrl: 'https://www.islamcan.com/audio/adhan/azan2.mp3',
  },
  {
    id: 'alafasy',
    label: 'أذان مشاري العفاسي',
    subtitle: 'الشيخ مشاري راشد العفاسي',
    url: 'https://cdn.jsdelivr.net/gh/abodehq/Athan-MP3@master/Sounds/Athan%20Mishary%20Alafasi.mp3',
    fallbackUrl: 'https://cdn.aladhan.com/audio/adhans/a4.mp3',
  },
  {
    id: 'egyptian',
    label: 'أذان مصري - إذاعة القرآن',
    subtitle: 'الشيخ محمد رفعت (الإذاعة المصرية)',
    url: 'https://cdn.jsdelivr.net/gh/abodehq/Athan-MP3@master/Sounds/Athan%20Mohammad%20Ref3at.mp3',
    fallbackUrl: 'https://www.islamcan.com/audio/adhan/azan1.mp3',
  },
];

let adhanAudio: HTMLAudioElement | null = null;
let adhanShortTimer: ReturnType<typeof setTimeout> | null = null;
let adhanStatePlaying = false;
const adhanListeners = new Set<(playing: boolean) => void>();

function notifyAdhanListeners() {
  adhanListeners.forEach((cb) => {
    try {
      cb(adhanStatePlaying);
    } catch {}
  });
}

export function subscribeAdhanPlayback(cb: (playing: boolean) => void): () => void {
  adhanListeners.add(cb);
  cb(adhanStatePlaying);
  return () => {
    adhanListeners.delete(cb);
  };
}

export function isAdhanPlaying(): boolean {
  return adhanStatePlaying;
}

export function getMuezzinInfo(soundId: AzanSoundOption): MuezzinInfo {
  return MUEZZIN_OPTIONS.find((m) => m.id === soundId) || MUEZZIN_OPTIONS[0];
}

export function stopRealAdhan(): void {
  if (adhanShortTimer) {
    clearTimeout(adhanShortTimer);
    adhanShortTimer = null;
  }
  if (adhanAudio) {
    try {
      adhanAudio.pause();
      adhanAudio.currentTime = 0;
      adhanAudio.src = '';
    } catch {}
  }
  adhanStatePlaying = false;
  notifyAdhanListeners();
}

export async function playRealAdhan(
  soundId: AzanSoundOption,
  options?: { shortDurationMs?: number; lowVolume?: boolean; onError?: (msg: string) => void }
): Promise<boolean> {
  if (soundId === 'silent') return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    options?.onError?.('مفيش نت لتشغيل صوت الأذان، وصل النت وجرب تاني');
    return false;
  }

  stopRealAdhan();

  const muezzin = getMuezzinInfo(soundId);
  const audio = new Audio();
  audio.preload = 'auto';
  audio.volume = options?.lowVolume ? 0.45 : 1.0;
  adhanAudio = audio;

  const startShortTimerIfNeeded = () => {
    if (options?.shortDurationMs && options.shortDurationMs > 0) {
      adhanShortTimer = setTimeout(() => {
        stopRealAdhan();
      }, options.shortDurationMs);
    }
  };

  audio.onended = () => {
    adhanStatePlaying = false;
    notifyAdhanListeners();
  };

  const tryPlayUrl = async (url: string): Promise<boolean> => {
    audio.src = url;
    audio.load();
    await audio.play();
    adhanStatePlaying = true;
    notifyAdhanListeners();
    startShortTimerIfNeeded();
    return true;
  };

  try {
    return await tryPlayUrl(muezzin.url);
  } catch {
    try {
      return await tryPlayUrl(muezzin.fallbackUrl);
    } catch {
      adhanStatePlaying = false;
      notifyAdhanListeners();
      options?.onError?.('تعذر تشغيل صوت الأذان، تأكد من اتصال الإنترنت أو إذن الصوت في المتصفح');
      return false;
    }
  }
}

// --- Tasbih click & completion soft feedback ---
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playTasbihClick(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  } catch {}
}

export function playSuccessChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.45);
    });
  } catch {}
}

export function triggerHaptic(pattern: number | number[] = 25): void {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}

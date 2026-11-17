/**
 * Sakina - Quran Real MP3 Downloader & Cache Manager
 * Fetches authentic MP3 from mp3quran.net with real byte progress,
 * triggers real browser file download (e.g. "001-الفاتحة.mp3"), and stores in Cache API.
 */

import { getSurahAudioUrl, QURAN_RECITERS } from './quranApi';

export interface DownloadProgress {
  surahNumber: number;
  surahName: string;
  reciterId: string;
  percent: number;
  loadedBytes: number;
  totalBytes: number;
  status: 'downloading' | 'completed' | 'error';
  errorMessage?: string;
}

export interface DownloadedSurah {
  surahNumber: number;
  surahName: string;
  reciterId: string;
  reciterName: string;
  sizeBytes: number;
  sizeMB: string;
  downloadedAt: number;
  audioUrl: string;
}

const CACHE_NAME = 'sakina-quran-audio-v2';
const METADATA_KEY = 'sakina_downloaded_surahs_v2';

const activeControllers: Map<number, AbortController> = new Map();
const activeProgress: Map<number, DownloadProgress> = new Map();
const listeners: Set<() => void> = new Set();
const blobUrlCache: Map<string, string> = new Map();

function notifyListeners() {
  listeners.forEach((callback) => {
    try {
      callback();
    } catch (e) {
      console.error('Error notifying download listener', e);
    }
  });
}

export function subscribeToDownloads(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getActiveProgress(surahNumber: number): DownloadProgress | undefined {
  return activeProgress.get(surahNumber);
}

export function getAllActiveProgress(): DownloadProgress[] {
  return Array.from(activeProgress.values());
}

export function getAllDownloadedSurahs(): DownloadedSurah[] {
  try {
    const raw = localStorage.getItem(METADATA_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DownloadedSurah[];
  } catch (err) {
    console.error('Error reading downloaded surahs metadata', err);
    return [];
  }
}

export function isSurahDownloaded(surahNumber: number, reciterId?: string): boolean {
  const all = getAllDownloadedSurahs();
  if (reciterId) {
    return all.some((item) => item.surahNumber === surahNumber && item.reciterId === reciterId);
  }
  return all.some((item) => item.surahNumber === surahNumber);
}

export function getDownloadedSurah(surahNumber: number): DownloadedSurah | undefined {
  const all = getAllDownloadedSurahs();
  return all.find((item) => item.surahNumber === surahNumber);
}

function saveDownloadedSurah(item: DownloadedSurah) {
  const all = getAllDownloadedSurahs().filter(
    (s) => !(s.surahNumber === item.surahNumber && s.reciterId === item.reciterId)
  );
  all.push(item);
  all.sort((a, b) => a.surahNumber - b.surahNumber);
  try {
    localStorage.setItem(METADATA_KEY, JSON.stringify(all));
  } catch {}
}

export async function deleteDownloadedSurah(surahNumber: number): Promise<boolean> {
  try {
    const all = getAllDownloadedSurahs();
    const items = all.filter((s) => s.surahNumber === surahNumber);
    if (items.length === 0) return true;

    for (const item of items) {
      const cachedBlobKey = `s_${surahNumber}_${item.reciterId}`;
      if (blobUrlCache.has(cachedBlobKey)) {
        URL.revokeObjectURL(blobUrlCache.get(cachedBlobKey)!);
        blobUrlCache.delete(cachedBlobKey);
      }
      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        await cache.delete(item.audioUrl);
      }
    }

    const filtered = all.filter((s) => s.surahNumber !== surahNumber);
    localStorage.setItem(METADATA_KEY, JSON.stringify(filtered));
    notifyListeners();
    return true;
  } catch (err) {
    console.error('Error deleting downloaded surah', err);
    return false;
  }
}

export function getTotalDownloadedSizeMB(): string {
  const all = getAllDownloadedSurahs();
  const totalBytes = all.reduce((sum, item) => sum + (item.sizeBytes || 0), 0);
  return (totalBytes / (1024 * 1024)).toFixed(1);
}

function triggerBrowserFileSave(blob: Blob, fileName: string) {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 10000);
}

/**
 * Fetches real MP3 from mp3quran.net, reports exact % download progress,
 * triggers real browser file save ("001-الفاتحة.mp3"), and stores in Cache API.
 */
export async function startDownloadSurah(
  surahNumber: number,
  surahName: string,
  reciterId: string = 'ar.alafasy'
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }

  if (activeControllers.has(surahNumber)) {
    return false;
  }

  const reciter = QURAN_RECITERS.find((r) => r.id === reciterId) || QURAN_RECITERS[0];
  const audioUrl = getSurahAudioUrl(surahNumber, reciterId);
  const cleanSurahName = surahName.replace(/^سورة\s+/u, '').trim();
  const padded = surahNumber.toString().padStart(3, '0');
  const fileName = `${padded}-${cleanSurahName}.mp3`;

  const controller = new AbortController();
  activeControllers.set(surahNumber, controller);

  activeProgress.set(surahNumber, {
    surahNumber,
    surahName: cleanSurahName,
    reciterId,
    percent: 0,
    loadedBytes: 0,
    totalBytes: 0,
    status: 'downloading',
  });
  notifyListeners();

  try {
    const response = await fetch(audioUrl, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`تعذر تنزيل السورة: كود ${response.status}`);
    }

    const contentLengthHeader = response.headers.get('content-length');
    const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

    let receivedBytes = 0;
    const chunks: BlobPart[] = [];

    if (response.body) {
      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          chunks.push(value);
          receivedBytes += value.length;

          const percent =
            totalBytes > 0
              ? Math.min(99, Math.round((receivedBytes / totalBytes) * 100))
              : Math.min(95, Math.round((receivedBytes / (3 * 1024 * 1024)) * 100));

          activeProgress.set(surahNumber, {
            surahNumber,
            surahName: cleanSurahName,
            reciterId,
            percent,
            loadedBytes: receivedBytes,
            totalBytes: totalBytes || receivedBytes,
            status: 'downloading',
          });
          notifyListeners();
        }
      }
    } else {
      const blob = await response.blob();
      receivedBytes = blob.size;
      chunks.push(await blob.arrayBuffer());
    }

    const combinedBlob = new Blob(chunks, { type: 'audio/mpeg' });
    const sizeBytes = combinedBlob.size;
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);

    // 1. Trigger REAL browser file download to user's device (e.g. "112-الإخلاص.mp3")
    triggerBrowserFileSave(combinedBlob, fileName);

    // 2. Also store in Cache API for instant replay inside "تحميلاتي"
    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cacheResponse = new Response(combinedBlob, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': sizeBytes.toString(),
          },
        });
        await cache.put(audioUrl, cacheResponse);
      } catch {}
    }

    saveDownloadedSurah({
      surahNumber,
      surahName: cleanSurahName,
      reciterId,
      reciterName: reciter.nameAr,
      sizeBytes,
      sizeMB: `${sizeMB} ميجا`,
      downloadedAt: Date.now(),
      audioUrl,
    });

    activeProgress.set(surahNumber, {
      surahNumber,
      surahName: cleanSurahName,
      reciterId,
      percent: 100,
      loadedBytes: sizeBytes,
      totalBytes: sizeBytes,
      status: 'completed',
    });
    notifyListeners();

    setTimeout(() => {
      activeControllers.delete(surahNumber);
      activeProgress.delete(surahNumber);
      notifyListeners();
    }, 1200);

    return true;
  } catch (err: unknown) {
    activeControllers.delete(surahNumber);
    if (err instanceof Error && err.name === 'AbortError') {
      activeProgress.delete(surahNumber);
      notifyListeners();
      return false;
    }

    console.error('Download error for surah', surahNumber, err);
    activeProgress.set(surahNumber, {
      surahNumber,
      surahName: cleanSurahName,
      reciterId,
      percent: 0,
      loadedBytes: 0,
      totalBytes: 0,
      status: 'error',
      errorMessage: 'مفيش نت، وصل النت وجرب تاني',
    });
    notifyListeners();

    setTimeout(() => {
      activeProgress.delete(surahNumber);
      notifyListeners();
    }, 3500);

    return false;
  }
}

export function cancelDownload(surahNumber: number) {
  const controller = activeControllers.get(surahNumber);
  if (controller) {
    controller.abort();
    activeControllers.delete(surahNumber);
  }
  activeProgress.delete(surahNumber);
  notifyListeners();
}

export async function getOfflineAudioUrl(surahNumber: number, reciterId: string = 'ar.alafasy'): Promise<string | null> {
  const cachedKey = `s_${surahNumber}_${reciterId}`;
  if (blobUrlCache.has(cachedKey)) {
    return blobUrlCache.get(cachedKey)!;
  }

  const audioUrl = getSurahAudioUrl(surahNumber, reciterId);

  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const match = await cache.match(audioUrl);

      if (match) {
        const blob = await match.blob();
        const blobUrl = URL.createObjectURL(blob);
        blobUrlCache.set(cachedKey, blobUrl);
        return blobUrl;
      }
    } catch (e) {
      console.warn('Error reading from cache API', e);
    }
  }

  return null;
}

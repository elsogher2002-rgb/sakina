import React, { useState, useEffect } from 'react';
import { 
  getAllDownloadedSurahs, 
  deleteDownloadedSurah, 
  getTotalDownloadedSizeMB, 
  subscribeToDownloads, 
  DownloadedSurah,
  getOfflineAudioUrl
} from '../utils/audioDownloader';
import { 
  DownloadCloud, 
  Trash2, 
  Play, 
  Pause, 
  HardDrive, 
  BookOpen, 
  ArrowRight,
  Headphones,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface DownloadsScreenProps {
  onBack: () => void;
  onNavigateToSurah: (surahNumber: number) => void;
  onPlayAudioStream: (url: string, title: string) => void;
  onStopAudioStream: () => void;
  isPlayingAudio: boolean;
  currentPlayingTitle?: string;
  onShowToast: (msg: string) => void;
}

export const DownloadsScreen: React.FC<DownloadsScreenProps> = ({
  onBack,
  onNavigateToSurah,
  onPlayAudioStream,
  onStopAudioStream,
  isPlayingAudio,
  currentPlayingTitle,
  onShowToast,
}) => {
  const [downloadedList, setDownloadedList] = useState<DownloadedSurah[]>([]);
  const [totalSize, setTotalSize] = useState<string>('0');
  const [loadingAudioSurah, setLoadingAudioSurah] = useState<number | null>(null);

  const refreshList = () => {
    setDownloadedList(getAllDownloadedSurahs());
    setTotalSize(getTotalDownloadedSizeMB());
  };

  useEffect(() => {
    refreshList();
    const unsubscribe = subscribeToDownloads(() => {
      refreshList();
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (surahNumber: number, surahName: string) => {
    const success = await deleteDownloadedSurah(surahNumber);
    if (success) {
      onShowToast(`تم حذف سورة ${surahName} من التخزين لتوفير المساحة`);
      refreshList();
    } else {
      onShowToast('حدث خطأ أثناء الحذف');
    }
  };

  const handlePlayOffline = async (item: DownloadedSurah) => {
    const title = `سورة ${item.surahName} - ${item.reciterName} (أوفلاين)`;
    if (isPlayingAudio && currentPlayingTitle?.includes(item.surahName)) {
      onStopAudioStream();
      return;
    }

    try {
      setLoadingAudioSurah(item.surahNumber);
      const offlineUrl = await getOfflineAudioUrl(item.surahNumber, item.reciterId);
      setLoadingAudioSurah(null);

      if (offlineUrl) {
        onPlayAudioStream(offlineUrl, title);
        onShowToast(`تشغيل أوفلاين: سورة ${item.surahName}`);
      } else {
        // Fallback to item.audioUrl if blob match wasn't direct
        onPlayAudioStream(item.audioUrl, title);
        onShowToast(`تشغيل: سورة ${item.surahName}`);
      }
    } catch {
      setLoadingAudioSurah(null);
      onPlayAudioStream(item.audioUrl, title);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-white dark:bg-[#24211D] p-4 rounded-3xl border border-[#E8D5B7]/60 dark:border-white/5 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-2xl bg-[#FFF9EB] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] hover:bg-[#E8D5B7]/40 transition-colors"
            title="رجوع"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#6B4A2F] dark:text-[#EED6BD] font-cairo flex items-center gap-2">
              <DownloadCloud className="w-5 h-5 text-[#7BC0BE]" />
              <span>تحميلاتي (الاستماع أوفلاين)</span>
            </h1>
            <p className="text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">
              سور القرآن المحفوظة على جهازك للاستماع بدون إنترنت
            </p>
          </div>
        </div>

        {/* Space Usage Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#FFF9EB] dark:bg-[#1A1815] border border-[#E8D5B7]/60 dark:border-white/10 text-xs">
          <HardDrive className="w-3.5 h-3.5 text-[#7BC0BE]" />
          <span className="font-bold text-[#6B4A2F] dark:text-[#EED6BD] font-mono">{totalSize} MB</span>
        </div>
      </div>

      {/* Main Content */}
      {downloadedList.length === 0 ? (
        <div className="bg-white dark:bg-[#24211D] p-8 rounded-3xl border border-[#E8D5B7]/50 dark:border-white/5 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-3xl bg-[#7BC0BE]/15 text-[#7BC0BE] mx-auto flex items-center justify-center">
            <DownloadCloud className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#6B4A2F] dark:text-[#EED6BD] font-cairo">
              لا توجد سور محملة بعد
            </h3>
            <p className="text-xs text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 max-w-sm mx-auto leading-relaxed">
              يمكنك تحميل أي سورة للاستماع إليها في أي وقت وأي مكان حتى لو كنت مسافرًا أو بدون إنترنت 100%.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              <span>الذهاب للمصحف لتحميل السور</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
              {downloadedList.length} سورة محفوظة على الجهاز
            </span>
            <span className="text-[11px] text-[#7BC0BE] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              جاهزة للاستماع أوفلاين
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {downloadedList.map((item) => {
              const isPlayingThis = isPlayingAudio && currentPlayingTitle?.includes(item.surahName);

              return (
                <div
                  key={item.surahNumber}
                  className={`p-4 rounded-3xl bg-white dark:bg-[#24211D] border transition-all ${
                    isPlayingThis
                      ? 'border-[#7BC0BE] shadow-md bg-[#7BC0BE]/5 dark:bg-[#7BC0BE]/10'
                      : 'border-[#E8D5B7]/60 dark:border-white/5 shadow-2xs hover:border-[#7BC0BE]/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Number + Title */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FFF9EB] dark:bg-[#1A1815] border border-[#E8D5B7]/60 dark:border-white/10 flex items-center justify-center font-bold text-xs text-[#6B4A2F] dark:text-[#EED6BD] font-mono shrink-0">
                        {item.surahNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
                            سورة {item.surahName}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#7BC0BE]/15 text-[#559B99] dark:text-[#7BC0BE]">
                            أوفلاين
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 mt-0.5">
                          <span>القارئ: {item.reciterName}</span>
                          <span>·</span>
                          <span className="font-mono text-[10px]">{item.sizeMB}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Play Button */}
                      <button
                        onClick={() => handlePlayOffline(item)}
                        disabled={loadingAudioSurah === item.surahNumber}
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                          isPlayingThis
                            ? 'bg-[#7BC0BE] text-white shadow-xs'
                            : 'bg-[#FFF9EB] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] hover:bg-[#7BC0BE] hover:text-white'
                        }`}
                        title={isPlayingThis ? 'إيقاف' : 'تشغيل السورة أوفلاين'}
                      >
                        {loadingAudioSurah === item.surahNumber ? (
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isPlayingThis ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </button>

                      {/* Open in reader */}
                      <button
                        onClick={() => onNavigateToSurah(item.surahNumber)}
                        className="w-9 h-9 rounded-2xl bg-[#FFF9EB] dark:bg-[#1A1815] text-[#4A4A4A] dark:text-[#CFCBC3] hover:text-[#7BC0BE] flex items-center justify-center hover:bg-[#E8D5B7]/30 transition-colors"
                        title="قراءة في المصحف"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(item.surahNumber, item.surahName)}
                        className="w-9 h-9 rounded-2xl bg-[#FFF9EB] dark:bg-[#1A1815] text-red-500/70 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center transition-colors"
                        title="حذف من الجهاز لتوفير المساحة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick tips footer */}
          <div className="p-4 rounded-3xl bg-[#FFF9EB] dark:bg-[#1A1815] border border-[#E8D5B7]/50 dark:border-white/5 flex items-start gap-3 mt-4 text-xs text-[#6B4A2F] dark:text-[#EED6BD]">
            <Sparkles className="w-4 h-4 text-[#7BC0BE] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              السور المحملة تعمل بشكل كامل حتى لو قفلت شاشة الهاتف أو كنت في وضع الطيران (Airplane Mode).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

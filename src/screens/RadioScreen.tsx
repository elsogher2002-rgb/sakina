import React, { useState, useMemo } from 'react';
import { RadioStation } from '../types';
import { OnlineErrorState } from '../components/OnlineErrorState';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Radio, 
  Sparkles, 
  Loader2, 
  SkipForward, 
  SkipBack, 
  AlertCircle,
  Search
} from 'lucide-react';

interface RadioScreenProps {
  stations: RadioStation[];
  isLoadingStations: boolean;
  stationsError: string | null;
  onRetryStations: () => void;
  currentStation: RadioStation | null;
  isPlaying: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  volume: number;
  onSelectStation: (station: RadioStation) => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onNextStation: () => void;
  onPrevStation: () => void;
  onVolumeChange: (vol: number) => void;
  onShowToast: (text: string) => void;
}

export const RadioScreen: React.FC<RadioScreenProps> = ({
  stations,
  isLoadingStations,
  stationsError,
  onRetryStations,
  currentStation,
  isPlaying,
  isLoading,
  errorMessage,
  volume,
  onSelectStation,
  onTogglePlay,
  onStop,
  onNextStation,
  onPrevStation,
  onVolumeChange,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStations = useMemo(() => {
    if (!searchQuery.trim()) return stations;
    const q = searchQuery.trim().toLowerCase();
    return stations.filter(
      (s) => s.name.toLowerCase().includes(q) || s.reciter.toLowerCase().includes(q)
    );
  }, [stations, searchQuery]);

  if (isLoadingStations) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/10 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#7BC0BE] mx-auto" />
        <p className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
          جاري تحميل إذاعات القرآن الكريم المباشرة من الإنترنت...
        </p>
      </div>
    );
  }

  if (stationsError || stations.length === 0) {
    return (
      <OnlineErrorState
        message={stationsError || 'مفيش نت، وصل النت وجرب تاني'}
        onRetry={onRetryStations}
      />
    );
  }

  const activeStation = currentStation && !currentStation.id.startsWith('quran_')
    ? currentStation
    : stations[0];

  const handleStationClick = (station: RadioStation) => {
    onSelectStation(station);
    onShowToast(`جاري تشغيل: ${station.name}`);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Hero Big Card: Active Radio Station */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-[#FFF9EB] to-[#F7EFE1] dark:from-[#24211D] dark:via-[#1F1C18] dark:to-[#171512] border border-[#E8D5B7]/60 dark:border-white/10 shadow-sm text-center">
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <span className="text-[11px] font-bold text-[#7BC0BE] tracking-wider uppercase flex items-center gap-2 bg-[#7BC0BE]/10 px-3 py-1 rounded-full">
            <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'animate-pulse text-[#7BC0BE]' : ''}`} />
            <span>{isPlaying ? 'يتم التشغيل الآن · بث مباشر' : 'بث حي ومباشر على مدار الساعة'}</span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#6B4A2F] dark:text-[#EED6BD] font-cairo">
          {activeStation.name}
        </h1>

        <p className="text-xs text-[#4A4A4A]/80 dark:text-[#CFCBC3]/80 mt-1.5 max-w-sm mx-auto leading-relaxed">
          {activeStation.reciter}
        </p>

        {/* Live Audio Equalizer Waves Animation */}
        <div className="my-5 flex items-center justify-center gap-1.5 h-8">
          {[12, 24, 32, 18, 28, 14, 26, 20].map((h, i) => (
            <span
              key={i}
              className={`w-1 rounded-full bg-[#7BC0BE] transition-all duration-300 ${
                isPlaying && !isLoading ? 'animate-pulse' : 'opacity-30'
              }`}
              style={{
                height: isPlaying && !isLoading ? `${h}px` : '6px',
                animationDelay: `${i * 120}ms`,
              }}
            />
          ))}
        </div>

        {errorMessage && (
          <div className="mb-4 mx-auto max-w-sm p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Controls Bar */}
        <div className="flex items-center justify-center gap-4 my-2">
          <button
            onClick={onPrevStation}
            className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] border border-[#E8D5B7]/70 dark:border-white/10 flex items-center justify-center hover:bg-[#FFF9EB] active:scale-95 transition-all shadow-2xs"
            title="المحطة السابقة"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={onTogglePlay}
            disabled={isLoading}
            className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all ${
              isPlaying
                ? 'bg-gradient-to-br from-[#7BC0BE] to-[#559B99] text-white shadow-[#7BC0BE]/30 ring-8 ring-[#7BC0BE]/20'
                : 'bg-[#6B4A2F] text-white shadow-[#6B4A2F]/30 hover:bg-[#5A3E27]'
            }`}
            aria-label={isPlaying ? 'إيقاف البث مؤقتاً' : 'تشغيل البث المباشر'}
          >
            {isLoading ? (
              <Loader2 className="w-9 h-9 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-9 h-9 fill-current" />
            ) : (
              <Play className="w-9 h-9 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNextStation}
            className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] border border-[#E8D5B7]/70 dark:border-white/10 flex items-center justify-center hover:bg-[#FFF9EB] active:scale-95 transition-all shadow-2xs"
            title="المحطة التالية"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={onStop}
            className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] hover:text-rose-600 border border-[#E8D5B7]/70 dark:border-white/10 flex items-center justify-center hover:bg-[#FFF9EB] active:scale-95 transition-all shadow-2xs"
            title="إيقاف نهائي"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        </div>

        <p className="text-xs font-semibold mt-3 text-[#7BC0BE]">
          {isLoading
            ? 'جاري الاتصال بالسيرفر وتحميل البث المباشر...'
            : isPlaying
            ? 'يتم التشغيل الآن بأعلى جودة نقية'
            : 'اضغط تشغيل للاستماع'}
        </p>

        {/* Volume Slider Bar */}
        <div className="mt-5 max-w-xs mx-auto flex items-center gap-3 bg-white/90 dark:bg-[#1A1815]/90 px-4 py-2.5 rounded-2xl border border-[#E8D5B7]/50 dark:border-white/10 shadow-xs">
          <button
            onClick={() => onVolumeChange(volume === 0 ? 0.85 : 0)}
            className="text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 hover:text-[#7BC0BE]"
            title={volume === 0 ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
          >
            {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-[#7BC0BE] cursor-pointer h-1.5 rounded-lg"
            aria-label="مستوى الصوت"
          />

          <span className="text-[11px] font-mono text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 tabular-nums">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Stations Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#4A4A4A]/50 dark:text-[#CFCBC3]/50 absolute right-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`ابحث بين ${stations.length} إذاعة قرآنية حية (القاهرة، العفاسي، الحصري، المنشاوي...)`}
          className="w-full bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/10 rounded-2xl py-3 pr-11 pl-4 text-xs sm:text-sm text-[#4A4A4A] dark:text-[#EED6BD] focus:outline-none focus:ring-2 focus:ring-[#7BC0BE]/50 shadow-2xs"
        />
      </div>

      {/* Stations List */}
      <div>
        <h3 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD] mb-3 px-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#7BC0BE]" />
          <span>قائمة الإذاعات القرآنية الحية ({filteredStations.length} إذاعة):</span>
        </h3>

        <div className="space-y-2.5">
          {filteredStations.map((station) => {
            const isSelected = activeStation.id === station.id;

            return (
              <div
                key={station.id}
                onClick={() => handleStationClick(station)}
                className={`p-4 rounded-3xl transition-all cursor-pointer flex items-center justify-between border select-none active:scale-[0.99] ${
                  isSelected
                    ? 'bg-white dark:bg-[#24211D] border-[#7BC0BE] shadow-xs'
                    : 'bg-white/80 dark:bg-[#24211D]/80 border-[#E8D5B7]/50 dark:border-white/5 hover:border-[#7BC0BE]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                      isSelected && isPlaying
                        ? 'bg-[#7BC0BE] text-white shadow-xs'
                        : isSelected
                        ? 'bg-[#7BC0BE]/20 text-[#559B99] dark:text-[#7BC0BE]'
                        : 'bg-[#FFF9EB] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD]'
                    }`}
                  >
                    {isSelected && isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[#7BC0BE]" />
                    ) : isSelected && isPlaying ? (
                      <Radio className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Play className="w-5 h-5 translate-x-0.5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD] truncate">
                      {station.name}
                    </h4>
                    <p className="text-xs text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 mt-0.5 truncate">
                      {station.reciter}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-[11px] font-bold text-[#7BC0BE] px-2.5 py-1 rounded-full bg-[#7BC0BE]/10 shrink-0">
                    {isLoading ? 'جاري الاتصال...' : isPlaying ? 'يتم التشغيل الآن' : 'محدد'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Play, Pause, Square, Volume2, VolumeX, SkipForward, Radio, Loader2 } from 'lucide-react';
import { RadioStation } from '../types';

interface MiniPlayerBarProps {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  currentTime?: number;
  duration?: number;
  onSeek?: (seconds: number) => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onVolumeChange: (vol: number) => void;
  onNextStation: () => void;
  onOpenRadioTab: () => void;
}

function formatAudioTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '00:00';
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const MiniPlayerBar: React.FC<MiniPlayerBarProps> = ({
  currentStation,
  isPlaying,
  isLoading,
  volume,
  currentTime = 0,
  duration = 0,
  onSeek,
  onTogglePlay,
  onStop,
  onVolumeChange,
  onNextStation,
  onOpenRadioTab,
}) => {
  if (!currentStation && !isPlaying && !isLoading) return null;

  const stationName = currentStation?.name || 'إذاعة القرآن الكريم';
  const isQuranTrack = currentStation?.id.startsWith('quran_') && duration > 0 && isFinite(duration);

  return (
    <div className="fixed bottom-[68px] left-0 right-0 z-30 px-3 py-1 pointer-events-none transition-all duration-300">
      <div className="max-w-md mx-auto bg-white/95 dark:bg-[#24211D]/95 backdrop-blur-md rounded-2xl p-2.5 shadow-lg shadow-black/10 border border-[#E8D5B7]/70 dark:border-white/10 pointer-events-auto space-y-1.5 animate-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-center justify-between gap-2.5">
          {/* Station / Surah info */}
          <div
            onClick={onOpenRadioTab}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7BC0BE] to-[#559B99] text-white flex items-center justify-center shrink-0 shadow-xs">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <div className="flex items-end gap-0.5 h-3.5">
                  <span className="w-1 bg-white rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 bg-white rounded-full animate-bounce h-3.5" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 bg-white rounded-full animate-bounce h-2.5" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <Radio className="w-4 h-4" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] leading-snug">
                {stationName}
              </h4>
              <p className="text-[10px] text-[#7BC0BE] font-medium mt-0.5 leading-snug">
                {isLoading ? 'جاري التحميل والاتصال...' : isPlaying ? 'يتم التشغيل الآن' : 'متوقف مؤقتاً'}
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onVolumeChange(volume === 0 ? 0.85 : 0)}
              className="p-1.5 rounded-lg text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 hover:text-[#6B4A2F] dark:hover:text-[#EED6BD] transition-colors"
              title={volume === 0 ? 'إلغاء الكتم' : 'كتم'}
            >
              {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {!currentStation?.id.startsWith('quran_') && (
              <button
                onClick={onNextStation}
                className="p-1.5 rounded-lg text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 hover:text-[#6B4A2F] dark:hover:text-[#EED6BD] transition-colors"
                title="المحطة التالية"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onStop}
              className="p-1.5 rounded-lg text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 hover:text-rose-500 transition-colors"
              title="إيقاف نهائي"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>

            <button
              onClick={onTogglePlay}
              disabled={isLoading}
              className="w-8 h-8 rounded-xl bg-[#7BC0BE] hover:bg-[#67AEA9] text-white flex items-center justify-center shadow-xs active:scale-95 transition-all disabled:opacity-50"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Audio Seek Progress Bar when playing a Surah */}
        {isQuranTrack && onSeek && (
          <div className="flex items-center gap-2 px-1 pt-0.5">
            <span className="text-[10px] font-mono text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 tabular-nums">
              {formatAudioTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration}
              step={1}
              value={Math.min(currentTime, duration)}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="flex-1 accent-[#7BC0BE] h-1 cursor-pointer rounded-lg"
              aria-label="تقدم التلاوة"
            />
            <span className="text-[10px] font-mono text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 tabular-nums">
              {formatAudioTime(duration)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

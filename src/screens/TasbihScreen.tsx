import React, { useState, useEffect } from 'react';
import { UserStats } from '../types';
import { playTasbihClick, playSuccessChime, triggerHaptic } from '../utils/sound';
import confetti from 'canvas-confetti';
import { 
  RotateCcw, 
  Vibrate, 
  Volume2, 
  VolumeX, 
  Target, 
  Sparkles,
  Plus,
  X,
  Check
} from 'lucide-react';

interface TasbihScreenProps {
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  onShowToast: (text: string) => void;
}

const DEFAULT_PRESET_PHRASES = [
  'سُبْحَانَ اللَّهِ',
  'الْحَمْدُ لِلَّهِ',
  'اللَّهُ أَكْبَرُ',
  'لَا إِلَهَ إِلَّا اللَّهُ',
  'أَسْتَغْفِرُ اللَّهَ',
  'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
  'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ',
  'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
];

const PHRASE_COUNTS_KEY = 'sakina_tasbih_counts_by_phrase_v2';
const CUSTOM_PHRASES_KEY = 'sakina_custom_tasbih_phrases';

export const TasbihScreen: React.FC<TasbihScreenProps> = ({
  stats,
  onUpdateStats,
  onShowToast,
}) => {
  // Custom phrases list
  const [customPhrases, setCustomPhrases] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PHRASES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allPhrases = [...DEFAULT_PRESET_PHRASES, ...customPhrases];

  const [selectedPhrase, setSelectedPhrase] = useState<string>(() => {
    return localStorage.getItem('sakina_last_selected_phrase') || DEFAULT_PRESET_PHRASES[0];
  });

  // Load counts by phrase
  const [countsByPhrase, setCountsByPhrase] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(PHRASE_COUNTS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const count = countsByPhrase[selectedPhrase] || 0;

  const [targetCount, setTargetCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sakina_tasbih_target_count');
      return saved !== null ? parseInt(saved, 10) : 33;
    } catch {
      return 33;
    }
  }); // 33, 100, 0 (free mode)
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sakina_tasbih_daily_goal');
      return saved ? parseInt(saved, 10) : 1000;
    } catch {
      return 1000;
    }
  });
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sakina_tasbih_vibration');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sakina_tasbih_sound');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [isTapped, setIsTapped] = useState<boolean>(false);
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [customInputText, setCustomInputText] = useState<string>('');

  // Sync device preferences and current phrase/count to localStorage automatically
  useEffect(() => {
    try {
      localStorage.setItem('sakina_last_selected_phrase', selectedPhrase);
      localStorage.setItem('sakina_current_tasbih_count', count.toString());
    } catch {}
  }, [selectedPhrase, count]);

  useEffect(() => {
    try {
      localStorage.setItem('sakina_tasbih_target_count', targetCount.toString());
    } catch {}
  }, [targetCount]);

  useEffect(() => {
    try {
      localStorage.setItem('sakina_tasbih_vibration', String(vibrationEnabled));
    } catch {}
  }, [vibrationEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('sakina_tasbih_sound', String(soundEnabled));
    } catch {}
  }, [soundEnabled]);

  // Persist counts
  const updateCurrentCount = (newCount: number) => {
    setCountsByPhrase((prev) => {
      const updated = { ...prev, [selectedPhrase]: newCount };
      try {
        localStorage.setItem(PHRASE_COUNTS_KEY, JSON.stringify(updated));
        localStorage.setItem('sakina_current_tasbih_count', newCount.toString());
      } catch {}
      return updated;
    });
  };

  const handlePhraseSelect = (phrase: string) => {
    setSelectedPhrase(phrase);
    try {
      localStorage.setItem('sakina_last_selected_phrase', phrase);
    } catch {}
    const existing = countsByPhrase[phrase] || 0;
    onShowToast(`تم اختيار: ${phrase} (سجلّك: ${existing})`);
  };

  const handleTasbihTap = () => {
    if (soundEnabled) playTasbihClick();
    if (vibrationEnabled) triggerHaptic(25);

    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 180);

    const nextCount = count + 1;
    updateCurrentCount(nextCount);

    // Update global user statistics
    const todayStr = new Date().toDateString();
    const currentTodayCount = (stats.todayTasbihCount || 0) + 1;
    const currentTotalCount = (stats.totalTasbihCount || 0) + 1;
    const bestDay = Math.max(stats.bestTasbihDay || 0, currentTodayCount);

    const updatedHistory = {
      ...(stats.dailyTasbihHistory || {}),
      [todayStr]: currentTodayCount,
    };

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const nextStreakDays =
      stats.lastActiveDate === todayStr
        ? Math.max(1, stats.streakDays || 1)
        : stats.lastActiveDate === yesterday.toDateString()
        ? (stats.streakDays || 0) + 1
        : 1;

    onUpdateStats({
      ...stats,
      streakDays: nextStreakDays,
      lastActiveDate: todayStr,
      todayTasbihCount: currentTodayCount,
      totalTasbihCount: currentTotalCount,
      bestTasbihDay: bestDay,
      dailyTasbihHistory: updatedHistory,
    });

    // Milestone celebration (if target is active)
    if (targetCount > 0 && nextCount % targetCount === 0) {
      if (soundEnabled) playSuccessChime();
      if (vibrationEnabled) triggerHaptic([50, 60, 70]);

      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#7BC0BE', '#E8D5B7', '#559B99'],
      });

      onShowToast(`ما شاء الله! أتممت دورة ${targetCount} تسبيحة`);
    }
  };

  const handleResetCurrent = () => {
    updateCurrentCount(0);
    onShowToast(`تم تصفير عداد: ${selectedPhrase}`);
  };

  const handleAddCustomPhrase = () => {
    const trimmed = customInputText.trim();
    if (!trimmed) return;
    if (allPhrases.includes(trimmed)) {
      setSelectedPhrase(trimmed);
      setShowAddCustomModal(false);
      setCustomInputText('');
      return;
    }

    const updated = [...customPhrases, trimmed];
    setCustomPhrases(updated);
    try {
      localStorage.setItem(CUSTOM_PHRASES_KEY, JSON.stringify(updated));
    } catch {}

    setSelectedPhrase(trimmed);
    setShowAddCustomModal(false);
    setCustomInputText('');
    onShowToast(`تمت إضافة الذكر المخصص: "${trimmed}"`);
  };

  const todayProgressPercent = Math.min(100, Math.round(((stats.todayTasbihCount || 0) / dailyGoal) * 100));

  return (
    <div className="space-y-4 pb-12">
      {/* Preset Phrases Horizontal Scroller */}
      <div className="p-3.5 bg-white dark:bg-[#24211D] rounded-3xl border border-[#E8D5B7]/50 dark:border-white/5 shadow-2xs">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-bold text-[#7BC0BE]">
            اختر الذكر (يحفظ عداد كل ذكر بشكل مستقل):
          </span>
          <button
            onClick={() => setShowAddCustomModal(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#6B4A2F] dark:text-[#EED6BD] hover:text-[#7BC0BE] bg-[#FFF9EB] dark:bg-[#1A1815] px-2.5 py-1 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ذكر مخصص</span>
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {allPhrases.map((phrase) => {
            const isSelected = selectedPhrase === phrase;
            const phraseCount = countsByPhrase[phrase] || 0;

            return (
              <button
                key={phrase}
                onClick={() => handlePhraseSelect(phrase)}
                className={`whitespace-nowrap px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all shrink-0 active:scale-95 flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#7BC0BE] text-white shadow-xs'
                    : 'bg-[#FFF9EB] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] hover:bg-[#E8D5B7]/40'
                }`}
              >
                <span>{phrase}</span>
                {phraseCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-[#7BC0BE]/20 text-[#559B99] dark:text-[#7BC0BE]'
                    }`}
                  >
                    {phraseCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target & Toggles Bar */}
      <div className="flex items-center justify-between gap-2 p-3.5 bg-white dark:bg-[#24211D] rounded-3xl border border-[#E8D5B7]/50 dark:border-white/5 shadow-2xs">
        {/* Targets: 33 / 100 / Free mode */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">الهدف:</span>
          {[
            { label: '33', val: 33 },
            { label: '100', val: 100 },
            { label: 'السبحة الحرة', val: 0 },
          ].map((t) => (
            <button
              key={t.val}
              onClick={() => {
                setTargetCount(t.val);
                onShowToast(t.val === 0 ? 'تم تفعيل السبحة الحرة بدون هدف' : `الهدف المحدد: ${t.val}`);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                targetCount === t.val
                  ? 'bg-[#7BC0BE] text-white shadow-2xs'
                  : 'bg-[#FFF9EB] dark:bg-[#1A1815] text-[#4A4A4A] dark:text-[#CFCBC3]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setVibrationEnabled(!vibrationEnabled)}
            className={`p-2 rounded-xl transition-colors ${
              vibrationEnabled
                ? 'bg-[#7BC0BE]/20 text-[#559B99] dark:text-[#7BC0BE]'
                : 'text-[#4A4A4A]/40 hover:bg-black/5'
            }`}
            title="الاهتزاز"
          >
            <Vibrate className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl transition-colors ${
              soundEnabled
                ? 'bg-[#7BC0BE]/20 text-[#559B99] dark:text-[#7BC0BE]'
                : 'text-[#4A4A4A]/40 hover:bg-black/5'
            }`}
            title="صوت النقر"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={handleResetCurrent}
            className="p-2 rounded-xl text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            title="تصفير عداد هذا الذكر"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Big Central Interactive Tasbih Bead Ring */}
      <div className="flex flex-col items-center justify-center py-4">
        <button
          onClick={handleTasbihTap}
          className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-gradient-to-br from-white via-[#FFF9EB] to-[#F3E7D3] dark:from-[#24211D] dark:via-[#1F1C18] dark:to-[#171512] border-8 border-[#7BC0BE]/35 shadow-xl flex flex-col items-center justify-center cursor-pointer select-none transition-transform active:scale-95 duration-150 group ${
            isTapped ? 'ring-8 ring-[#7BC0BE]/30 scale-[0.98]' : ''
          }`}
          aria-label="اضغط للتسبيح"
        >
          {/* Subtle Outer SVG ring progress */}
          {targetCount > 0 && (() => {
            const radius = 46;
            const circumference = 2 * Math.PI * radius;
            const remainder = count % targetCount;
            const progressRatio = count > 0 && remainder === 0 ? 1 : remainder / targetCount;
            const dashOffset = circumference * (1 - progressRatio);
            return (
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-[#7BC0BE] transition-all duration-200"
                  strokeWidth="3.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            );
          })()}

          {/* Current Phrase */}
          <span className="text-xs sm:text-sm font-bold text-[#7BC0BE] max-w-[210px] text-center px-3 font-cairo leading-relaxed">
            {selectedPhrase}
          </span>

          {/* Big Counter */}
          <span className="text-5xl sm:text-6xl font-extrabold font-mono text-[#6B4A2F] dark:text-[#EED6BD] tabular-nums my-1">
            {count}
          </span>

          {/* Sub Target info */}
          <span className="text-xs text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 font-mono">
            {targetCount > 0 ? `الهدف: ${targetCount}` : 'السبحة الحرة'}
          </span>

          {/* Gentle Hint */}
          <span className="mt-2 text-[10px] text-[#4A4A4A]/40 dark:text-[#CFCBC3]/40">
            المس الدائرة للتسبيح
          </span>
        </button>
      </div>

      {/* Daily Goal & Progress */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/5 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#7BC0BE]" />
            <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
              الهدف اليومي العام: {stats.todayTasbihCount || 0} / {dailyGoal}
            </h4>
          </div>
          <span className="text-xs font-bold text-[#7BC0BE] font-mono">
            {todayProgressPercent}%
          </span>
        </div>

        {/* Bar */}
        <div className="w-full h-2.5 rounded-full bg-[#E8D5B7]/30 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#7BC0BE] to-[#559B99] rounded-full transition-all duration-300"
            style={{ width: `${todayProgressPercent}%` }}
          />
        </div>

        {/* Change Goal options */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">
          <span>تعديل الهدف اليومي:</span>
          <div className="flex items-center gap-1.5">
            {[500, 1000, 3000].map((g) => (
              <button
                key={g}
                onClick={() => {
                  setDailyGoal(g);
                  localStorage.setItem('sakina_tasbih_daily_goal', g.toString());
                  onShowToast(`تم تعديل الهدف اليومي إلى ${g} تسبيحة`);
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-colors ${
                  dailyGoal === g
                    ? 'bg-[#7BC0BE] text-white font-bold'
                    : 'bg-[#FFF9EB] dark:bg-[#1A1815] text-[#4A4A4A]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/50 dark:border-white/5 text-center shadow-2xs">
          <span className="text-[10px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 block">
            تسبيحات اليوم
          </span>
          <span className="text-lg font-bold font-mono text-[#7BC0BE] tabular-nums">
            {(stats.todayTasbihCount || 0).toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/50 dark:border-white/5 text-center shadow-2xs">
          <span className="text-[10px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 block">
            المجموع الكلي
          </span>
          <span className="text-lg font-bold font-mono text-[#6B4A2F] dark:text-[#EED6BD] tabular-nums">
            {(stats.totalTasbihCount || 0).toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/50 dark:border-white/5 text-center shadow-2xs">
          <span className="text-[10px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 block">
            أفضل يوم
          </span>
          <span className="text-lg font-bold font-mono text-[#6B4A2F] dark:text-[#EED6BD] tabular-nums">
            {(stats.bestTasbihDay || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Add Custom Phrase Modal */}
      {showAddCustomModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowAddCustomModal(false)}
        >
          <div
            className="bg-white dark:bg-[#24211D] w-full max-w-sm rounded-3xl p-5 border border-[#E8D5B7] dark:border-white/10 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E8D5B7]/40 dark:border-white/10">
              <h3 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">إضافة ذكر مخصص</h3>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="p-1 rounded-full hover:bg-black/5"
              >
                <X className="w-4 h-4 text-[#4A4A4A]" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#7BC0BE] font-semibold block">اكتب الذكر أو الدعاء:</label>
              <input
                type="text"
                value={customInputText}
                onChange={(e) => setCustomInputText(e.target.value)}
                placeholder="مثال: رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ..."
                className="w-full bg-[#FFF9EB] dark:bg-[#1A1815] border border-[#E8D5B7] dark:border-white/10 rounded-2xl p-3 text-xs text-[#4A4A4A] dark:text-[#EED6BD] focus:outline-none focus:ring-2 focus:ring-[#7BC0BE]"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-[#4A4A4A] hover:bg-black/5"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddCustomPhrase}
                disabled={!customInputText.trim()}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>إضافة وبدء التسبيح</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

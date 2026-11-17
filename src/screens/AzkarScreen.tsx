import React, { useState, useEffect, useCallback } from 'react';
import { ZikrCategory, ZikrItem } from '../types';
import { fetchLiveAzkarCategories } from '../utils/contentApi';
import { playTasbihClick, playSuccessChime, triggerHaptic } from '../utils/sound';
import { OnlineErrorState } from '../components/OnlineErrorState';
import confetti from 'canvas-confetti';
import { 
  Sun, 
  Moon, 
  BedDouble, 
  Sparkles, 
  Sunrise, 
  Shield, 
  HeartHandshake, 
  Check, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight,
  Share2,
  Copy,
  Volume2,
  Search,
  Home,
  Compass,
  Utensils,
  Plane,
  HeartPulse,
  Droplets,
  Loader2
} from 'lucide-react';

interface AzkarScreenProps {
  onShowToast: (text: string) => void;
  onZikrFinished?: () => void;
  onlineRefreshTick: number;
}

export const AzkarScreen: React.FC<AzkarScreenProps> = ({
  onShowToast,
  onZikrFinished,
  onlineRefreshTick,
}) => {
  const [categories, setCategories] = useState<ZikrCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [itemProgress, setItemProgress] = useState<{ [itemId: string]: number }>(() => {
    try {
      const saved = localStorage.getItem('sakina_azkar_progress_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sakina_azkar_font_size');
      return saved ? parseInt(saved, 10) : 18;
    } catch {
      return 18;
    }
  });
  const [speakingItemId, setSpeakingItemId] = useState<string | null>(null);

  const loadAzkar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await fetchLiveAzkarCategories();
      setCategories(list);
    } catch (err) {
      setCategories([]);
      setError(err instanceof Error ? err.message : 'مفيش نت، وصل النت وجرب تاني');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAzkar();
  }, [loadAzkar, onlineRefreshTick]);

  const selectedCategory: ZikrCategory | undefined = categories.find(
    (c) => c.id === selectedCategoryId
  );

  useEffect(() => {
    try {
      localStorage.setItem('sakina_azkar_progress_v1', JSON.stringify(itemProgress));
    } catch {}
  }, [itemProgress]);

  useEffect(() => {
    try {
      localStorage.setItem('sakina_azkar_font_size', fontSizeLevel.toString());
    } catch {}
  }, [fontSizeLevel]);

  if (isLoading) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#7BC0BE] mx-auto" />
        <p className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
          جاري جلب الأذكار والأدعية من الإنترنت...
        </p>
      </div>
    );
  }

  if (error || categories.length === 0) {
    return (
      <OnlineErrorState
        message={error || 'مفيش نت، وصل النت وجرب تاني'}
        onRetry={() => void loadAzkar()}
      />
    );
  }

  const handleCategorySelect = (catId: string) => {
    setSelectedCategoryId(catId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIncrement = (item: ZikrItem, index: number) => {
    const currentCount = itemProgress[item.id] || 0;
    if (currentCount >= item.count) return;

    playTasbihClick();
    triggerHaptic(20);

    const nextCount = currentCount + 1;

    setItemProgress((prev) => ({
      ...prev,
      [item.id]: nextCount,
    }));

    if (nextCount >= item.count) {
      playSuccessChime();
      triggerHaptic([30, 40, 50]);

      if (selectedCategory && index < selectedCategory.items.length - 1) {
        setTimeout(() => {
          const nextEl = document.getElementById(`zikr-card-${index + 1}`);
          if (nextEl) {
            nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 350);
      } else if (selectedCategory && index === selectedCategory.items.length - 1) {
        handleFinishCategory();
      }
    }
  };

  const handleDecrement = (item: ZikrItem) => {
    const current = itemProgress[item.id] || 0;
    if (current > 0) {
      setItemProgress((prev) => ({
        ...prev,
        [item.id]: current - 1,
      }));
      triggerHaptic(15);
    }
  };

  const handleResetCategory = () => {
    if (!selectedCategory) return;
    const cleared: { [key: string]: number } = { ...itemProgress };
    selectedCategory.items.forEach((it) => {
      delete cleared[it.id];
    });
    setItemProgress(cleared);
    onShowToast('تمت إعادة العدادات من البداية');
  };

  const handleFinishCategory = () => {
    playSuccessChime();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7BC0BE', '#E8D5B7', '#559B99'],
    });
    onShowToast('هنيئاً لك! تقبل الله أذكارك وأثابك خيراً');
    onZikrFinished?.();
  };

  const handleCopyZikr = async (text: string, reference?: string) => {
    const fullText = reference ? `${text}\n[${reference}]\nعبر تطبيق سَكِينة` : `${text}\nعبر تطبيق سَكِينة`;
    try {
      await navigator.clipboard.writeText(fullText);
      onShowToast('تم نسخ الذكر بنجاح');
    } catch {
      onShowToast('فشل النسخ تلقائياً');
    }
  };

  const handleShareZikr = async (text: string, reference?: string) => {
    const fullText = reference ? `${text}\n[${reference}]\nعبر تطبيق سَكِينة` : `${text}\nعبر تطبيق سَكِينة`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'أذكار من سَكِينة',
          text: fullText,
        });
      } catch {}
    } else {
      handleCopyZikr(text, reference);
    }
  };

  const handleSpeakZikr = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      onShowToast('خاصية النطق غير مدعومة في المتصفح');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;

      utterance.onstart = () => setSpeakingItemId(id);
      utterance.onend = () => setSpeakingItemId(null);
      utterance.onerror = () => setSpeakingItemId(null);

      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeakingItemId(null);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sun':
        return Sun;
      case 'Moon':
        return Moon;
      case 'BedDouble':
        return BedDouble;
      case 'Sunrise':
        return Sunrise;
      case 'Shield':
        return Shield;
      case 'HeartHandshake':
        return HeartHandshake;
      case 'Home':
        return Home;
      case 'Compass':
        return Compass;
      case 'Utensils':
        return Utensils;
      case 'Plane':
        return Plane;
      case 'HeartPulse':
        return HeartPulse;
      case 'Droplets':
        return Droplets;
      default:
        return Sparkles;
    }
  };

  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      cat.title.toLowerCase().includes(q) ||
      (cat.badge ? cat.badge.toLowerCase().includes(q) : false) ||
      cat.items.some((it) => it.text.toLowerCase().includes(q))
    );
  });

  const completedItemsCount = selectedCategory
    ? selectedCategory.items.filter((it) => (itemProgress[it.id] || 0) >= it.count).length
    : 0;

  const totalItemsCount = selectedCategory ? selectedCategory.items.length : 1;
  const categoryPercentage = Math.round((completedItemsCount / totalItemsCount) * 100);

  if (selectedCategory) {
    return (
      <div className="space-y-4 pb-12">
        <div className="bg-white dark:bg-[#24211D] p-4 rounded-3xl border border-[#E8D5B7]/60 dark:border-white/5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FFF9EB] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] hover:bg-[#E8D5B7]/40 text-xs font-semibold transition-all"
            >
              <ArrowRight className="w-4 h-4" />
              <span>كل الأذكار</span>
            </button>

            <div className="text-center">
              <h2 className="text-base font-bold text-[#6B4A2F] dark:text-[#EED6BD] font-cairo">
                {selectedCategory.title}
              </h2>
              <span className="text-[11px] text-[#7BC0BE] font-medium">{selectedCategory.badge}</span>
            </div>

            <button
              onClick={handleResetCategory}
              className="p-2 rounded-2xl text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              title="إعادة ضبط العدادات"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 border-t border-[#E8D5B7]/40 dark:border-white/10 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70">
                  الإنجاز: {completedItemsCount} من {totalItemsCount} ذكر
                </span>
                <span className="font-bold text-[#7BC0BE] font-mono">{categoryPercentage}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#E8D5B7]/30 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#7BC0BE] rounded-full transition-all duration-300"
                  style={{ width: `${categoryPercentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 bg-[#FFF9EB] dark:bg-[#1A1815] px-2 py-1 rounded-xl border border-[#E8D5B7]/50">
              <button
                onClick={() => setFontSizeLevel((prev) => Math.max(14, prev - 2))}
                className="w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center text-[#6B4A2F] dark:text-[#EED6BD]"
              >
                -
              </button>
              <span className="text-[11px] font-mono">{fontSizeLevel}</span>
              <button
                onClick={() => setFontSizeLevel((prev) => Math.min(28, prev + 2))}
                className="w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center text-[#6B4A2F] dark:text-[#EED6BD]"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {selectedCategory.items.map((item, index) => {
            const currentCount = itemProgress[item.id] || 0;
            const isCompleted = currentCount >= item.count;
            const isSpeaking = speakingItemId === item.id;

            return (
              <div
                key={item.id}
                id={`zikr-card-${index}`}
                className={`p-4 sm:p-5 rounded-3xl transition-all ${
                  isCompleted
                    ? 'bg-[#7BC0BE]/10 border-2 border-[#7BC0BE]/50 shadow-2xs'
                    : 'bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/5 shadow-2xs'
                }`}
              >
                <p
                  style={{ fontSize: `${fontSizeLevel}px` }}
                  className="font-quran leading-loose text-[#6B4A2F] dark:text-[#EED6BD] text-justify select-text py-1"
                >
                  {item.text}
                </p>

                {item.reference && (
                  <div className="mt-1 text-[11px] text-[#4A4A4A]/50 dark:text-[#CFCBC3]/50">
                    المصدر: {item.reference}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E8D5B7]/30 dark:border-white/5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSpeakZikr(item.id, item.text)}
                      className={`p-2 rounded-xl transition-colors ${
                        isSpeaking
                          ? 'text-[#7BC0BE] bg-[#7BC0BE]/15 animate-pulse'
                          : 'text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 hover:text-[#7BC0BE] hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815]'
                      }`}
                      title="استماع للذكر"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleCopyZikr(item.text, item.reference)}
                      className="p-2 rounded-xl text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 hover:text-[#7BC0BE] hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815] transition-colors"
                      title="نسخ الذكر"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleShareZikr(item.text, item.reference)}
                      className="p-2 rounded-xl text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 hover:text-[#7BC0BE] hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815] transition-colors"
                      title="مشاركة الذكر"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentCount > 0 && !isCompleted && (
                      <button
                        onClick={() => handleDecrement(item)}
                        className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-[#4A4A4A] text-xs font-bold flex items-center justify-center hover:bg-gray-200"
                      >
                        -
                      </button>
                    )}

                    <button
                      onClick={() => handleIncrement(item, index)}
                      className={`min-w-[110px] h-10 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition-all active:scale-95 shadow-xs ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#7BC0BE] hover:bg-[#67AEA9] text-white'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>تم الذكر ({item.count})</span>
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-sm">
                            {currentCount} / {item.count}
                          </span>
                          <span className="text-[10px] opacity-80">(اضغط)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {categoryPercentage === 100 && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-50 to-[#FFF9EB] dark:from-[#1D2B24] dark:to-[#1A1815] border border-emerald-300 dark:border-emerald-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              ما شاء الله! أتممت {selectedCategory.title} بالكامل
            </h3>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="relative">
        <Search className="w-4 h-4 text-[#4A4A4A]/50 dark:text-[#CFCBC3]/50 absolute right-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`ابحث في ${categories.length} قسماً من الأذكار والأدعية النبوية...`}
          className="w-full bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/10 rounded-2xl py-3 pr-11 pl-4 text-xs sm:text-sm text-[#4A4A4A] dark:text-[#EED6BD] focus:outline-none focus:ring-2 focus:ring-[#7BC0BE]/50 shadow-2xs"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {filteredCategories.map((category) => {
          const Icon = getCategoryIcon(category.icon);

          return (
            <div
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className="p-4 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/5 hover:border-[#7BC0BE] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF9EB] dark:bg-[#1A1815] border border-[#E8D5B7]/60 dark:border-white/10 flex items-center justify-center text-[#7BC0BE] shrink-0 group-hover:bg-[#7BC0BE] group-hover:text-white transition-colors">
                  <Icon className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD] group-hover:text-[#7BC0BE] transition-colors font-cairo">
                    {category.title}
                  </h3>
                  <p className="text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 mt-0.5 line-clamp-1">
                    {category.badge}
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-[#7BC0BE] font-medium font-mono">
                    {category.items.length} ذكر ودعاء
                  </span>
                </div>
              </div>

              <div className="p-2 rounded-2xl bg-[#FFF9EB] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] group-hover:bg-[#7BC0BE] group-hover:text-white transition-colors">
                <ArrowRight className="w-4 h-4 rotate-180" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

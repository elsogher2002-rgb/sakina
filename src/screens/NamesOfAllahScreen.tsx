import React, { useState, useMemo } from 'react';
import { NAMES_OF_ALLAH, NameOfAllah } from '../data/namesOfAllah';
import { 
  Search, 
  ArrowRight, 
  Volume2, 
  Sparkles, 
  Copy, 
  Share2, 
  X, 
  BookOpen,
  Heart
} from 'lucide-react';

interface NamesOfAllahScreenProps {
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export const NamesOfAllahScreen: React.FC<NamesOfAllahScreenProps> = ({
  onBack,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedName, setSelectedName] = useState<NameOfAllah | null>(null);
  const [speakingNumber, setSpeakingNumber] = useState<number | null>(null);
  const [favoriteNames, setFavoriteNames] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('sakina_favorite_names');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (num: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favoriteNames.includes(num)
      ? favoriteNames.filter((n) => n !== num)
      : [...favoriteNames, num];
    setFavoriteNames(updated);
    try {
      localStorage.setItem('sakina_favorite_names', JSON.stringify(updated));
    } catch {}
    onShowToast(favoriteNames.includes(num) ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة إلى المفضلة');
  };

  const filteredNames = useMemo(() => {
    if (!searchQuery.trim()) return NAMES_OF_ALLAH;
    const q = searchQuery.trim().toLowerCase();
    return NAMES_OF_ALLAH.filter(
      (item) =>
        item.name.includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        item.explanation.toLowerCase().includes(q) ||
        item.number.toString() === q
    );
  }, [searchQuery]);

  const speakName = (name: string, num: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!('speechSynthesis' in window)) {
      onShowToast('خاصية النطق الصوتي غير مدعومة في جهازك');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`الله، ${name}`);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;

      utterance.onstart = () => setSpeakingNumber(num);
      utterance.onend = () => setSpeakingNumber(null);
      utterance.onerror = () => setSpeakingNumber(null);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech error', err);
      setSpeakingNumber(null);
    }
  };

  const handleCopy = (item: NameOfAllah) => {
    const text = `من أسماء الله الحسنى: ﴿ ${item.name} ﴾\nالمعنى: ${item.meaning}\nالشرح: ${item.explanation}\nعبر تطبيق سَكِينة`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      onShowToast('تم نسخ الاسم وشرحه بنجاح');
    }
  };

  const handleShare = async (item: NameOfAllah) => {
    const text = `من أسماء الله الحسنى: ﴿ ${item.name} ﴾\nالمعنى: ${item.meaning}\nالشرح: ${item.explanation}\nعبر تطبيق سَكِينة`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `اسم الله: ${item.name}`,
          text,
        });
      } catch {}
    } else {
      handleCopy(item);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header Card */}
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
              <Sparkles className="w-5 h-5 text-[#7BC0BE]" />
              <span>أسماء الله الحسنى</span>
            </h1>
            <p className="text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">
              «إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا، مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ»
            </p>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="px-3 py-1.5 rounded-2xl bg-[#FFF9EB] dark:bg-[#1A1815] border border-[#E8D5B7]/60 dark:border-white/10 text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] font-mono">
          99 اسماً
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#4A4A4A]/50 dark:text-[#CFCBC3]/50 absolute right-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث في أسماء الله الحسنى أو معانيها..."
          className="w-full bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/10 rounded-2xl py-3 pr-11 pl-4 text-xs sm:text-sm text-[#4A4A4A] dark:text-[#EED6BD] focus:outline-none focus:ring-2 focus:ring-[#7BC0BE]/50 shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-[#4A4A4A]/40 hover:text-[#4A4A4A]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 99 Names Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredNames.map((item) => {
          const isFav = favoriteNames.includes(item.number);
          const isSpeaking = speakingNumber === item.number;

          return (
            <div
              key={item.number}
              onClick={() => setSelectedName(item)}
              className="relative p-4 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/5 hover:border-[#7BC0BE] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
            >
              {/* Top Row: Number & Actions */}
              <div className="flex items-center justify-between text-xs text-[#4A4A4A]/50 dark:text-[#CFCBC3]/50 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#FFF9EB] dark:bg-[#1A1815] border border-[#E8D5B7]/50 flex items-center justify-center font-mono text-[10px] text-[#6B4A2F] dark:text-[#EED6BD] font-bold">
                  {item.number}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => speakName(item.name, item.number, e)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isSpeaking
                        ? 'text-[#7BC0BE] bg-[#7BC0BE]/15 animate-pulse'
                        : 'hover:text-[#7BC0BE] hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815]'
                    }`}
                    title="استماع للنطق"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => toggleFavorite(item.number, e)}
                    className="p-1.5 rounded-lg hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815] transition-colors"
                    title="حفظ في المفضلة"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isFav ? 'fill-rose-500 text-rose-500' : 'text-[#4A4A4A]/40 dark:text-[#CFCBC3]/40'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Center: Beautiful Arabic Calligraphy Name */}
              <div className="text-center py-2">
                <h3 className="font-quran text-2xl sm:text-3xl text-[#6B4A2F] dark:text-[#EED6BD] group-hover:text-[#7BC0BE] transition-colors leading-relaxed">
                  {item.name}
                </h3>
              </div>

              {/* Bottom: Meaning */}
              <div className="pt-2 border-t border-[#E8D5B7]/30 dark:border-white/5">
                <p className="text-[11px] text-[#4A4A4A]/80 dark:text-[#CFCBC3]/80 line-clamp-2 text-center leading-snug">
                  {item.meaning}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedName && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedName(null)}
        >
          <div
            className="bg-white dark:bg-[#24211D] w-full max-w-md rounded-3xl p-6 border border-[#E8D5B7] dark:border-white/10 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E8D5B7]/40 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-[#7BC0BE]/20 text-[#559B99] dark:text-[#7BC0BE] flex items-center justify-center font-bold text-xs font-mono">
                  {selectedName.number}
                </span>
                <span className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">من أسماء الله الحسنى</span>
              </div>
              <button
                onClick={() => setSelectedName(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-[#4A4A4A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Name Big Display */}
            <div className="text-center py-3 bg-[#FFF9EB] dark:bg-[#1A1815] rounded-2xl border border-[#E8D5B7]/50">
              <h2 className="font-quran text-4xl sm:text-5xl text-[#6B4A2F] dark:text-[#EED6BD]">
                {selectedName.name}
              </h2>
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  onClick={() => speakName(selectedName.name, selectedName.number)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7BC0BE] text-white text-xs font-semibold shadow-xs hover:bg-[#67AEA9] transition-all"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>استماع للنطق</span>
                </button>
              </div>
            </div>

            {/* Meaning & Explanation */}
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-[#7BC0BE] block mb-1">المعنى:</span>
                <p className="text-sm font-semibold text-[#6B4A2F] dark:text-[#EED6BD] leading-relaxed">
                  {selectedName.meaning}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-[#7BC0BE] block mb-1">الشرح والأثر الإيماني:</span>
                <p className="text-xs sm:text-sm text-[#4A4A4A] dark:text-[#CFCBC3] leading-relaxed text-justify bg-[#FDF8F0] dark:bg-[#1A1815] p-3.5 rounded-2xl border border-[#E8D5B7]/40">
                  {selectedName.explanation}
                </p>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8D5B7]/40 dark:border-white/10">
              <button
                onClick={() => handleCopy(selectedName)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFF9EB] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] hover:bg-[#E8D5B7]/40 text-xs font-semibold transition-all"
              >
                <Copy className="w-3.5 h-3.5 text-[#7BC0BE]" />
                <span>نسخ</span>
              </button>
              <button
                onClick={() => handleShare(selectedName)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7BC0BE] text-white hover:bg-[#67AEA9] text-xs font-semibold shadow-xs transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>مشاركة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

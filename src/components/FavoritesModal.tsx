import React from 'react';
import { FavoriteItem } from '../utils/db';
import { Star, Trash2, ArrowLeft, BookOpen, Heart } from 'lucide-react';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: FavoriteItem[];
  onRemoveFavorite: (id: string) => void;
  onSelectSurah?: (surahNumber: number) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  favorites,
  onRemoveFavorite,
  onSelectSurah,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#24211D] rounded-3xl p-6 shadow-2xl border border-[#E8D5B7]/50 dark:border-white/10 text-right max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8D5B7]/30 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
                قائمتي المفضلة
              </h3>
              <p className="text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">
                {favorites.length} عناصر محفوظة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 hover:bg-[#FFF9EB] dark:hover:bg-[#2D2822] text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content list */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
          {favorites.length === 0 ? (
            <div className="py-12 text-center text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">
              <Star className="w-10 h-10 mx-auto text-[#E8D5B7] stroke-1 mb-2" />
              <p className="text-xs">لم تقم بإضافة أي سور أو أذكار للمفضلة بعد</p>
              <p className="text-[11px] text-[#4A4A4A]/40 dark:text-[#CFCBC3]/40 mt-1">
                اضغط على أيقونة النجمة بجانب أي سورة لحفظها هنا
              </p>
            </div>
          ) : (
            favorites.map((fav) => (
              <div
                key={fav.id}
                className="p-3.5 rounded-2xl bg-[#FDF8F0] dark:bg-[#1A1815] border border-[#E8D5B7]/40 dark:border-white/5 flex items-center justify-between gap-3 hover:border-[#7BC0BE] transition-colors"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  onClick={() => {
                    if (fav.surahNumber && onSelectSurah) {
                      onSelectSurah(fav.surahNumber);
                      onClose();
                    }
                  }}
                >
                  <div className="w-8 h-8 rounded-xl bg-[#7BC0BE]/20 text-[#559B99] dark:text-[#7BC0BE] flex items-center justify-center shrink-0">
                    {fav.type === 'surah' ? (
                      <BookOpen className="w-4 h-4" />
                    ) : (
                      <Heart className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] truncate">
                      {fav.title}
                    </h4>
                    {fav.subtitle && (
                      <p className="text-[10px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 truncate">
                        {fav.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onRemoveFavorite(fav.id)}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                  title="حذف من المفضلة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-xs font-semibold rounded-2xl transition-all"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};

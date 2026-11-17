import React, { useState } from 'react';
import { AppSettings, UserStats, KhatmaTracker, ActiveTab } from '../types';
import { FavoriteItem } from '../utils/db';
import { 
  Star, 
  BookOpen, 
  AlarmClock, 
  Type, 
  Globe, 
  Share2, 
  ThumbsUp, 
  Info, 
  Heart, 
  ChevronLeft,
  Zap,
  Sparkles,
  DownloadCloud,
  Megaphone
} from 'lucide-react';

interface MoreScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  stats: UserStats;
  khatma: KhatmaTracker;
  onUpdateKhatma: (newKhatma: KhatmaTracker) => void;
  favorites: FavoriteItem[];
  onOpenFavorites: () => void;
  onShowToast: (text: string) => void;
  onInstallPWA?: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({
  settings,
  onUpdateSettings,
  stats,
  khatma,
  onUpdateKhatma,
  favorites,
  onOpenFavorites,
  onShowToast,
  onInstallPWA,
  onNavigateTab,
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [userRating, setUserRating] = useState(5);

  const handleShareApp = async () => {
    const text = 'تطبيق سَكِينة - رفيقك الهادئ للقرآن الكريم والأذكار ومواقيت الصلاة والقبلة والسبحة.\n' + window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'تطبيق سَكِينة',
          text,
          url: window.location.href,
        });
        onShowToast('شكراً لمشاركتك تطبيق سَكِينة');
      } catch {
        // canceled
      }
    } else {
      await navigator.clipboard.writeText(text);
      onShowToast('تم نسخ رابط التطبيق للمشاركة');
    }
  };

  const shareUrl = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');
  const shareText = encodeURIComponent('تطبيق سَكِينة - رفيقك الهادئ للقرآن الكريم والأذكار ومواقيت الصلاة: ');

  const handleUpdateKhatmaDays = (days: number) => {
    const ayahsPerDay = Math.ceil(6236 / days);
    onUpdateKhatma({
      ...khatma,
      targetDays: days,
      dailyWirdTarget: ayahsPerDay,
    });
    onShowToast(`تم ضبط خطة الختمة على ${days} يوم (${ayahsPerDay} آية يومياً)`);
  };

  const khatmaPercent = Math.min(100, Math.round((khatma.completedAyahs / 6236) * 100));

  // Generate 7-day visualization from device local history
  const daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateKey = d.toDateString();
    const isToday = i === 6;
    const count = isToday
      ? stats.todayTasbihCount || 0
      : (stats.dailyTasbihHistory && stats.dailyTasbihHistory[dateKey]) || 0;
    return {
      label: daysAr[d.getDay()],
      count,
      isToday,
    };
  });
  const maxWeekly = Math.max(...weeklyData.map((d) => d.count), 100);

  return (
    <div className="space-y-4 pb-24">
      {/* User Stats Snapshot Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-[#FFF9EB] to-[#F7EFE1] dark:from-[#24211D] dark:via-[#1F1C18] dark:to-[#171512] border border-[#E8D5B7]/60 dark:border-white/10 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8D5B7]/40 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#7BC0BE]" />
            <h3 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
              إحصائياتي في سَكِينة
            </h3>
          </div>
          <span className="text-[11px] font-bold text-[#7BC0BE] bg-[#7BC0BE]/15 px-2.5 py-0.5 rounded-full">
            🔥 {stats.streakDays} أيام متواصلة
          </span>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#1A1815]/80 text-center border border-[#E8D5B7]/40">
            <span className="text-[10px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 block">تسبيحات اليوم</span>
            <span className="text-base font-bold font-mono text-[#7BC0BE] tabular-nums">{stats.todayTasbihCount || 0}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#1A1815]/80 text-center border border-[#E8D5B7]/40">
            <span className="text-[10px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 block">مجموع التسبيحات</span>
            <span className="text-base font-bold font-mono text-[#6B4A2F] dark:text-[#EED6BD] tabular-nums">{stats.totalTasbihCount.toLocaleString()}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#1A1815]/80 text-center border border-[#E8D5B7]/40">
            <span className="text-[10px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 block">آيات قُرِئت</span>
            <span className="text-base font-bold font-mono text-[#6B4A2F] dark:text-[#EED6BD] tabular-nums">{khatma.completedAyahs}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#1A1815]/80 text-center border border-[#E8D5B7]/40">
            <span className="text-[10px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 block">أذكار أُنجزت</span>
            <span className="text-base font-bold font-mono text-[#6B4A2F] dark:text-[#EED6BD] tabular-nums">{stats.completedAzkarCount}</span>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="mt-4 pt-3 border-t border-[#E8D5B7]/30 dark:border-white/5">
          <span className="text-[11px] font-semibold text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 block mb-2">
            نشاطك خلال الأسبوع:
          </span>
          <div className="flex items-end justify-between gap-1 h-20 pt-2">
            {weeklyData.map((day, idx) => {
              const heightPct = day.count === 0 ? 10 : Math.max(15, Math.round((day.count / maxWeekly) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                      day.isToday ? 'bg-[#7BC0BE]' : 'bg-[#E8D5B7] dark:bg-white/20'
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${day.count} تسبيحة`}
                  />
                  <span className="text-[9px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 truncate">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Khatma Planner Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#7BC0BE]" />
            <h3 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
              مخطط ختمة القرآن الكريم
            </h3>
          </div>
          <span className="text-xs font-bold text-[#7BC0BE] font-mono">{khatmaPercent}% منجز</span>
        </div>

        <p className="text-xs text-[#4A4A4A]/80 dark:text-[#CFCBC3]/80 leading-relaxed">
          اختر المدة المناسبة لك لختم القرآن، وسيقترح عليك التطبيق الورد اليومي المناسب:
        </p>

        {/* 30 / 60 / 90 days options */}
        <div className="grid grid-cols-3 gap-2.5 my-3">
          {[30, 60, 90].map((days) => {
            const isSelected = khatma.targetDays === days;
            const dailyAyahs = Math.ceil(6236 / days);

            return (
              <button
                key={days}
                onClick={() => handleUpdateKhatmaDays(days)}
                className={`p-3 rounded-2xl text-center transition-all ${
                  isSelected
                    ? 'bg-[#7BC0BE] text-white shadow-xs'
                    : 'bg-[#FFF9EB] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] hover:bg-[#E8D5B7]/30'
                }`}
              >
                <span className="text-sm font-bold block">{days} يوم</span>
                <span className={`text-[10px] mt-0.5 block ${isSelected ? 'text-white/90' : 'text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60'}`}>
                  {dailyAyahs} آية / يوم
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fajr Alarm Setting */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/5 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlarmClock className="w-4 h-4 text-[#7BC0BE]" />
            <h4 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
              منبه الفجر المسبق
            </h4>
          </div>
          <p className="text-xs text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 mt-0.5">
            يصحيك قبل أذان الفجر بـ {settings.fajrAlarmOffset} دقيقة للتهجد والوتر
          </p>
        </div>

        <button
          onClick={() => {
            onUpdateSettings({ ...settings, fajrAlarmEnabled: !settings.fajrAlarmEnabled });
            onShowToast(settings.fajrAlarmEnabled ? 'تم إيقاف منبه الفجر' : 'تم تفعيل منبه الفجر');
          }}
          className={`w-11 h-6 rounded-full transition-colors relative ${
            settings.fajrAlarmEnabled ? 'bg-[#7BC0BE]' : 'bg-[#E8D5B7]/60 dark:bg-white/10'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              settings.fajrAlarmEnabled ? 'left-1' : 'right-1'
            }`}
          />
        </button>
      </div>

      {/* Main Settings Menu Items */}
      <div className="bg-white dark:bg-[#24211D] rounded-3xl border border-[#E8D5B7]/60 dark:border-white/5 overflow-hidden shadow-xs divide-y divide-[#E8D5B7]/30 dark:divide-white/5">
        {/* Favorites */}
        <button
          onClick={onOpenFavorites}
          className="w-full p-4 flex items-center justify-between hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
            <div className="text-right">
              <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">المفضلة</h4>
              <p className="text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">السور والآيات والأذكار المحفوظة ({favorites.length})</p>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#4A4A4A]/40" />
        </button>

        {/* Font Size */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#7BC0BE]/15 text-[#7BC0BE] flex items-center justify-center">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">حجم الخط العام</h4>
              <p className="text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">صغير · متوسط · كبير</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#FDF8F0] dark:bg-[#1A1815] p-1 rounded-xl border border-[#E8D5B7]/40">
            {(['small', 'medium', 'large'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  onUpdateSettings({ ...settings, fontSize: lvl });
                  onShowToast(`تم تغيير حجم الخط: ${lvl === 'small' ? 'صغير' : lvl === 'medium' ? 'متوسط' : 'كبير'}`);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  settings.fontSize === lvl
                    ? 'bg-[#7BC0BE] text-white'
                    : 'text-[#4A4A4A] dark:text-[#CFCBC3]'
                }`}
              >
                {lvl === 'small' ? 'صغير' : lvl === 'medium' ? 'متوسط' : 'كبير'}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#7BC0BE]/15 text-[#7BC0BE] flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">لغة الواجهة</h4>
              <p className="text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">العربية الفصحى الميسّرة</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#7BC0BE]/15 text-[#559B99] dark:text-[#7BC0BE]">
            العربية
          </span>
        </div>

        {/* Names of Allah */}
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('names_of_allah')}
            className="w-full p-4 flex items-center justify-between hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815] transition-colors border-b border-[#E8D5B7]/30 dark:border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#7BC0BE]/15 text-[#7BC0BE] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">أسماء الله الحسنى 99</h4>
                <p className="text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">استمع لنطقها، وتعرّف على معانيها وشرحها الإيماني</p>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-[#4A4A4A]/40" />
          </button>
        )}

        {/* Downloads */}
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('downloads')}
            className="w-full p-4 flex items-center justify-between hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815] transition-colors border-b border-[#E8D5B7]/30 dark:border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#7BC0BE]/15 text-[#7BC0BE] flex items-center justify-center">
                <DownloadCloud className="w-4 h-4" />
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">تحميلاتي (الاستماع أوفلاين)</h4>
                <p className="text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">إدارة السور المحفوظة على جهازك وتشغيلها بدون إنترنت</p>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-[#4A4A4A]/40" />
          </button>
        )}

        {/* Rate app */}
        <button
          onClick={() => setRatingModalOpen(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ThumbsUp className="w-4 h-4" />
            </div>
            <div className="text-right">
              <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">تقييم التطبيق</h4>
              <p className="text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">رأيك يهمنا لمواصلة التطوير والتحسين</p>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#4A4A4A]/40" />
        </button>

        {/* Share app */}
        <button
          onClick={handleShareApp}
          className="w-full p-4 flex items-center justify-between hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#7BC0BE]/15 text-[#7BC0BE] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="text-right">
              <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">مشاركة تطبيق سَكِينة</h4>
              <p className="text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">شارك الأجر مع أهلك وأصدقائك (تيليجرام، فيسبوك، نسخ الرابط)</p>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#4A4A4A]/40" />
        </button>


        {/* Advertise & Contact Developer */}
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('ad_contact')}
            className="w-full p-4 flex items-center justify-between hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#7BC0BE]/15 text-[#7BC0BE] flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
                  أعلن معنا · رسائل وطلبات الإعلانات
                </h4>
                <p className="text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">
                  إرسال طلب إعلان للمطور أو فتح صندوق رسائل المطور
                </p>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-[#4A4A4A]/40" />
          </button>
        )}

        {/* Support Us */}
        <button
          onClick={() => setActiveSection(activeSection === 'support' ? null : 'support')}
          className="w-full p-4 flex items-center justify-between hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
            <div className="text-right">
              <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">ادعم تطبيق سَكِينة</h4>
              <p className="text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">التطبيق مجاني بالكامل وخالٍ من الإعلانات المزعجة</p>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#4A4A4A]/40" />
        </button>

        {/* About & Privacy */}
        <button
          onClick={() => setActiveSection(activeSection === 'about' ? null : 'about')}
          className="w-full p-4 flex items-center justify-between hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div className="text-right">
              <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">من نحن وسياسة الخصوصية</h4>
              <p className="text-[11px] text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60">عداداتك وسجلّك محفوظان لكل متصفح بشكل مستقل</p>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#4A4A4A]/40" />
        </button>
      </div>

      {/* Accordion Support section */}
      {activeSection === 'support' && (
        <div className="p-5 rounded-3xl bg-[#FFF9EB] dark:bg-[#201D19] border border-[#E8D5B7]/60 text-xs leading-relaxed text-[#4A4A4A] dark:text-[#CFCBC3] space-y-2 animate-in fade-in">
          <h4 className="font-bold text-[#6B4A2F] dark:text-[#EED6BD] text-sm">صفحة ادعمنا:</h4>
          <p>
            تطبيق <strong>سَكِينة</strong> مجاني 100% وخالٍ من الإعلانات المزعجة أو النوافذ المنبثقة الإجبارية لتنعم بتجربة هادئة وخاشعة.
          </p>
          <p>
            أكبر دعم يمكنك تقديمه هو مشاركة التطبيق مع عائلتك وأصدقائك، والدعاء لنا بالخير والتوفيق.
          </p>
        </div>
      )}

      {/* Accordion About section */}
      {activeSection === 'about' && (
        <div className="p-5 rounded-3xl bg-[#FFF9EB] dark:bg-[#201D19] border border-[#E8D5B7]/60 text-xs leading-relaxed text-[#4A4A4A] dark:text-[#CFCBC3] space-y-2 animate-in fade-in">
          <h4 className="font-bold text-[#6B4A2F] dark:text-[#EED6BD] text-sm">عن تطبيق سَكِينة - Sakina:</h4>
          <p>
            تطبيق إسلامي حديث مبني بهوية تصميم هادئة مستوحاة من الطمأنينة (Tranquility)، بألوان دافئة مريحة للعين (البيج والتركوازي والرملي)، ليكون رفيقك اليومي المخلص للقرآن الكريم، الأذكار، مواقيت الصلاة، اتجاه القبلة، والسبحة.
          </p>
          <h4 className="font-bold text-[#6B4A2F] dark:text-[#EED6BD] pt-2">سياسة الخصوصية:</h4>
          <p>
            خصوصيتك خط أحمر: كافة عداداتك (السبحة، الأذكار، علامات المصحف، والختمة) تُحفظ محلياً داخل متصفح جهازك فقط بشكل مستقل تماماً عن باقي المستخدمين، ويتصل الموقع فقط بالخدمات الرسمية المباشرة لجلب مواقيت الصلاة ونصوص القرآن الكريم وبث الإذاعات المباشر.
          </p>
        </div>
      )}

      {/* Social quick share strip */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/50 text-center">
        <span className="text-xs text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 font-medium block mb-2.5">
          انشر تؤجر - شارك عبر:
        </span>
        <div className="flex items-center justify-center gap-3">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-semibold text-xs hover:bg-blue-100 transition-colors"
          >
            فيسبوك
          </a>
          <a
            href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 font-semibold text-xs hover:bg-sky-100 transition-colors"
          >
            تيليجرام
          </a>
        </div>
      </div>

      {/* Rating Modal */}
      {ratingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#24211D] rounded-3xl p-6 shadow-2xl border border-[#E8D5B7]/50 text-center">
            <h3 className="text-base font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
              ما هو تقييمك لتطبيق سَكِينة؟
            </h3>
            <p className="text-xs text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 mt-1">
              ملاحظاتك تساعدنا على تحسين التجربة دائماً
            </p>

            <div className="flex items-center justify-center gap-2 my-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setUserRating(star)}
                  className="p-1 transition-transform active:scale-125"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= userRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-[#E8D5B7] dark:text-white/20'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setRatingModalOpen(false);
                  onShowToast('شكراً جزيلاً لتقييمك ودعمك الكريم!');
                }}
                className="flex-1 py-2.5 bg-[#7BC0BE] text-white text-xs font-bold rounded-2xl"
              >
                إرسال التقييم
              </button>
              <button
                onClick={() => setRatingModalOpen(false)}
                className="flex-1 py-2.5 bg-[#FDF8F0] dark:bg-[#1A1815] text-[#4A4A4A] text-xs font-medium rounded-2xl border border-[#E8D5B7]/50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

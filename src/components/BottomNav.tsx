import React from 'react';
import { ActiveTab } from '../types';
import { Home, BookOpen, Heart, Compass, Disc3, Radio, Clock, MoreHorizontal } from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home' as ActiveTab, label: 'الرئيسية', icon: Home },
    { id: 'quran' as ActiveTab, label: 'القرآن', icon: BookOpen },
    { id: 'azkar' as ActiveTab, label: 'الأذكار', icon: Heart },
    { id: 'tasbih' as ActiveTab, label: 'التسبيح', icon: Disc3 },
    { id: 'prayer' as ActiveTab, label: 'الصلاة', icon: Clock },
    { id: 'qibla' as ActiveTab, label: 'القبلة', icon: Compass },
    { id: 'radio' as ActiveTab, label: 'الراديو', icon: Radio },
    { id: 'more' as ActiveTab, label: 'المزيد', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1A1815]/95 backdrop-blur-md border-t border-[#E8D5B7]/50 dark:border-[#2D2822] transition-colors pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1 py-1 sm:py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id ||
            (tab.id === 'quran' && activeTab === 'downloads') ||
            (tab.id === 'home' && activeTab === 'names_of_allah');

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 min-h-[48px] py-1 px-1 flex flex-col items-center justify-center relative transition-all duration-200 select-none ${
                isActive
                  ? 'text-[#7BC0BE] dark:text-[#7BC0BE]'
                  : 'text-[#4A4A4A]/60 dark:text-[#CFCBC3]/60 hover:text-[#6B4A2F] dark:hover:text-[#EED6BD]'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'
                  }`}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#7BC0BE]" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium tracking-tight whitespace-nowrap leading-tight ${
                  isActive ? 'font-bold text-[#7BC0BE]' : ''
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

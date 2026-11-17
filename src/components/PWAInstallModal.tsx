import React, { useEffect, useState } from 'react';
import { Download, Share2, PlusSquare, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallNative: () => Promise<boolean>;
  isIOS: boolean;
  isInstallable: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onInstallNative,
  isIOS,
  isInstallable,
}) => {
  const [installedSuccess, setInstalledSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await onInstallNative();
    if (success) {
      setInstalledSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-[#24211D] rounded-3xl p-6 shadow-2xl border border-[#E8D5B7]/50 dark:border-white/10 text-right">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8D5B7]/30 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7BC0BE]/20 text-[#559B99] dark:text-[#7BC0BE] flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
              تثبيت تطبيق سَكِينة
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 hover:bg-[#FFF9EB] dark:hover:bg-[#2D2822] text-sm"
          >
            ✕
          </button>
        </div>

        {installedSuccess ? (
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <p className="font-bold text-[#6B4A2F] dark:text-[#EED6BD]">تم التثبيت بنجاح!</p>
            <p className="text-xs text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 mt-1">تطبيق سَكِينة الآن على شاشتك الرئيسية ويعمل أوفلاين</p>
          </div>
        ) : isInstallable ? (
          <div className="py-4">
            <p className="text-xs text-[#4A4A4A] dark:text-[#CFCBC3] leading-relaxed">
              ثبت سَكِينة على هاتفك أو حاسوبك لتشغيله بنقرة واحدة، واستخدامه 100% بدون إنترنت مع تجربة شاشة كاملة وسريعة.
            </p>
            <button
              onClick={handleInstallClick}
              className="mt-5 w-full py-3 bg-[#7BC0BE] hover:bg-[#67AEA9] text-white font-semibold text-sm rounded-2xl shadow-md shadow-[#7BC0BE]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>تثبيت الآن على الجهاز</span>
            </button>
          </div>
        ) : isIOS ? (
          <div className="py-4 space-y-3">
            <p className="text-xs text-[#4A4A4A] dark:text-[#CFCBC3] leading-relaxed">
              لتثبيت سَكِينة على الآيفون والآيباد عبر متصفح سفاري Safari:
            </p>
            <div className="space-y-2 text-xs text-[#6B4A2F] dark:text-[#EED6BD] bg-[#FFF9EB] dark:bg-[#1A1815] p-3 rounded-2xl border border-[#E8D5B7]/40">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#7BC0BE] shrink-0" />
                <span>1. اضغط على زر المشاركة (Share) في شريط المتصفح أسفل الشاشة.</span>
              </div>
              <div className="flex items-center gap-2">
                <PlusSquare className="w-4 h-4 text-[#7BC0BE] shrink-0" />
                <span>2. مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#7BC0BE] shrink-0" />
                <span>3. اضغط على "إضافة" (Add) في الزاوية العلوية.</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-xs text-[#4A4A4A] dark:text-[#CFCBC3] leading-relaxed">
            <p>التطبيق يعمل بشكل كامل أوفلاين. يمكنك إضافته لشاشتك الرئيسية من قائمة خيارات المتصفح (⋮) ثم "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-2 py-2.5 bg-[#FDF8F0] dark:bg-[#1A1815] text-[#4A4A4A] dark:text-[#CFCBC3] font-medium text-xs rounded-2xl border border-[#E8D5B7]/30 transition-colors"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};

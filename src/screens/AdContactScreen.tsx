import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  DEVELOPER_EMAIL,
  isVerifiedDeveloper,
  subscribeAuthState,
  signInDeveloperWithGoogle,
  signOutDeveloper,
  submitAdRequest,
  subscribeAdRequestsForDeveloper,
  updateAdRequestStatus,
  deleteAdRequest,
  subscribeAllPublishedAdsForDeveloper,
  upsertPublishedAd,
  togglePublishedAdActive,
  deletePublishedAd,
} from '../utils/firebase';
import {
  AdPlacementOption,
  AdRequestItem,
  PublishedAdItem,
} from '../types';
import {
  ArrowRight,
  Megaphone,
  Send,
  Lock,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Copy,
  Mail,
  Sparkles,
  Eye,
  EyeOff,
  Plus,
  Loader2,
  AlertCircle,
  Inbox,
} from 'lucide-react';

interface AdContactScreenProps {
  onBack: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'reminder') => void;
}

export const AdContactScreen: React.FC<AdContactScreenProps> = ({
  onBack,
  onShowToast,
}) => {
  const [subView, setSubView] = useState<'form' | 'developer'>('form');

  // Public Visitor Form State
  const [senderName, setSenderName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [adTitle, setAdTitle] = useState('');
  const [adLink, setAdLink] = useState('');
  const [placement, setPlacement] = useState<AdPlacementOption>('slot1');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Developer Auth & Data State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [requests, setRequests] = useState<AdRequestItem[]>([]);
  const [publishedAds, setPublishedAds] = useState<PublishedAdItem[]>([]);
  const [inboxError, setInboxError] = useState<string | null>(null);

  // Developer Publish Ad Form State
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdDesc, setNewAdDesc] = useState('');
  const [newAdCta, setNewAdCta] = useState('زيارة الرابط');
  const [newAdUrl, setNewAdUrl] = useState('');
  const [newAdSlot, setNewAdSlot] = useState<1 | 2>(1);
  const [linkedRequestId, setLinkedRequestId] = useState<string | null>(null);
  const [isPublishingAd, setIsPublishingAd] = useState(false);

  const isDev = isVerifiedDeveloper(currentUser);

  useEffect(() => {
    const unsub = subscribeAuthState((user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !isDev) {
      setRequests([]);
      setPublishedAds([]);
      return;
    }

    setInboxError(null);
    const unsubReqs = subscribeAdRequestsForDeveloper(
      (items) => setRequests(items),
      (err) => {
        setInboxError('تعذر تحميل رسائل المطور: ' + err.message);
      }
    );

    const unsubAds = subscribeAllPublishedAdsForDeveloper(
      (ads) => setPublishedAds(ads),
      (err) => {
        setInboxError('تعذر تحميل قائمة الإعلانات المنشورة: ' + err.message);
      }
    );

    return () => {
      unsubReqs();
      unsubAds();
    };
  }, [authReady, isDev]);

  const handleVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await submitAdRequest({
        senderName,
        contactInfo,
        adTitle,
        adLink,
        message,
        placement,
      });
      setSubmitSuccess(true);
      setSenderName('');
      setContactInfo('');
      setAdTitle('');
      setAdLink('');
      setMessage('');
      onShowToast('تم إرسال رسالتك إلى مطور موقع سَكِينة بنجاح');
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'تعذر إرسال الرسالة، تأكد من اتصال الإنترنت وحاول مرة أخرى'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeveloperLogin = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const user = await signInDeveloperWithGoogle();
      if (!isVerifiedDeveloper(user)) {
        await signOutDeveloper();
        setAuthError(
          `عذراً، هذا القسم مخصص لمطور الموقع فقط (${DEVELOPER_EMAIL}). تم تسجيل الدخول بحساب: ${user.email || 'غير معروف'}`
        );
        return;
      }
      onShowToast('مرحباً بك أيها المطور في صندوق طلبات الإعلانات');
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'تعذر إتمام تسجيل الدخول عبر Google'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handlePrefillAdFromRequest = (req: AdRequestItem) => {
    setNewAdTitle(req.adTitle.slice(0, 100));
    setNewAdDesc(req.message.replace(/\s+/g, ' ').trim().slice(0, 240));
    setNewAdUrl(req.adLink || '');
    setNewAdSlot(req.placement === 'slot2' ? 2 : 1);
    setLinkedRequestId(req.id);
    onShowToast('تم تعبئة نموذج نشر الإعلان من الرسالة، راجعه واضغط نشر');
  };

  const handlePublishAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishingAd(true);
    try {
      await upsertPublishedAd({
        title: newAdTitle,
        description: newAdDesc,
        ctaText: newAdCta,
        targetUrl: newAdUrl,
        slotNumber: newAdSlot,
        active: true,
      });
      if (linkedRequestId) {
        await updateAdRequestStatus(linkedRequestId, 'published');
      }
      setNewAdTitle('');
      setNewAdDesc('');
      setNewAdCta('زيارة الرابط');
      setNewAdUrl('');
      setLinkedRequestId(null);
      onShowToast('تم نشر الإعلان على الموقع بنجاح!');
    } catch (err) {
      onShowToast(
        err instanceof Error ? err.message : 'تعذر نشر الإعلان، تأكد من الحقول',
        'info'
      );
    } finally {
      setIsPublishingAd(false);
    }
  };

  const unreadCount = requests.filter((r) => r.status === 'new').length;

  const formatDateTimeAr = (ms: number) => {
    try {
      return new Intl.DateTimeFormat('ar-EG', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(ms));
    } catch {
      return '';
    }
  };

  const placementLabel = (p: AdPlacementOption) => {
    if (p === 'slot1') return 'المساحة 1 (الرئيسية)';
    if (p === 'slot2') return 'المساحة 2 (المصحف)';
    return 'المساحتان معاً';
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-[#24211D] p-4 rounded-3xl border border-[#E8D5B7]/60 dark:border-white/10 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-2xl bg-[#FFF9EB] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] hover:bg-[#E8D5B7]/40 transition-colors"
            title="رجوع"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#6B4A2F] dark:text-[#EED6BD] font-cairo flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#7BC0BE]" />
              <span>أعلن معنا · تواصل مع المطور</span>
            </h1>
            <p className="text-[11px] text-[#4A4A4A]/65 dark:text-[#CFCBC3]/65">
              أرسل طلب إعلانك أو رسالتك مباشرة للمطور فقط بسرية تامة
            </p>
          </div>
        </div>
      </div>

      {/* View Switcher: Public Ad Inquiry Form vs Private Developer Inbox */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 dark:border-white/10">
        <button
          type="button"
          onClick={() => setSubView('form')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            subView === 'form'
              ? 'bg-[#7BC0BE] text-white shadow-xs'
              : 'text-[#6B4A2F] dark:text-[#EED6BD] hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815]'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>أرسل طلب إعلان</span>
        </button>

        <button
          type="button"
          onClick={() => setSubView('developer')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            subView === 'developer'
              ? 'bg-[#6B4A2F] text-white shadow-xs'
              : 'text-[#6B4A2F] dark:text-[#EED6BD] hover:bg-[#FFF9EB] dark:hover:bg-[#1A1815]'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>رسائل المطور</span>
          {isDev && unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {subView === 'form' ? (
        <div className="bg-white dark:bg-[#24211D] p-5 sm:p-6 rounded-3xl border border-[#E8D5B7]/60 dark:border-white/10 shadow-xs space-y-4">
          {submitSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-[#6B4A2F] dark:text-[#EED6BD] font-cairo">
                  وصلت رسالتك للمطور بنجاح!
                </h2>
                <p className="text-xs text-[#4A4A4A]/80 dark:text-[#CFCBC3]/80 max-w-md mx-auto leading-relaxed">
                  شكراً لتواصلك مع إدارة موقع <strong>سَكِينة</strong>. رسالتك محفوظة بسرية ولا يراها إلا المطور فقط، وسيتم التواصل معك لمراجعة إعلانك ونشره.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitSuccess(false)}
                className="px-5 py-2.5 rounded-2xl bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                إرسال رسالة أخرى
              </button>
            </div>
          ) : (
            <form onSubmit={handleVisitorSubmit} className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-[#FFF9EB] dark:bg-[#1A1815] border border-[#E8D5B7]/60 dark:border-white/10 flex items-start gap-2.5 text-xs text-[#6B4A2F] dark:text-[#EED6BD]">
                <ShieldCheck className="w-4 h-4 text-[#7BC0BE] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  هل لديك نشاط تجاري أو مشروع تود الإعلان عنه في <strong>سَكِينة</strong>؟ اكتب تفاصيل إعلانك هنا وستصل رسالتك مباشرة <strong>لمطور الموقع فقط</strong>.
                </p>
              </div>

              {formError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] mb-1">
                    الاسم / اسم الجهة *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={80}
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="مثال: أحمد محمد / متجر النور"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FDF8F0] dark:bg-[#1A1815] border border-[#E8D5B7]/70 dark:border-white/10 text-xs text-[#4A4A4A] dark:text-[#EED6BD] focus:outline-none focus:ring-2 focus:ring-[#7BC0BE]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] mb-1">
                    حساب تيليجرام أو البريد الإلكتروني *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={4}
                    maxLength={120}
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="مثال: @username أو email@example.com"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FDF8F0] dark:bg-[#1A1815] border border-[#E8D5B7]/70 dark:border-white/10 text-xs text-[#4A4A4A] dark:text-[#EED6BD] focus:outline-none focus:ring-2 focus:ring-[#7BC0BE]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] mb-1">
                    عنوان الإعلان المطلوب *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={120}
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    placeholder="مثال: إعلان عن تطبيق / خدمة / متجر"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FDF8F0] dark:bg-[#1A1815] border border-[#E8D5B7]/70 dark:border-white/10 text-xs text-[#4A4A4A] dark:text-[#EED6BD] focus:outline-none focus:ring-2 focus:ring-[#7BC0BE]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] mb-1">
                    رابط الإعلان (اختياري)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={300}
                    value={adLink}
                    onChange={(e) => setAdLink(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FDF8F0] dark:bg-[#1A1815] border border-[#E8D5B7]/70 dark:border-white/10 text-xs text-[#4A4A4A] dark:text-[#EED6BD] focus:outline-none focus:ring-2 focus:ring-[#7BC0BE]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] mb-1.5">
                  الموضع المقترح للإعلان
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'slot1', label: 'الصفحة الرئيسية' },
                      { id: 'slot2', label: 'صفحة القرآن' },
                      { id: 'both', label: 'الموضعين معاً' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPlacement(opt.id)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                        placement === opt.id
                          ? 'bg-[#7BC0BE] text-white border-[#7BC0BE]'
                          : 'bg-[#FDF8F0] dark:bg-[#1A1815] text-[#6B4A2F] dark:text-[#EED6BD] border-[#E8D5B7]/60 dark:border-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] mb-1">
                  تفاصيل الرسالة والنص الإعلاني *
                </label>
                <textarea
                  required
                  minLength={5}
                  maxLength={1500}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب نص الإعلان أو المدة المطلوبة وأي تفاصيل تحب توصلها للمطور..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FDF8F0] dark:bg-[#1A1815] border border-[#E8D5B7]/70 dark:border-white/10 text-xs text-[#4A4A4A] dark:text-[#EED6BD] focus:outline-none focus:ring-2 focus:ring-[#7BC0BE] leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الإرسال للمطور...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>إرسال الرسالة للمطور الآن</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      ) : (
        /* Private Developer Inbox & Ad Manager */
        <div className="space-y-4">
          {!authReady ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/60 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#7BC0BE] mx-auto" />
            </div>
          ) : !isDev ? (
            <div className="bg-white dark:bg-[#24211D] p-6 sm:p-8 rounded-3xl border border-[#E8D5B7]/60 dark:border-white/10 shadow-xs text-center space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-[#6B4A2F]/10 text-[#6B4A2F] dark:text-[#EED6BD] mx-auto flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-[#6B4A2F] dark:text-[#EED6BD] font-cairo">
                  صندوق رسائل المطور (محمي)
                </h2>
                <p className="text-xs text-[#4A4A4A]/75 dark:text-[#CFCBC3]/75 max-w-sm mx-auto leading-relaxed">
                  هذه الرسائل سرية ولا تظهر لأي مستخدم. لعرض رسائل طلبات الإعلانات ونشر الإعلانات على الموقع، سجل دخولك بحساب المطور المعتمد:
                </p>
                <p className="text-xs font-mono font-bold text-[#7BC0BE]" dir="ltr">
                  {DEVELOPER_EMAIL}
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs">
                  {authError}
                </div>
              )}

              <button
                type="button"
                onClick={handleDeveloperLogin}
                disabled={isSigningIn}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#6B4A2F] hover:bg-[#573B24] text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-60"
              >
                {isSigningIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>تسجيل دخول المطور عبر Google</span>
              </button>
            </div>
          ) : (
            <>
              {/* Signed-in Developer Banner */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-[#6B4A2F] to-[#825B3A] text-white flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#7BC0BE] shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold">مرحباً بك في لوحة المطور</h3>
                    <p className="text-[10px] text-white/80 font-mono" dir="ltr">
                      {currentUser?.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void signOutDeveloper()}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>

              {inboxError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs">
                  {inboxError}
                </div>
              )}

              {/* Incoming Ad Requests List */}
              <div className="bg-white dark:bg-[#24211D] p-5 rounded-3xl border border-[#E8D5B7]/60 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD] flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-[#7BC0BE]" />
                    <span>الرسائل وطلبات الإعلانات الواردة ({requests.length})</span>
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[11px] font-bold">
                      {unreadCount} جديدة
                    </span>
                  )}
                </div>

                {requests.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#4A4A4A]/65 dark:text-[#CFCBC3]/65">
                    لا توجد رسائل واردة حتى الآن. أي رسالة يرسلها الزوار ستظهر لك هنا فوراً.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((req) => (
                      <div
                        key={req.id}
                        className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                          req.status === 'new'
                            ? 'bg-[#FFF9EB] dark:bg-[#1F1C18] border-[#7BC0BE]'
                            : 'bg-[#FDF8F0]/60 dark:bg-[#1A1815]/70 border-[#E8D5B7]/60 dark:border-white/10'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
                                {req.adTitle}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  req.status === 'new'
                                    ? 'bg-[#7BC0BE] text-white'
                                    : req.status === 'published'
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                      : 'bg-[#E8D5B7]/60 text-[#6B4A2F] dark:text-[#EED6BD]'
                                }`}
                              >
                                {req.status === 'new'
                                  ? 'رسالة جديدة'
                                  : req.status === 'published'
                                    ? 'تم نشر إعلانه'
                                    : req.status === 'read'
                                      ? 'تمت القراءة'
                                      : 'مؤرشفة'}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 mt-0.5">
                              من: <strong>{req.senderName}</strong> · {placementLabel(req.placement)} · {formatDateTimeAr(req.createdAtMs)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(req.contactInfo);
                                onShowToast('تم نسخ وسيلة التواصل');
                              }}
                              className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#24211D] border border-[#E8D5B7]/70 text-[11px] font-bold text-[#6B4A2F] dark:text-[#EED6BD] flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3 text-[#7BC0BE]" />
                              <span>{req.contactInfo}</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-xs leading-relaxed text-[#4A4A4A] dark:text-[#CFCBC3] bg-white/80 dark:bg-[#24211D]/80 p-3 rounded-xl border border-[#E8D5B7]/40 dark:border-white/5 whitespace-pre-wrap">
                          {req.message}
                        </p>

                        {req.adLink && (
                          <a
                            href={req.adLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7BC0BE] hover:underline"
                            dir="ltr"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{req.adLink}</span>
                          </a>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handlePrefillAdFromRequest(req)}
                            className="px-3 py-1.5 rounded-xl bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>تجهيز ونشر كإعلان على الموقع</span>
                          </button>

                          {req.status === 'new' && (
                            <button
                              type="button"
                              onClick={() => void updateAdRequestStatus(req.id, 'read')}
                              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#24211D] border border-[#E8D5B7] text-[#6B4A2F] dark:text-[#EED6BD] text-[11px] font-bold flex items-center gap-1"
                            >
                              <Mail className="w-3.5 h-3.5 text-[#7BC0BE]" />
                              <span>تحديد كمقروءة</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => void deleteAdRequest(req.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1 mr-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Developer Ad Publisher Tool */}
              <div className="bg-white dark:bg-[#24211D] p-5 rounded-3xl border border-[#E8D5B7]/60 dark:border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#6B4A2F] dark:text-[#EED6BD] flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#7BC0BE]" />
                    <span>نشر إعلان جديد في مساحات الموقع</span>
                  </h3>
                  {linkedRequestId && (
                    <span className="text-[10px] font-bold text-[#7BC0BE] bg-[#7BC0BE]/15 px-2 py-0.5 rounded-full">
                      مرتبط برسالة واردة
                    </span>
                  )}
                </div>

                <form onSubmit={handlePublishAdSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={100}
                      value={newAdTitle}
                      onChange={(e) => setNewAdTitle(e.target.value)}
                      placeholder="عنوان الإعلان (مثال: متجر المسك للعطور)"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FDF8F0] dark:bg-[#1A1815] border border-[#E8D5B7]/70 dark:border-white/10 text-xs"
                    />
                    <input
                      type="text"
                      required
                      dir="ltr"
                      minLength={5}
                      maxLength={300}
                      value={newAdUrl}
                      onChange={(e) => setNewAdUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FDF8F0] dark:bg-[#1A1815] border border-[#E8D5B7]/70 dark:border-white/10 text-xs"
                    />
                  </div>

                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={240}
                    value={newAdDesc}
                    onChange={(e) => setNewAdDesc(e.target.value)}
                    placeholder="وصف مختصر للإعلان يظهر للزوار..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FDF8F0] dark:bg-[#1A1815] border border-[#E8D5B7]/70 dark:border-white/10 text-xs"
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={40}
                      value={newAdCta}
                      onChange={(e) => setNewAdCta(e.target.value)}
                      placeholder="نص الزر"
                      className="px-3.5 py-2 rounded-xl bg-[#FDF8F0] dark:bg-[#1A1815] border border-[#E8D5B7]/70 dark:border-white/10 text-xs"
                    />

                    <select
                      value={newAdSlot}
                      onChange={(e) => setNewAdSlot(Number(e.target.value) === 2 ? 2 : 1)}
                      className="px-3 py-2 rounded-xl bg-[#FDF8F0] dark:bg-[#1A1815] border border-[#E8D5B7]/70 dark:border-white/10 text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]"
                    >
                      <option value={1}>الموضع 1 (الرئيسية)</option>
                      <option value={2}>الموضع 2 (المصحف)</option>
                    </select>

                    <button
                      type="submit"
                      disabled={isPublishingAd}
                      className="col-span-2 sm:col-span-1 py-2 px-4 rounded-xl bg-[#7BC0BE] hover:bg-[#67AEA9] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      {isPublishingAd ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>نشر الإعلان الآن</span>
                    </button>
                  </div>
                </form>

                {/* Active / Existing Published Ads */}
                {publishedAds.length > 0 && (
                  <div className="pt-3 border-t border-[#E8D5B7]/40 dark:border-white/10 space-y-2">
                    <h4 className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD]">
                      الإعلانات المضافة ({publishedAds.length}):
                    </h4>
                    {publishedAds.map((ad) => (
                      <div
                        key={ad.id}
                        className="p-3 rounded-2xl bg-[#FDF8F0] dark:bg-[#1A1815] border border-[#E8D5B7]/60 dark:border-white/10 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#6B4A2F] dark:text-[#EED6BD] truncate">
                              {ad.title}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7BC0BE]/15 text-[#7BC0BE]">
                              موضع {ad.slotNumber}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#4A4A4A]/70 dark:text-[#CFCBC3]/70 truncate">
                            {ad.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void togglePublishedAdActive(ad.id, !ad.active, ad)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 ${
                              ad.active
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {ad.active ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>ظاهر</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>مخفي</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => void deletePublishedAd(ad.id)}
                            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                            title="حذف الإعلان"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

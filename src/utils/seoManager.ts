import { ActiveTab } from '../types';

const TAB_SEO_MAP: Record<ActiveTab, { title: string; description: string }> = {
  home: {
    title: 'سَكِينة - القرآن الكريم والأذكار ومواقيت الصلاة وإذاعة القرآن',
    description:
      'موقع سَكِينة: رفيقك الهادئ للقرآن الكريم تلاوة وتحميلاً، إذاعة القرآن المباشرة، أذكار الصباح والمساء، مواقيت الصلاة الدقيقة في مصر، واتجاه القبلة.',
  },
  quran: {
    title: 'القرآن الكريم تلاوة وتحميل MP3 مع التفسير الميسر | سَكِينة',
    description:
      'اقرأ سور القرآن الكريم الـ 114 مع التفسير الميسر، استمع لأشهر القراء وحمّل التلاوات بصيغة MP3 بجودة عالية.',
  },
  azkar: {
    title: 'أذكار الصباح والمساء وأدعية المسلم الصحيحة | سَكِينة',
    description:
      'تصفح وسبّح بأذكار الصباح والمساء، أذكار النوم والاستيقاظ، وأدعية مأثورة من القرآن والسنة الصحيحة.',
  },
  tasbih: {
    title: 'السبحة الإلكترونية الذكية وحفظ التسبيحات | سَكِينة',
    description:
      'سبحة إلكترونية مريحة للعين مع عداد يومي وإجمالي وحفظ تلقائي لتسبيحاتك على جهازك.',
  },
  prayer: {
    title: 'مواقيت الصلاة الدقيقة في مصر والأذان المباشر | سَكِينة',
    description:
      'مواقيت الصلاة اليومية لجميع محافظات مصر الـ 27 ومدن العالم بدقة، مع تنبيهات الأذان بأعذب الأصوات.',
  },
  qibla: {
    title: 'اتجاه القبلة الدقيق حسب محافظتك وموقعك | سَكِينة',
    description:
      'احسب زاوية واتجاه القبلة نحو الكعبة المشرفة بدقة حسب محافظتك أو إحداثيات GPS.',
  },
  radio: {
    title: 'إذاعة القرآن الكريم والبث المباشر 24/7 | سَكِينة',
    description:
      'استمع إلى إذاعة القرآن الكريم وعشرات الإذاعات القرآنية المباشرة بجودة نقية بدون انقطاع.',
  },
  names_of_allah: {
    title: 'أسماء الله الحسنى 99 وشرح معانيها | سَكِينة',
    description:
      'تعرّف على أسماء الله الحسنى الـ 99 ومعانيها الإيمانية وشرحها المبسط في سَكِينة.',
  },
  downloads: {
    title: 'تحميلاتي الصوتية من القرآن الكريم | سَكِينة',
    description: 'استمع إلى سور القرآن الكريم المحملة بصيغة MP3 وإدارتها بسهولة.',
  },
  more: {
    title: 'الإعدادات وخطة الختمة وإحصائياتك | سَكِينة',
    description: 'إدارة خطة ختمة القرآن الكريم، المفضلة، وحجم الخط في موقع سَكِينة.',
  },
  ad_contact: {
    title: 'أعلن معنا وتواصل مع مطور سَكِينة',
    description: 'أرسل رسالتك أو طلب الإعلان مباشرة إلى مطور موقع سَكِينة.',
  },
};

function upsertMeta(attrName: 'name' | 'property', key: string, content: string): void {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attrName}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(url: string): void {
  if (typeof document === 'undefined') return;
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function upsertJsonLd(schemaObj: Record<string, unknown>): void {
  if (typeof document === 'undefined') return;
  let script = document.head.querySelector<HTMLScriptElement>('#sakina-dynamic-jsonld');
  if (!script) {
    script = document.createElement('script');
    script.id = 'sakina-dynamic-jsonld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schemaObj);
}

export function applyDynamicSeo(activeTab: ActiveTab): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const origin = window.location.origin;

  const tabMeta = TAB_SEO_MAP[activeTab] || TAB_SEO_MAP.home;
  const canonical = activeTab === 'home' ? `${origin}/` : `${origin}/?tab=${activeTab}`;

  document.title = tabMeta.title;
  upsertMeta('name', 'description', tabMeta.description);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:title', tabMeta.title);
  upsertMeta('property', 'og:description', tabMeta.description);
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('name', 'twitter:title', tabMeta.title);
  upsertMeta('name', 'twitter:description', tabMeta.description);
  upsertCanonical(canonical);

  upsertJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'سَكِينة - Sakina',
    url: canonical,
    inLanguage: 'ar',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'All',
    description: tabMeta.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EGP',
    },
  });
}

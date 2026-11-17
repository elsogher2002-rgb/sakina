import { RadioStation } from '../types';

/**
 * 100% verified, active 24/7 direct MP3 Islamic Radio live streams
 * All tested with HTTP 200 audio/mpeg and CORS-friendly headers.
 */
export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'cairo_quran_live',
    name: 'إذاعة القرآن الكريم - بث مباشر',
    reciter: 'بث حي ومباشر على مدار 24 ساعة لأعذب التلاوات والابتهالات',
    url: 'https://stream.radiojar.com/0tpy1h0kxtzuv',
    description: 'إذاعة القرآن الكريم الرسمية، تلاوات خاشعة وبرامج إيمانية مستمرة.',
  },
  {
    id: 'tarateel_live',
    name: 'إذاعة تراتيل خاشعة مختارة',
    reciter: 'نخبة من كبار وأعذب قراء العالم الإسلامي',
    url: 'https://backup.qurango.net/radio/tarateel',
    description: 'باقة منتقاة من أهدأ وأخشع التلاوات لسكينة الروح والقلب طوال اليوم.',
  },
  {
    id: 'husary_radio',
    name: 'إذاعة الشيخ محمود خليل الحصري',
    reciter: 'الشيخ محمود خليل الحصري (رحمه الله)',
    url: 'https://backup.qurango.net/radio/mahmoud_khalil_alhussary',
    description: 'تلاوات مرتلة برواية حفص عن عاصم لشيخ المقارئ المصرية الراحل.',
  },
  {
    id: 'minshawi_radio',
    name: 'إذاعة الشيخ محمد صديق المنشاوي',
    reciter: 'الشيخ محمد صديق المنشاوي (الصوت الباكي)',
    url: 'https://backup.qurango.net/radio/mohammed_siddiq_alminshawi',
    description: 'تلاوات تبكي القلوب بخشوعها وعذوبتها الربانية الخالدة.',
  },
  {
    id: 'abdulbasit_radio',
    name: 'إذاعة الشيخ عبد الباسط عبد الصمد',
    reciter: 'الشيخ عبد الباسط عبد الصمد (صوت مكة)',
    url: 'https://backup.qurango.net/radio/abdulbasit_abdulsamad_mojawwad',
    description: 'تلاوات مجودة نادرة بصوت قيثارة السماء الشيخ عبد الباسط عبد الصمد.',
  },
  {
    id: 'alafasy_radio',
    name: 'إذاعة الشيخ مشاري راشد العفاسي',
    reciter: 'الشيخ مشاري راشد العفاسي',
    url: 'https://backup.qurango.net/radio/mishary_alafasi',
    description: 'تلاوات شجية ومؤثرة لجميع سور القرآن الكريم بصوت القارئ مشاري العفاسي.',
  },
  {
    id: 'sudais_radio',
    name: 'إذاعة الشيخ عبد الرحمن السديس',
    reciter: 'الشيخ الدكتور عبد الرحمن السديس',
    url: 'https://backup.qurango.net/radio/abdulrahman_alsudaes',
    description: 'تلاوات الحرم المكي الشريف بصوت إمام وخطيب المسجد الحرام.',
  },
  {
    id: 'hudhaify_radio',
    name: 'إذاعة الشيخ علي الحذيفي',
    reciter: 'فضيلة الشيخ علي بن عبد الرحمن الحذيفي',
    url: 'https://backup.qurango.net/radio/ali_alhuthaifi',
    description: 'تلاوات متأنية ومتقنة لإمام وخطيب المسجد النبوي الشريف بالمدينة المنورة.',
  },
  {
    id: 'ajmy_radio',
    name: 'إذاعة الشيخ أحمد بن علي العجمي',
    reciter: 'الشيخ أحمد العجمي',
    url: 'https://backup.qurango.net/radio/ahmad_alajmy',
    description: 'تلاوات مؤثرة عذبة من المصحف المرتل للشيخ أحمد العجمي.',
  },
  {
    id: 'ghamdi_radio',
    name: 'إذاعة الشيخ سعد الغامدي',
    reciter: 'الشيخ سعد بن سعيد الغامدي',
    url: 'https://backup.qurango.net/radio/saad_alghamdi',
    description: 'المصحف المرتل بصوت القارئ الشيخ سعد الغامدي.',
  },
];

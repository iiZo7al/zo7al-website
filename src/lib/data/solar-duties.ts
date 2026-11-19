export interface SolarRoleDuty {
  id: string;
  title: string;
  desc: string;
  frequency: "daily" | "weekly" | "per_task" | "continuous";
  frequencyLabel: string;
}

export interface SolarRoleDutiesConfig {
  roleId: string;
  roleLabel: string;
  description: string;
  duties: SolarRoleDuty[];
}

export const SOLAR_ROLE_DUTIES: Record<string, SolarRoleDutiesConfig> = {
  creator: {
    roleId: "creator",
    roleLabel: "صانع محتوى",
    description: "مسؤوليات صناع المحتوى لإنتاج وتقديم محتوى احترافي يمثل شبكة وكلان Solar.",
    duties: [
      {
        id: "c1",
        title: "جدولة ونشر المقاطع بانتظام",
        desc: "الالتزام بجدول نشر دوري (أسبوعياً أو حسب الخطة المتفق عليها) بجودة صوت وصورة عالية.",
        frequency: "weekly",
        frequencyLabel: "أسبوعي",
      },
      {
        id: "c2",
        title: "التنسيق المبكر مع فريق الإنتاج",
        desc: "رفع طلبات الأفكار والمونتاج والتصميم عبر المنصة قبل موعد النشر بوقت كافٍ.",
        frequency: "per_task",
        frequencyLabel: "عند كل طلب",
      },
      {
        id: "c3",
        title: "تطبيق هوية وشعار الكلان",
        desc: "وضع شعار كلان Solar وروابط شبكة زحل في وصف الفيديو أو المقدمة حسب معايير الكلان.",
        frequency: "per_task",
        frequencyLabel: "عند كل مقطع",
      },
      {
        id: "c4",
        title: "التفاعل الإيجابي مع الجمهور",
        desc: "الرد على المتابعين باحترافية، وتمثيل الكلان في منصات التواصل بصورة مشرفة ومحترمة.",
        frequency: "continuous",
        frequencyLabel: "مستمر",
      },
      {
        id: "c5",
        title: "حضور الاجتماعات والمشاركة في الفعاليات",
        desc: "المشاركة في الاجتماعات الدورية لصناع المحتوى والفعاليات والتحديات المشتركة.",
        frequency: "weekly",
        frequencyLabel: "دوري",
      },
    ],
  },
  writer: {
    roleId: "writer",
    roleLabel: "كاتب أفكار",
    description: "مسؤوليات كتاب الأفكار لصناعة محتوى إبداعي وسيناريوهات تصوير جذابة.",
    duties: [
      {
        id: "w1",
        title: "ابتكار أفكار وسيناريوهات تصوير جديدة",
        desc: "كتابة أفكار مقاطع وتحديات مميزة تناسب أسلوب صانع المحتوى وهوية الكلان.",
        frequency: "weekly",
        frequencyLabel: "أسبوعي",
      },
      {
        id: "w2",
        title: "متابعة الترندات وتحويلها لأفكار عملية",
        desc: "رصد الترندات في يوتيوب وتيك توك وصياغتها في قوالب تناسب ألعاب الكلان.",
        frequency: "continuous",
        frequencyLabel: "مستمر",
      },
      {
        id: "w3",
        title: "صياغة خطة محكمة للمقطع (Hook + Body + CTA)",
        desc: "تجهيز خطاف قوي (Hook) في أول 10 ثوانٍ لشد المشاهد مع خاتمة واضحة وممتعة.",
        frequency: "per_task",
        frequencyLabel: "عند كل فكرة",
      },
      {
        id: "w4",
        title: "استلام طلبات صناع المحتوى والموافقة عليها",
        desc: "متابعة قسم الطلبات الواردة من صناع المحتوى وسرعة الرد والتسليم.",
        frequency: "daily",
        frequencyLabel: "يومي",
      },
      {
        id: "w5",
        title: "تقبل التعديلات والملاحظات بصدر رحب",
        desc: "التنسيق المباشر مع صانع المحتوى لتعديل أي نقطة حتى الوصول للصيغة المثالية.",
        frequency: "per_task",
        frequencyLabel: "عند الحاجة",
      },
    ],
  },
  editor: {
    roleId: "editor",
    roleLabel: "ممنتج",
    description: "مسؤوليات الممنتجين لتقديم إخراج بصري وصوتي سلس وجذاب.",
    duties: [
      {
        id: "e1",
        title: "استلام طلبات المونتاج والبدء فوراً",
        desc: "متابعة قسم طلبات المونتاج من صناع المحتوى والموافقة على استلام الطلب بالموعد.",
        frequency: "daily",
        frequencyLabel: "يومي",
      },
      {
        id: "e2",
        title: "الالتزام بمواعيد التسليم (Deadlines)",
        desc: "تسليم مسودة المونتاج الأولى في الوقت المتفق عليه لتفادي تأخير جدول النشر.",
        frequency: "per_task",
        frequencyLabel: "لكل مقطع",
      },
      {
        id: "e3",
        title: "مؤثرات بصرية وصوتية احترافية بدون حقوق",
        desc: "استخدام ساوند تراك ومؤثرات صوتية نقية ومرخصة بدون حقوق طبع ونشر (Copyright Free).",
        frequency: "per_task",
        frequencyLabel: "لكل مقطع",
      },
      {
        id: "e4",
        title: "ضبط الإيقاع والقصقصة الحركية (Pacing)",
        desc: "حذف الفراغات والمشاهد المملة للحفاظ على تفاعل المشاهد ومعدل المشاهدة (Retention).",
        frequency: "per_task",
        frequencyLabel: "لكل مقطع",
      },
      {
        id: "e5",
        title: "إجراء التعديلات المطلوبة بسرعة",
        desc: "تنفيذ التعديلات الإخراجية المطلوبة من صانع المحتوى بدقة وسرعة.",
        frequency: "per_task",
        frequencyLabel: "عند التعديل",
      },
    ],
  },
  designer: {
    roleId: "designer",
    roleLabel: "مصمم",
    description: "مسؤوليات المصممين لإبراز هوية الكلان وصناعة صور مصغرة ذات معدل نقر مرتفع.",
    duties: [
      {
        id: "d1",
        title: "تصميم صور مصغرة عالية الجاذبية (CTR)",
        desc: "تصميم صور تعبر عن الفكرة بوضوح وتشد الانتباه وفق أفضل المعايير البصرية.",
        frequency: "per_task",
        frequencyLabel: "لكل مقطع",
      },
      {
        id: "d2",
        title: "استلام طلبات التصميم وتأكيد البدء",
        desc: "الاطلاع على طلبات التصميم في المنصة والموافقة عليها والتواصل لتوضيح التفاصيل.",
        frequency: "daily",
        frequencyLabel: "يومي",
      },
      {
        id: "d3",
        title: "الالتزام بالهوية البصرية لكلان Solar",
        desc: "استخدام درجات الألوان المعتمدة (البرتقالي/الذهبي)، والشعارات الرسمية بدقة ونظافة.",
        frequency: "continuous",
        frequencyLabel: "مستمر",
      },
      {
        id: "d4",
        title: "تسليم ملفات العمل بأعلى دقة وصيغ مناسبة",
        desc: "تسليم الصور بصيغة PNG أو WebP بدقة 1080p على الأقل وبحجم مناسب للمنصة.",
        frequency: "per_task",
        frequencyLabel: "عند التسليم",
      },
      {
        id: "d5",
        title: "المرونة والسرعة في تعديل الملاحظات",
        desc: "تعديل النصوص أو الإضاءة بناءً على رغبة صانع المحتوى أو إدارة الكلان.",
        frequency: "per_task",
        frequencyLabel: "عند الحاجة",
      },
    ],
  },
  streamer: {
    roleId: "streamer",
    roleLabel: "ستريمر",
    description: "مسؤوليات الستريمرز لتقديم بثوث مباشرة حماسية وبأجواء تفاعلية ممتازة.",
    duties: [
      {
        id: "s1",
        title: "الالتزام بجدول بث أسبوعي منتظم",
        desc: "تحديد ساعات وأيام البث الأسبوعية وإعلانها لمجتمع الكلان في الديسكورد.",
        frequency: "weekly",
        frequencyLabel: "أسبوعي",
      },
      {
        id: "s2",
        title: "تضمين أوفرلاي وهوية الكلان في البث",
        desc: "وضع شعار الكلان ورابط الموقع أو الديسكورد في شاشة البث المباشر (Overlay).",
        frequency: "per_task",
        frequencyLabel: "لكل بث",
      },
      {
        id: "s3",
        title: "الحفاظ على السلوك الإيجابي والروح الرياضية",
        desc: "الالتزام بالأخلاق واللباقة وعدم إثارة الشحناء أو الإساءة للآخرين على الهواء.",
        frequency: "continuous",
        frequencyLabel: "مستمر",
      },
      {
        id: "s4",
        title: "المشاركة في بثوث وفعاليات الكلان الجماعية",
        desc: "التفاعل والتعاون مع الستريمرز الآخرين في الكلان في بطولات أو فعاليات مشتركة.",
        frequency: "weekly",
        frequencyLabel: "دوري",
      },
    ],
  },
  player: {
    roleId: "player",
    roleLabel: "لاعب بطولات",
    description: "مسؤوليات لاعبي الكلان التنافسيين في مختلف الألعاب (فورتنايت، روكيت ليق، فيفا، كود).",
    duties: [
      {
        id: "p1",
        title: "المشاركة في التمارين وسكرمات الكلان (Scrims)",
        desc: "الحضور في المواعيد المقررة للتمرين الفردي والجماعي لتطوير المستوى.",
        frequency: "daily",
        frequencyLabel: "يومي / دوري",
      },
      {
        id: "p2",
        title: "تمثيل الكلان في البطولات الرسمية",
        desc: "المشاركة في كؤوس وبطولات الألعاب المعتمدة ورفع اسم الكلان في المراكز المتقدمة.",
        frequency: "weekly",
        frequencyLabel: "أسبوعي",
      },
      {
        id: "p3",
        title: "وضع وسم وشعار الكلان في المعرفات",
        desc: "إضافة بادئة أو تاق الكلان (Solar / SLR) في الاسم داخل الألعاب المعتمدة.",
        frequency: "continuous",
        frequencyLabel: "مستمر",
      },
      {
        id: "p4",
        title: "إبلاغ مشرف اللاعبين بأي اعتذار مسبقاً",
        desc: "في حال وجود ظرف طارئ يمنع من اللعب، تقديم إشعار أو طلب إجازة عبر المنصة.",
        frequency: "per_task",
        frequencyLabel: "عند الظروف",
      },
    ],
  },
  admin: {
    roleId: "admin",
    roleLabel: "إداري ومشرف",
    description: "مسؤوليات المشرفين والإداريين لضمان انضباط الكلان وراحة الأعضاء وسير العمل.",
    duties: [
      {
        id: "a1",
        title: "متابعة انضباط الأعضاء وسير الأقسام",
        desc: "التأكد من التزام كل قسم بمهامه وتقديم الدعم والتوجيه اللازم للأعضاء.",
        frequency: "daily",
        frequencyLabel: "يومي",
      },
      {
        id: "a2",
        title: "مراجعة طلبات الإجازات وتعهدات الإنذار",
        desc: "الرد على طلبات الأعضاء في لوحة الإدارة في غضون 24-48 ساعة بعدل ومرونة.",
        frequency: "daily",
        frequencyLabel: "يومي",
      },
      {
        id: "a3",
        title: "حل الخلافات بروح الفريق والعدالة",
        desc: "الاستماع لكافة الأطراف بهدوء وفصل أي نزاع بما يحفظ كرامة وانسجام الكلان.",
        frequency: "continuous",
        frequencyLabel: "مستمر",
      },
      {
        id: "a4",
        title: "تنظيم الفعاليات الداخلية والأنشطة",
        desc: "المساهمة في ابتكار بطولات داخلية وفعاليات تجمع الأعضاء وتزيد ترابطهم.",
        frequency: "weekly",
        frequencyLabel: "دوري",
      },
    ],
  },
};

/**
 * Matches a user's free-text or structured rank to a corresponding duties role ID.
 */
export function resolveDutiesRoleId(rank: string | undefined | null): string {
  if (!rank) return "creator";
  const normalized = rank.toLowerCase().trim();

  if (normalized.includes("صانع محتوى") || normalized.includes("creator")) return "creator";
  if (normalized.includes("ممنتج") || normalized.includes("editor")) return "editor";
  if (normalized.includes("مصمم") || normalized.includes("designer")) return "designer";
  if (normalized.includes("كاتب") || normalized.includes("أفكار") || normalized.includes("writer")) return "writer";
  if (normalized.includes("ستريمر") || normalized.includes("streamer")) return "streamer";
  if (normalized.includes("لاعب") || normalized.includes("player")) return "player";
  if (
    normalized.includes("إداري") ||
    normalized.includes("مشرف") ||
    normalized.includes("رئيس") ||
    normalized.includes("مراقب") ||
    normalized.includes("admin")
  ) {
    return "admin";
  }

  return "creator";
}

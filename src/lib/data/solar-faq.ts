import type { FaqItem } from "@/lib/data/faq";

export interface SolarFaqBundle {
  eyebrow: string;
  title: string;
  text: string;
  categories: Record<string, string>;
  items: FaqItem[];
}

export function getSolarFaq(locale: string): SolarFaqBundle {
  if (locale === "ar") {
    return {
      eyebrow: "الأسئلة الشائعة",
      title: "إجابات حول كلان Solar System",
      text: "كل ما تحتاج معرفته عن التقديم، الأقسام المتاحة، القوانين، وطبيعة الانضمام للكلان.",
      categories: {
        joining: "التقديم والانضمام",
        divisions: "الأقسام والرتب",
        rules: "القوانين والعقد",
      },
      items: [
        {
          id: "solar-paid",
          category: "joining",
          q: "هل يوجد راتب أو مقابل مادي في كلان Solar؟",
          a: "لا، الكلان مجتمعي وتنافسي وتطوعي بالكامل ولا يوجد فيه أي رواتب أو مبالغ مالية. الفائدة من الانضمام هي التطوير، التعاون الجماعي، المشاركة في البطولات والفعاليات، وبناء الخبرة والحضور مع الفريق.",
        },
        {
          id: "solar-how-to-apply",
          category: "joining",
          q: "كيف أقدّم للانضمام إلى كلان Solar System؟",
          a: "اضغط على زر \"قدّم الآن\" في أعلى الصفحة أو اختر القسم المناسب لك من قائمة الأقسام، ثم املأ البيانات المطلوبة ووقّع التعهد إلكترونياً. بعد الإرسال ستحصل على رقم تتبع لمتابعة حالة طلبك.",
        },
        {
          id: "solar-discord-required",
          category: "joining",
          q: "هل يشترط وجودي في سيرفر الديسكورد الرسمي للكلان؟",
          a: "نعم، سيرفر ديسكورد الفريق هو المنصة الرسمية والأساسية لجميع أمور الكلان من إعلانات واجتماعات واختبارات وتدريبات وتنسيق بين الأعضاء والإدارة.",
        },
        {
          id: "solar-divisions-list",
          category: "divisions",
          q: "ما هي الأقسام المتاحة حالياً للتقديم في الكلان؟",
          a: "الأقسام المتوفرة في الكلان هي: صانع محتوى، ستريمر، مصمم، ممنتج، لاعب (روكيت ليق، فورتنايت، ماينكرافت، أو فيفا)، إداري، وكاتب أفكار.",
        },
        {
          id: "solar-contract-duration",
          category: "rules",
          q: "ما هي مدة العقد في الكلان وهل يمكن تجديده؟",
          a: "تتراوح مدة العقد بين شهرين وسنتين حسب اختيارك واتفاقك مع الإدارة (شهرين، 3، 4، 5، 6 شهور، سنة، أو سنتين)، ويخضع تجديده لموافقة الإدارة وتقييم أدائك.",
        },
        {
          id: "solar-signature",
          category: "rules",
          q: "كيف أوقّع تعهد الانضمام في نموذج التقديم؟",
          a: "التوقيع الرقمي المباشر داخل نموذج التقديم هو الخيار الأساسي؛ يمكنك رسم توقيعك بالمربع المخصص واعتماده فوراً، أو استخدام خيار رفع صورة العقد الموقعة.",
        },
        {
          id: "solar-review-time",
          category: "joining",
          q: "كم يستغرق الرد على طلب التقديم؟",
          a: "تتم مراجعة الطلبات من قبل الإدارة المختصة في أقرب وقت، ويمكنك متابعة حالة طلبك في أي لحظة عبر صفحة التتبع أو انتظار تواصل الإدارة معك عبر الديسكورد أو الواتساب.",
        },
        {
          id: "solar-admin-ranks",
          category: "divisions",
          q: "هل يمكن التقديم على رتب إدارية محددة؟",
          a: "نعم، عند اختيار قسم \"إداري\" ستظهر لك الرتب الإدارية المتاحة حالياً في الكلان (وقد تقوم الإدارة بإغلاق التقديم على بعض الرتب مؤقتاً عند اكتمال العدد).",
        },
      ],
    };
  }

  return {
    eyebrow: "FAQ",
    title: "Frequently Asked Questions",
    text: "Everything you need to know about applying, clan divisions, contracts, and how Solar System operates.",
    categories: {
      joining: "Joining & Applications",
      divisions: "Divisions & Ranks",
      rules: "Rules & Contract",
    },
    items: [
      {
        id: "solar-paid",
        category: "joining",
        q: "Is there any salary or monetary payment in Solar Clan?",
        a: "No. Solar System is a voluntary community and competitive gaming clan with no salaries or financial payouts. Members join for teamwork, collaborations, events, tournaments, and experience.",
      },
      {
        id: "solar-how-to-apply",
        category: "joining",
        q: "How do I apply to join Solar System Team?",
        a: "Click \"Apply Now\" at the top of the page or pick a division card, complete the application form, and sign the pledge digitally. You will receive a tracking code right after submitting.",
      },
      {
        id: "solar-discord-required",
        category: "joining",
        q: "Is joining the official Discord server required?",
        a: "Yes. The official Discord server is the main hub for all announcements, tryouts, meetings, events, and communication with leadership.",
      },
      {
        id: "solar-divisions-list",
        category: "divisions",
        q: "What divisions are currently available?",
        a: "Available divisions are: Content Creator, Streamer, Designer, Video Editor, Player (Rocket League, Fortnite, Minecraft, or FIFA), Staff & Admin, and Idea Writer.",
      },
      {
        id: "solar-contract-duration",
        category: "rules",
        q: "How long is the clan contract and can it be renewed?",
        a: "Contracts range from 2 months up to 2 years based on your selection and management agreement, and renewals are subject to performance reviews.",
      },
      {
        id: "solar-signature",
        category: "rules",
        q: "How do I sign the clan pledge?",
        a: "Digital signature directly inside the form is the primary method — simply draw and save your signature, or optionally upload a signed contract image.",
      },
      {
        id: "solar-review-time",
        category: "joining",
        q: "How long does application review take?",
        a: "Applications are reviewed by the relevant staff as soon as possible. You can check your status anytime on the tracking page or wait for Discord/WhatsApp contact.",
      },
      {
        id: "solar-admin-ranks",
        category: "divisions",
        q: "Can I apply for specific staff/admin ranks?",
        a: "Yes, selecting Staff & Admin lets you choose from open administrative ranks (some ranks may be temporarily closed by management when full).",
      },
    ],
  };
}

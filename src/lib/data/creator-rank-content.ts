export type CreatorPlatform = "youtube" | "twitch" | "tiktok";
export type CreatorRankContent = {
  title: string; intro: string[]; sections: { title: string; items: string[] }[];
  summary: string[][]; preview: string[]; free: string;
};
const content: Record<string, Record<CreatorPlatform, CreatorRankContent>> = {
  "en": {
    "youtube": {
      "title": "YouTube Rank – Zo7al Network",
      "intro": [
        "The **YouTube Rank** is a special free rank designed for content creators who create videos and content about **Zo7al Network**.",
        "This rank **cannot be purchased**. You must submit an application, and your application will be reviewed by the Zo7al Network team. Meeting the requirements does **not guarantee acceptance**."
      ],
      "sections": [
        {
          "title": "🎥 Creator Benefits:",
          "items": [
            "Exclusive **[YOUTUBE]** chat prefix",
            "Special YouTube creator name color",
            "YouTube Creator role on Discord",
            "Access to creator-only Discord channels",
            "Priority support for recording and content-related issues",
            "Recognition as an official Zo7al Network content creator"
          ]
        },
        {
          "title": "🎬 Recording Features:",
          "items": [
            "Access to `/record` to enable **Recording Mode**",
            "A special **REC indicator** appears next to your name while recording",
            "`/nick` access to temporarily change your displayed name while recording",
            "Ability to hide your real identity while recording when needed",
            "Quick access to creator tools designed for recording videos on the server"
          ]
        },
        {
          "title": "💬 Discord Benefits:",
          "items": [
            "Exclusive **YouTube Creator** Discord role",
            "Special Discord name color",
            "Access to creator-only channels",
            "Direct communication with the server team for content-related matters",
            "Opportunity to have your Zo7al Network content featured or promoted"
          ]
        },
        {
          "title": "📋 Application Information:",
          "items": [
            "The YouTube Rank is **completely free**",
            "You must submit an application to receive the rank",
            "Applications are reviewed manually by the Zo7al Network team",
            "Providing a YouTube channel does **not guarantee acceptance**",
            "Your channel, content quality, activity, and suitability for the server may be considered during review",
            "Providing false information may result in your application being rejected",
            "The rank may be removed if the creator becomes inactive or no longer meets the requirements"
          ]
        }
      ],
      "summary": [
        [
          "Rank Duration",
          "While eligible as an approved content creator."
        ],
        [
          "Price",
          "FREE."
        ],
        [
          "Application Required",
          "Yes."
        ],
        [
          "Acceptance",
          "Not guaranteed."
        ]
      ],
      "preview": [
        "Exclusive **[YOUTUBE]** chat prefix",
        "Access to `/record` — **Recording Mode**",
        "**REC indicator** while recording",
        "Access to `/nick`",
        "YouTube Creator role on Discord"
      ],
      "free": "FREE"
    },
    "twitch": {
      "title": "Twitch Rank – Zo7al Network",
      "intro": [
        "The **Twitch Rank** is a special free rank designed for streamers who broadcast **Zo7al Network** content live on Twitch.",
        "This rank **cannot be purchased**. You must submit an application, and your application will be reviewed by the Zo7al Network team. Meeting the requirements does **not guarantee acceptance**."
      ],
      "sections": [
        {
          "title": "🟣 Streamer Benefits:",
          "items": [
            "Exclusive **[TWITCH]** chat prefix",
            "Special Twitch streamer name color",
            "Recognition as an official Zo7al Network streamer",
            "Priority support for streaming and content-related issues",
            "Access to special streamer features while broadcasting"
          ]
        },
        {
          "title": "🔴 Live Streaming Features:",
          "items": [
            "Access to `/live` to enable **Live Mode**",
            "A special **LIVE indicator** appears next to your name while streaming",
            "`/nick` access to temporarily change your displayed name while live",
            "Ability to hide your real identity when needed during streams",
            "Access to streamer tools designed to make live content easier",
            "Ability to announce your stream to players when going live, subject to cooldowns",
            "Protection against excessive stream announcements or spam"
          ]
        },
        {
          "title": "💬 Discord Benefits:",
          "items": [
            "Exclusive **Twitch Streamer** Discord role",
            "Special Discord name color",
            "Access to creator-only Discord channels",
            "Ability to share approved Twitch streams in dedicated creator channels",
            "Direct communication with the server team for stream-related matters",
            "Opportunity to have your streams featured or promoted by Zo7al Network"
          ]
        },
        {
          "title": "📋 Application Information:",
          "items": [
            "The Twitch Rank is **completely free**",
            "You must submit an application to receive the rank",
            "Applications are reviewed manually by the Zo7al Network team",
            "Providing a Twitch channel does **not guarantee acceptance**",
            "Your stream quality, activity, audience, and suitability for the server may be considered during review",
            "Providing false information may result in your application being rejected",
            "The rank may be removed if the streamer becomes inactive or no longer meets the requirements"
          ]
        }
      ],
      "summary": [
        [
          "Rank Duration",
          "While eligible as an approved streamer."
        ],
        [
          "Price",
          "FREE."
        ],
        [
          "Application Required",
          "Yes."
        ],
        [
          "Acceptance",
          "Not guaranteed."
        ]
      ],
      "preview": [
        "Exclusive **[TWITCH]** chat prefix",
        "Access to `/live` — **Live Mode**",
        "**LIVE indicator** while streaming",
        "Access to `/nick`",
        "Twitch Streamer role on Discord"
      ],
      "free": "FREE"
    },
    "tiktok": {
      "title": "TikTok Rank – Zo7al Network",
      "intro": [
        "The **TikTok Rank** is a special free rank designed for creators who produce TikTok videos and short-form content featuring **Zo7al Network**.",
        "This rank **cannot be purchased**. You must submit an application, and your application will be reviewed by the Zo7al Network team. Meeting the requirements does **not guarantee acceptance**."
      ],
      "sections": [
        {
          "title": "🎵 Creator Benefits:",
          "items": [
            "Exclusive **[TIKTOK]** chat prefix",
            "Special TikTok creator name color",
            "Recognition as an official Zo7al Network TikTok creator",
            "Priority support for content creation and recording-related issues",
            "Access to special creator features for producing short-form content"
          ]
        },
        {
          "title": "📱 Content Creation Features:",
          "items": [
            "Access to `/record` to enable **Recording Mode**",
            "A special **REC indicator** appears next to your name while recording",
            "`/nick` access to temporarily change your displayed name while recording",
            "Ability to hide your real identity when needed during recordings",
            "Access to creator tools designed for clips and short-form videos",
            "Access to selected locations or features designed for recording content",
            "Ability to disable unnecessary visual distractions while recording"
          ]
        },
        {
          "title": "💬 Discord Benefits:",
          "items": [
            "Exclusive **TikTok Creator** Discord role",
            "Special Discord name color",
            "Access to creator-only Discord channels",
            "Ability to share approved TikTok videos in dedicated creator channels",
            "Direct communication with the server team for content-related matters",
            "Opportunity to have your TikTok videos featured or promoted by Zo7al Network"
          ]
        },
        {
          "title": "📋 Application Information:",
          "items": [
            "The TikTok Rank is **completely free**",
            "You must submit an application to receive the rank",
            "Applications are reviewed manually by the Zo7al Network team",
            "Providing a TikTok account does **not guarantee acceptance**",
            "Your content quality, activity, engagement, and suitability for the server may be considered during review",
            "Providing false information may result in your application being rejected",
            "The rank may be removed if the creator becomes inactive or no longer meets the requirements"
          ]
        }
      ],
      "summary": [
        [
          "Rank Duration",
          "While eligible as an approved content creator."
        ],
        [
          "Price",
          "FREE."
        ],
        [
          "Application Required",
          "Yes."
        ],
        [
          "Acceptance",
          "Not guaranteed."
        ]
      ],
      "preview": [
        "Exclusive **[TIKTOK]** chat prefix",
        "Access to `/record` — **Recording Mode**",
        "**REC indicator** while recording",
        "Access to `/nick`",
        "TikTok Creator role on Discord"
      ],
      "free": "FREE"
    }
  },
  "ar": {
    "youtube": {
      "title": "رتبة YouTube – شبكة زحل",
      "intro": [
        "رتبة **YouTube** رتبة مجانية مميزة مخصصة لصنّاع المحتوى الذين يصنعون فيديوهات ومحتوى عن **شبكة زحل**.",
        "هذه الرتبة **غير متاحة للشراء**. يجب تقديم طلب يراجعه فريق شبكة زحل. استيفاء الشروط **لا يضمن القبول**."
      ],
      "sections": [
        {
          "title": "🎥 مميزات صنّاع المحتوى:",
          "items": [
            "بادئة شات حصرية **[YOUTUBE]**",
            "لون اسم مميز لصنّاع محتوى يوتيوب",
            "رتبة YouTube Creator في ديسكورد",
            "دخول قنوات ديسكورد الخاصة بصنّاع المحتوى",
            "أولوية دعم لمشكلات التصوير وصناعة المحتوى",
            "التعريف بك كصانع محتوى معتمد لدى شبكة زحل"
          ]
        },
        {
          "title": "🎬 مميزات التصوير:",
          "items": [
            "استخدام `/record` لتفعيل **وضع التسجيل**",
            "ظهور علامة **REC** مميزة بجانب اسمك أثناء التسجيل",
            "استخدام `/nick` لتغيير اسمك الظاهر مؤقتًا أثناء التسجيل",
            "إمكانية إخفاء هويتك الحقيقية أثناء التسجيل عند الحاجة",
            "وصول سريع لأدوات صنّاع المحتوى المخصصة لتصوير فيديوهات داخل السيرفر"
          ]
        },
        {
          "title": "💬 مميزات ديسكورد:",
          "items": [
            "رتبة **YouTube Creator** حصرية في ديسكورد",
            "لون اسم مميز في ديسكورد",
            "دخول القنوات الخاصة بصنّاع المحتوى",
            "تواصل مباشر مع فريق السيرفر في الأمور المتعلقة بالمحتوى",
            "فرصة لعرض محتواك عن شبكة زحل أو الترويج له"
          ]
        },
        {
          "title": "📋 معلومات التقديم:",
          "items": [
            "رتبة YouTube **مجانية بالكامل**",
            "يجب تقديم طلب للحصول على الرتبة",
            "يراجع فريق شبكة زحل الطلبات يدويًا",
            "تقديم رابط قناة يوتيوب **لا يضمن القبول**",
            "قد تؤخذ قناتك وجودة محتواك ونشاطك ومدى ملاءمته للسيرفر في الاعتبار أثناء المراجعة",
            "قد يؤدي تقديم معلومات غير صحيحة إلى رفض طلبك",
            "قد تُسحب الرتبة إذا توقف صانع المحتوى عن النشاط أو لم يعد مستوفيًا للشروط"
          ]
        }
      ],
      "summary": [
        [
          "مدة الرتبة",
          "ما دمت مؤهلًا كصانع محتوى معتمد."
        ],
        [
          "السعر",
          "مجانًا."
        ],
        [
          "التقديم مطلوب",
          "نعم."
        ],
        [
          "القبول",
          "غير مضمون."
        ]
      ],
      "preview": [
        "بادئة شات حصرية **[YOUTUBE]**",
        "أمر `/record` لتفعيل **وضع التسجيل**",
        "علامة **REC** أثناء التسجيل",
        "الوصول إلى أمر `/nick`",
        "رتبة YouTube Creator في ديسكورد"
      ],
      "free": "مجانًا"
    },
    "twitch": {
      "title": "رتبة Twitch – شبكة زحل",
      "intro": [
        "رتبة **Twitch** رتبة مجانية مميزة مخصصة لصنّاع البثوث الذين يبثّون محتوى **شبكة زحل** مباشرة على تويتش.",
        "هذه الرتبة **غير متاحة للشراء**. يجب تقديم طلب يراجعه فريق شبكة زحل. استيفاء الشروط **لا يضمن القبول**."
      ],
      "sections": [
        {
          "title": "🟣 مميزات صنّاع البثوث:",
          "items": [
            "بادئة شات حصرية **[TWITCH]**",
            "لون اسم مميز لصنّاع بثوث تويتش",
            "التعريف بك كصانع بثوث معتمد لدى شبكة زحل",
            "أولوية دعم لمشكلات البث وصناعة المحتوى",
            "الوصول إلى مميزات خاصة بصنّاع البثوث أثناء البث"
          ]
        },
        {
          "title": "🔴 مميزات البث المباشر:",
          "items": [
            "استخدام `/live` لتفعيل **وضع البث المباشر**",
            "ظهور علامة **LIVE** مميزة بجانب اسمك أثناء البث",
            "استخدام `/nick` لتغيير اسمك الظاهر مؤقتًا أثناء البث",
            "إمكانية إخفاء هويتك الحقيقية عند الحاجة أثناء البث",
            "الوصول إلى أدوات تسهّل صناعة محتوى البث المباشر",
            "إمكانية إعلان بدء بثك للاعبين مع مراعاة فترات الانتظار بين الإعلانات",
            "حماية من الإفراط في إعلانات البث أو الرسائل المزعجة"
          ]
        },
        {
          "title": "💬 مميزات ديسكورد:",
          "items": [
            "رتبة **Twitch Streamer** حصرية في ديسكورد",
            "لون اسم مميز في ديسكورد",
            "دخول قنوات ديسكورد الخاصة بصنّاع المحتوى",
            "مشاركة بثوث تويتش المعتمدة في قنوات مخصصة لصنّاع المحتوى",
            "تواصل مباشر مع فريق السيرفر في الأمور المتعلقة بالبث",
            "فرصة لعرض بثوثك أو الترويج لها من شبكة زحل"
          ]
        },
        {
          "title": "📋 معلومات التقديم:",
          "items": [
            "رتبة Twitch **مجانية بالكامل**",
            "يجب تقديم طلب للحصول على الرتبة",
            "يراجع فريق شبكة زحل الطلبات يدويًا",
            "تقديم رابط قناة تويتش **لا يضمن القبول**",
            "قد تؤخذ جودة بثوثك ونشاطك وجمهورك ومدى ملاءمتها للسيرفر في الاعتبار أثناء المراجعة",
            "قد يؤدي تقديم معلومات غير صحيحة إلى رفض طلبك",
            "قد تُسحب الرتبة إذا توقف صاحب البث عن النشاط أو لم يعد مستوفيًا للشروط"
          ]
        }
      ],
      "summary": [
        [
          "مدة الرتبة",
          "ما دمت مؤهلًا كصانع بثوث معتمد."
        ],
        [
          "السعر",
          "مجانًا."
        ],
        [
          "التقديم مطلوب",
          "نعم."
        ],
        [
          "القبول",
          "غير مضمون."
        ]
      ],
      "preview": [
        "بادئة شات حصرية **[TWITCH]**",
        "أمر `/live` لتفعيل **وضع البث المباشر**",
        "علامة **LIVE** أثناء البث",
        "الوصول إلى أمر `/nick`",
        "رتبة Twitch Streamer في ديسكورد"
      ],
      "free": "مجانًا"
    },
    "tiktok": {
      "title": "رتبة TikTok – شبكة زحل",
      "intro": [
        "رتبة **TikTok** رتبة مجانية مميزة مخصصة لصنّاع فيديوهات تيك توك والمحتوى القصير الذي يعرض **شبكة زحل**.",
        "هذه الرتبة **غير متاحة للشراء**. يجب تقديم طلب يراجعه فريق شبكة زحل. استيفاء الشروط **لا يضمن القبول**."
      ],
      "sections": [
        {
          "title": "🎵 مميزات صنّاع المحتوى:",
          "items": [
            "بادئة شات حصرية **[TIKTOK]**",
            "لون اسم مميز لصنّاع محتوى تيك توك",
            "التعريف بك كصانع محتوى تيك توك معتمد لدى شبكة زحل",
            "أولوية دعم لمشكلات صناعة المحتوى والتسجيل",
            "الوصول إلى مميزات خاصة لصناعة المحتوى القصير"
          ]
        },
        {
          "title": "📱 مميزات صناعة المحتوى:",
          "items": [
            "استخدام `/record` لتفعيل **وضع التسجيل**",
            "ظهور علامة **REC** مميزة بجانب اسمك أثناء التسجيل",
            "استخدام `/nick` لتغيير اسمك الظاهر مؤقتًا أثناء التسجيل",
            "إمكانية إخفاء هويتك الحقيقية عند الحاجة أثناء التسجيل",
            "الوصول إلى أدوات مخصصة للقطات والفيديوهات القصيرة",
            "الوصول إلى مواقع أو مميزات مختارة مخصصة لتصوير المحتوى",
            "إمكانية إيقاف المؤثرات البصرية غير الضرورية أثناء التسجيل"
          ]
        },
        {
          "title": "💬 مميزات ديسكورد:",
          "items": [
            "رتبة **TikTok Creator** حصرية في ديسكورد",
            "لون اسم مميز في ديسكورد",
            "دخول قنوات ديسكورد الخاصة بصنّاع المحتوى",
            "مشاركة فيديوهات تيك توك المعتمدة في قنوات مخصصة لصنّاع المحتوى",
            "تواصل مباشر مع فريق السيرفر في الأمور المتعلقة بالمحتوى",
            "فرصة لعرض فيديوهاتك على تيك توك أو الترويج لها من شبكة زحل"
          ]
        },
        {
          "title": "📋 معلومات التقديم:",
          "items": [
            "رتبة TikTok **مجانية بالكامل**",
            "يجب تقديم طلب للحصول على الرتبة",
            "يراجع فريق شبكة زحل الطلبات يدويًا",
            "تقديم رابط حساب تيك توك **لا يضمن القبول**",
            "قد تؤخذ جودة محتواك ونشاطك وتفاعل جمهورك ومدى ملاءمته للسيرفر في الاعتبار أثناء المراجعة",
            "قد يؤدي تقديم معلومات غير صحيحة إلى رفض طلبك",
            "قد تُسحب الرتبة إذا توقف صانع المحتوى عن النشاط أو لم يعد مستوفيًا للشروط"
          ]
        }
      ],
      "summary": [
        [
          "مدة الرتبة",
          "ما دمت مؤهلًا كصانع محتوى معتمد."
        ],
        [
          "السعر",
          "مجانًا."
        ],
        [
          "التقديم مطلوب",
          "نعم."
        ],
        [
          "القبول",
          "غير مضمون."
        ]
      ],
      "preview": [
        "بادئة شات حصرية **[TIKTOK]**",
        "أمر `/record` لتفعيل **وضع التسجيل**",
        "علامة **REC** أثناء التسجيل",
        "الوصول إلى أمر `/nick`",
        "رتبة TikTok Creator في ديسكورد"
      ],
      "free": "مجانًا"
    }
  }
};
export function getCreatorRankContent(locale: string, platform: CreatorPlatform): CreatorRankContent {
  return (content[locale] ?? content.en)[platform];
}

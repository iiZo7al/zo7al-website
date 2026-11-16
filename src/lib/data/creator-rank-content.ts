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
  },
  "es": {
    "youtube": {
      "title": "Rango YouTube – Zo7al Network",
      "intro": [
        "El **Rango YouTube** es un rango gratuito especial para creadores que producen videos sobre **Zo7al Network**.",
        "Este rango **no se puede comprar**. Debes enviar una solicitud para revisión manual. Cumplir los requisitos **no garantiza la aceptación**."
      ],
      "sections": [
        { "title": "🎥 Beneficios de Creador:", "items": ["Prefijo exclusivo **[YOUTUBE]**", "Color de nombre especial", "Rol YouTube Creator en Discord", "Acceso a canales de creadores", "Soporte prioritario", "Reconocimiento oficial en Zo7al Network"] },
        { "title": "🎬 Funciones de Grabación:", "items": ["Comando `/record` para **Modo Grabación**", "Indicador **REC** junto a tu nombre", "Acceso a `/nick` temporal", "Ocultar identidad real al grabar", "Herramientas rápidas para creadores"] },
        { "title": "💬 Beneficios en Discord:", "items": ["Rol exclusivo **YouTube Creator**", "Color especial en Discord", "Canales privados para creadores", "Comunicación directa con el equipo", "Oportunidad de promoción oficial"] },
        { "title": "📋 Información de Solicitud:", "items": ["Totalmente **gratuito**", "Requiere solicitud previa", "Revisión manual por el equipo", "No garantiza aceptación", "Se evalúa calidad y actividad", "Información falsa causa rechazo", "Puede retirarse por inactividad"] }
      ],
      "summary": [["Duración", "Mientras seas creador aprobado."], ["Precio", "GRATIS."], ["Solicitud", "Sí."], ["Aceptación", "No garantizada."]],
      "preview": ["Prefijo exclusivo **[YOUTUBE]**", "Comando `/record` — **Modo Grabación**", "Indicador **REC** al grabar", "Acceso a `/nick`", "Rol YouTube Creator en Discord"],
      "free": "GRATIS"
    },
    "twitch": {
      "title": "Rango Twitch – Zo7al Network",
      "intro": [
        "El **Rango Twitch** es un rango gratuito para streamers que transmiten **Zo7al Network** en directo en Twitch.",
        "Este rango **no se puede comprar**. Requiere solicitud y revisión manual. Cumplir los requisitos **no garantiza la aceptación**."
      ],
      "sections": [
        { "title": "🟣 Beneficios de Streamer:", "items": ["Prefijo exclusivo **[TWITCH]**", "Color especial de streamer", "Reconocimiento oficial", "Soporte prioritario en directos", "Funciones especiales en vivo"] },
        { "title": "🔴 Funciones en Directo:", "items": ["Comando `/live` para **Modo Directo**", "Indicador **LIVE** en tu nombre", "Acceso a `/nick` temporal", "Ocultar identidad en directos", "Anuncio de directo con cooldown"] },
        { "title": "💬 Beneficios en Discord:", "items": ["Rol exclusivo **Twitch Streamer**", "Color especial en Discord", "Canales de creadores", "Compartir directos aprobados", "Promoción oficial en Zo7al Network"] },
        { "title": "📋 Información de Solicitud:", "items": ["Totalmente **gratuito**", "Requiere solicitud", "Revisión manual", "No garantiza aceptación", "Puede retirarse por inactividad"] }
      ],
      "summary": [["Duración", "Mientras seas streamer aprobado."], ["Precio", "GRATIS."], ["Solicitud", "Sí."], ["Aceptación", "No garantizada."]],
      "preview": ["Prefijo exclusivo **[TWITCH]**", "Comando `/live` — **Modo Directo**", "Indicador **LIVE** en vivo", "Acceso a `/nick`", "Rol Twitch Streamer en Discord"],
      "free": "GRATIS"
    },
    "tiktok": {
      "title": "Rango TikTok – Zo7al Network",
      "intro": [
        "El **Rango TikTok** es un rango gratuito para creadores de videos cortos en TikTok sobre **Zo7al Network**.",
        "Este rango **no se puede comprar**. Requiere solicitud y revisión manual. Cumplir los requisitos **no garantiza la aceptación**."
      ],
      "sections": [
        { "title": "🎵 Beneficios de Creador:", "items": ["Prefijo exclusivo **[TIKTOK]**", "Color especial TikTok", "Reconocimiento oficial", "Soporte prioritario", "Funciones para contenido corto"] },
        { "title": "📱 Funciones de Creación:", "items": ["Comando `/record` para **Modo Grabación**", "Indicador **REC**", "Acceso a `/nick`", "Ocultar identidad al grabar", "Herramientas para clips cortos"] },
        { "title": "💬 Beneficios en Discord:", "items": ["Rol exclusivo **TikTok Creator**", "Color especial", "Canales de creadores", "Compartir videos aprobados", "Promoción en Zo7al Network"] },
        { "title": "📋 Información de Solicitud:", "items": ["Totalmente **gratuito**", "Requiere solicitud", "Revisión manual", "No garantiza aceptación", "Puede retirarse por inactividad"] }
      ],
      "summary": [["Duración", "Mientras seas creador aprobado."], ["Precio", "GRATIS."], ["Solicitud", "Sí."], ["Aceptación", "No garantizada."]],
      "preview": ["Prefijo exclusivo **[TIKTOK]**", "Comando `/record` — **Modo Grabación**", "Indicador **REC**", "Acceso a `/nick`", "Rol TikTok Creator en Discord"],
      "free": "GRATIS"
    }
  },
  "fr": {
    "youtube": {
      "title": "Grade YouTube – Zo7al Network",
      "intro": [
        "Le **Grade YouTube** est un grade gratuit destiné aux créateurs de vidéos sur **Zo7al Network**.",
        "Ce grade **ne peut pas être acheté**. Vous devez postuler et l'équipe examinera votre demande. Remplir les critères **ne garantit pas l'acceptation**."
      ],
      "sections": [
        { "title": "🎥 Avantages Créateur :", "items": ["Préfixe exclusif **[YOUTUBE]**", "Couleur de pseudo spéciale", "Rôle YouTube Creator sur Discord", "Accès aux salons créateurs", "Support prioritaire", "Statut de créateur officiel"] },
        { "title": "🎬 Fonctions d'Enregistrement :", "items": ["Commande `/record` pour le **Mode Enregistrement**", "Indicateur **REC** en jeu", "Accès à `/nick` temporaire", "Masquer son identité en tournage", "Outils dédiés aux vidéos"] },
        { "title": "💬 Avantages Discord :", "items": ["Rôle exclusif **YouTube Creator**", "Couleur spéciale sur Discord", "Salons privés créateurs", "Contact direct avec le staff", "Mise en avant possible de vos vidéos"] },
        { "title": "📋 Candidature :", "items": ["**100 % gratuit**", "Candidature requise", "Examen manuel par l'équipe", "Acceptation non garantie", "Retrait possible en cas d'inactivité"] }
      ],
      "summary": [["Durée", "Tant que vous êtes approuvé."], ["Prix", "GRATUIT."], ["Candidature", "Oui."], ["Acceptation", "Non garantie."]],
      "preview": ["Préfixe exclusif **[YOUTUBE]**", "Commande `/record` — **Mode Enregistrement**", "Indicateur **REC**", "Accès à `/nick`", "Rôle YouTube Creator sur Discord"],
      "free": "GRATUIT"
    },
    "twitch": {
      "title": "Grade Twitch – Zo7al Network",
      "intro": [
        "Le **Grade Twitch** est un grade gratuit pour les streamers diffusant **Zo7al Network** en direct sur Twitch.",
        "Ce grade **ne peut pas être acheté**. Une candidature est requise et **l'acceptation n'est pas garantie**."
      ],
      "sections": [
        { "title": "🟣 Avantages Streamer :", "items": ["Préfixe exclusif **[TWITCH]**", "Couleur spéciale streamer", "Reconnaissance officielle", "Support prioritaire", "Outils de diffusion en direct"] },
        { "title": "🔴 Fonctions Live :", "items": ["Commande `/live` pour le **Mode Live**", "Indicateur **LIVE**", "Accès à `/nick`", "Masquer son identité en stream", "Annonce de live avec délai"] },
        { "title": "💬 Avantages Discord :", "items": ["Rôle exclusif **Twitch Streamer**", "Couleur Discord spéciale", "Salons créateurs", "Partage de streams approuvés", "Promotion par Zo7al Network"] },
        { "title": "📋 Candidature :", "items": ["**100 % gratuit**", "Candidature requise", "Examen manuel", "Acceptation non garantie", "Retrait possible en cas d'inactivité"] }
      ],
      "summary": [["Durée", "Tant que vous êtes approuvé."], ["Prix", "GRATUIT."], ["Candidature", "Oui."], ["Acceptation", "Non garantie."]],
      "preview": ["Préfixe exclusif **[TWITCH]**", "Commande `/live` — **Mode Live**", "Indicateur **LIVE**", "Accès à `/nick`", "Rôle Twitch Streamer sur Discord"],
      "free": "GRATUIT"
    },
    "tiktok": {
      "title": "Grade TikTok – Zo7al Network",
      "intro": [
        "Le **Grade TikTok** est un grade gratuit pour les créateurs de vidéos courtes TikTok sur **Zo7al Network**.",
        "Ce grade **ne peut pas être acheté**. Une candidature est requise et **l'acceptation n'est pas garantie**."
      ],
      "sections": [
        { "title": "🎵 Avantages Créateur :", "items": ["Préfixe exclusif **[TIKTOK]**", "Couleur spéciale TikTok", "Reconnaissance officielle", "Support prioritaire", "Fonctions pour formats courts"] },
        { "title": "📱 Fonctions de Création :", "items": ["Commande `/record` pour le **Mode Enregistrement**", "Indicateur **REC**", "Accès à `/nick`", "Masquer son identité", "Outils pour clips"] },
        { "title": "💬 Avantages Discord :", "items": ["Rôle exclusif **TikTok Creator**", "Couleur Discord spéciale", "Salons créateurs", "Partage de vidéos approuvées", "Mise en avant par Zo7al Network"] },
        { "title": "📋 Candidature :", "items": ["**100 % gratuit**", "Candidature requise", "Examen manuel", "Acceptation non garantie", "Retrait possible en cas d'inactivité"] }
      ],
      "summary": [["Durée", "Tant que vous êtes approuvé."], ["Prix", "GRATUIT."], ["Candidature", "Oui."], ["Acceptation", "Non garantie."]],
      "preview": ["Préfixe exclusif **[TIKTOK]**", "Commande `/record` — **Mode Enregistrement**", "Indicateur **REC**", "Accès à `/nick`", "Rôle TikTok Creator sur Discord"],
      "free": "GRATUIT"
    }
  },
  "de": {
    "youtube": {
      "title": "YouTube-Rang – Zo7al Network",
      "intro": [
        "Der **YouTube-Rang** ist ein kostenloser Spezialrang für Creator, die Videos über **Zo7al Network** erstellen.",
        "Dieser Rang ist **nicht käuflich**. Eine Bewerbung ist erforderlich; das Erfüllen der Kriterien **garantiert keine Annahme**."
      ],
      "sections": [
        { "title": "🎥 Creator-Vorteile:", "items": ["Exklusives **[YOUTUBE]**-Chat-Präfix", "Spezielle Namensfarbe", "YouTube Creator-Rolle auf Discord", "Zugang zu Creator-Kanälen", "Prioritäts-Support", "Offizielle Anerkennung"] },
        { "title": "🎬 Aufnahme-Funktionen:", "items": ["`/record` für den **Aufnahmemodus**", "**REC-Anzeige** neben deinem Namen", "Temporäres `/nick`", "Identität bei Aufnahmen verbergen", "Schnelle Creator-Tools"] },
        { "title": "💬 Discord-Vorteile:", "items": ["Exklusive **YouTube Creator**-Rolle", "Spezielle Discord-Farbe", "Private Creator-Kanäle", "Direkter Kontakt zum Team", "Chance auf Feature/Promotion"] },
        { "title": "📋 Bewerbungsinfos:", "items": ["**Komplett kostenlos**", "Bewerbung erforderlich", "Manuelle Prüfung durch das Team", "Keine Annahmegarantie", "Kann bei Inaktivität entfernt werden"] }
      ],
      "summary": [["Dauer", "Solange du als Creator zugelassen bist."], ["Preis", "KOSTENLOS."], ["Bewerbung", "Ja."], ["Annahme", "Nicht garantiert."]],
      "preview": ["Exklusives **[YOUTUBE]**-Präfix", "`/record` — **Aufnahmemodus**", "**REC-Anzeige** beim Aufnehmen", "Zugriff auf `/nick`", "YouTube Creator-Rolle auf Discord"],
      "free": "KOSTENLOS"
    },
    "twitch": {
      "title": "Twitch-Rang – Zo7al Network",
      "intro": [
        "Der **Twitch-Rang** ist ein kostenloser Rang für Streamer, die **Zo7al Network** live auf Twitch übertragen.",
        "Dieser Rang ist **nicht käuflich**. Eine Bewerbung ist erforderlich und **garantiert keine Annahme**."
      ],
      "sections": [
        { "title": "🟣 Streamer-Vorteile:", "items": ["Exklusives **[TWITCH]**-Präfix", "Spezielle Streamer-Farbe", "Offizielle Anerkennung", "Prioritäts-Support", "Spezielle Live-Funktionen"] },
        { "title": "🔴 Live-Funktionen:", "items": ["`/live` für den **Live-Modus**", "**LIVE-Anzeige** beim Streamen", "Temporäres `/nick`", "Identität verbergen", "Stream-Ankündigung mit Cooldown"] },
        { "title": "💬 Discord-Vorteile:", "items": ["Exklusive **Twitch Streamer**-Rolle", "Spezielle Discord-Farbe", "Creator-Kanäle", "Streams teilen", "Promotion durch Zo7al Network"] },
        { "title": "📋 Bewerbungsinfos:", "items": ["**Komplett kostenlos**", "Bewerbung erforderlich", "Manuelle Prüfung", "Keine Annahmegarantie", "Kann bei Inaktivität entfernt werden"] }
      ],
      "summary": [["Dauer", "Solange du als Streamer zugelassen bist."], ["Preis", "KOSTENLOS."], ["Bewerbung", "Ja."], ["Annahme", "Nicht garantiert."]],
      "preview": ["Exklusives **[TWITCH]**-Präfix", "`/live` — **Live-Modus**", "**LIVE-Anzeige**", "Zugriff auf `/nick`", "Twitch Streamer-Rolle auf Discord"],
      "free": "KOSTENLOS"
    },
    "tiktok": {
      "title": "TikTok-Rang – Zo7al Network",
      "intro": [
        "Der **TikTok-Rang** ist ein kostenloser Rang für Creator von TikTok-Kurzvideos über **Zo7al Network**.",
        "Dieser Rang ist **nicht käuflich**. Eine Bewerbung ist erforderlich und **garantiert keine Annahme**."
      ],
      "sections": [
        { "title": "🎵 Creator-Vorteile:", "items": ["Exklusives **[TIKTOK]**-Präfix", "Spezielle TikTok-Farbe", "Offizielle Anerkennung", "Prioritäts-Support", "Tools für Kurzvideos"] },
        { "title": "📱 Aufnahme-Funktionen:", "items": ["`/record` für den **Aufnahmemodus**", "**REC-Anzeige**", "Zugriff auf `/nick`", "Identität verbergen", "Clip-Tools"] },
        { "title": "💬 Discord-Vorteile:", "items": ["Exklusive **TikTok Creator**-Rolle", "Spezielle Discord-Farbe", "Creator-Kanäle", "Videos teilen", "Promotion durch Zo7al Network"] },
        { "title": "📋 Bewerbungsinfos:", "items": ["**Komplett kostenlos**", "Bewerbung erforderlich", "Manuelle Prüfung", "Keine Annahmegarantie", "Kann bei Inaktivität entfernt werden"] }
      ],
      "summary": [["Dauer", "Solange du als Creator zugelassen bist."], ["Preis", "KOSTENLOS."], ["Bewerbung", "Ja."], ["Annahme", "Nicht garantiert."]],
      "preview": ["Exklusives **[TIKTOK]**-Präfix", "`/record` — **Aufnahmemodus**", "**REC-Anzeige**", "Zugriff auf `/nick`", "TikTok Creator-Rolle auf Discord"],
      "free": "KOSTENLOS"
    }
  },
  "pt": {
    "youtube": {
      "title": "Cargo YouTube – Zo7al Network",
      "intro": [
        "O **Cargo YouTube** é um cargo gratuito especial para criadores que produzem vídeos sobre a **Zo7al Network**.",
        "Este cargo **não pode ser comprado**. É necessário enviar uma candidatura; cumprir os requisitos **não garante aceitação**."
      ],
      "sections": [
        { "title": "🎥 Benefícios de Criador:", "items": ["Prefixo exclusivo **[YOUTUBE]**", "Cor especial no nome", "Cargo YouTube Creator no Discord", "Acesso a canais de criadores", "Suporte prioritário", "Reconhecimento oficial"] },
        { "title": "🎬 Recursos de Gravação:", "items": ["Comando `/record` para **Modo Gravação**", "Indicador **REC** ao gravar", "Acesso ao `/nick` temporário", "Ocultar identidade real", "Ferramentas para gravação"] },
        { "title": "💬 Benefícios no Discord:", "items": ["Cargo exclusivo **YouTube Creator**", "Cor especial no Discord", "Canais privados", "Contato direto com a equipe", "Chance de destaque oficial"] },
        { "title": "📋 Informações:", "items": ["**Totalmente gratuito**", "Requer candidatura", "Análise manual", "Sem garantia de aceitação", "Pode ser removido por inatividade"] }
      ],
      "summary": [["Duração", "Enquanto estiver elegível."], ["Preço", "GRÁTIS."], ["Candidatura", "Sim."], ["Aceitação", "Não garantida."]],
      "preview": ["Prefixo exclusivo **[YOUTUBE]**", "Comando `/record` — **Modo Gravação**", "Indicador **REC**", "Acesso ao `/nick`", "Cargo YouTube Creator no Discord"],
      "free": "GRÁTIS"
    },
    "twitch": {
      "title": "Cargo Twitch – Zo7al Network",
      "intro": [
        "O **Cargo Twitch** é um cargo gratuito para streamers que transmitem a **Zo7al Network** ao vivo na Twitch.",
        "Este cargo **não pode ser comprado**. Requer candidatura e **não garante aceitação**."
      ],
      "sections": [
        { "title": "🟣 Benefícios de Streamer:", "items": ["Prefixo exclusivo **[TWITCH]**", "Cor especial de streamer", "Reconhecimento oficial", "Suporte prioritário", "Recursos para lives"] },
        { "title": "🔴 Recursos Ao Vivo:", "items": ["Comando `/live` para **Modo Ao Vivo**", "Indicador **LIVE**", "Acesso ao `/nick`", "Ocultar identidade", "Anúncio de live com cooldown"] },
        { "title": "💬 Benefícios no Discord:", "items": ["Cargo exclusivo **Twitch Streamer**", "Cor especial no Discord", "Canais de criadores", "Compartilhar lives", "Divulgação pela Zo7al Network"] },
        { "title": "📋 Informações:", "items": ["**Totalmente gratuito**", "Requer candidatura", "Análise manual", "Sem garantia de aceitação", "Pode ser removido por inatividade"] }
      ],
      "summary": [["Duração", "Enquanto estiver elegível."], ["Preço", "GRÁTIS."], ["Candidatura", "Sim."], ["Aceitação", "Não garantida."]],
      "preview": ["Prefixo exclusivo **[TWITCH]**", "Comando `/live` — **Modo Ao Vivo**", "Indicador **LIVE**", "Acesso ao `/nick`", "Cargo Twitch Streamer no Discord"],
      "free": "GRÁTIS"
    },
    "tiktok": {
      "title": "Cargo TikTok – Zo7al Network",
      "intro": [
        "O **Cargo TikTok** é um cargo gratuito para criadores de vídeos curtos no TikTok sobre a **Zo7al Network**.",
        "Este cargo **não pode ser comprado**. Requer candidatura e **não garante aceitação**."
      ],
      "sections": [
        { "title": "🎵 Benefícios de Criador:", "items": ["Prefixo exclusivo **[TIKTOK]**", "Cor especial TikTok", "Reconhecimento oficial", "Suporte prioritário", "Recursos para vídeos curtos"] },
        { "title": "📱 Recursos de Criação:", "items": ["Comando `/record` para **Modo Gravação**", "Indicador **REC**", "Acesso ao `/nick`", "Ocultar identidade", "Ferramentas para clipes"] },
        { "title": "💬 Benefícios no Discord:", "items": ["Cargo exclusivo **TikTok Creator**", "Cor especial no Discord", "Canais de criadores", "Compartilhar vídeos", "Divulgação pela Zo7al Network"] },
        { "title": "📋 Informações:", "items": ["**Totalmente gratuito**", "Requer candidatura", "Análise manual", "Sem garantia de aceitação", "Pode ser removido por inatividade"] }
      ],
      "summary": [["Duração", "Enquanto estiver elegível."], ["Preço", "GRÁTIS."], ["Candidatura", "Sim."], ["Aceitação", "Não garantida."]],
      "preview": ["Prefixo exclusivo **[TIKTOK]**", "Comando `/record` — **Modo Gravação**", "Indicador **REC**", "Acesso ao `/nick`", "Cargo TikTok Creator no Discord"],
      "free": "GRÁTIS"
    }
  },
  "tr": {
    "youtube": {
      "title": "YouTube Rütbesi – Zo7al Network",
      "intro": [
        "**YouTube Rütbesi**, **Zo7al Network** hakkında video üreten içerik üreticileri için özel ve ücretsiz bir rütbedir.",
        "Bu rütbe **satın alınamaz**. Başvuru yapmanız gerekir; şartları karşılamak **kabul garantisi vermez**."
      ],
      "sections": [
        { "title": "🎥 Üretici Avantajları:", "items": ["Özel **[YOUTUBE]** sohbet ön eki", "Özel isim rengi", "Discord'da YouTube Creator rolü", "Üretici kanallarına erişim", "Öncelikli destek", "Resmi içerik üreticisi tanınırlığı"] },
        { "title": "🎬 Kayıt Özellikleri:", "items": ["**Kayıt Modu** için `/record` komutu", "Kayıt sırasında **REC** göstergesi", "Geçici `/nick` erişimi", "Kayıt sırasında kimliği gizleme", "Hızlı üretici araçları"] },
        { "title": "💬 Discord Avantajları:", "items": ["Özel **YouTube Creator** rolü", "Özel Discord rengi", "Özel üretici kanalları", "Ekip ile doğrudan iletişim", "İçerik tanıtım fırsatı"] },
        { "title": "📋 Başvuru Bilgileri:", "items": ["**Tamamen ücretsizdir**", "Başvuru gerektirir", "Manuel olarak incelenir", "Kabul garantisi yoktur", "Pasif kalındığında geri alınabilir"] }
      ],
      "summary": [["Süre", "Onaylı üretici olduğunuz sürece."], ["Fiyat", "ÜCRETSİZ."], ["Başvuru", "Gerekli."], ["Kabul", "Garanti değil."]],
      "preview": ["Özel **[YOUTUBE]** ön eki", "`/record` — **Kayıt Modu**", "Kayıt sırasında **REC** göstergesi", "`/nick` erişimi", "Discord'da YouTube Creator rolü"],
      "free": "ÜCRETSİZ"
    },
    "twitch": {
      "title": "Twitch Rütbesi – Zo7al Network",
      "intro": [
        "**Twitch Rütbesi**, Twitch'te **Zo7al Network** canlı yayını yapan yayıncılar için ücretsiz bir rütbedir.",
        "Bu rütbe **satın alınamaz**. Başvuru gerektirir ve **kabul garantisi vermez**."
      ],
      "sections": [
        { "title": "🟣 Yayıncı Avantajları:", "items": ["Özel **[TWITCH]** ön eki", "Özel yayıncı rengi", "Resmi tanınırlık", "Öncelikli destek", "Canlı yayın araçları"] },
        { "title": "🔴 Canlı Yayın Özellikleri:", "items": ["**Canlı Mod** için `/live`", "**LIVE** göstergesi", "`/nick` erişimi", "Kimliği gizleme", "Bekleme süreli yayın duyurusu"] },
        { "title": "💬 Discord Avantajları:", "items": ["Özel **Twitch Streamer** rolü", "Özel Discord rengi", "Üretici kanalları", "Yayın paylaşımı", "Zo7al Network tanıtımı"] },
        { "title": "📋 Başvuru Bilgileri:", "items": ["**Tamamen ücretsizdir**", "Başvuru gerektirir", "Manuel inceleme", "Kabul garantisi yoktur", "Pasiflikte geri alınabilir"] }
      ],
      "summary": [["Süre", "Onaylı yayıncı olduğunuz sürece."], ["Fiyat", "ÜCRETSİZ."], ["Başvuru", "Gerekli."], ["Kabul", "Garanti değil."]],
      "preview": ["Özel **[TWITCH]** ön eki", "`/live` — **Canlı Mod**", "**LIVE** göstergesi", "`/nick` erişimi", "Discord'da Twitch Streamer rolü"],
      "free": "ÜCRETSİZ"
    },
    "tiktok": {
      "title": "TikTok Rütbesi – Zo7al Network",
      "intro": [
        "**TikTok Rütbesi**, TikTok'ta **Zo7al Network** kısa videoları üretenler için ücretsiz bir rütbedir.",
        "Bu rütbe **satın alınamaz**. Başvuru gerektirir ve **kabul garantisi vermez**."
      ],
      "sections": [
        { "title": "🎵 Üretici Avantajları:", "items": ["Özel **[TIKTOK]** ön eki", "Özel TikTok rengi", "Resmi tanınırlık", "Öncelikli destek", "Kısa video araçları"] },
        { "title": "📱 İçerik Özellikleri:", "items": ["**Kayıt Modu** için `/record`", "**REC** göstergesi", "`/nick` erişimi", "Kimliği gizleme", "Klip araçları"] },
        { "title": "💬 Discord Avantajları:", "items": ["Özel **TikTok Creator** rolü", "Özel Discord rengi", "Üretici kanalları", "Video paylaşımı", "Zo7al Network tanıtımı"] },
        { "title": "📋 Başvuru Bilgileri:", "items": ["**Tamamen ücretsizdir**", "Başvuru gerektirir", "Manuel inceleme", "Kabul garantisi yoktur", "Pasiflikte geri alınabilir"] }
      ],
      "summary": [["Süre", "Onaylı üretici olduğunuz sürece."], ["Fiyat", "ÜCRETSİZ."], ["Başvuru", "Gerekli."], ["Kabul", "Garanti değil."]],
      "preview": ["Özel **[TIKTOK]** ön eki", "`/record` — **Kayıt Modu**", "**REC** göstergesi", "`/nick` erişimi", "Discord'da TikTok Creator rolü"],
      "free": "ÜCRETSİZ"
    }
  },
  "ja": {
    "youtube": {
      "title": "YouTubeランク – Zo7al Network",
      "intro": [
        "**YouTubeランク**は、**Zo7al Network**の動画コンテンツを制作するクリエイター向けの無料特別ランクです。",
        "このランクは**購入できません**。申請と運営チームによる審査が必要であり、条件を満たしても**承認は保証されません**。"
      ],
      "sections": [
        { "title": "🎥 クリエイター特典:", "items": ["専用 **[YOUTUBE]** チャットプレフィックス", "専用ネームカラー", "DiscordのYouTube Creatorロール", "クリエイター専用チャンネルへのアクセス", "優先サポート", "公式クリエイター認定"] },
        { "title": "🎬 録画機能:", "items": ["`/record` で**録画モード**を有効化", "録画中の **REC** 表示", "一時的な `/nick` 変更", "録画中の身元非表示", "撮影用クリエイターツール"] },
        { "title": "💬 Discord特典:", "items": ["専用 **YouTube Creator** ロール", "専用Discordカラー", "クリエイターチャンネル", "運営チームとの直接連絡", "公式紹介の機会"] },
        { "title": "📋 申請について:", "items": ["**完全無料**", "申請が必須", "運営による手動審査", "承認は保証されません", "活動停止時は剥奪される場合があります"] }
      ],
      "summary": [["有効期間", "認定クリエイターである間。"], ["価格", "無料。"], ["申請", "必須。"], ["承認", "保証なし。"]],
      "preview": ["専用 **[YOUTUBE]** プレフィックス", "`/record` — **録画モード**", "録画中の **REC** 表示", "`/nick` 利用可能", "Discord YouTube Creatorロール"],
      "free": "無料"
    },
    "twitch": {
      "title": "Twitchランク – Zo7al Network",
      "intro": [
        "**Twitchランク**は、Twitchで**Zo7al Network**をライブ配信するストリーマー向けの無料特別ランクです。",
        "このランクは**購入できません**。申請と審査が必要であり、**承認は保証されません**。"
      ],
      "sections": [
        { "title": "🟣 配信者特典:", "items": ["専用 **[TWITCH]** プレフィックス", "専用ネームカラー", "公式配信者認定", "優先サポート", "配信向け特別機能"] },
        { "title": "🔴 ライブ機能:", "items": ["`/live` で**配信モード**を有効化", "配信中の **LIVE** 表示", "一時的な `/nick`", "配信中の身元非表示", "クールダウン付き配信通知"] },
        { "title": "💬 Discord特典:", "items": ["専用 **Twitch Streamer** ロール", "専用Discordカラー", "クリエイターチャンネル", "配信リンクの共有", "公式プロモーション機会"] },
        { "title": "📋 申請について:", "items": ["**完全無料**", "申請が必須", "手動審査", "承認は保証されません", "活動停止時は剥奪される場合があります"] }
      ],
      "summary": [["有効期間", "認定配信者である間。"], ["価格", "無料。"], ["申請", "必須。"], ["承認", "保証なし。"]],
      "preview": ["専用 **[TWITCH]** プレフィックス", "`/live` — **配信モード**", "配信中の **LIVE** 表示", "`/nick` 利用可能", "Discord Twitch Streamerロール"],
      "free": "無料"
    },
    "tiktok": {
      "title": "TikTokランク – Zo7al Network",
      "intro": [
        "**TikTokランク**は、TikTokで**Zo7al Network**のショート動画を制作するクリエイター向けの無料ランクです。",
        "このランクは**購入できません**。申請と審査が必要であり、**承認は保証されません**。"
      ],
      "sections": [
        { "title": "🎵 クリエイター特典:", "items": ["専用 **[TIKTOK]** プレフィックス", "専用ネームカラー", "公式認定", "優先サポート", "ショート動画向け機能"] },
        { "title": "📱 制作機能:", "items": ["`/record` で**録画モード**", "**REC** 表示", "`/nick` 利用", "身元非表示", "クリップ撮影ツール"] },
        { "title": "💬 Discord特典:", "items": ["専用 **TikTok Creator** ロール", "専用カラー", "クリエイターチャンネル", "動画共有", "公式紹介の機会"] },
        { "title": "📋 申請について:", "items": ["**完全無料**", "申請が必須", "手動審査", "承認は保証されません", "活動停止時は剥奪される場合があります"] }
      ],
      "summary": [["有効期間", "認定クリエイターである間。"], ["価格", "無料。"], ["申請", "必須。"], ["承認", "保証なし。"]],
      "preview": ["専用 **[TIKTOK]** プレフィックス", "`/record` — **録画モード**", "**REC** 表示", "`/nick` 利用可能", "Discord TikTok Creatorロール"],
      "free": "無料"
    }
  },
  "ko": {
    "youtube": {
      "title": "YouTube 등급 – Zo7al Network",
      "intro": [
        "**YouTube 등급**은 **Zo7al Network** 관련 영상을 제작하는 크리에이터를 위한 무료 특별 등급입니다.",
        "이 등급은 **구매할 수 없으며** 신청 및 수동 심사를 거쳐야 합니다. 조건을 충족해도 **승인이 보장되지 않습니다**."
      ],
      "sections": [
        { "title": "🎥 크리에이터 혜택:", "items": ["전용 **[YOUTUBE]** 채팅 접두사", "전용 닉네임 색상", "Discord YouTube Creator 역할", "크리에이터 전용 채널 접근", "우선 지원", "공식 크리에이터 인증"] },
        { "title": "🎬 녹화 기능:", "items": ["`/record`로 **녹화 모드** 활성화", "녹화 중 **REC** 표시", "임시 `/nick` 변경", "녹화 중 신원 숨기기", "촬영 전용 크리에이터 도구"] },
        { "title": "💬 Discord 혜택:", "items": ["전용 **YouTube Creator** 역할", "전용 Discord 색상", "크리에이터 채널", "운영팀과 직접 소통", "공식 홍보 기회"] },
        { "title": "📋 신청 안내:", "items": ["**완전 무료**", "신청서 제출 필수", "운영팀 수동 심사", "승인 보장 안 됨", "비활동 시 회수 가능"] }
      ],
      "summary": [["유지 기간", "승인된 크리에이터인 동안."], ["가격", "무료."], ["신청 필수", "예."], ["승인", "보장되지 않음."]],
      "preview": ["전용 **[YOUTUBE]** 접두사", "`/record` — **녹화 모드**", "녹화 중 **REC** 표시", "`/nick` 사용 가능", "Discord YouTube Creator 역할"],
      "free": "무료"
    },
    "twitch": {
      "title": "Twitch 등급 – Zo7al Network",
      "intro": [
        "**Twitch 등급**은 Twitch에서 **Zo7al Network**를 생방송하는 스트리머를 위한 무료 등급입니다.",
        "이 등급은 **구매할 수 없으며** 신청 및 심사가 필요합니다. **승인이 보장되지 않습니다**."
      ],
      "sections": [
        { "title": "🟣 스트리머 혜택:", "items": ["전용 **[TWITCH]** 접두사", "전용 닉네임 색상", "공식 스트리머 인증", "우선 지원", "방송 전용 기능"] },
        { "title": "🔴 라이브 기능:", "items": ["`/live`로 **라이브 모드** 활성화", "방송 중 **LIVE** 표시", "임시 `/nick`", "방송 중 신원 숨기기", "쿨다운 적용 방송 알림"] },
        { "title": "💬 Discord 혜택:", "items": ["전용 **Twitch Streamer** 역할", "전용 색상", "크리에이터 채널", "방송 공유", "공식 홍보 기회"] },
        { "title": "📋 신청 안내:", "items": ["**완전 무료**", "신청 필수", "수동 심사", "승인 보장 안 됨", "비활동 시 회수 가능"] }
      ],
      "summary": [["유지 기간", "승인된 스트리머인 동안."], ["가격", "무료."], ["신청 필수", "예."], ["승인", "보장되지 않음."]],
      "preview": ["전용 **[TWITCH]** 접두사", "`/live` — **라이브 모드**", "방송 중 **LIVE** 표시", "`/nick` 사용 가능", "Discord Twitch Streamer 역할"],
      "free": "무료"
    },
    "tiktok": {
      "title": "TikTok 등급 – Zo7al Network",
      "intro": [
        "**TikTok 등급**은 TikTok에서 **Zo7al Network** 숏폼 영상을 제작하는 크리에이터를 위한 무료 등급입니다.",
        "이 등급은 **구매할 수 없으며** 신청 및 심사가 필요합니다. **승인이 보장되지 않습니다**."
      ],
      "sections": [
        { "title": "🎵 크리에이터 혜택:", "items": ["전용 **[TIKTOK]** 접두사", "전용 색상", "공식 인증", "우선 지원", "숏폼 제작 기능"] },
        { "title": "📱 제작 기능:", "items": ["`/record`로 **녹화 모드**", "**REC** 표시", "`/nick` 사용", "신원 숨기기", "클립 도구"] },
        { "title": "💬 Discord 혜택:", "items": ["전용 **TikTok Creator** 역할", "전용 색상", "크리에이터 채널", "영상 공유", "공식 홍보 기회"] },
        { "title": "📋 신청 안내:", "items": ["**완전 무료**", "신청 필수", "수동 심사", "승인 보장 안 됨", "비활동 시 회수 가능"] }
      ],
      "summary": [["유지 기간", "승인된 크리에이터인 동안."], ["가격", "무료."], ["신청 필수", "예."], ["승인", "보장되지 않음."]],
      "preview": ["전용 **[TIKTOK]** 접두사", "`/record` — **녹화 모드**", "**REC** 표시", "`/nick` 사용 가능", "Discord TikTok Creator 역할"],
      "free": "무료"
    }
  },
  "zh": {
    "youtube": {
      "title": "YouTube 职级 – Zo7al Network",
      "intro": [
        "**YouTube 职级**是专为制作 **Zo7al Network** 视频内容的创作者设立的免费专属职级。",
        "该职级**不可购买**，必须提交申请由团队人工审核。满足要求**不保证一定通过**。"
      ],
      "sections": [
        { "title": "🎥 创作者权益：", "items": ["专属 **[YOUTUBE]** 聊天前缀", "专属名称颜色", "Discord YouTube Creator 身份组", "进入创作者专属频道", "优先支持服务", "官方认证创作者身份"] },
        { "title": "🎬 录制功能：", "items": ["使用 `/record` 开启**录制模式**", "录制时显示专属 **REC** 标识", "使用 `/nick` 临时更改显示名称", "录制时隐藏真实身份", "专属视频录制工具"] },
        { "title": "💬 Discord 权益：", "items": ["专属 **YouTube Creator** 身份组", "Discord 专属名称颜色", "创作者专属频道", "与服务器团队直接沟通", "官方推荐与宣传机会"] },
        { "title": "📋 申请须知：", "items": ["**完全免费**", "必须提交申请", "由团队人工审核", "不保证通过", "长期不活跃可能会被收回"] }
      ],
      "summary": [["职级有效期", "在符合认证创作者条件期间。"], ["价格", "免费。"], ["需要申请", "是。"], ["通过保证", "不保证。"]],
      "preview": ["专属 **[YOUTUBE]** 前缀", "`/record` — **录制模式**", "录制时 **REC** 标识", "可使用 `/nick`", "Discord YouTube Creator 身份组"],
      "free": "免费"
    },
    "twitch": {
      "title": "Twitch 职级 – Zo7al Network",
      "intro": [
        "**Twitch 职级**是专为在 Twitch 直播 **Zo7al Network** 内容的主播设立的免费专属职级。",
        "该职级**不可购买**，必须提交申请并经过审核，**不保证一定通过**。"
      ],
      "sections": [
        { "title": "🟣 主播权益：", "items": ["专属 **[TWITCH]** 前缀", "专属主播颜色", "官方认证主播", "优先支持服务", "直播专属功能"] },
        { "title": "🔴 直播功能：", "items": ["使用 `/live` 开启**直播模式**", "直播时显示 **LIVE** 标识", "使用 `/nick` 临时改名", "隐藏真实身份", "带冷却时间的开播公告"] },
        { "title": "💬 Discord 权益：", "items": ["专属 **Twitch Streamer** 身份组", "Discord 专属颜色", "创作者频道", "分享已批准的直播", "Zo7al Network 官方推广机会"] },
        { "title": "📋 申请须知：", "items": ["**完全免费**", "必须提交申请", "人工审核", "不保证通过", "长期不活跃可能会被收回"] }
      ],
      "summary": [["职级有效期", "在符合认证主播条件期间。"], ["价格", "免费。"], ["需要申请", "是。"], ["通过保证", "不保证。"]],
      "preview": ["专属 **[TWITCH]** 前缀", "`/live` — **直播模式**", "直播时 **LIVE** 标识", "可使用 `/nick`", "Discord Twitch Streamer 身份组"],
      "free": "免费"
    },
    "tiktok": {
      "title": "TikTok 职级 – Zo7al Network",
      "intro": [
        "**TikTok 职级**是专为在 TikTok 制作 **Zo7al Network** 短视频的创作者设立的免费专属职级。",
        "该职级**不可购买**，必须提交申请并经过审核，**不保证一定通过**。"
      ],
      "sections": [
        { "title": "🎵 创作者权益：", "items": ["专属 **[TIKTOK]** 前缀", "专属颜色", "官方认证", "优先支持服务", "短视频创作功能"] },
        { "title": "📱 创作功能：", "items": ["使用 `/record` 开启**录制模式**", "显示 **REC** 标识", "使用 `/nick`", "隐藏真实身份", "短视频剪辑工具"] },
        { "title": "💬 Discord 权益：", "items": ["专属 **TikTok Creator** 身份组", "Discord 专属颜色", "创作者频道", "分享已批准的视频", "Zo7al Network 官方推广机会"] },
        { "title": "📋 申请须知：", "items": ["**完全免费**", "必须提交申请", "人工审核", "不保证通过", "长期不活跃可能会被收回"] }
      ],
      "summary": [["职级有效期", "在符合认证创作者条件期间。"], ["价格", "免费。"], ["需要申请", "是。"], ["通过保证", "不保证。"]],
      "preview": ["专属 **[TIKTOK]** 前缀", "`/record` — **录制模式**", "**REC** 标识", "可使用 `/nick`", "Discord TikTok Creator 身份组"],
      "free": "免费"
    }
  }
};
export function getCreatorRankContent(locale: string, platform: CreatorPlatform): CreatorRankContent {
  return (content[locale] ?? content.en)[platform];
}

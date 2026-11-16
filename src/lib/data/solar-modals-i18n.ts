export type SolarModalsCopy = {
  shared: {
    yourAccount: string;
    closeAria: string;
    errAuth: string;
    errRateLimit: string;
    errServer: string;
    errNetwork: string;
    yes: string;
    no: string;
    closedBadge: string;
    fullBadge: string;
  };
  apply: {
    title: string;
    step1Sub: string;
    step2Sub: string;
    step3Sub: string;
    closedTitle: string;
    closedFallback: string;
    step1Tab: string;
    step2Tab: string;
    step3Tab: string;
    rulesHeading: string;
    rulesIntro: string;
    ruleSections: { title: string; items?: string[]; text?: string }[];
    discordLinkLabel: string;
    continueToStep2: string;
    nameLabel: string;
    namePlaceholder: string;
    nicknameLabel: string;
    nicknamePlaceholder: string;
    ageLabel: string;
    agePlaceholder: string;
    countryLabel: string;
    countryPlaceholder: string;
    discordLabel: string;
    discordPlaceholder: string;
    phoneLabel: string;
    roleLabel: string;
    gameLabel: string;
    adminSubTypeLabel: string;
    adminGameLabel: string;
    channelLabel: string;
    channelPlaceholderCreator: string;
    channelPlaceholderStreamer: string;
    portfolioLabel: string;
    experienceLabel: string;
    experiencePlaceholder: string;
    prevClansLabel: string;
    backToRules: string;
    continueToStep3: string;
    contractDurationLabel: string;
    contractDurationCustomPlaceholder: string;
    contractImageLabel: string;
    pledgeTitle: string;
    pledgeIntro: string;
    pledgeItems: string[];
    pledgeMotto: string;
    pledgeAgree: string;
    whyJoinLabel: string;
    whyJoinPlaceholder: string;
    editInfo: string;
    submitting: string;
    submitBtn: string;
    errName: string;
    errNickname: string;
    errAge: string;
    errCountry: string;
    errDiscord: string;
    errPhone: string;
    errExperience: string;
    errChannel: string;
    errStream: string;
    errCustomContract: string;
    errSignature: string;
    errPledge: string;
    errWhyJoin: string;
    errAlreadyApplied: string;
    roles: Record<string, string>;
    games: Record<string, string>;
    adminSubTypes: Record<string, string>;
    contractDurations: Record<string, string>;
  };
  leave: {
    title: string;
    step1Sub: string;
    step2Sub: string;
    step3Sub: string;
    step1Tab: string;
    step2Tab: string;
    step3Tab: string;
    rulesHeading: string;
    rulesIntro: string;
    ruleSections: { title: string; items?: string[]; text?: string }[];
    continueToStep2: string;
    nameLabel: string;
    namePlaceholder: string;
    discordLabel: string;
    discordPlaceholder: string;
    phoneLabel: string;
    durationLabel: string;
    startDateLabel: string;
    endDateLabel: string;
    selectedDurationPrefix: string;
    daysSuffix: string;
    maxDaysExceeded: string;
    backToRules: string;
    continueToStep3: string;
    contractImageLabel: string;
    contractTitle: string;
    pledgeTitle: string;
    pledgeIntro: string;
    pledgeItems: string[];
    pledgeMotto: string;
    pledgeAgree: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    editInfo: string;
    submitting: string;
    submitBtn: string;
    successTitle: string;
    successDesc: string;
    referenceLabel: string;
    doneBtn: string;
    errName: string;
    errDiscord: string;
    errPhone: string;
    errCalendarEmpty: string;
    errCalendarOrder: string;
    errCalendarMax: string;
    errSignature: string;
    errPledge: string;
    errNotMember: string;
    durations: Record<string, string>;
  };
  events: {
    title: string;
    step1Sub: string;
    step2Sub: string;
    step3Sub: string;
    step1Tab: string;
    step2Tab: string;
    step3Tab: string;
    rulesHeading: string;
    rulesIntro: string;
    ruleSections: { title: string; items?: string[]; text?: string }[];
    discordLinkLabel: string;
    continueToStep2: string;
    nameLabel: string;
    namePlaceholder: string;
    ageLabel: string;
    agePlaceholder: string;
    discordLabel: string;
    discordPlaceholder: string;
    backToRules: string;
    continueToStep3: string;
    contractImageLabel: string;
    contractTitle: string;
    pledgeTitle: string;
    pledgeIntro: string;
    pledgeItems: string[];
    pledgeClosing: string;
    pledgeMotto: string;
    pledgeAgree: string;
    editInfo: string;
    submitting: string;
    submitBtn: string;
    successTitle: string;
    successDesc: string;
    referenceLabel: string;
    trackBtn: string;
    closeBtn: string;
    errName: string;
    errAge: string;
    errDiscord: string;
    errSignature: string;
    errPledge: string;
    errAlreadyApplied: string;
  };
  warning: {
    title: string;
    step1Sub: string;
    step2Sub: string;
    step3Sub: string;
    step1Tab: string;
    step2Tab: string;
    step3Tab: string;
    reasonBannerLabel: string;
    rulesHeading: string;
    rulesIntro: string;
    ruleSections: { title: string; items?: string[]; text?: string }[];
    noticeBanner: string;
    continueToStep2: string;
    nameLabel: string;
    namePlaceholder: string;
    ageLabel: string;
    agePlaceholder: string;
    discordLabel: string;
    discordPlaceholder: string;
    backToRules: string;
    continueToStep3: string;
    contractImageLabel: string;
    contractTitle: string;
    pledgeTitle: string;
    pledgeIntro: string;
    pledgeItems: string[];
    warningsSystemTitle: string;
    warningsSystemItems: string[];
    pledgeAck: string;
    pledgeConfirm: string;
    pledgeMotto: string;
    pledgeAgree: string;
    editInfo: string;
    submitting: string;
    submitBtn: string;
    successTitle: string;
    successDesc: string;
    doneBtn: string;
    errName: string;
    errAge: string;
    errDiscord: string;
    errSignature: string;
    errPledge: string;
    errNotFound: string;
    errGeneric: string;
  };
};

const ar: SolarModalsCopy = {
  shared: {
    yourAccount: "حسابك:",
    closeAria: "إغلاق",
    errAuth: "يجب تسجيل الدخول بحسابك أولاً.",
    errRateLimit: "لقد أرسلت طلباً مؤخراً. يرجى الانتظار قليلاً قبل المحاولة مجدداً.",
    errServer: "حدث خطأ أثناء إرسال الطلب، يرجى التحقق من البيانات والمحاولة مجدداً.",
    errNetwork: "تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً.",
    yes: "نعم",
    no: "لا",
    closedBadge: "— (مغلق مؤقتاً)",
    fullBadge: "— (مكتمل)",
  },
  apply: {
    title: "تقديم لفريق Solar System",
    step1Sub: "الخطوة 1 من 3: قوانين وشروط مقدّمي الكلان",
    step2Sub: "الخطوة 2 من 3: البيانات الشخصية والتخصص",
    step3Sub: "الخطوة 3 من 3: العقد، التعهد، وتأكيد التقديم",
    closedTitle: "التقديم مغلق حالياً",
    closedFallback: "باب الانضمام لكلان Solar System مغلق مؤقتاً في الوقت الحالي. تابع حسابات الكلان للإعلان عن فتح التقديم مجدداً.",
    step1Tab: "القوانين والشروط",
    step2Tab: "البيانات والتخصص",
    step3Tab: "العقد والتعهد",
    rulesHeading: "قوانين وشروط مقدّمي Solar System",
    rulesIntro: "يرجى قراءة جميع القوانين والشروط التالية بعناية قبل الموافقة على الانضمام إلى طاقم التقديم في كلان Solar System.",
    ruleSections: [
      {
        title: "1. الالتزام بالقوانين",
        items: [
          "الالتزام بجميع قوانين وأنظمة كلان Solar System.",
          "احترام الإدارة العليا وتنفيذ توجيهاتها.",
          "عدم استغلال منصب التقديم لتحقيق مصالح شخصية.",
        ],
      },
      {
        title: "2. شروط التقديم",
        items: [
          "التعامل مع جميع المتقدمين باحترام وعدالة.",
          "عدم قبول أو رفض أي متقدم بناءً على الصداقة أو الخلافات الشخصية.",
          "الالتزام بمعايير الاختبارات المعتمدة من الإدارة.",
          "عدم تسريب أسئلة الاختبارات أو إجاباتها أو تفاصيلها.",
          "عدم التلاعب بنتائج الاختبارات أو تغييرها دون إذن الإدارة.",
        ],
      },
      {
        title: "3. السلوك والانضباط",
        items: [
          "التحلي بالأخلاق والاحترام أثناء التعامل مع الأعضاء والمتقدمين.",
          "يمنع افتعال المشاكل أو إثارة الفتن بين أعضاء الكلان.",
          "يمنع الإساءة إلى أي عضو أو متقدم أو التقليل من شأنه.",
          "يمنع استخدام الصلاحيات للتهديد أو الظلم أو الانتقام الشخصي.",
        ],
      },
      {
        title: "4. السرية والأمانة",
        items: [
          "المحافظة على سرية بيانات المتقدمين ومعلومات الكلان الداخلية.",
          "يمنع نشر المعلومات الداخلية أو مشاركتها مع أشخاص غير مخوّلين.",
          "الالتزام بالأمانة والمصداقية في جميع أعمال التقديم.",
        ],
      },
      {
        title: "5. المسؤوليات والصلاحيات",
        items: [
          "الالتزام بالمهام الموكلة إليك وعدم تجاوز حدود صلاحياتك.",
          "يمنع تغيير القوانين أو إجراءات التقديم دون موافقة الإدارة.",
          "يجب إبلاغ الإدارة عن أي مخالفة أو محاولة تلاعب يتم اكتشافها.",
          "يتحمل المقدّم مسؤولية تصرفاته والقرارات الصادرة عنه ضمن مهامه.",
        ],
      },
      {
        title: "6. مدة العقد وإنهاء الصلاحيات",
        items: [
          "تكون مدة العقد لا تقل عن شهرين ولا تزيد على سنتين، أو حسب المدة الأخرى التي يتم الاتفاق عليها مع الإدارة.",
          "يخضع تجديد العقد لموافقة الإدارة وتقييم أداء المقدّم.",
          "يحق للإدارة سحب صلاحيات المقدّم أو إنهاء عقده عند مخالفة القوانين والشروط.",
          "يحق للإدارة اتخاذ الإجراءات المناسبة وفقًا لطبيعة المخالفة ومدى خطورتها.",
        ],
      },
      {
        title: "7. الموافقة النهائية",
        text: "بتقديم طلب الانضمام إلى طاقم التقديم في Solar System، أقرّ بأنني قرأت جميع القوانين والشروط المذكورة أعلاه، وفهمتها، وأوافق على الالتزام بها طوال مدة العقد. كما أقرّ بأن مخالفة هذه القوانين قد تؤدي إلى سحب صلاحياتي أو إنهاء عقدي بقرار من الإدارة.",
      },
      {
        title: "8. ديسكورد الفريق",
        text: "يُعدّ سيرفر ديسكورد الفريق المنصة الرسمية والأساسية لجميع أمور فريق Solar System. تتم جميع أمور الفريق داخل السيرفر (إعلانات، اجتماعات، فعاليات، تقديمات).",
      },
    ],
    discordLinkLabel: "الانضمام إلى سيرفر ديسكورد الفريق الرسمي",
    continueToStep2: "المتابعة لتعبئة البيانات الشخصية",
    nameLabel: "اسمك؟",
    namePlaceholder: "مثال: أحمد",
    nicknameLabel: "لقبك؟",
    nicknamePlaceholder: "اسم الشهرة / الـ Nickname",
    ageLabel: "عمرك؟",
    agePlaceholder: "مثال: 18",
    countryLabel: "من وين؟",
    countryPlaceholder: "الدولة / المدينة (مثال: السعودية - الرياض)",
    discordLabel: "حسابك ديسكورد؟ (اليوزر)",
    discordPlaceholder: "zo7al أو user#0000",
    phoneLabel: "رقم جوالك؟ (للتواصل)",
    roleLabel: "وش تقدم؟",
    gameLabel: "اللعبة التنافسية",
    adminSubTypeLabel: "نوع الإشراف / الرتبة الإدارية",
    adminGameLabel: "اللعبة (فيفا، فورت، روكيت، ماينكرافت، أو كود)",
    channelLabel: "لو اخترت صانع محتوى او ستريمر (حط رابط قناتك أو حسابك)",
    channelPlaceholderCreator: "https://youtube.com/@... أو https://tiktok.com/@...",
    channelPlaceholderStreamer: "https://twitch.tv/... أو https://kick.com/...",
    portfolioLabel: "رابط معرض الأعمال / النماذج (اختياري)",
    experienceLabel: "كم مدة خبرتك في الي بتقدم فيه؟",
    experiencePlaceholder: "مثال: سنتين، 6 أشهر...",
    prevClansLabel: "هل عندك خبرة سابقة في الكلانات؟",
    backToRules: "الرجوع للشروط",
    continueToStep3: "المتابعة للعقد والتعهد",
    contractDurationLabel: "مدة العقد؟ تقدر تجدده! (كم مدة العقد في الكلان)",
    contractDurationCustomPlaceholder: "حدد مدة العقد الأخرى...",
    contractImageLabel: "صورة العقد والتوقيع",
    pledgeTitle: "تعهّد مقدّم Solar System",
    pledgeIntro: "أنا الموقّع أدناه، أتعهد بالالتزام بجميع أنظمة وقوانين كلان Solar System، والمحافظة على سمعته ومكانته، وعدم القيام بأي تصرّف يسيء إلى الكلان أو أعضائه.",
    pledgeItems: [
      "عدم تخريب القيم أو التدريبات أو الفعاليات أو تعطيل سيرها.",
      "الالتزام بالاحترام والأخلاق، وعدم افتعال المشاكل أو إثارة الفتن بين الأعضاء.",
      "عدم استغلال صلاحياتي كمقدّم لتحقيق مصالح شخصية أو الإضرار بالآخرين.",
      "عدم التلاعب بالاختبارات أو النتائج أو المعلومات بأي شكل من الأشكال.",
      "التعامل مع جميع المتقدمين بعدل ومساواة، دون محاباة أو تمييز.",
      "المحافظة على سرية معلومات المتقدمين وأعضاء الكلان، وعدم إفشائها لأي جهة غير مخوّلة.",
      "الالتزام بتوجيهات الإدارة وعدم تجاوز حدود الصلاحيات الممنوحة لي.",
      "تحمّل المسؤولية الكاملة عن أي مخالفة أو تصرّف يصدر مني أثناء أداء مهامي.",
    ],
    pledgeMotto: "Solar System — الالتزام، الاحترام، والعدالة.",
    pledgeAgree: "موافق على التعهد والشروط كاملة",
    whyJoinLabel: "لماذا ترغب بالانضمام إلى Solar System؟",
    whyJoinPlaceholder: "تحدث عن دافعك، ما يميزك، وما الذي تطمح لتقديمه للكلان...",
    editInfo: "تعديل البيانات",
    submitting: "جاري الإرسال...",
    submitBtn: "إرسال طلب الانضمام الآن",
    errName: "يرجى كتابة اسمك",
    errNickname: "يرجى كتابة لقبك",
    errAge: "يرجى كتابة عمرك",
    errCountry: "يرجى كتابة دولتك أو مدينتك",
    errDiscord: "يرجى كتابة حسابك الديسكورد",
    errPhone: "يرجى كتابة رقم جوالك للتواصل",
    errExperience: "يرجى تحديد مدة خبرتك في التخصص",
    errChannel: "يرجى وضع رابط قناتك أو حسابك",
    errStream: "يرجى وضع رابط منصة البث الخاصة بك",
    errCustomContract: "يرجى كتابة مدة العقد الأخرى المطلوبة.",
    errSignature: "يرجى حفظ التوقيع أو رفع صورة العقد الموقّعة لإتمام التقديم.",
    errPledge: "يرجى الموافقة على تعهّد المقدّم لإتمام التقديم.",
    errWhyJoin: "يرجى كتابة سبب رغبتك بالانضمام إلى Solar System.",
    errAlreadyApplied: "لديك طلب تقديم قيد المراجعة أو مقبول بالفعل.",
    roles: {
      creator: "صانع محتوى",
      streamer: "ستريمر",
      designer: "مصمم",
      editor: "ممنتج",
      player: "لاعب بطولات",
      admin: "اداري",
      writer: "كاتب افكار",
    },
    games: {
      fortnite: "فورتنايت (Fortnite)",
      rocket: "روكيت ليق (Rocket League)",
      minecraft: "ماينكرافت (Minecraft)",
      fifa: "فيفا / FC (FIFA)",
      cod: "كود (Call of Duty)",
    },
    adminSubTypes: {
      president: "الرئيس",
      vice_president: "نائب الرئيس",
      exec_supervisor: "مشرف تنفيذي",
      dept_supervisor: "مشرف أقسام",
      general_admin: "إدارة عامة",
      admin_monitor: "مراقب إدارة",
      creators_supervisor: "مشرف صناع محتوى",
      creators_admin: "إداري صناع محتوى",
      designers_supervisor: "مشرف مصممين",
      players_supervisor: "مشرف لاعبين",
      players_admin: "إداري لاعبين",
      editors_supervisor: "مشرف ممنتجين",
      streamers_supervisor: "مشرف ستريمرز",
    },
    contractDurations: {
      "2_months": "شهرين",
      "3_months": "3 شهور",
      "5_months": "5 شهور",
      "6_months": "6 شهور",
      "8_months": "8 شهور",
      "1_year": "سنة",
      "2_years": "سنتين",
      other: "أخرى",
    },
  },
  leave: {
    title: "تقديم إجازة — Solar System",
    step1Sub: "الخطوة 1 من 3: قوانين وشروط الإجازة",
    step2Sub: "الخطوة 2 من 3: البيانات الشخصية ومدة الإجازة",
    step3Sub: "الخطوة 3 من 3: التوقيع، التعهّد، وإرسال الطلب",
    step1Tab: "شروط الإجازة",
    step2Tab: "البيانات والمدة",
    step3Tab: "التوقيع والتعهّد",
    rulesHeading: "شروط وضوابط الإجازة – Solar System",
    rulesIntro: "يرجى قراءة الضوابط التالية بعناية قبل رفع طلب الإجازة للإدارة:",
    ruleSections: [
      {
        title: "1. مدة الإجازة والحد الأقصى",
        items: [
          "الحد الأقصى لمدة الإجازة هو أسبوعين (14 يوماً) فقط.",
          "يمكنك اختيار مدة محددة أو تحديد تاريخ البداية والنهاية من التقويم.",
        ],
      },
      {
        title: "2. الالتزام بالعودة والتواصل",
        items: [
          "يجب الالتزام بالعودة فور انتهاء مدة الإجازة المحددة.",
          "تبقى مسؤولاً عن التواصل مع الإدارة في حال حدوث أي طارئ يستدعي التمديد.",
        ],
      },
      {
        title: "3. الصلاحيات أثناء الإجازة",
        items: [
          "الالتزام بكافة قوانين الكلان وسرية البيانات أثناء فترة الإجازة.",
          "عدم استغلال فترة الإجازة للتغيب المتكرر دون مبرر مقبول.",
        ],
      },
    ],
    continueToStep2: "المتابعة لتعبئة البيانات",
    nameLabel: "اسمك؟",
    namePlaceholder: "اكتب اسمك...",
    discordLabel: "حسابك ديسكورد؟ (اليوزر)",
    discordPlaceholder: "username",
    phoneLabel: "رقم جوالك؟",
    durationLabel: "مدة الإجازة؟",
    startDateLabel: "تاريخ بداية الإجازة",
    endDateLabel: "تاريخ نهاية الإجازة",
    selectedDurationPrefix: "المدة المحددة:",
    daysSuffix: "يوم",
    maxDaysExceeded: "(تجاوزت الحد الأقصى 14 يوماً!)",
    backToRules: "الرجوع للشروط",
    continueToStep3: "المتابعة للتوقيع والتعهّد",
    contractImageLabel: "صورة العقد والتوقيع",
    contractTitle: "صورة عقد وإجازة كلان Solar System",
    pledgeTitle: "تعهّد الإجازة – Solar System",
    pledgeIntro: "أنا العضو الموقّع أدناه، أتعهد بصحة البيانات المقدمة في طلب الإجازة، وألتزم بالتالي:",
    pledgeItems: [
      "العودة والانتظام في مهامي فور انتهاء فترة الإجازة المحددة.",
      "الالتزام بكافة قوانين كلان Solar System وعدم مخالفتها خلال فترة الإجازة.",
      "التواصل مع الإدارة مسبقاً في حال وجود ظرف طارئ يمنع العودة في الموعد.",
    ],
    pledgeMotto: "Solar System — الالتزام، الاحترام، والمسؤولية.",
    pledgeAgree: "موافق على التعهد والشروط كاملة",
    reasonLabel: "سبب الإجازة (اختياري)",
    reasonPlaceholder: "اكتب سبباً مختصراً أو ملاحظة للإدارة (اختياري)...",
    editInfo: "تعديل البيانات",
    submitting: "جاري الإرسال...",
    submitBtn: "إرسال طلب الإجازة",
    successTitle: "تم استلام طلب الإجازة بنجاح",
    successDesc: "تم إرسال طلب الإجازة إلى إدارة Solar System للمراجعة، ويمكنك متابعة حالته من صفحة بوابة الأعضاء.",
    referenceLabel: "الرقم المرجعي",
    doneBtn: "تم",
    errName: "يرجى كتابة اسمك",
    errDiscord: "يرجى كتابة حسابك ديسكورد (اليوزر)",
    errPhone: "يرجى كتابة رقم جوالك للتواصل",
    errCalendarEmpty: "يرجى تحديد تاريخ بداية ونهاية الإجازة من التقويم",
    errCalendarOrder: "تاريخ نهاية الإجازة يجب أن يكون بعد تاريخ البداية",
    errCalendarMax: "الحد الأقصى لمدة الإجازة هو أسبوعين (14 يوماً)",
    errSignature: "يرجى حفظ التوقيع أو رفع صورة العقد الموقّعة لإتمام الطلب.",
    errPledge: "يرجى الموافقة على تعهّد الإجازة لإتمام الطلب.",
    errNotMember: "هذه الميزة متاحة فقط لأعضاء كلان Solar System المقبولين.",
    durations: {
      "2_days": "يومين",
      "4_days": "4 أيام",
      "1_week": "أسبوع",
      "2_weeks": "أسبوعين",
      other: "أخرى (تحديد من التقويم)",
    },
  },
  events: {
    title: "تقديم إدارة فعاليات ديسكورد",
    step1Sub: "الخطوة 1 من 3: قوانين وشروط إدارة فعاليات الديسكورد",
    step2Sub: "الخطوة 2 من 3: البيانات الشخصية",
    step3Sub: "الخطوة 3 من 3: التوقيع، التعهّد، وتأكيد التقديم",
    step1Tab: "القوانين والشروط",
    step2Tab: "البيانات الشخصية",
    step3Tab: "التوقيع والتعهّد",
    rulesHeading: "قوانين وشروط إدارة فعاليات الديسكورد – Solar System",
    rulesIntro: "يرجى قراءة القوانين والشروط التالية بعناية قبل التقديم على إدارة فعاليات الديسكورد في كلان Solar System:",
    ruleSections: [
      {
        title: "1. الالتزام والانضباط",
        items: [
          "الالتزام الكامل بجميع قوانين وأنظمة كلان Solar System.",
          "الالتزام بمواعيد الفعاليات المتفق عليها وعدم الغياب أو التأخير دون عذر مسبق.",
          "احترام الإدارة وجميع أعضاء الكلان والمشاركين في الفعاليات.",
        ],
      },
      {
        title: "2. إدارة وتنظيم الفعاليات",
        items: [
          "تنظيم الفعاليات بعدالة وحيادية تامة بين جميع المشاركين.",
          "منع التحيز أو المحاباة لأي شخص في الفعاليات أو الجوائز أو النتائج.",
          "التعامل بهدوء واحترافية مع المشاكل أو الاعتراضات أثناء الفعاليات.",
          "يمنع تخريب الفعاليات أو تعطيلها أو تغيير قوانينها دون موافقة الإدارة.",
        ],
      },
      {
        title: "3. استخدام الصلاحيات",
        items: [
          "استخدام صلاحيات إدارة الفعاليات فقط في تنظيم الفعاليات المخصصة.",
          "يمنع استغلال الصلاحيات لأغراض شخصية أو للإضرار بأي عضو.",
          "الالتزام بتعليمات وتوجيهات الإدارة العليا في جميع الأوقات.",
        ],
      },
      {
        title: "4. المسؤولية والجزاءات",
        items: [
          "في حال مخالفة القوانين أو إساءة استخدام الصلاحيات، يحق للإدارة سحب الصلاحيات أو إنهاء المهمة مباشرة.",
          "يتحمل منظم الفعاليات المسؤولية الكاملة عن الفعاليات التي يشرف عليها.",
        ],
      },
      {
        title: "5. ديسكورد الفريق",
        text: "يُعدّ سيرفر ديسكورد الفريق المنصة الرسمية والأساسية لجميع فعاليات وأمور فريق Solar System.",
      },
    ],
    discordLinkLabel: "الانضمام إلى سيرفر ديسكورد الفريق الرسمي",
    continueToStep2: "المتابعة لتعبئة البيانات الشخصية",
    nameLabel: "اسمك؟",
    namePlaceholder: "اكتب اسمك...",
    ageLabel: "عمرك؟",
    agePlaceholder: "مثال: 19",
    discordLabel: "حسابك ديسكورد؟ (اليوزر)",
    discordPlaceholder: "username",
    backToRules: "الرجوع للشروط",
    continueToStep3: "المتابعة للتوقيع والتعهّد",
    contractImageLabel: "صورة العقد والتوقيع",
    contractTitle: "صورة عقد وتعهد إدارة فعاليات ديسكورد Solar System",
    pledgeTitle: "تعهّد إدارة فعاليات الديسكورد – Solar System",
    pledgeIntro: "أنا الموقّع أدناه، أتعهد أمام إدارة كلان Solar System بأنني قرأت جميع القوانين والشروط الخاصة بإدارة فعاليات الديسكورد، وأوافق على الالتزام بها بشكل كامل، كما أتعهد بما يلي:",
    pledgeItems: [
      "الالتزام بجميع قوانين الكلان وأنظمة الفعاليات دون استثناء.",
      "الالتزام بالمواعيد المحددة للفعاليات وإبلاغ الإدارة مسبقًا في حال وجود أي ظرف.",
      "عدم التحيز أو التلاعب بالنتائج أو استغلال الصلاحيات بأي شكل من الأشكال.",
      "الحفاظ على النظام والاحترام أثناء إدارة الفعاليات وعدم افتعال المشاكل.",
      "تنفيذ توجيهات الإدارة وتحمل المسؤولية الكاملة عن أي مخالفة تصدر مني.",
    ],
    pledgeClosing: "وأقرّ بأن للإدارة كامل الحق في سحب صلاحياتي أو إيقافي عن إدارة الفعاليات في حال الإخلال بأي بند من بنود هذا التعهد.",
    pledgeMotto: "Solar System — الالتزام، التنظيم، والعدالة.",
    pledgeAgree: "موافق",
    editInfo: "تعديل البيانات",
    submitting: "جاري الإرسال...",
    submitBtn: "إرسال طلب إدارة الفعاليات",
    successTitle: "تم استلام طلبك بنجاح",
    successDesc: "تم إرسال طلبك لإدارة فعاليات الديسكورد بنجاح، وسيتم مراجعته من قِبل الإدارة قريباً.",
    referenceLabel: "رقم المرجع",
    trackBtn: "تتبع الطلب",
    closeBtn: "إغلاق",
    errName: "يرجى كتابة اسمك",
    errAge: "يرجى كتابة عمرك",
    errDiscord: "يرجى كتابة حسابك ديسكورد (اليوزر)",
    errSignature: "يرجى حفظ التوقيع أو رفع صورة العقد الموقّعة لإتمام التقديم.",
    errPledge: "يرجى الموافقة على تعهّد إدارة فعاليات الديسكورد لإتمام التقديم.",
    errAlreadyApplied: "لديك طلب تقديم لإدارة فعاليات الديسكورد قيد المراجعة أو مقبول بالفعل.",
  },
  warning: {
    title: "تعهّد بعد استلام تحذير — Solar System",
    step1Sub: "الخطوة 1 من 3: بنود التعهّد بعد استلام تحذير",
    step2Sub: "الخطوة 2 من 3: البيانات الشخصية",
    step3Sub: "الخطوة 3 من 3: التوقيع، الموافقة، وتأكيد التعهّد",
    step1Tab: "بنود التعهّد",
    step2Tab: "البيانات الشخصية",
    step3Tab: "التوقيع والموافقة",
    reasonBannerLabel: "سبب التحذير الموجّه من الإدارة:",
    rulesHeading: "تعهّد بعد استلام تحذير – Solar System",
    rulesIntro: "يرجى قراءة التعهّد التالي بعناية بعد استلام تحذير من إدارة كلان Solar System:",
    ruleSections: [
      {
        title: "1. الإقرار بالتحذير",
        items: [
          "يقر العضو باستلام التحذير من إدارة الكلان.",
          "يتعهد بعدم تكرار المخالفة التي أدت إلى حصوله على التحذير.",
          "يلتزم بجميع قوانين وأنظمة الكلان دون استناء.",
        ],
      },
      {
        title: "2. الالتزام بعد التحذير",
        items: [
          "يجب تحسين السلوك والالتزام بتوجيهات الإدارة.",
          "يمنع تكرار المخالفة أو ارتكاب مخالفات جديدة.",
          "يجب احترام جميع أعضاء الكلان والإدارة.",
          "يحق للإدارة متابعة سلوك العضو بعد إصدار التحذير.",
        ],
      },
      {
        title: "3. نظام التحذيرات والعقوبات",
        items: [
          "التحذير الأول: تنبيه رسمي للعضو بضرورة الالتزام بالقوانين.",
          "التحذير الثاني: يتم طرد العضو نهائيًا من الكلان.",
          "لا يُسمح بتجاوز نظام التحذيرات أو تجاهل قرارات الإدارة.",
        ],
      },
      {
        title: "4. الموافقة والتعهّد",
        text: "بموافقتك على هذا التعهّد، فإنك تقر باستلام التحذير وفهم أسباب صدوره، وتتعهد بعدم تكرار المخالفة والالتزام بجميع قوانين Solar System.",
      },
    ],
    noticeBanner: "تنبيه: حصولك على تحذيرين يؤدي إلى الطرد النهائي من الكلان دون الحاجة إلى تحذير ثالث.",
    continueToStep2: "المتابعة لتعبئة البيانات",
    nameLabel: "اسمك؟",
    namePlaceholder: "اكتب اسمك...",
    ageLabel: "عمرك؟",
    agePlaceholder: "مثال: 19",
    discordLabel: "حسابك ديسكورد؟ (اليوزر)",
    discordPlaceholder: "username",
    backToRules: "الرجوع للبنود",
    continueToStep3: "المتابعة للتوقيع والموافقة",
    contractImageLabel: "صورة العقد والتوقيع",
    contractTitle: "صورة التعهّد بعد التحذير — Solar System",
    pledgeTitle: "تعهّد بعد استلام تحذير – Solar System",
    pledgeIntro: "أنا المقدّم أدناه، أقرّ باستلام تحذير رسمي من إدارة فريق Solar System، وأتعهد بالالتزام بجميع أنظمة وقوانين الفريق، وعدم تكرار المخالفة التي أدت إلى إصدار هذا التحذير.",
    pledgeItems: [
      "عدم تكرار المخالفة التي تم تحذيري بسببها.",
      "الالتزام بجميع قوانين وأنظمة فريق Solar System.",
      "احترام الإدارة وجميع أعضاء الكلان والتعامل معهم بأسلوب لائق.",
      "الالتزام بتوجيهات الإدارة وعدم مخالفتها.",
      "عدم التسبب في أي مشاكل أو إساءة تؤثر على أعضاء الفريق أو سمعته.",
      "تحمّل مسؤولية تصرفاتي والالتزام بالسلوك المناسب داخل الكلان.",
      "تقبّل الإجراءات الإدارية المتربة على أي مخالفة مستقبلية.",
    ],
    warningsSystemTitle: "نظام التحذيرات:",
    warningsSystemItems: [
      "التحذير الأول: إنذار رسمي مع إلزام العضو بعدم تكرار المخالفة.",
      "التحذير الثاني: الطرد النهائي من الكلان.",
    ],
    pledgeAck: "وأقرّ بأنني على علم تام بأن حصولي على تحذير ثانٍ سيؤدي إلى طردي نهائيًا من فريق Solar System، دون الحاجة إلى توجيه تحذير إضافي.",
    pledgeConfirm: "وبناءً عليه، أؤكد أنني قرأت هذا التعهّد وفهمت جميع بنوده، وأوافق على الالتزام بها، وأتحمّل مسؤولية أي مخالفة مستقبلية تصدر مني.",
    pledgeMotto: "Solar System — الالتزام، الاحترام، والمسؤولية.",
    pledgeAgree: "موافق",
    editInfo: "تعديل البيانات",
    submitting: "جاري الإرسال...",
    submitBtn: "توقيع وإرسال التعهّد",
    successTitle: "تم توقيع وإرسال التعهّد بنجاح",
    successDesc: "تم توثيق التعهّد وإرساله إلى إدارة كلان Solar System.",
    doneBtn: "تم",
    errName: "يرجى كتابة اسمك",
    errAge: "يرجى كتابة عمرك",
    errDiscord: "يرجى كتابة حسابك ديسكورد (اليوزر)",
    errSignature: "يرجى إرفاق أو رسم توقيعك على صورة التعهّد.",
    errPledge: "يرجى الموافقة على تعهّد التحذير لإتمام الإجراء.",
    errNotFound: "انتهت صلاحية هذا التعهّد أو تم حذفه.",
    errGeneric: "يرجى التأكد من تعبئة جميع الحقول وإرفاق التوقيع.",
  },
};

const en: SolarModalsCopy = {
  shared: {
    yourAccount: "Account:",
    closeAria: "Close",
    errAuth: "Please sign in to your account first.",
    errRateLimit: "You submitted a request recently. Please wait a moment before trying again.",
    errServer: "An error occurred while submitting. Please verify your details and try again.",
    errNetwork: "Could not connect to the server. Please try again later.",
    yes: "Yes",
    no: "No",
    closedBadge: "— (Temporarily Closed)",
    fullBadge: "— (Full)",
  },
  apply: {
    title: "Apply to Solar System",
    step1Sub: "Step 1 of 3: Clan Rules & Guidelines",
    step2Sub: "Step 2 of 3: Personal Info & Division",
    step3Sub: "Step 3 of 3: Contract, Pledge & Submit",
    closedTitle: "Applications Closed",
    closedFallback: "Solar System clan applications are temporarily closed at this time. Follow official clan channels for announcements.",
    step1Tab: "Rules & Terms",
    step2Tab: "Info & Division",
    step3Tab: "Contract & Pledge",
    rulesHeading: "Solar System Staff & Member Guidelines",
    rulesIntro: "Please read all rules and terms below carefully before applying to join Solar System.",
    ruleSections: [
      {
        title: "1. Rule Compliance",
        items: [
          "Follow all Solar System clan rules and regulations.",
          "Respect senior management and follow their instructions.",
          "Do not abuse your clan role for personal gain.",
        ],
      },
      {
        title: "2. Application Fairness",
        items: [
          "Treat all applicants with respect and fairness.",
          "Never accept or reject any applicant based on friendship or personal disputes.",
          "Follow official evaluation criteria approved by management.",
          "Never leak evaluation questions, answers, or internal details.",
          "Never alter evaluation results without management approval.",
        ],
      },
      {
        title: "3. Conduct & Discipline",
        items: [
          "Maintain respectful behavior when dealing with members and applicants.",
          "Causing drama or conflicts between clan members is strictly prohibited.",
          "Insulting or belittling any member or applicant is forbidden.",
          "Never use permissions for threats, injustice, or personal retaliation.",
        ],
      },
      {
        title: "4. Confidentiality & Integrity",
        items: [
          "Keep applicant data and internal clan information confidential.",
          "Do not share internal info with unauthorized individuals.",
          "Maintain honesty and credibility in all clan duties.",
        ],
      },
      {
        title: "5. Responsibilities & Permissions",
        items: [
          "Stick to your assigned duties and do not exceed your permissions.",
          "Do not change rules or procedures without management approval.",
          "Report any violation or manipulation attempt to management.",
          "You are responsible for your actions and decisions within your role.",
        ],
      },
      {
        title: "6. Contract Duration & Termination",
        items: [
          "Contract duration is between 2 months and 2 years, or as otherwise agreed with management.",
          "Contract renewal is subject to management approval and performance review.",
          "Management reserves the right to revoke permissions or terminate the contract upon violations.",
          "Management may take appropriate action based on the severity of any violation.",
        ],
      },
      {
        title: "7. Final Agreement",
        text: "By submitting this application to Solar System, I confirm that I have read, understood, and agree to abide by all rules and terms throughout the contract period. Violating these rules may result in revocation of permissions or contract termination.",
      },
      {
        title: "8. Official Team Discord",
        text: "The team Discord server is the official hub for all Solar System announcements, meetings, events, and applications.",
      },
    ],
    discordLinkLabel: "Join the Official Team Discord Server",
    continueToStep2: "Continue to Personal Info",
    nameLabel: "Your Name?",
    namePlaceholder: "e.g., Ahmed",
    nicknameLabel: "Your Nickname?",
    nicknamePlaceholder: "In-game / Public Nickname",
    ageLabel: "Your Age?",
    agePlaceholder: "e.g., 18",
    countryLabel: "Where are you from?",
    countryPlaceholder: "Country / City (e.g., Saudi Arabia - Riyadh)",
    discordLabel: "Discord Username?",
    discordPlaceholder: "zo7al or user#0000",
    phoneLabel: "Phone Number? (For contact)",
    roleLabel: "What are you applying for?",
    gameLabel: "Competitive Game",
    adminSubTypeLabel: "Admin / Supervision Rank",
    adminGameLabel: "Game (FIFA, Fortnite, Rocket, Minecraft, or CoD)",
    channelLabel: "Channel or Stream Link (if Creator or Streamer)",
    channelPlaceholderCreator: "https://youtube.com/@... or https://tiktok.com/@...",
    channelPlaceholderStreamer: "https://twitch.tv/... or https://kick.com/...",
    portfolioLabel: "Portfolio / Samples URL (Optional)",
    experienceLabel: "How long have you been in this field?",
    experiencePlaceholder: "e.g., 2 years, 6 months...",
    prevClansLabel: "Do you have previous clan experience?",
    backToRules: "Back to Rules",
    continueToStep3: "Continue to Contract & Pledge",
    contractDurationLabel: "Contract Duration (Renewable!)",
    contractDurationCustomPlaceholder: "Specify custom contract duration...",
    contractImageLabel: "Contract Image & Signature",
    pledgeTitle: "Solar System Applicant Pledge",
    pledgeIntro: "I, the undersigned, pledge to abide by all rules and regulations of Solar System Clan, protect its reputation, and refrain from any action that harms the clan or its members.",
    pledgeItems: [
      "Do not disrupt games, scrims, trainings, or events.",
      "Maintain respect and good manners, and avoid causing drama among members.",
      "Do not abuse my position for personal gain or to harm others.",
      "Do not manipulate tests, results, or information in any way.",
      "Treat all applicants fairly and equally without favoritism.",
      "Protect the confidentiality of applicant and member data.",
      "Follow management directives and stay within granted permissions.",
      "Take full responsibility for my actions while performing my duties.",
    ],
    pledgeMotto: "Solar System — Commitment, Respect, and Fairness.",
    pledgeAgree: "I agree to the full pledge and all terms",
    whyJoinLabel: "Why do you want to join Solar System?",
    whyJoinPlaceholder: "Tell us about your motivation, strengths, and what you aim to bring to the clan...",
    editInfo: "Edit Info",
    submitting: "Submitting...",
    submitBtn: "Submit Application Now",
    errName: "Please enter your name",
    errNickname: "Please enter your nickname",
    errAge: "Please enter your age",
    errCountry: "Please enter your country or city",
    errDiscord: "Please enter your Discord username",
    errPhone: "Please enter your phone number",
    errExperience: "Please specify your experience duration",
    errChannel: "Please enter your channel or account URL",
    errStream: "Please enter your streaming platform URL",
    errCustomContract: "Please specify the custom contract duration.",
    errSignature: "Please save your signature or upload the signed contract image.",
    errPledge: "Please agree to the pledge to complete your application.",
    errWhyJoin: "Please explain why you want to join Solar System.",
    errAlreadyApplied: "You already have a pending or accepted application.",
    roles: {
      creator: "Content Creator",
      streamer: "Streamer",
      designer: "Designer",
      editor: "Video Editor",
      player: "Tournament Player",
      admin: "Admin / Staff",
      writer: "Idea Writer",
    },
    games: {
      fortnite: "Fortnite",
      rocket: "Rocket League",
      minecraft: "Minecraft",
      fifa: "FIFA / EA FC",
      cod: "Call of Duty",
    },
    adminSubTypes: {
      president: "President",
      vice_president: "Vice President",
      exec_supervisor: "Executive Supervisor",
      dept_supervisor: "Divisions Supervisor",
      general_admin: "General Management",
      admin_monitor: "Management Monitor",
      creators_supervisor: "Creators Supervisor",
      creators_admin: "Creators Admin",
      designers_supervisor: "Designers Supervisor",
      players_supervisor: "Players Supervisor",
      players_admin: "Players Admin",
      editors_supervisor: "Editors Supervisor",
      streamers_supervisor: "Streamers Supervisor",
    },
    contractDurations: {
      "2_months": "2 Months",
      "3_months": "3 Months",
      "5_months": "5 Months",
      "6_months": "6 Months",
      "8_months": "8 Months",
      "1_year": "1 Year",
      "2_years": "2 Years",
      other: "Other",
    },
  },
  leave: {
    title: "Request Leave — Solar System",
    step1Sub: "Step 1 of 3: Leave Rules & Guidelines",
    step2Sub: "Step 2 of 3: Personal Info & Leave Duration",
    step3Sub: "Step 3 of 3: Signature, Pledge & Submit",
    step1Tab: "Leave Rules",
    step2Tab: "Info & Duration",
    step3Tab: "Signature & Pledge",
    rulesHeading: "Leave Rules & Guidelines – Solar System",
    rulesIntro: "Please read the following guidelines carefully before submitting a leave request to management:",
    ruleSections: [
      {
        title: "1. Leave Duration & Maximum Limit",
        items: [
          "The maximum allowed leave duration is two weeks (14 days) only.",
          "You may select a preset duration or pick start and end dates from the calendar.",
        ],
      },
      {
        title: "2. Return & Communication",
        items: [
          "You must return to your duties immediately once your leave ends.",
          "Contact management in advance if an emergency requires an extension.",
        ],
      },
      {
        title: "3. Conduct During Leave",
        items: [
          "All clan rules and data confidentiality remain in effect during leave.",
          "Do not abuse leave requests for repeated unjustified absences.",
        ],
      },
    ],
    continueToStep2: "Continue to Personal Info",
    nameLabel: "Your Name?",
    namePlaceholder: "Enter your name...",
    discordLabel: "Discord Username?",
    discordPlaceholder: "username",
    phoneLabel: "Phone Number?",
    durationLabel: "Leave Duration?",
    startDateLabel: "Leave Start Date",
    endDateLabel: "Leave End Date",
    selectedDurationPrefix: "Selected duration:",
    daysSuffix: "days",
    maxDaysExceeded: "(Exceeds 14-day maximum!)",
    backToRules: "Back to Rules",
    continueToStep3: "Continue to Signature & Pledge",
    contractImageLabel: "Contract Image & Signature",
    contractTitle: "Solar System Leave Contract Image",
    pledgeTitle: "Leave Pledge – Solar System",
    pledgeIntro: "I, the undersigned member, confirm that the information provided in this leave request is accurate and pledge to:",
    pledgeItems: [
      "Return and resume my duties immediately after the leave period ends.",
      "Abide by all Solar System clan rules during my leave.",
      "Notify management in advance if an emergency prevents my scheduled return.",
    ],
    pledgeMotto: "Solar System — Commitment, Respect, and Responsibility.",
    pledgeAgree: "I agree to the full pledge and all terms",
    reasonLabel: "Reason for Leave (Optional)",
    reasonPlaceholder: "Write a brief reason or note for management (optional)...",
    editInfo: "Edit Info",
    submitting: "Submitting...",
    submitBtn: "Submit Leave Request",
    successTitle: "Leave Request Received",
    successDesc: "Your leave request has been sent to Solar System management for review. You can track its status from the Members Portal.",
    referenceLabel: "Reference Number",
    doneBtn: "Done",
    errName: "Please enter your name",
    errDiscord: "Please enter your Discord username",
    errPhone: "Please enter your phone number",
    errCalendarEmpty: "Please select both start and end dates from the calendar",
    errCalendarOrder: "End date must be on or after start date",
    errCalendarMax: "Maximum leave duration is two weeks (14 days)",
    errSignature: "Please save your signature or upload the signed contract image.",
    errPledge: "Please agree to the leave pledge to submit.",
    errNotMember: "This feature is only available to accepted Solar System clan members.",
    durations: {
      "2_days": "2 Days",
      "4_days": "4 Days",
      "1_week": "1 Week",
      "2_weeks": "2 Weeks",
      other: "Other (Pick from calendar)",
    },
  },
  events: {
    title: "Discord Events Staff Application",
    step1Sub: "Step 1 of 3: Discord Events Management Rules",
    step2Sub: "Step 2 of 3: Personal Information",
    step3Sub: "Step 3 of 3: Signature, Pledge & Submit",
    step1Tab: "Rules & Terms",
    step2Tab: "Personal Info",
    step3Tab: "Signature & Pledge",
    rulesHeading: "Discord Events Management Rules – Solar System",
    rulesIntro: "Please read the following rules and terms carefully before applying for Discord Events Management in Solar System:",
    ruleSections: [
      {
        title: "1. Commitment & Punctuality",
        items: [
          "Fully abide by all Solar System clan rules and regulations.",
          "Stick to scheduled event times and never be absent or late without prior notice.",
          "Respect management, clan members, and all event participants.",
        ],
      },
      {
        title: "2. Event Organization & Fairness",
        items: [
          "Organize events with complete fairness and neutrality toward all participants.",
          "No favoritism or bias in events, prizes, or outcomes.",
          "Handle disputes or objections calmly and professionally during events.",
          "Never disrupt events or change rules without management approval.",
        ],
      },
      {
        title: "3. Use of Permissions",
        items: [
          "Use event permissions strictly for organizing assigned events.",
          "Never abuse permissions for personal gain or to harm any member.",
          "Follow senior management instructions at all times.",
        ],
      },
      {
        title: "4. Accountability & Penalties",
        items: [
          "Management reserves the right to revoke permissions or remove staff upon any violation.",
          "Event organizers bear full responsibility for the events they supervise.",
        ],
      },
      {
        title: "5. Team Discord",
        text: "The team Discord server is the official platform for all Solar System events and activities.",
      },
    ],
    discordLinkLabel: "Join the Official Team Discord Server",
    continueToStep2: "Continue to Personal Info",
    nameLabel: "Your Name?",
    namePlaceholder: "Enter your name...",
    ageLabel: "Your Age?",
    agePlaceholder: "e.g., 19",
    discordLabel: "Discord Username?",
    discordPlaceholder: "username",
    backToRules: "Back to Rules",
    continueToStep3: "Continue to Signature & Pledge",
    contractImageLabel: "Contract Image & Signature",
    contractTitle: "Solar System Discord Events Contract Image",
    pledgeTitle: "Discord Events Management Pledge – Solar System",
    pledgeIntro: "I, the undersigned, pledge to Solar System Clan management that I have read all rules for Discord Events Management, agree to abide by them fully, and commit to the following:",
    pledgeItems: [
      "Abide by all clan rules and event regulations without exception.",
      "Respect event schedules and notify management in advance of any conflict.",
      "Never show bias, manipulate results, or abuse permissions in any way.",
      "Maintain order and respect while hosting events and avoid causing drama.",
      "Follow management directives and take full responsibility for any violation.",
    ],
    pledgeClosing: "I acknowledge that management has full authority to revoke my permissions or remove me from events management if I breach any term of this pledge.",
    pledgeMotto: "Solar System — Commitment, Organization, and Fairness.",
    pledgeAgree: "I Agree",
    editInfo: "Edit Info",
    submitting: "Submitting...",
    submitBtn: "Submit Events Staff Application",
    successTitle: "Application Received",
    successDesc: "Your Discord Events Management application has been submitted and will be reviewed by management soon.",
    referenceLabel: "Reference Number",
    trackBtn: "Track Request",
    closeBtn: "Close",
    errName: "Please enter your name",
    errAge: "Please enter your age",
    errDiscord: "Please enter your Discord username",
    errSignature: "Please save your signature or upload the signed contract image.",
    errPledge: "Please agree to the Discord Events Management pledge.",
    errAlreadyApplied: "You already have a pending or accepted Discord Events application.",
  },
  warning: {
    title: "Warning Pledge — Solar System",
    step1Sub: "Step 1 of 3: Warning Pledge Terms",
    step2Sub: "Step 2 of 3: Personal Information",
    step3Sub: "Step 3 of 3: Signature, Agreement & Submit",
    step1Tab: "Pledge Terms",
    step2Tab: "Personal Info",
    step3Tab: "Signature & Agreement",
    reasonBannerLabel: "Warning Reason from Management:",
    rulesHeading: "Warning Pledge – Solar System",
    rulesIntro: "Please read the following pledge carefully after receiving a warning from Solar System Clan management:",
    ruleSections: [
      {
        title: "1. Acknowledgment of Warning",
        items: [
          "The member acknowledges receiving the warning from clan management.",
          "Pledges not to repeat the violation that led to this warning.",
          "Commits to all clan rules and regulations without exception.",
        ],
      },
      {
        title: "2. Post-Warning Commitment",
        items: [
          "Must improve behavior and follow management instructions.",
          "Repeating the violation or committing new violations is prohibited.",
          "Must respect all clan members and management.",
          "Management reserves the right to monitor member conduct after the warning.",
        ],
      },
      {
        title: "3. Warning & Penalty System",
        items: [
          "First Warning: Official notice requiring the member to comply with rules.",
          "Second Warning: Permanent removal (kick) from the clan.",
          "Bypassing the warning system or ignoring management decisions is not permitted.",
        ],
      },
      {
        title: "4. Agreement & Pledge",
        text: "By agreeing to this pledge, you acknowledge receiving the warning, understand its reasons, and pledge not to repeat the violation while abiding by all Solar System rules.",
      },
    ],
    noticeBanner: "Notice: Receiving two warnings results in permanent removal from the clan without needing a third warning.",
    continueToStep2: "Continue to Personal Info",
    nameLabel: "Your Name?",
    namePlaceholder: "Enter your name...",
    ageLabel: "Your Age?",
    agePlaceholder: "e.g., 19",
    discordLabel: "Discord Username?",
    discordPlaceholder: "username",
    backToRules: "Back to Terms",
    continueToStep3: "Continue to Signature & Agreement",
    contractImageLabel: "Pledge Image & Signature",
    contractTitle: "Warning Pledge Image — Solar System",
    pledgeTitle: "Warning Pledge – Solar System",
    pledgeIntro: "I, the undersigned, acknowledge receiving an official warning from Solar System management, and pledge to abide by all team rules and not repeat the violation that led to this warning.",
    pledgeItems: [
      "Not repeating the violation for which I was warned.",
      "Abiding by all Solar System team rules and regulations.",
      "Respecting management and all clan members appropriately.",
      "Following management directives without violation.",
      "Not causing any trouble or harm affecting team members or reputation.",
      "Taking responsibility for my actions and maintaining proper conduct.",
      "Accepting administrative actions resulting from any future violation.",
    ],
    warningsSystemTitle: "Warning System:",
    warningsSystemItems: [
      "First Warning: Official warning requiring the member not to repeat the violation.",
      "Second Warning: Permanent removal from the clan.",
    ],
    pledgeAck: "I acknowledge that receiving a second warning will result in my permanent removal from Solar System without needing an additional warning.",
    pledgeConfirm: "Accordingly, I confirm that I have read and understood all terms of this pledge, agree to abide by them, and accept responsibility for any future violation.",
    pledgeMotto: "Solar System — Commitment, Respect, and Responsibility.",
    pledgeAgree: "I Agree",
    editInfo: "Edit Info",
    submitting: "Submitting...",
    submitBtn: "Sign & Submit Pledge",
    successTitle: "Pledge Signed & Submitted",
    successDesc: "Your pledge has been recorded and sent to Solar System Clan management.",
    doneBtn: "Done",
    errName: "Please enter your name",
    errAge: "Please enter your age",
    errDiscord: "Please enter your Discord username",
    errSignature: "Please attach or draw your signature on the pledge image.",
    errPledge: "Please agree to the warning pledge to complete.",
    errNotFound: "This pledge has expired or was removed.",
    errGeneric: "Please fill all fields and attach your signature.",
  },
};

type DeepPartialModals = {
  shared?: Partial<SolarModalsCopy["shared"]>;
  apply?: Partial<SolarModalsCopy["apply"]>;
  leave?: Partial<SolarModalsCopy["leave"]>;
  events?: Partial<SolarModalsCopy["events"]>;
  warning?: Partial<SolarModalsCopy["warning"]>;
};

function makeLocale(overrides: DeepPartialModals): SolarModalsCopy {
  return {
    shared: { ...en.shared, ...overrides.shared },
    apply: { ...en.apply, ...overrides.apply },
    leave: { ...en.leave, ...overrides.leave },
    events: { ...en.events, ...overrides.events },
    warning: { ...en.warning, ...overrides.warning },
  };
}

const es = makeLocale({
  shared: {
    yourAccount: "Tu cuenta:",
    closeAria: "Cerrar",
    errAuth: "Debes iniciar sesión primero.",
    errRateLimit: "Enviaste una solicitud recientemente. Espera un momento.",
    errServer: "Error al enviar. Verifica tus datos e inténtalo de nuevo.",
    errNetwork: "No se pudo conectar con el servidor.",
    yes: "Sí",
    no: "No",
    closedBadge: "— (Cerrado temporalmente)",
    fullBadge: "— (Completo)",
  },
  apply: {
    title: "Postular a Solar System",
    step1Sub: "Paso 1 de 3: Reglas y Condiciones",
    step2Sub: "Paso 2 de 3: Datos Personales y División",
    step3Sub: "Paso 3 de 3: Contrato, Compromiso y Envío",
    closedTitle: "Postulaciones Cerradas",
    closedFallback: "Las postulaciones a Solar System están cerradas temporalmente. Sigue los canales oficiales del clan.",
    step1Tab: "Reglas y Términos",
    step2Tab: "Datos y División",
    step3Tab: "Contrato y Compromiso",
    continueToStep2: "Continuar a Datos Personales",
    nameLabel: "¿Tu nombre?",
    nicknameLabel: "¿Tu apodo?",
    ageLabel: "¿Tu edad?",
    countryLabel: "¿De dónde eres?",
    discordLabel: "¿Usuario de Discord?",
    phoneLabel: "¿Número de teléfono?",
    roleLabel: "¿A qué te postulas?",
    gameLabel: "Juego Competitivo",
    adminSubTypeLabel: "Rango Administrativo",
    backToRules: "Volver a Reglas",
    continueToStep3: "Continuar al Contrato",
    contractDurationLabel: "Duración del contrato (¡Renovable!)",
    contractImageLabel: "Imagen del Contrato y Firma",
    pledgeAgree: "Acepto el compromiso y todos los términos",
    whyJoinLabel: "¿Por qué quieres unirte a Solar System?",
    editInfo: "Editar Datos",
    submitting: "Enviando...",
    submitBtn: "Enviar Solicitud Ahora",
    roles: { creator: "Creador de Contenido", streamer: "Streamer", designer: "Diseñador", editor: "Editor de Video", player: "Jugador de Torneos", admin: "Admin / Staff", writer: "Guionista" },
    contractDurations: { "2_months": "2 Meses", "3_months": "3 Meses", "5_months": "5 Meses", "6_months": "6 Meses", "8_months": "8 Meses", "1_year": "1 Año", "2_years": "2 Años", other: "Otro" },
  },
  leave: {
    title: "Solicitar Permiso — Solar System",
    step1Tab: "Reglas",
    step2Tab: "Datos y Duración",
    step3Tab: "Firma y Compromiso",
    continueToStep2: "Continuar a Datos",
    backToRules: "Volver a Reglas",
    continueToStep3: "Continuar a Firma",
    submitBtn: "Enviar Solicitud de Permiso",
    submitting: "Enviando...",
    doneBtn: "Listo",
    durations: { "2_days": "2 Días", "4_days": "4 Días", "1_week": "1 Semana", "2_weeks": "2 Semanas", other: "Otro (Calendario)" },
  },
  events: {
    title: "Postulación de Eventos Discord",
    step1Tab: "Reglas",
    step2Tab: "Datos Personales",
    step3Tab: "Firma y Compromiso",
    submitBtn: "Enviar Postulación",
    submitting: "Enviando...",
    trackBtn: "Seguir Solicitud",
    closeBtn: "Cerrar",
    pledgeAgree: "Acepto",
  },
  warning: {
    title: "Compromiso de Advertencia — Solar System",
    step1Tab: "Términos",
    step2Tab: "Datos Personales",
    step3Tab: "Firma y Acuerdo",
    reasonBannerLabel: "Motivo de la advertencia:",
    submitBtn: "Firmar y Enviar Compromiso",
    submitting: "Enviando...",
    doneBtn: "Listo",
    pledgeAgree: "Acepto",
  },
});

const fr = makeLocale({
  shared: {
    yourAccount: "Votre compte :",
    closeAria: "Fermer",
    errAuth: "Veuillez d'abord vous connecter.",
    errRateLimit: "Vous avez déjà envoyé une demande récemment. Veuillez patienter.",
    errServer: "Erreur lors de l'envoi. Vérifiez vos informations.",
    errNetwork: "Impossible de joindre le serveur.",
    yes: "Oui",
    no: "Non",
    closedBadge: "— (Fermé temporairement)",
    fullBadge: "— (Complet)",
  },
  apply: {
    title: "Postuler chez Solar System",
    step1Sub: "Étape 1 sur 3 : Règles et Conditions",
    step2Sub: "Étape 2 sur 3 : Informations et Division",
    step3Sub: "Étape 3 sur 3 : Contrat, Engagement et Envoi",
    closedTitle: "Candidatures Fermées",
    closedFallback: "Les candidatures Solar System sont temporairement fermées.",
    step1Tab: "Règles",
    step2Tab: "Infos & Division",
    step3Tab: "Contrat & Engagement",
    continueToStep2: "Continuer vers les infos",
    nameLabel: "Votre nom ?",
    nicknameLabel: "Votre pseudo ?",
    ageLabel: "Votre âge ?",
    countryLabel: "Pays / Ville ?",
    discordLabel: "Pseudo Discord ?",
    phoneLabel: "Numéro de téléphone ?",
    roleLabel: "Poste souhaité ?",
    backToRules: "Retour aux règles",
    continueToStep3: "Continuer vers le contrat",
    pledgeAgree: "J'accepte l'engagement et toutes les conditions",
    whyJoinLabel: "Pourquoi rejoindre Solar System ?",
    editInfo: "Modifier",
    submitting: "Envoi...",
    submitBtn: "Envoyer ma candidature",
    roles: { creator: "Créateur de Contenu", streamer: "Streamer", designer: "Designer", editor: "Monteur Vidéo", player: "Joueur de Tournois", admin: "Admin / Staff", writer: "Scénariste" },
    contractDurations: { "2_months": "2 Mois", "3_months": "3 Mois", "5_months": "5 Mois", "6_months": "6 Mois", "8_months": "8 Mois", "1_year": "1 An", "2_years": "2 Ans", other: "Autre" },
  },
  leave: {
    title: "Demande d'Absence — Solar System",
    step1Tab: "Règles",
    step2Tab: "Infos & Durée",
    step3Tab: "Signature",
    submitBtn: "Envoyer la demande",
    submitting: "Envoi...",
    doneBtn: "Terminé",
    durations: { "2_days": "2 Jours", "4_days": "4 Jours", "1_week": "1 Semaine", "2_weeks": "2 Semaines", other: "Autre (Calendrier)" },
  },
  events: {
    title: "Candidature Staff Événements Discord",
    submitBtn: "Envoyer la candidature",
    submitting: "Envoi...",
    trackBtn: "Suivre",
    closeBtn: "Fermer",
    pledgeAgree: "J'accepte",
  },
  warning: {
    title: "Engagement d'Avertissement — Solar System",
    reasonBannerLabel: "Motif de l'avertissement :",
    submitBtn: "Signer et Envoyer",
    submitting: "Envoi...",
    doneBtn: "Terminé",
    pledgeAgree: "J'accepte",
  },
});

const de = makeLocale({
  shared: {
    yourAccount: "Konto:",
    closeAria: "Schließen",
    errAuth: "Bitte melde dich zuerst an.",
    errRateLimit: "Du hast kürzlich eine Anfrage gesendet. Bitte warte kurz.",
    errServer: "Fehler beim Senden. Bitte prüfe deine Angaben.",
    errNetwork: "Verbindung zum Server fehlgeschlagen.",
    yes: "Ja",
    no: "Nein",
    closedBadge: "— (Vorübergehend geschlossen)",
    fullBadge: "— (Voll)",
  },
  apply: {
    title: "Bewerbung bei Solar System",
    step1Sub: "Schritt 1 von 3: Regeln & Bedingungen",
    step2Sub: "Schritt 2 von 3: Persönliche Daten & Abteilung",
    step3Sub: "Schritt 3 von 3: Vertrag, Gelöbnis & Absenden",
    closedTitle: "Bewerbungen geschlossen",
    closedFallback: "Bewerbungen für Solar System sind derzeit vorübergehend geschlossen.",
    step1Tab: "Regeln",
    step2Tab: "Daten & Bereich",
    step3Tab: "Vertrag & Gelöbnis",
    continueToStep2: "Weiter zu den Daten",
    nameLabel: "Dein Name?",
    nicknameLabel: "Dein Nickname?",
    ageLabel: "Dein Alter?",
    countryLabel: "Land / Stadt?",
    discordLabel: "Discord-Benutzername?",
    phoneLabel: "Telefonnummer?",
    roleLabel: "Wofür bewirbst du dich?",
    backToRules: "Zurück zu den Regeln",
    continueToStep3: "Weiter zum Vertrag",
    pledgeAgree: "Ich stimme dem Gelöbnis und allen Bedingungen zu",
    whyJoinLabel: "Warum möchtest du Solar System beitreten?",
    editInfo: "Daten bearbeiten",
    submitting: "Wird gesendet...",
    submitBtn: "Bewerbung absenden",
    roles: { creator: "Content Creator", streamer: "Streamer", designer: "Designer", editor: "Video-Editor", player: "Turnierspieler", admin: "Admin / Staff", writer: "Ideenschreiber" },
    contractDurations: { "2_months": "2 Monate", "3_months": "3 Monate", "5_months": "5 Monate", "6_months": "6 Monate", "8_months": "8 Monate", "1_year": "1 Jahr", "2_years": "2 Jahre", other: "Andere" },
  },
  leave: {
    title: "Urlaubsantrag — Solar System",
    submitBtn: "Antrag absenden",
    submitting: "Wird gesendet...",
    doneBtn: "Fertig",
    durations: { "2_days": "2 Tage", "4_days": "4 Tage", "1_week": "1 Woche", "2_weeks": "2 Wochen", other: "Andere (Kalender)" },
  },
  events: {
    title: "Bewerbung Discord-Event-Team",
    submitBtn: "Bewerbung absenden",
    submitting: "Wird gesendet...",
    trackBtn: "Verfolgen",
    closeBtn: "Schließen",
    pledgeAgree: "Einverstanden",
  },
  warning: {
    title: "Verwarnungs-Gelöbnis — Solar System",
    reasonBannerLabel: "Grund der Verwarnung:",
    submitBtn: "Unterschreiben & Senden",
    submitting: "Wird gesendet...",
    doneBtn: "Fertig",
    pledgeAgree: "Einverstanden",
  },
});

const pt = makeLocale({
  shared: {
    yourAccount: "Sua conta:",
    closeAria: "Fechar",
    errAuth: "Faça login na sua conta primeiro.",
    errRateLimit: "Você enviou uma solicitação recentemente. Aguarde um pouco.",
    errServer: "Erro ao enviar. Verifique seus dados.",
    errNetwork: "Não foi possível conectar ao servidor.",
    yes: "Sim",
    no: "Não",
    closedBadge: "— (Fechado temporariamente)",
    fullBadge: "— (Completo)",
  },
  apply: {
    title: "Candidatar-se ao Solar System",
    step1Tab: "Regras",
    step2Tab: "Dados e Divisão",
    step3Tab: "Contrato e Compromisso",
    closedTitle: "Inscrições Fechadas",
    submitBtn: "Enviar Candidatura",
    submitting: "Enviando...",
    pledgeAgree: "Concordo com o compromisso e todos os termos",
    roles: { creator: "Criador de Conteúdo", streamer: "Streamer", designer: "Designer", editor: "Editor de Vídeo", player: "Jogador de Torneios", admin: "Admin / Staff", writer: "Roteirista" },
    contractDurations: { "2_months": "2 Meses", "3_months": "3 Meses", "5_months": "5 Meses", "6_months": "6 Meses", "8_months": "8 Meses", "1_year": "1 Ano", "2_years": "2 Anos", other: "Outro" },
  },
  leave: {
    title: "Solicitar Licença — Solar System",
    submitBtn: "Enviar Solicitação",
    submitting: "Enviando...",
    doneBtn: "Concluído",
    durations: { "2_days": "2 Dias", "4_days": "4 Dias", "1_week": "1 Semana", "2_weeks": "2 Semanas", other: "Outro (Calendário)" },
  },
  events: {
    title: "Candidatura Eventos Discord",
    submitBtn: "Enviar Candidatura",
    submitting: "Enviando...",
    trackBtn: "Acompanhar",
    closeBtn: "Fechar",
    pledgeAgree: "Concordo",
  },
  warning: {
    title: "Compromisso de Aviso — Solar System",
    reasonBannerLabel: "Motivo do aviso:",
    submitBtn: "Assinar e Enviar",
    submitting: "Enviando...",
    doneBtn: "Concluído",
    pledgeAgree: "Concordo",
  },
});

const tr = makeLocale({
  shared: {
    yourAccount: "Hesabınız:",
    closeAria: "Kapat",
    errAuth: "Önce hesabınıza giriş yapmalısınız.",
    errRateLimit: "Yakın zamanda bir istek gönderdiniz. Lütfen biraz bekleyin.",
    errServer: "Gönderilirken bir hata oluştu. Bilgilerinizi kontrol edin.",
    errNetwork: "Sunucuya bağlanılamadı.",
    yes: "Evet",
    no: "Hayır",
    closedBadge: "— (Geçici Olarak Kapalı)",
    fullBadge: "— (Dolu)",
  },
  apply: {
    title: "Solar System Başvurusu",
    step1Tab: "Kurallar",
    step2Tab: "Bilgiler & Bölüm",
    step3Tab: "Sözleşme & Taahhüt",
    closedTitle: "Başvurular Kapalı",
    submitBtn: "Başvuruyu Gönder",
    submitting: "Gönderiliyor...",
    pledgeAgree: "Taahhüdü ve tüm şartları kabul ediyorum",
    roles: { creator: "İçerik Üreticisi", streamer: "Yayıncı", designer: "Tasarımcı", editor: "Video Editörü", player: "Turnuva Oyuncusu", admin: "Yönetici / Yetkili", writer: "Fikir Yazarı" },
    contractDurations: { "2_months": "2 Ay", "3_months": "3 Ay", "5_months": "5 Ay", "6_months": "6 Ay", "8_months": "8 Ay", "1_year": "1 Yıl", "2_years": "2 Yıl", other: "Diğer" },
  },
  leave: {
    title: "İzin Talebi — Solar System",
    submitBtn: "İzin Talebini Gönder",
    submitting: "Gönderiliyor...",
    doneBtn: "Tamam",
    durations: { "2_days": "2 Gün", "4_days": "4 Gün", "1_week": "1 Hafta", "2_weeks": "2 Hafta", other: "Diğer (Takvim)" },
  },
  events: {
    title: "Discord Etkinlik Yönetimi Başvurusu",
    submitBtn: "Başvuruyu Gönder",
    submitting: "Gönderiliyor...",
    trackBtn: "Takip Et",
    closeBtn: "Kapat",
    pledgeAgree: "Kabul Ediyorum",
  },
  warning: {
    title: "Uyarı Taahhüdü — Solar System",
    reasonBannerLabel: "Yönetim Uyarı Sebebi:",
    submitBtn: "İmzala ve Gönder",
    submitting: "Gönderiliyor...",
    doneBtn: "Tamam",
    pledgeAgree: "Kabul Ediyorum",
  },
});

const ja = makeLocale({
  shared: {
    yourAccount: "アカウント:",
    closeAria: "閉じる",
    errAuth: "先にアカウントにログインしてください。",
    errRateLimit: "最近リクエストを送信しました。しばらくお待ちください。",
    errServer: "送信中にエラーが発生しました。入力内容を確認してください。",
    errNetwork: "サーバーに接続できませんでした。",
    yes: "はい",
    no: "いいえ",
    closedBadge: "— (一時停止中)",
    fullBadge: "— (満員)",
  },
  apply: {
    title: "Solar System 応募",
    step1Tab: "規約",
    step2Tab: "情報・部門",
    step3Tab: "契約・誓約",
    closedTitle: "応募受付停止中",
    submitBtn: "応募を送信",
    submitting: "送信中...",
    pledgeAgree: "誓約とすべての規約に同意します",
    roles: { creator: "クリエイター", streamer: "ストリーマー", designer: "デザイナー", editor: "動画編集者", player: "トーナメントプレイヤー", admin: "運営スタッフ", writer: "企画作家" },
    contractDurations: { "2_months": "2ヶ月", "3_months": "3ヶ月", "5_months": "5ヶ月", "6_months": "6ヶ月", "8_months": "8ヶ月", "1_year": "1年", "2_years": "2年", other: "その他" },
  },
  leave: {
    title: "休暇申請 — Solar System",
    submitBtn: "休暇申請を送信",
    submitting: "送信中...",
    doneBtn: "完了",
    durations: { "2_days": "2日間", "4_days": "4日間", "1_week": "1週間", "2_weeks": "2週間", other: "その他 (カレンダー)" },
  },
  events: {
    title: "Discord イベント運営応募",
    submitBtn: "応募を送信",
    submitting: "送信中...",
    trackBtn: "確認する",
    closeBtn: "閉じる",
    pledgeAgree: "同意する",
  },
  warning: {
    title: "警告後の誓約 — Solar System",
    reasonBannerLabel: "運営からの警告理由:",
    submitBtn: "署名して送信",
    submitting: "送信中...",
    doneBtn: "完了",
    pledgeAgree: "同意する",
  },
});

const ko = makeLocale({
  shared: {
    yourAccount: "계정:",
    closeAria: "닫기",
    errAuth: "먼저 계정에 로그인해 주세요.",
    errRateLimit: "최근에 요청을 보냈습니다. 잠시 후 다시 시도해 주세요.",
    errServer: "제출 중 오류가 발생했습니다. 입력 내용을 확인해 주세요.",
    errNetwork: "서버에 연결할 수 없습니다.",
    yes: "예",
    no: "아니요",
    closedBadge: "— (임시 마감)",
    fullBadge: "— (정원 마감)",
  },
  apply: {
    title: "Solar System 지원",
    step1Tab: "규칙",
    step2Tab: "정보 및 부서",
    step3Tab: "계약 및 서약",
    closedTitle: "지원 마감",
    submitBtn: "지원서 제출",
    submitting: "제출 중...",
    pledgeAgree: "서약 및 모든 규칙에 동의합니다",
    roles: { creator: "콘텐츠 크리에이터", streamer: "스트리머", designer: "디자이너", editor: "영상 편집자", player: "토너먼트 플레이어", admin: "운영진", writer: "아이디어 작가" },
    contractDurations: { "2_months": "2개월", "3_months": "3개월", "5_months": "5개월", "6_months": "6개월", "8_months": "8개월", "1_year": "1년", "2_years": "2년", other: "기타" },
  },
  leave: {
    title: "휴가 신청 — Solar System",
    submitBtn: "휴가 신청 제출",
    submitting: "제출 중...",
    doneBtn: "완료",
    durations: { "2_days": "2일", "4_days": "4일", "1_week": "1주", "2_weeks": "2주", other: "기타 (달력 선택)" },
  },
  events: {
    title: "Discord 이벤트 관리 지원",
    submitBtn: "지원서 제출",
    submitting: "제출 중...",
    trackBtn: "상태 확인",
    closeBtn: "닫기",
    pledgeAgree: "동의합니다",
  },
  warning: {
    title: "경고 후 서약 — Solar System",
    reasonBannerLabel: "운영진 경고 사유:",
    submitBtn: "서명 및 제출",
    submitting: "제출 중...",
    doneBtn: "완료",
    pledgeAgree: "동의합니다",
  },
});

const zh = makeLocale({
  shared: {
    yourAccount: "您的账号：",
    closeAria: "关闭",
    errAuth: "请先登录您的账号。",
    errRateLimit: "您刚刚提交过请求，请稍后再试。",
    errServer: "提交时出错，请检查信息后重试。",
    errNetwork: "无法连接服务器，请稍后重试。",
    yes: "是",
    no: "否",
    closedBadge: "— (暂关闭)",
    fullBadge: "— (已满)",
  },
  apply: {
    title: "申请加入 Solar System",
    step1Tab: "规则与条款",
    step2Tab: "信息与部门",
    step3Tab: "合约与承诺",
    closedTitle: "申请暂未开放",
    submitBtn: "立即提交申请",
    submitting: "正在提交...",
    pledgeAgree: "我同意全部承诺与条款",
    roles: { creator: "内容创作者", streamer: "主播", designer: "设计师", editor: "视频剪辑师", player: "锦标赛选手", admin: "管理运营", writer: "创意策划" },
    contractDurations: { "2_months": "2 个月", "3_months": "3 个月", "5_months": "5 个月", "6_months": "6 个月", "8_months": "8 个月", "1_year": "1 年", "2_years": "2 年", other: "其他" },
  },
  leave: {
    title: "请假申请 — Solar System",
    submitBtn: "提交请假申请",
    submitting: "正在提交...",
    doneBtn: "完成",
    durations: { "2_days": "2 天", "4_days": "4 天", "1_week": "1 周", "2_weeks": "2 周", other: "其他（日历选择）" },
  },
  events: {
    title: "Discord 活动管理申请",
    submitBtn: "提交活动管理申请",
    submitting: "正在提交...",
    trackBtn: "追踪申请",
    closeBtn: "关闭",
    pledgeAgree: "同意",
  },
  warning: {
    title: "警告后承诺书 — Solar System",
    reasonBannerLabel: "管理组警告原因：",
    submitBtn: "签署并提交承诺书",
    submitting: "正在提交...",
    doneBtn: "完成",
    pledgeAgree: "同意",
  },
});

const MODALS_DICT: Record<string, SolarModalsCopy> = {
  ar,
  en,
  es,
  fr,
  de,
  pt,
  tr,
  ja,
  ko,
  zh,
};

export function solarModalsCopy(locale: string): SolarModalsCopy {
  return MODALS_DICT[locale] ?? MODALS_DICT.en;
}

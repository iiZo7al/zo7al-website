export type SolarDashboardCopy = {
  contractViewer: {
    leaveTitle: string;
    eventsTitle: string;
    defaultTitle: string;
    subtitle: string;
    closeAria: string;
    tabContract: string;
    tabSignature: string;
    leaveAlt: string;
    defaultAlt: string;
    sigAlt: string;
    contractNote: string;
    downloading: string;
    downloadMerged: string;
    openOriginal: string;
    sigNote: string;
    downloadSigOnly: string;
    openDirect: string;
  };
  warnings: {
    loadError: string;
    selectMemberError: string;
    reasonError: string;
    dateRequiredError: string;
    dateOrderError: string;
    sendError: string;
    sendSuccess: string;
    sendNetworkError: string;
    heading: string;
    subheadingPrefix: string;
    subheadingSuffix: string;
    refresh: string;
    selectMemberLabel: string;
    noMembersOption: string;
    unlinkedSuffix: string;
    unlinkedWarning: string;
    durationLabel: string;
    customCalendarOption: string;
    startDateLabel: string;
    endDateLabel: string;
    selectedDuration: string;
    daySingular: string;
    dayPlural: string;
    fromToPrefix: string;
    toWord: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    sending: string;
    sendBtn: string;
    activeListTitle: string;
    noActivePledges: string;
    signedBadge: string;
    pendingBadge: string;
    reasonPrefix: string;
    nameLabel: string;
    ageLabel: string;
    discordLabel: string;
    viewSignature: string;
    durationPrefix: string;
    expiresPrefix: string;
    deleteBtn: string;
    durations: Record<string, string>;
  };
  members: {
    loadError: string;
    uploadError: string;
    uploadNetworkError: string;
    requiredError: string;
    saveError: string;
    networkError: string;
    confirmDelete: string;
    title: string;
    subtitle: string;
    addBtn: string;
    loadingAria: string;
    emptyState: string;
    linkedSocialsSuffix: string;
    moveUp: string;
    moveDown: string;
    editBtn: string;
    deleteBtn: string;
    editDialogTitle: string;
    addDialogTitle: string;
    uploading: string;
    uploadAvatar: string;
    removeAvatar: string;
    avatarUrlPlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
    rankLabel: string;
    rankPlaceholder: string;
    roleSelectLabel: string;
    roleSelectPlaceholder: string;
    adminSubSelectLabel: string;
    adminSubSelectPlaceholder: string;
    gameSelectLabel: string;
    gameSelectPlaceholder: string;
    bioLabel: string;
    bioPlaceholder: string;
    socialsLabel: string;
    addSocialBtn: string;
    noSocials: string;
    socialPlaceholder: string;
    deleteSocialAria: string;
    cancelBtn: string;
    saving: string;
    saveBtn: string;
  };
  excel: {
    title: string;
    subtitle: string;
    refresh: string;
    save: string;
    saving: string;
    savedSuccess: string;
    saveError: string;
    loadError: string;
    colCategory: string;
    colTarget: string;
    colActual: string;
    colRemaining: string;
    colStatus: string;
    statusFull: string;
    statusOpen: string;
    totalRow: string;
    addRowBtn: string;
    newRowPlaceholder: string;
    deleteRowAria: string;
    loadingAria: string;
    tabPlan: string;
    tabAllRecords: string;
    saveQuotas: string;
    quotasSaved: string;
    quotasSaveError: string;
    copyWhatsapp: string;
    copiedWhatsapp: string;
    downloadPlanCsv: string;
    allDepts: string;
    searchPlanPlaceholder: string;
    planTableTitle: string;
    colDept: string;
    colRank: string;
    colRequired: string;
    colOccupiedEmpty: string;
    colMembersSlots: string;
    decreaseTitle: string;
    increaseTitle: string;
    emptyWord: string;
    emptySlot: string;
    occupiedWord: string;
    totalFooterNote: string;
    memberFallback: string;
    waHeader: string;
    waAllFull: string;
    waTotalEmpty: string;
    waApplyLink: string;
    membersTitle: string;
    membersSubtitle: string;
    quickAddBtn: string;
    emptyTemplateBtn: string;
    uploadCsvBtn: string;
    downloadCsvBtn: string;
    uploadEmptyError: string;
    uploadNoValidRows: string;
    uploadSuccess: string;
    uploadError: string;
    uploadParseError: string;
    nameReqLabel: string;
    namePlaceholder: string;
    nickLabel: string;
    nickPlaceholder: string;
    discordLabel: string;
    whatsappLabel: string;
    roleLabel: string;
    statusLabel: string;
    noteLabel: string;
    notePlaceholder: string;
    saveRowBtn: string;
    filterAll: string;
    filterAccepted: string;
    filterPending: string;
    filterRejected: string;
    searchTablePlaceholder: string;
    colName: string;
    colNick: string;
    colDiscord: string;
    colWhatsapp: string;
    colRole: string;
    colSubGame: string;
    colContract: string;
    colNotes: string;
    colAction: string;
    statusAcceptedMember: string;
    statusPendingReview: string;
    statusRejected: string;
    addNotePlaceholder: string;
    saveEditTitle: string;
    confirmDeleteRow: string;
    deleteRowTitle: string;
    emptyTable: string;
  };
  management: {
    headerTitle: string;
    headerSubtitle: string;
    refreshDataTitle: string;
    loadError: string;
    settingsLoadError: string;
    settingsSaved: string;
    settingsSaveError: string;
    tabApplications: string;
    tabLeaves: string;
    tabEvents: string;
    tabMembers: string;
    tabExcel: string;
    tabWarnings: string;
    tabSettings: string;
    statTotal: string;
    leaveStatTotal: string;
    eventsStatTotal: string;
    statPending: string;
    statAccepted: string;
    statRejected: string;
    searchPlaceholder: string;
    leaveSearchPlaceholder: string;
    eventsSearchPlaceholder: string;
    allStatuses: string;
    statusPending: string;
    statusAccepted: string;
    statusRejected: string;
    allRoles: string;
    noMatchingApps: string;
    noMatchingLeaves: string;
    noMatchingEvents: string;
    noAppsHint: string;
    settingsTitle: string;
    settingsDesc: string;
    loadingSettingsAria: string;
    globalStatusTitle: string;
    globalStatusDesc: string;
    statusOpen: string;
    statusClosed: string;
    rolesSectionTitle: string;
    rolesSectionDesc: string;
    adminSubsSectionTitle: string;
    adminSubsSectionDesc: string;
    gamesSectionTitle: string;
    gamesSectionDesc: string;
    saveNameTitle: string;
    cancelTitle: string;
    editNameTitle: string;
    deleteItemTitle: string;
    excelFullTooltip: string;
    badgeFull: string;
    badgeClosed: string;
    badgeOpenRole: string;
    badgeAvailable: string;
    newRolePlaceholder: string;
    addRoleBtn: string;
    newAdminSubPlaceholder: string;
    addAdminSubBtn: string;
    newGamePlaceholder: string;
    addGameBtn: string;
    announcementLabel: string;
    announcementHint: string;
    announcementPlaceholder: string;
    guidelinesLabel: string;
    guidelinesHint: string;
    guidelinesPlaceholder: string;
    savingSettings: string;
    saveSettingsBtn: string;
    unnamedApplicant: string;
    leaveRequestType: string;
    eventsRequestType: string;
    typePrefix: string;
    rankPrefix: string;
    leaveDurationPrefix: string;
    adminSubPrefix: string;
    gamePrefix: string;
    agePrefix: string;
    yearsSuffix: string;
    countryPrefix: string;
    experiencePrefix: string;
    prevClansPrefix: string;
    yes: string;
    no: string;
    contractPrefix: string;
    pledgePrefix: string;
    pledgeAgreed: string;
    pledgeUnconfirmed: string;
    discordPrefix: string;
    copyDiscordTitle: string;
    whatsappPrefix: string;
    channelPrefix: string;
    streamPrefix: string;
    portfolioPrefix: string;
    docLeave: string;
    docEvents: string;
    docDefault: string;
    previewContractBtn: string;
    openOriginalTitle: string;
    reasonLeaveLabel: string;
    reasonApplyLabel: string;
    resendDiscordBtn: string;
    editRoleLabel: string;
    editAdminSubLabel: string;
    adminOnlyOption: string;
    chooseSubOption: string;
    editGameLabel: string;
    playersOnlyOption: string;
    unspecifiedOption: string;
    appStatusLabel: string;
    acceptOption: string;
    rejectOption: string;
    staffNoteLabel: string;
    staffNotePlaceholder: string;
    confirmDeleteApp: string;
    deleting: string;
    deleteAppBtn: string;
    savingApp: string;
    saveAppBtn: string;
  };
};

const ar: SolarDashboardCopy = {
  contractViewer: {
    leaveTitle: "معاينة عقد الإجازة والتوقيع — {name}",
    eventsTitle: "معاينة عقد إدارة الفعاليات والتوقيع — {name}",
    defaultTitle: "معاينة العقد والتوقيع — {name}",
    subtitle: "اختر بين عرض التوقيع داخل العقد بمكانه المعتمد أو استعراض التوقيع منفرداً.",
    closeAria: "إغلاق",
    tabContract: "بالعقد (مكانه داخل العقد)",
    tabSignature: "التوقيع لحاله",
    leaveAlt: "عقد الإجازة الرسمي لفريق Solar",
    defaultAlt: "وثيقة تعهد وعقد مقدّم Solar",
    sigAlt: "توقيع {name}",
    contractNote: "يظهر التوقيع الرقمي في المكان المخصص له داخل وثيقة العقد الرسمية.",
    downloading: "جاري تجهيز الصورة...",
    downloadMerged: "تحميل العقد مع التوقيع (PNG)",
    openOriginal: "فتح التوقيع الأصلي",
    sigNote: "التوقيع الرقمي المرفوع أو المرسوم بواسطة المتقدم.",
    downloadSigOnly: "تحميل التوقيع فقط (PNG)",
    openDirect: "فتح برابط مباشر",
  },
  warnings: {
    loadError: "تعذر تحميل التعهدات وأعضاء الكلان.",
    selectMemberError: "يرجى اختيار عضو من الكلان.",
    reasonError: "يرجى كتابة سبب التحذير / التعهد.",
    dateRequiredError: "يرجى تحديد تاريخ بداية ونهاية مدة التعهد من التقويم.",
    dateOrderError: "تاريخ نهاية التعهد يجب أن يكون بعد تاريخ البداية.",
    sendError: "تعذر إرسال التعهد، يرجى التحقق من البيانات.",
    sendSuccess: "تم إرسال التعهد للعضو بنجاح وسيظهر له في صفحة /solar/members.",
    sendNetworkError: "حدث خطأ أثناء إرسال التعهد.",
    heading: "إرسال تعهّد / تحذير لعضو في الكلان",
    subheadingPrefix: "يصل التعهد مباشرة إلى العضو في صفحة",
    subheadingSuffix: "وينحذف تلقائياً بعد انتهاء المدة المحددة.",
    refresh: "تحديث",
    selectMemberLabel: "اختر العضو من الكلان",
    noMembersOption: "لا يوجد أعضاء مسجلين",
    unlinkedSuffix: "(غير مربوط بحساب)",
    unlinkedWarning: "تنبيه: هذا العضو غير مربوط بحساب موقع بعد؛ لن يظهر له التعهد في /solar/members حتى يتم ربط حسابه.",
    durationLabel: "مدة التعهد (يختفي وينحذف تلقائياً بعدها)",
    customCalendarOption: "تحديد مدة التعهد من التقويم (بدون حد أقصى)",
    startDateLabel: "تاريخ البداية",
    endDateLabel: "تاريخ الانتهاء",
    selectedDuration: "المدة المحددة:",
    daySingular: "يوم",
    dayPlural: "أيام",
    fromToPrefix: "من",
    toWord: "إلى",
    reasonLabel: "سبب التعهد / التحذير",
    reasonPlaceholder: "اكتب سبب إصدار التحذير والتعهد بوضوح ليظهر للعضو...",
    sending: "جاري الإرسال...",
    sendBtn: "إرسال التعهد للعضو",
    activeListTitle: "التعهدات النشطة والموقّعة",
    noActivePledges: "لا توجد تعهدات نشطة حالياً.",
    signedBadge: "تم التوقيع",
    pendingBadge: "بانتظار التوقيع",
    reasonPrefix: "السبب:",
    nameLabel: "الاسم:",
    ageLabel: "العمر:",
    discordLabel: "ديسكورد:",
    viewSignature: "معاينة التوقيع / التعهد",
    durationPrefix: "المدة:",
    expiresPrefix: "ينحذف:",
    deleteBtn: "حذف",
    durations: {
      "3_days": "3 أيام",
      "7_days": "أسبوع",
      "14_days": "أسبوعين",
      "30_days": "شهر",
    },
  },
  members: {
    loadError: "تعذر تحميل أعضاء الكلان.",
    uploadError: "تعذر رفع الصورة. تأكد من صيغة وحجم الملف.",
    uploadNetworkError: "حدث خطأ أثناء رفع الصورة.",
    requiredError: "يرجى كتابة اسم الشخص ورتبته في الكلان.",
    saveError: "تعذر حفظ بيانات العضو. تأكد من صحة الروابط.",
    networkError: "تعذر الاتصال بالخادم.",
    confirmDelete: "هل تريد حذف هذا العضو من قائمة الكلان؟",
    title: "أعضاء الكلان",
    subtitle: "يظهرون في نهاية صفحة كلان سولار (/solar) بنفس شكل قائمة المتصدرين مع صورة ورتبة وزر تفاصيل وحسابات كل عضو.",
    addBtn: "إضافة عضو للكلان",
    loadingAria: "جاري التحميل...",
    emptyState: "لا يوجد أعضاء مضافون بعد. اضغط على «إضافة عضو للكلان» لإضافة أول عضو.",
    linkedSocialsSuffix: "حساب مرتبط",
    moveUp: "تحريك لأعلى",
    moveDown: "تحريك لأسفل",
    editBtn: "تعديل",
    deleteBtn: "حذف",
    editDialogTitle: "تعديل العضو · {name}",
    addDialogTitle: "إضافة عضو جديد للكلان",
    uploading: "جاري الرفع...",
    uploadAvatar: "رفع صورة من جهازك",
    removeAvatar: "إزالة الصورة",
    avatarUrlPlaceholder: "أو الصق رابط الصورة مباشرة (https://...)",
    nameLabel: "اسم الشخص *",
    namePlaceholder: "مثال: Zo7al",
    rankLabel: "رتبته بالكلان *",
    rankPlaceholder: "مثال: قائد الكلان / صانع محتوى",
    roleSelectLabel: "المرتبة / القسم",
    roleSelectPlaceholder: "اختر المرتبة / القسم...",
    adminSubSelectLabel: "نوع الإشراف / الرتبة الإدارية",
    adminSubSelectPlaceholder: "اختر الرتبة الإدارية...",
    gameSelectLabel: "اللعبة (فيفا، فورت، ماينكرافت، أو روكيت)",
    gameSelectPlaceholder: "اختر اللعبة...",
    bioLabel: "نبذة / تفاصيل إضافية (اختياري)",
    bioPlaceholder: "معلومات مختصرة تظهر عند فتح تفاصيل العضو...",
    socialsLabel: "حسابات العضو (تظهر في صفحة التفاصيل)",
    addSocialBtn: "إضافة حساب",
    noSocials: "لا توجد حسابات مضافة بعد.",
    socialPlaceholder: "اليوزر (@...)",
    deleteSocialAria: "حذف الحساب",
    cancelBtn: "إلغاء",
    saving: "جاري الحفظ...",
    saveBtn: "حفظ العضو",
  },
  excel: {
    title: "جدول خطة الرتب والأعداد (Excel)",
    subtitle: "مقارنة الأعداد المطلوبة مع الأعضاء الحاليين في الكلان وتحديث حالة القبول تلقائياً.",
    refresh: "تحديث",
    save: "حفظ الخطة",
    saving: "جاري الحفظ...",
    savedSuccess: "تم حفظ جدول الخطة بنجاح.",
    saveError: "تعذر حفظ الخطة.",
    loadError: "تعذر تحميل جدول الخطة.",
    colCategory: "القسم / الرتبة",
    colTarget: "المطلوب",
    colActual: "الموجود",
    colRemaining: "المتبقي",
    colStatus: "الحالة",
    statusFull: "مكتمل",
    statusOpen: "مفتوح",
    totalRow: "الإجمالي",
    addRowBtn: "إضافة صف جديد",
    newRowPlaceholder: "اسم القسم / الرتبة...",
    deleteRowAria: "حذف الصف",
    loadingAria: "جاري التحميل...",
    tabPlan: "سجل أعضاء الكلان | خطة توزيع الرتب",
    tabAllRecords: "سجل المتقدمين الكامل ({count})",
    saveQuotas: "حفظ الأعداد",
    quotasSaved: "تم حفظ أعداد الرتب والأماكن الفاضية بنجاح!",
    quotasSaveError: "تعذر حفظ الأعداد، يرجى المحاولة مجدداً.",
    copyWhatsapp: "نسخ كرسالة واتساب",
    copiedWhatsapp: "تم نسخ رسالة الواتساب!",
    downloadPlanCsv: "تحميل خطة التوزيع (CSV)",
    allDepts: "كل الأقسام",
    searchPlanPlaceholder: "بحث بالقسم أو الرتبة أو العضو...",
    planTableTitle: "سجل أعضاء الكلان | خطة توزيع الرتب",
    colDept: "القسم",
    colRank: "الرتبة",
    colRequired: "العدد المطلوب",
    colOccupiedEmpty: "المشغول / الفاضي",
    colMembersSlots: "الأعضاء والأماكن الفاضية",
    decreaseTitle: "إنقاص العدد",
    increaseTitle: "زيادة العدد",
    emptyWord: "فاضي",
    emptySlot: "مكان فاضي",
    occupiedWord: "مشغول",
    totalFooterNote: "أي عضو يتم قبوله في التقديم ينزل تلقائياً في مكانه المخصص هنا، وأي رتبة تضاف في إعدادات التقديم تظهر تلقائياً.",
    memberFallback: "عضو",
    waHeader: "**📋 الرتب التي تحتاج إلى أعضاء:**",
    waAllFull: "جميع المقاعد مكتملة حالياً ✅",
    waTotalEmpty: "**📊 إجمالي المقاعد الشاغرة: {count}**",
    waApplyLink: "رابط التقديم : https://zo7al.is-a.dev/solar",
    membersTitle: "جدول Excel للأعضاء والمتقدمين ({count})",
    membersSubtitle: "استعراض، تعديل، رفع (استيراد CSV/Excel) وتحميل قائمة أعضاء الكلان والموافق عليهم والمتقدمين.",
    quickAddBtn: "إضافة صف سريع",
    emptyTemplateBtn: "نموذج فارغ",
    uploadCsvBtn: "رفع ملف Excel (CSV)",
    downloadCsvBtn: "تحميل Excel (CSV)",
    uploadEmptyError: "الملف فارغ أو لا يحتوي على صفوف بيانات.",
    uploadNoValidRows: "لم يتم العثور على صفوف صالحة تحتوي على الاسم.",
    uploadSuccess: "تم رفع واستيراد {count} سجل بنجاح في الجدول!",
    uploadError: "حدث خطأ أثناء رفع البيانات، يرجى المحاولة مجدداً.",
    uploadParseError: "تعذر قراءة الملف. تأكد أنه بصيغة CSV صحيحة.",
    nameReqLabel: "الاسم *",
    namePlaceholder: "الاسم",
    nickLabel: "اللقب",
    nickPlaceholder: "اللقب",
    discordLabel: "الديسكورد",
    whatsappLabel: "الجوال",
    roleLabel: "الرتبة",
    statusLabel: "الحالة",
    noteLabel: "ملاحظة",
    notePlaceholder: "ملاحظة",
    saveRowBtn: "حفظ الصف",
    filterAll: "الكل",
    filterAccepted: "الأعضاء الموافق عليهم",
    filterPending: "قيد المراجعة",
    filterRejected: "المرفوضين",
    searchTablePlaceholder: "بحث في الجدول...",
    colName: "الاسم",
    colNick: "اللقب",
    colDiscord: "الديسكورد",
    colWhatsapp: "الجوال",
    colRole: "الرتبة",
    colSubGame: "التخصص / اللعبة",
    colContract: "مدة العقد",
    colNotes: "ملاحظات",
    colAction: "إجراء",
    statusAcceptedMember: "مقبول (عضو)",
    statusPendingReview: "قيد المراجعة",
    statusRejected: "مرفوض",
    addNotePlaceholder: "أضف ملاحظة...",
    saveEditTitle: "حفظ التعديل",
    confirmDeleteRow: "حذف \"{name}\" من الجدول؟",
    deleteRowTitle: "حذف السجل",
    emptyTable: "لا توجد سجلات مطابقة حالياً. يمكنك رفع ملف CSV أو إضافة صف جديد.",
  },
  management: {
    headerTitle: "إدارة كلان Solar System",
    headerSubtitle: "مراجعة طلبات الانضمام للكلان، طلبات الإجازة، تحديث حالة المتقدمين، وتعديل إعدادات التقديم المتاحة.",
    refreshDataTitle: "تحديث البيانات",
    loadError: "تعذر تحميل طلبات التقديم.",
    settingsLoadError: "تعذر تحميل إعدادات التقديم.",
    settingsSaved: "تم حفظ إعدادات التقديم بنجاح.",
    settingsSaveError: "تعذر حفظ إعدادات التقديم.",
    tabApplications: "طلبات التقديم",
    tabLeaves: "طلبات الإجازة",
    tabEvents: "طلبات إدارة الفعاليات",
    tabMembers: "أعضاء الكلان",
    tabExcel: "جدول Excel والأعضاء",
    tabWarnings: "التعهدات والإنذارات",
    tabSettings: "إعدادات التقديم",
    statTotal: "إجمالي الطلبات",
    leaveStatTotal: "إجمالي طلبات الإجازة",
    eventsStatTotal: "إجمالي طلبات الفعاليات",
    statPending: "قيد المراجعة",
    statAccepted: "تم القبول",
    statRejected: "مرفوضة",
    searchPlaceholder: "ابحث بالاسم، الديسكورد، الواتساب أو رقم الطلب...",
    leaveSearchPlaceholder: "ابحث بالاسم، الديسكورد، الجوال أو سبب الإجازة...",
    eventsSearchPlaceholder: "ابحث بالاسم، العمر، أو يوزر الديسكورد...",
    allStatuses: "جميع الحالات",
    statusPending: "قيد المراجعة",
    statusAccepted: "تم القبول",
    statusRejected: "مرفوض",
    allRoles: "جميع الأقسام",
    noMatchingApps: "لا توجد طلبات تقديم مطابقة للبحث أو الفلتر",
    noMatchingLeaves: "لا توجد طلبات إجازة مطابقة للبحث حالياً.",
    noMatchingEvents: "لا توجد طلبات إدارة فعاليات مطابقة للبحث حالياً.",
    noAppsHint: "طلبات الانضمام الجديدة لكلان Solar ستظهر هنا بمجرد تقديمها عبر الموقع.",
    settingsTitle: "إعدادات وحالة التقديم لكلان Solar",
    settingsDesc: "تحكم في فتح وإغلاق التقديم العام، وتفعيل أو إيقاف التقديم على أقسام ورتب معينة، وإضافة إعلانات تظهر للمتقدمين.",
    loadingSettingsAria: "جاري تحميل إعدادات التقديم...",
    globalStatusTitle: "حالة التقديم العامة للكلان",
    globalStatusDesc: "عند إغلاق التقديم، لن يتمكن أي زائر من تقديم طلب جديد وسيظهر تنبيه بأن التقديم مغلق.",
    statusOpen: "مفتوح",
    statusClosed: "مغلق",
    rolesSectionTitle: "التقديم حسب الأقسام والرتب",
    rolesSectionDesc: "حدد الأقسام المتاحة للتقديم حالياً أو أضف رتباً جديدة، وأي رتبة تغلقها ستظهر للمتقدم ولكن لا تنضغط.",
    adminSubsSectionTitle: "التحكم في رتب وتخصصات الإدارة (تظهر للمتقدم ولكن لا تنضغط إذا كانت مغلقة)",
    adminSubsSectionDesc: "عند إغلاق أي تخصص إداري أو إضافة تخصص جديد، سيظهر في قائمة التقديم ويمكنك جعله غير متاح مؤقتاً.",
    gamesSectionTitle: "التحكم في الألعاب (تظهر للمتقدم ولكن لا تنضغط إذا كانت مغلقة)",
    gamesSectionDesc: "أضف ألعاباً جديدة أو أغلق ألعاباً مؤقتاً للاعبين وإدارة اللاعبين.",
    saveNameTitle: "حفظ الاسم",
    cancelTitle: "إلغاء",
    editNameTitle: "تعديل الاسم",
    deleteItemTitle: "حذف",
    excelFullTooltip: "مكتمل في الإكسل — لفتحه قم بزيادة العدد المطلوب من جدول الإكسل",
    badgeFull: "مغلق (مكتمل)",
    badgeClosed: "مغلق (لا ينضغط)",
    badgeOpenRole: "متاح للتقديم",
    badgeAvailable: "متاح",
    newRolePlaceholder: "اكتب اسم رتبة جديدة لإضافتها...",
    addRoleBtn: "إضافة رتبة",
    newAdminSubPlaceholder: "اكتب اسم تخصص إداري جديد...",
    addAdminSubBtn: "إضافة تخصص",
    newGamePlaceholder: "اكتب اسم لعبة جديدة...",
    addGameBtn: "إضافة لعبة",
    announcementLabel: "إعلان أو تنبيه التقديم (اختياري)",
    announcementHint: "رسالة تظهر في أعلى نافذة التقديم (مثل: \"نبحث حالياً عن لاعبين تنافسيين لفريق فورتنايت ومحرري فيديو\")",
    announcementPlaceholder: "اكتب إعلاناً أو تنبيهاً يظهر للمتقدمين...",
    guidelinesLabel: "شروط وملاحظات التقديم",
    guidelinesHint: "تعليمات توضح شروط القبول ومتطلبات كل رتبة.",
    guidelinesPlaceholder: "مثال: يرجى إرفاق رابط القناة أو البث والتأكد من إمكانية التواصل عبر الديسكورد...",
    savingSettings: "جاري الحفظ...",
    saveSettingsBtn: "حفظ إعدادات التقديم",
    unnamedApplicant: "متقدم بدون اسم",
    leaveRequestType: "طلب إجازة",
    eventsRequestType: "إدارة فعاليات ديسكورد",
    typePrefix: "النوع:",
    rankPrefix: "الرتبة:",
    leaveDurationPrefix: "مدة الإجازة:",
    adminSubPrefix: "التخصص:",
    gamePrefix: "اللعبة:",
    agePrefix: "العمر:",
    yearsSuffix: "سنة",
    countryPrefix: "من وين:",
    experiencePrefix: "مدة الخبرة:",
    prevClansPrefix: "كلانات سابقة:",
    yes: "نعم",
    no: "لا",
    contractPrefix: "مدة العقد:",
    pledgePrefix: "التعهد:",
    pledgeAgreed: "موافق وملتزم",
    pledgeUnconfirmed: "لم يؤكد",
    discordPrefix: "الديسكورد:",
    copyDiscordTitle: "نسخ اسم الحساب",
    whatsappPrefix: "الواتساب:",
    channelPrefix: "رابط القناة:",
    streamPrefix: "رابط البث:",
    portfolioPrefix: "معرض الأعمال:",
    docLeave: "وثيقة تعهّد الإجازة:",
    docEvents: "وثيقة عقد إدارة الفعاليات:",
    docDefault: "وثيقة العقد والتوقيع:",
    previewContractBtn: "معاينة بالعقد / لحاله",
    openOriginalTitle: "فتح الرابط الأصلي",
    reasonLeaveLabel: "لماذا ترغب باخذ اجازة في Solar System؟",
    reasonApplyLabel: "لماذا ترغب بالانضمام إلى Solar System؟",
    resendDiscordBtn: "إعادة إرسال للديسكورد",
    editRoleLabel: "الرتبة:",
    editAdminSubLabel: "التخصص:",
    adminOnlyOption: "للإدارة فقط",
    chooseSubOption: "— اختر التخصص —",
    editGameLabel: "اللعبة:",
    playersOnlyOption: "لإدارة اللاعبين واللاعبين فقط",
    unspecifiedOption: "— غير محدد —",
    appStatusLabel: "حالة الطلب:",
    acceptOption: "قبول الطلب",
    rejectOption: "رفض الطلب",
    staffNoteLabel: "ملاحظات الإدارة للطلب (تظهر للمتقدم):",
    staffNotePlaceholder: "مثال: تم قبولك وسيتم التواصل معك بالديسكورد...",
    confirmDeleteApp: "هل أنت متأكد من حذف طلب \"{name}\" نهائياً من لوحة التحكم؟ لا يمكن التراجع عن هذا الإجراء.",
    deleting: "جاري الحذف...",
    deleteAppBtn: "حذف الطلب",
    savingApp: "جاري الحفظ...",
    saveAppBtn: "حفظ حالة الطلب",
  },
};

const en: SolarDashboardCopy = {
  contractViewer: {
    leaveTitle: "Leave Contract & Signature Preview — {name}",
    eventsTitle: "Events Contract & Signature Preview — {name}",
    defaultTitle: "Contract & Signature Preview — {name}",
    subtitle: "Choose between viewing the signature placed inside the official contract or viewing it standalone.",
    closeAria: "Close",
    tabContract: "Inside Contract",
    tabSignature: "Signature Only",
    leaveAlt: "Official Solar Team Leave Contract",
    defaultAlt: "Solar Applicant Pledge & Contract",
    sigAlt: "{name}'s signature",
    contractNote: "The digital signature is displayed in its designated area inside the official contract.",
    downloading: "Preparing image...",
    downloadMerged: "Download Contract + Signature (PNG)",
    openOriginal: "Open Original Signature",
    sigNote: "Digital signature uploaded or drawn by the applicant.",
    downloadSigOnly: "Download Signature Only (PNG)",
    openDirect: "Open Direct Link",
  },
  warnings: {
    loadError: "Failed to load warning pledges and clan members.",
    selectMemberError: "Please select a clan member.",
    reasonError: "Please enter the warning / pledge reason.",
    dateRequiredError: "Please select both start and end dates from the calendar.",
    dateOrderError: "End date must be on or after start date.",
    sendError: "Failed to send pledge, please check the details.",
    sendSuccess: "Pledge sent to the member successfully and will appear on /solar/members.",
    sendNetworkError: "An error occurred while sending the pledge.",
    heading: "Send Warning / Pledge to a Clan Member",
    subheadingPrefix: "The pledge is delivered directly to the member at",
    subheadingSuffix: "and is automatically removed after the specified duration.",
    refresh: "Refresh",
    selectMemberLabel: "Select Clan Member",
    noMembersOption: "No registered members",
    unlinkedSuffix: "(Not linked to account)",
    unlinkedWarning: "Note: This member has not linked a site account yet; the pledge will not appear at /solar/members until linked.",
    durationLabel: "Pledge Duration (auto-expires & deletes afterward)",
    customCalendarOption: "Pick custom duration from calendar (unlimited)",
    startDateLabel: "Start Date",
    endDateLabel: "End Date",
    selectedDuration: "Selected duration:",
    daySingular: "day",
    dayPlural: "days",
    fromToPrefix: "from",
    toWord: "to",
    reasonLabel: "Warning / Pledge Reason",
    reasonPlaceholder: "Clearly write the reason for issuing this warning pledge...",
    sending: "Sending...",
    sendBtn: "Send Pledge to Member",
    activeListTitle: "Active & Signed Pledges",
    noActivePledges: "No active pledges right now.",
    signedBadge: "Signed",
    pendingBadge: "Awaiting Signature",
    reasonPrefix: "Reason:",
    nameLabel: "Name:",
    ageLabel: "Age:",
    discordLabel: "Discord:",
    viewSignature: "Preview Signature / Pledge",
    durationPrefix: "Duration:",
    expiresPrefix: "Deletes at:",
    deleteBtn: "Delete",
    durations: {
      "3_days": "3 Days",
      "7_days": "1 Week",
      "14_days": "2 Weeks",
      "30_days": "1 Month",
    },
  },
  members: {
    loadError: "Failed to load clan members.",
    uploadError: "Failed to upload image. Check file format and size.",
    uploadNetworkError: "An error occurred while uploading the image.",
    requiredError: "Please enter the member's name and clan rank.",
    saveError: "Failed to save member details. Check link formats.",
    networkError: "Could not connect to server.",
    confirmDelete: "Delete this member from the clan roster?",
    title: "Clan Members",
    subtitle: "Displayed at the bottom of the Solar page (/solar) in a leaderboard layout with avatar, rank, details button, and social links.",
    addBtn: "Add Clan Member",
    loadingAria: "Loading...",
    emptyState: "No members added yet. Click «Add Clan Member» to add the first member.",
    linkedSocialsSuffix: "linked accounts",
    moveUp: "Move up",
    moveDown: "Move down",
    editBtn: "Edit",
    deleteBtn: "Delete",
    editDialogTitle: "Edit Member · {name}",
    addDialogTitle: "Add New Clan Member",
    uploading: "Uploading...",
    uploadAvatar: "Upload Image from Device",
    removeAvatar: "Remove Image",
    avatarUrlPlaceholder: "Or paste image URL directly (https://...)",
    nameLabel: "Member Name *",
    namePlaceholder: "e.g., Zo7al",
    rankLabel: "Clan Rank *",
    rankPlaceholder: "e.g., Clan Leader / Content Creator",
    roleSelectLabel: "Division / Role",
    roleSelectPlaceholder: "Select division / role...",
    adminSubSelectLabel: "Admin / Supervision Rank",
    adminSubSelectPlaceholder: "Select admin rank...",
    gameSelectLabel: "Game (FIFA, Fortnite, Minecraft, or Rocket)",
    gameSelectPlaceholder: "Select game...",
    bioLabel: "Bio / Additional Details (Optional)",
    bioPlaceholder: "Brief info displayed in member details...",
    socialsLabel: "Member Socials (shown in details modal)",
    addSocialBtn: "Add Account",
    noSocials: "No accounts added yet.",
    socialPlaceholder: "Username (@...)",
    deleteSocialAria: "Remove account",
    cancelBtn: "Cancel",
    saving: "Saving...",
    saveBtn: "Save Member",
  },
  excel: {
    title: "Recruitment Quota Plan (Excel)",
    subtitle: "Compare target quotas against current clan members and auto-update application availability.",
    refresh: "Refresh",
    save: "Save Plan",
    saving: "Saving...",
    savedSuccess: "Quota plan saved successfully.",
    saveError: "Failed to save quota plan.",
    loadError: "Failed to load quota plan.",
    colCategory: "Division / Rank",
    colTarget: "Target",
    colActual: "Current",
    colRemaining: "Remaining",
    colStatus: "Status",
    statusFull: "Full",
    statusOpen: "Open",
    totalRow: "Total",
    addRowBtn: "Add New Row",
    newRowPlaceholder: "Division / Rank name...",
    deleteRowAria: "Delete row",
    loadingAria: "Loading...",
    tabPlan: "Clan Members | Rank Distribution Plan",
    tabAllRecords: "Full Applicants Log ({count})",
    saveQuotas: "Save Quotas",
    quotasSaved: "Rank quotas and empty slots saved successfully!",
    quotasSaveError: "Failed to save quotas, please try again.",
    copyWhatsapp: "Copy as WhatsApp Message",
    copiedWhatsapp: "WhatsApp message copied!",
    downloadPlanCsv: "Download Distribution Plan (CSV)",
    allDepts: "All Departments",
    searchPlanPlaceholder: "Search by department, rank, or member...",
    planTableTitle: "Clan Members Roster | Rank Distribution Plan",
    colDept: "Department",
    colRank: "Rank",
    colRequired: "Required",
    colOccupiedEmpty: "Occupied / Empty",
    colMembersSlots: "Members & Empty Slots",
    decreaseTitle: "Decrease count",
    increaseTitle: "Increase count",
    emptyWord: "empty",
    emptySlot: "Empty Slot",
    occupiedWord: "occupied",
    totalFooterNote: "Any accepted applicant is automatically placed in their designated slot here, and any rank added in recruitment settings appears automatically.",
    memberFallback: "Member",
    waHeader: "**📋 Ranks currently needing members:**",
    waAllFull: "All slots are currently filled ✅",
    waTotalEmpty: "**📊 Total Empty Slots: {count}**",
    waApplyLink: "Application Link: https://zo7al.is-a.dev/solar",
    membersTitle: "Excel Sheet — Members & Applicants ({count})",
    membersSubtitle: "Browse, edit, upload (CSV/Excel import), and download the list of clan members, accepted members, and applicants.",
    quickAddBtn: "Quick Add Row",
    emptyTemplateBtn: "Empty Template",
    uploadCsvBtn: "Upload Excel (CSV)",
    downloadCsvBtn: "Download Excel (CSV)",
    uploadEmptyError: "File is empty or contains no data rows.",
    uploadNoValidRows: "No valid rows containing a name were found.",
    uploadSuccess: "Successfully uploaded and imported {count} records into the sheet!",
    uploadError: "An error occurred while uploading data, please try again.",
    uploadParseError: "Could not read file. Make sure it is a valid CSV format.",
    nameReqLabel: "Name *",
    namePlaceholder: "Name",
    nickLabel: "Nickname",
    nickPlaceholder: "Nickname",
    discordLabel: "Discord",
    whatsappLabel: "Phone",
    roleLabel: "Rank",
    statusLabel: "Status",
    noteLabel: "Note",
    notePlaceholder: "Note",
    saveRowBtn: "Save Row",
    filterAll: "All",
    filterAccepted: "Accepted Members",
    filterPending: "Pending Review",
    filterRejected: "Rejected",
    searchTablePlaceholder: "Search table...",
    colName: "Name",
    colNick: "Nickname",
    colDiscord: "Discord",
    colWhatsapp: "Phone",
    colRole: "Rank",
    colSubGame: "Specialty / Game",
    colContract: "Contract Duration",
    colNotes: "Notes",
    colAction: "Action",
    statusAcceptedMember: "Accepted (Member)",
    statusPendingReview: "Pending Review",
    statusRejected: "Rejected",
    addNotePlaceholder: "Add note...",
    saveEditTitle: "Save changes",
    confirmDeleteRow: "Delete \"{name}\" from the table?",
    deleteRowTitle: "Delete record",
    emptyTable: "No matching records found. You can upload a CSV file or add a new row.",
  },
  management: {
    headerTitle: "Solar System Clan Management",
    headerSubtitle: "Review clan join applications, leave requests, update applicant statuses, and configure recruitment settings.",
    refreshDataTitle: "Refresh data",
    loadError: "Failed to load applications.",
    settingsLoadError: "Failed to load recruitment settings.",
    settingsSaved: "Recruitment settings saved successfully.",
    settingsSaveError: "Failed to save recruitment settings.",
    tabApplications: "Applications",
    tabLeaves: "Leave Requests",
    tabEvents: "Events Staff Requests",
    tabMembers: "Clan Members",
    tabExcel: "Excel Sheet & Members",
    tabWarnings: "Warnings & Pledges",
    tabSettings: "Recruitment Settings",
    statTotal: "Total Requests",
    leaveStatTotal: "Total Leave Requests",
    eventsStatTotal: "Total Events Requests",
    statPending: "Pending Review",
    statAccepted: "Accepted",
    statRejected: "Rejected",
    searchPlaceholder: "Search by name, Discord, WhatsApp, or reference...",
    leaveSearchPlaceholder: "Search by name, Discord, phone, or leave reason...",
    eventsSearchPlaceholder: "Search by name, age, or Discord username...",
    allStatuses: "All Statuses",
    statusPending: "Pending Review",
    statusAccepted: "Accepted",
    statusRejected: "Rejected",
    allRoles: "All Divisions",
    noMatchingApps: "No applications match your search or filter",
    noMatchingLeaves: "No leave requests match your search right now.",
    noMatchingEvents: "No events staff requests match your search right now.",
    noAppsHint: "New Solar Clan applications will appear here once submitted.",
    settingsTitle: "Solar Clan Recruitment Settings & Status",
    settingsDesc: "Control global recruitment status, toggle specific divisions/ranks, and add announcements for applicants.",
    loadingSettingsAria: "Loading recruitment settings...",
    globalStatusTitle: "Global Clan Recruitment Status",
    globalStatusDesc: "When closed, visitors cannot submit new applications and will see a closed notice.",
    statusOpen: "Open",
    statusClosed: "Closed",
    rolesSectionTitle: "Recruitment by Divisions & Ranks",
    rolesSectionDesc: "Enable or disable divisions or add new ranks. Closed ranks stay visible but disabled.",
    adminSubsSectionTitle: "Admin Ranks & Sub-specialties (visible but disabled when closed)",
    adminSubsSectionDesc: "Close any admin rank or add a new one to control availability.",
    gamesSectionTitle: "Games Control (visible but disabled when closed)",
    gamesSectionDesc: "Add new games or temporarily close games for players and player admins.",
    saveNameTitle: "Save Name",
    cancelTitle: "Cancel",
    editNameTitle: "Edit Name",
    deleteItemTitle: "Delete",
    excelFullTooltip: "Quota full in Excel — increase target count in Excel sheet to reopen",
    badgeFull: "Closed (Full)",
    badgeClosed: "Closed (Disabled)",
    badgeOpenRole: "Open for Applications",
    badgeAvailable: "Available",
    newRolePlaceholder: "Enter new rank name...",
    addRoleBtn: "Add Rank",
    newAdminSubPlaceholder: "Enter new admin rank name...",
    addAdminSubBtn: "Add Rank",
    newGamePlaceholder: "Enter new game name...",
    addGameBtn: "Add Game",
    announcementLabel: "Recruitment Announcement / Notice (Optional)",
    announcementHint: "Message shown at the top of the application modal",
    announcementPlaceholder: "Write an announcement or notice for applicants...",
    guidelinesLabel: "Application Rules & Notes",
    guidelinesHint: "Instructions explaining acceptance criteria and rank requirements.",
    guidelinesPlaceholder: "e.g., Attach your channel or stream link and ensure Discord reachability...",
    savingSettings: "Saving...",
    saveSettingsBtn: "Save Recruitment Settings",
    unnamedApplicant: "Unnamed Applicant",
    leaveRequestType: "Leave Request",
    eventsRequestType: "Discord Events Staff",
    typePrefix: "Type:",
    rankPrefix: "Rank:",
    leaveDurationPrefix: "Leave Duration:",
    adminSubPrefix: "Specialty:",
    gamePrefix: "Game:",
    agePrefix: "Age:",
    yearsSuffix: "yrs",
    countryPrefix: "Location:",
    experiencePrefix: "Experience:",
    prevClansPrefix: "Previous Clans:",
    yes: "Yes",
    no: "No",
    contractPrefix: "Contract:",
    pledgePrefix: "Pledge:",
    pledgeAgreed: "Agreed & Committed",
    pledgeUnconfirmed: "Unconfirmed",
    discordPrefix: "Discord:",
    copyDiscordTitle: "Copy username",
    whatsappPrefix: "WhatsApp:",
    channelPrefix: "Channel URL:",
    streamPrefix: "Stream URL:",
    portfolioPrefix: "Portfolio:",
    docLeave: "Leave Pledge Document:",
    docEvents: "Events Contract Document:",
    docDefault: "Contract & Signature Document:",
    previewContractBtn: "Preview Contract / Signature",
    openOriginalTitle: "Open original link",
    reasonLeaveLabel: "Reason for Leave Request:",
    reasonApplyLabel: "Why do you want to join Solar System?",
    resendDiscordBtn: "Resend to Discord",
    editRoleLabel: "Role:",
    editAdminSubLabel: "Specialty:",
    adminOnlyOption: "Admin only",
    chooseSubOption: "— Select Specialty —",
    editGameLabel: "Game:",
    playersOnlyOption: "Players & Player Admins only",
    unspecifiedOption: "— Unspecified —",
    appStatusLabel: "Application Status:",
    acceptOption: "Accept Request",
    rejectOption: "Reject Request",
    staffNoteLabel: "Staff Notes (visible to applicant):",
    staffNotePlaceholder: "e.g., Accepted! We will contact you on Discord...",
    confirmDeleteApp: "Are you sure you want to permanently delete \"{name}\"'s request? This cannot be undone.",
    deleting: "Deleting...",
    deleteAppBtn: "Delete Request",
    savingApp: "Saving...",
    saveAppBtn: "Save Status",
  },
};

type DeepPartialDash = {
  contractViewer?: Partial<SolarDashboardCopy["contractViewer"]>;
  warnings?: Partial<SolarDashboardCopy["warnings"]>;
  members?: Partial<SolarDashboardCopy["members"]>;
  excel?: Partial<SolarDashboardCopy["excel"]>;
  management?: Partial<SolarDashboardCopy["management"]>;
};

function makeDashLocale(o: DeepPartialDash): SolarDashboardCopy {
  return {
    contractViewer: { ...en.contractViewer, ...o.contractViewer },
    warnings: { ...en.warnings, ...o.warnings },
    members: { ...en.members, ...o.members },
    excel: { ...en.excel, ...o.excel },
    management: { ...en.management, ...o.management },
  };
}

const es = makeDashLocale({
  contractViewer: { tabContract: "En Contrato", tabSignature: "Solo Firma", downloadMerged: "Descargar Contrato + Firma (PNG)", downloadSigOnly: "Descargar Solo Firma (PNG)", closeAria: "Cerrar" },
  warnings: { heading: "Enviar Advertencia / Compromiso", refresh: "Actualizar", sendBtn: "Enviar Compromiso", sending: "Enviando...", signedBadge: "Firmado", pendingBadge: "Pendiente de Firma", deleteBtn: "Eliminar", durations: { "3_days": "3 Días", "7_days": "1 Semana", "14_days": "2 Semanas", "30_days": "1 Mes" } },
  members: { title: "Miembros del Clan", addBtn: "Añadir Miembro", editBtn: "Editar", deleteBtn: "Eliminar", saveBtn: "Guardar Miembro", cancelBtn: "Cancelar" },
  excel: { title: "Plan de Cuotas (Excel)", tabPlan: "Miembros | Plan de Rangos", tabAllRecords: "Registro Completo ({count})", saveQuotas: "Guardar Cuotas", refresh: "Actualizar", save: "Guardar Plan", saving: "Guardando...", statusFull: "Completo", statusOpen: "Abierto", totalRow: "Total", copyWhatsapp: "Copiar como WhatsApp", downloadPlanCsv: "Descargar Plan (CSV)" },
  management: { headerTitle: "Gestión del Clan Solar System", tabApplications: "Solicitudes", tabLeaves: "Permisos", tabEvents: "Eventos Discord", tabMembers: "Miembros", tabExcel: "Excel y Miembros", tabWarnings: "Advertencias", tabSettings: "Configuración", statusOpen: "Abierto", statusClosed: "Cerrado", saveSettingsBtn: "Guardar Configuración", saveAppBtn: "Guardar Estado", deleteAppBtn: "Eliminar Solicitud" },
});

const fr = makeDashLocale({
  contractViewer: { tabContract: "Dans le Contrat", tabSignature: "Signature Seule", downloadMerged: "Télécharger Contrat + Signature (PNG)", downloadSigOnly: "Télécharger Signature (PNG)", closeAria: "Fermer" },
  warnings: { heading: "Envoyer un Avertissement / Engagement", refresh: "Actualiser", sendBtn: "Envoyer l'Engagement", sending: "Envoi...", signedBadge: "Signé", pendingBadge: "En Attente", deleteBtn: "Supprimer", durations: { "3_days": "3 Jours", "7_days": "1 Semaine", "14_days": "2 Semaines", "30_days": "1 Mois" } },
  members: { title: "Membres du Clan", addBtn: "Ajouter un Membre", editBtn: "Modifier", deleteBtn: "Supprimer", saveBtn: "Enregistrer", cancelBtn: "Annuler" },
  excel: { title: "Plan des Quotas (Excel)", tabPlan: "Membres | Plan des Rangs", tabAllRecords: "Journal Complet ({count})", saveQuotas: "Enregistrer Quotas", refresh: "Actualiser", save: "Enregistrer", saving: "Enregistrement...", statusFull: "Complet", statusOpen: "Ouvert", totalRow: "Total", copyWhatsapp: "Copier pour WhatsApp", downloadPlanCsv: "Télécharger Plan (CSV)" },
  management: { headerTitle: "Gestion du Clan Solar System", tabApplications: "Candidatures", tabLeaves: "Congés", tabEvents: "Événements Discord", tabMembers: "Membres", tabExcel: "Excel & Membres", tabWarnings: "Avertissements", tabSettings: "Paramètres", statusOpen: "Ouvert", statusClosed: "Fermé", saveSettingsBtn: "Enregistrer les Paramètres", saveAppBtn: "Enregistrer le Statut", deleteAppBtn: "Supprimer" },
});

const de = makeDashLocale({
  contractViewer: { tabContract: "Im Vertrag", tabSignature: "Nur Unterschrift", downloadMerged: "Vertrag + Unterschrift (PNG)", downloadSigOnly: "Nur Unterschrift (PNG)", closeAria: "Schließen" },
  warnings: { heading: "Verwarnung / Gelöbnis senden", refresh: "Aktualisieren", sendBtn: "Gelöbnis senden", sending: "Wird gesendet...", signedBadge: "Unterschrieben", pendingBadge: "Ausstehend", deleteBtn: "Löschen", durations: { "3_days": "3 Tage", "7_days": "1 Woche", "14_days": "2 Wochen", "30_days": "1 Monat" } },
  members: { title: "Clan-Mitglieder", addBtn: "Mitglied hinzufügen", editBtn: "Bearbeiten", deleteBtn: "Löschen", saveBtn: "Speichern", cancelBtn: "Abbrechen" },
  excel: { title: "Quotenplan (Excel)", tabPlan: "Mitglieder | Rangverteilung", tabAllRecords: "Alle Einträge ({count})", saveQuotas: "Quoten speichern", refresh: "Aktualisieren", save: "Plan speichern", saving: "Speichern...", statusFull: "Voll", statusOpen: "Offen", totalRow: "Gesamt", copyWhatsapp: "Für WhatsApp kopieren", downloadPlanCsv: "Plan herunterladen (CSV)" },
  management: { headerTitle: "Solar System Clan-Verwaltung", tabApplications: "Bewerbungen", tabLeaves: "Urlaubsanträge", tabEvents: "Discord-Events", tabMembers: "Mitglieder", tabExcel: "Excel & Mitglieder", tabWarnings: "Verwarnungen", tabSettings: "Einstellungen", statusOpen: "Offen", statusClosed: "Geschlossen", saveSettingsBtn: "Einstellungen speichern", saveAppBtn: "Status speichern", deleteAppBtn: "Löschen" },
});

const pt = makeDashLocale({
  contractViewer: { tabContract: "No Contrato", tabSignature: "Apenas Assinatura", downloadMerged: "Baixar Contrato + Assinatura (PNG)", downloadSigOnly: "Baixar Assinatura (PNG)", closeAria: "Fechar" },
  warnings: { heading: "Enviar Aviso / Compromisso", refresh: "Atualizar", sendBtn: "Enviar Compromisso", sending: "Enviando...", signedBadge: "Assinado", pendingBadge: "Aguardando", deleteBtn: "Excluir", durations: { "3_days": "3 Dias", "7_days": "1 Semana", "14_days": "2 Semanas", "30_days": "1 Mês" } },
  members: { title: "Membros do Clã", addBtn: "Adicionar Membro", editBtn: "Editar", deleteBtn: "Excluir", saveBtn: "Salvar", cancelBtn: "Cancelar" },
  excel: { title: "Plano de Cotas (Excel)", tabPlan: "Membros | Plano de Cargos", tabAllRecords: "Registro Completo ({count})", saveQuotas: "Salvar Cotas", refresh: "Atualizar", save: "Salvar Plano", saving: "Salvando...", statusFull: "Completo", statusOpen: "Aberto", totalRow: "Total", copyWhatsapp: "Copiar para WhatsApp", downloadPlanCsv: "Baixar Plano (CSV)" },
  management: { headerTitle: "Gestão do Clã Solar System", tabApplications: "Candidaturas", tabLeaves: "Licenças", tabEvents: "Eventos Discord", tabMembers: "Membros", tabExcel: "Excel e Membros", tabWarnings: "Avisos", tabSettings: "Configurações", statusOpen: "Aberto", statusClosed: "Fechado", saveSettingsBtn: "Salvar Configurações", saveAppBtn: "Salvar Status", deleteAppBtn: "Excluir" },
});

const tr = makeDashLocale({
  contractViewer: { tabContract: "Sözleşme İçinde", tabSignature: "Sadece İmza", downloadMerged: "Sözleşme + İmza İndir (PNG)", downloadSigOnly: "Sadece İmza İndir (PNG)", closeAria: "Kapat" },
  warnings: { heading: "Üyeye Uyarı / Taahhüt Gönder", refresh: "Yenile", sendBtn: "Taahhüt Gönder", sending: "Gönderiliyor...", signedBadge: "İmzalandı", pendingBadge: "İmza Bekleniyor", deleteBtn: "Sil", durations: { "3_days": "3 Gün", "7_days": "1 Hafta", "14_days": "2 Hafta", "30_days": "1 Ay" } },
  members: { title: "Klan Üyeleri", addBtn: "Üye Ekle", editBtn: "Düzenle", deleteBtn: "Sil", saveBtn: "Kaydet", cancelBtn: "İptal" },
  excel: { title: "Kontenjan Planı (Excel)", tabPlan: "Üyeler | Rütbe Planı", tabAllRecords: "Tüm Başvurular ({count})", saveQuotas: "Kontenjanı Kaydet", refresh: "Yenile", save: "Planı Kaydet", saving: "Kaydediliyor...", statusFull: "Dolu", statusOpen: "Açık", totalRow: "Toplam", copyWhatsapp: "WhatsApp Mesajı Kopyala", downloadPlanCsv: "Planı İndir (CSV)" },
  management: { headerTitle: "Solar System Klan Yönetimi", tabApplications: "Başvurular", tabLeaves: "İzin Talepleri", tabEvents: "Discord Etkinlikleri", tabMembers: "Üyeler", tabExcel: "Excel ve Üyeler", tabWarnings: "Uyarılar", tabSettings: "Ayarlar", statusOpen: "Açık", statusClosed: "Kapalı", saveSettingsBtn: "Ayarları Kaydet", saveAppBtn: "Durumu Kaydet", deleteAppBtn: "Sil" },
});

const ja = makeDashLocale({
  contractViewer: { tabContract: "契約書内", tabSignature: "署名のみ", downloadMerged: "契約書＋署名をダウンロード (PNG)", downloadSigOnly: "署名のみダウンロード (PNG)", closeAria: "閉じる" },
  warnings: { heading: "メンバーへ警告・誓約を送信", refresh: "更新", sendBtn: "誓約を送信", sending: "送信中...", signedBadge: "署名済み", pendingBadge: "署名待ち", deleteBtn: "削除", durations: { "3_days": "3日間", "7_days": "1週間", "14_days": "2週間", "30_days": "1ヶ月" } },
  members: { title: "クランメンバー", addBtn: "メンバー追加", editBtn: "編集", deleteBtn: "削除", saveBtn: "保存", cancelBtn: "キャンセル" },
  excel: { title: "募集枠プラン (Excel)", tabPlan: "メンバー｜役職配分プラン", tabAllRecords: "全応募記録 ({count})", saveQuotas: "募集枠を保存", refresh: "更新", save: "プランを保存", saving: "保存中...", statusFull: "満員", statusOpen: "受付中", totalRow: "合計", copyWhatsapp: "WhatsApp用にコピー", downloadPlanCsv: "プランをダウンロード (CSV)" },
  management: { headerTitle: "Solar System クラン管理", tabApplications: "応募一覧", tabLeaves: "休暇申請", tabEvents: "イベント運営", tabMembers: "メンバー", tabExcel: "Excel & メンバー", tabWarnings: "警告・誓約", tabSettings: "募集設定", statusOpen: "受付中", statusClosed: "停止中", saveSettingsBtn: "設定を保存", saveAppBtn: "ステータス保存", deleteAppBtn: "削除" },
});

const ko = makeDashLocale({
  contractViewer: { tabContract: "계약서 내부", tabSignature: "서명만", downloadMerged: "계약서 + 서명 다운로드 (PNG)", downloadSigOnly: "서명만 다운로드 (PNG)", closeAria: "닫기" },
  warnings: { heading: "클랜원에게 경고 / 서약 전송", refresh: "새로고침", sendBtn: "서약 전송", sending: "전송 중...", signedBadge: "서명 완료", pendingBadge: "서명 대기", deleteBtn: "삭제", durations: { "3_days": "3일", "7_days": "1주", "14_days": "2주", "30_days": "1개월" } },
  members: { title: "클랜 멤버", addBtn: "멤버 추가", editBtn: "수정", deleteBtn: "삭제", saveBtn: "저장", cancelBtn: "취소" },
  excel: { title: "정원 계획 (Excel)", tabPlan: "클랜원 | 등급 배분 계획", tabAllRecords: "전체 지원 기록 ({count})", saveQuotas: "정원 저장", refresh: "새로고침", save: "계획 저장", saving: "저장 중...", statusFull: "마감", statusOpen: "모집 중", totalRow: "합계", copyWhatsapp: "WhatsApp 메시지 복사", downloadPlanCsv: "계획 다운로드 (CSV)" },
  management: { headerTitle: "Solar System 클랜 관리", tabApplications: "지원서", tabLeaves: "휴가 신청", tabEvents: "디스코드 이벤트", tabMembers: "멤버", tabExcel: "Excel 및 멤버", tabWarnings: "경고 및 서약", tabSettings: "모집 설정", statusOpen: "열림", statusClosed: "닫힘", saveSettingsBtn: "설정 저장", saveAppBtn: "상태 저장", deleteAppBtn: "삭제" },
});

const zh = makeDashLocale({
  contractViewer: { tabContract: "合约内预览", tabSignature: "仅签名", downloadMerged: "下载合约 + 签名 (PNG)", downloadSigOnly: "仅下载签名 (PNG)", closeAria: "关闭" },
  warnings: { heading: "向成员发送警告 / 承诺书", refresh: "刷新", sendBtn: "发送承诺书", sending: "发送中...", signedBadge: "已签署", pendingBadge: "等待签署", deleteBtn: "删除", durations: { "3_days": "3 天", "7_days": "1 周", "14_days": "2 周", "30_days": "1 个月" } },
  members: { title: "战队成员", addBtn: "添加成员", editBtn: "编辑", deleteBtn: "删除", saveBtn: "保存", cancelBtn: "取消" },
  excel: { title: "名额计划表 (Excel)", tabPlan: "战队成员 | 职位分配计划", tabAllRecords: "全部申请记录 ({count})", saveQuotas: "保存名额", refresh: "刷新", save: "保存计划", saving: "保存中...", statusFull: "已满", statusOpen: "开放", totalRow: "总计", copyWhatsapp: "复制为 WhatsApp 消息", downloadPlanCsv: "下载计划 (CSV)" },
  management: { headerTitle: "Solar System 战队管理", tabApplications: "入队申请", tabLeaves: "请假申请", tabEvents: "Discord 活动管理", tabMembers: "战队成员", tabExcel: "Excel 与成员", tabWarnings: "警告与承诺", tabSettings: "招募设置", statusOpen: "开放", statusClosed: "关闭", saveSettingsBtn: "保存设置", saveAppBtn: "保存状态", deleteAppBtn: "删除" },
});

const DASH_DICT: Record<string, SolarDashboardCopy> = {
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

export function solarDashboardCopy(locale: string): SolarDashboardCopy {
  return DASH_DICT[locale] ?? DASH_DICT.en;
}

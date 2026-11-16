export const DASHBOARD_PERMISSION_KEYS = [
  "all",
  "overview",
  "console",
  "minecraft",
  "fortnite",
  "youtube",
  "modrinth",
  "curseforge",
  "solar",
  "badges",
  "profiles",
  "news",
  "event",
  "rule",
  "application",
  "support",
  "registrations",
  "orders",
  "community",
  "connections",
] as const;

export type DashboardPermission = (typeof DASHBOARD_PERMISSION_KEYS)[number];

export const DASHBOARD_SPECIFIC_PERMISSIONS = DASHBOARD_PERMISSION_KEYS.filter(
  (key): key is Exclude<DashboardPermission, "all"> => key !== "all",
);

export function normalizeDashboardPermissions(input: unknown): DashboardPermission[] {
  if (!Array.isArray(input)) return [];
  const validSet = new Set<string>(DASHBOARD_PERMISSION_KEYS);
  const out: DashboardPermission[] = [];
  for (const item of input) {
    if (typeof item === "string" && validSet.has(item)) {
      const perm = item as DashboardPermission;
      if (perm === "all") return ["all"];
      if (!out.includes(perm)) out.push(perm);
    }
  }
  return out;
}

export function hasDashboardPermission(
  permissions: readonly string[] | null | undefined,
  required: DashboardPermission,
): boolean {
  if (!permissions || permissions.length === 0) return false;
  return permissions.includes("all") || permissions.includes(required);
}

export const DASHBOARD_PERMISSION_LABELS: Record<
  DashboardPermission,
  { ar: string; en: string }
> = {
  all: { ar: "كل الصلاحيات (إدارة كاملة)", en: "All Permissions (Full Admin)" },
  overview: { ar: "نظرة عامة", en: "Overview" },
  console: { ar: "Pelican (إدارة السيرفرات)", en: "Pelican Console" },
  minecraft: { ar: "إحصائيات Minecraft", en: "Minecraft" },
  fortnite: { ar: "إحصائيات Fortnite", en: "Fortnite" },
  youtube: { ar: "إدارة YouTube", en: "YouTube" },
  modrinth: { ar: "إدارة Modrinth", en: "Modrinth" },
  curseforge: { ar: "إحصائيات CurseForge", en: "CurseForge" },
  solar: { ar: "كلان سولار (Solar System)", en: "Solar Clan" },
  badges: { ar: "البادجات", en: "Badges" },
  profiles: { ar: "البروفايلات والصلاحيات", en: "Profiles & Permissions" },
  news: { ar: "الأخبار", en: "News" },
  event: { ar: "الفعاليات", en: "Events" },
  rule: { ar: "قوانين الشبكة", en: "Rules" },
  application: { ar: "تقديمات الصناع", en: "Creator Applications" },
  support: { ar: "مركز الدعم", en: "Support" },
  registrations: { ar: "تسجيلات الفعاليات", en: "Event Registrations" },
  orders: { ar: "طلبات المتجر", en: "Orders" },
  community: { ar: "المجتمع", en: "Community" },
  connections: { ar: "الاتصالات والإعدادات", en: "Connections" },
};

const EXTRA_PERMISSION_LABELS: Record<string, Partial<Record<DashboardPermission, string>>> = {
  es: {
    all: "Todos los permisos (Admin completo)",
    overview: "Resumen",
    console: "Consola Pelican",
    solar: "Clan Solar",
    badges: "Insignias",
    profiles: "Perfiles y permisos",
    news: "Noticias",
    event: "Eventos",
    rule: "Reglas",
    application: "Solicitudes de creadores",
    support: "Soporte",
    registrations: "Registros de eventos",
    orders: "Pedidos",
    community: "Comunidad",
    connections: "Conexiones",
  },
  fr: {
    all: "Toutes les permissions (Admin complet)",
    overview: "Aperçu",
    console: "Console Pelican",
    solar: "Clan Solar",
    badges: "Badges",
    profiles: "Profils et permissions",
    news: "Actualités",
    event: "Événements",
    rule: "Règles",
    application: "Candidatures créateurs",
    support: "Support",
    registrations: "Inscriptions aux événements",
    orders: "Commandes",
    community: "Communauté",
    connections: "Connexions",
  },
  de: {
    all: "Alle Berechtigungen (Volladmin)",
    overview: "Übersicht",
    console: "Pelican-Konsole",
    solar: "Solar-Clan",
    badges: "Abzeichen",
    profiles: "Profile & Berechtigungen",
    news: "Neuigkeiten",
    event: "Veranstaltungen",
    rule: "Regeln",
    application: "Creator-Bewerbungen",
    support: "Support",
    registrations: "Event-Anmeldungen",
    orders: "Bestellungen",
    community: "Community",
    connections: "Verbindungen",
  },
  pt: {
    all: "Todas as permissões (Admin completo)",
    overview: "Visão geral",
    console: "Console Pelican",
    solar: "Clã Solar",
    badges: "Insígnias",
    profiles: "Perfis e permissões",
    news: "Notícias",
    event: "Eventos",
    rule: "Regras",
    application: "Candidaturas de criadores",
    support: "Suporte",
    registrations: "Inscrições de eventos",
    orders: "Pedidos",
    community: "Comunidade",
    connections: "Conexões",
  },
  tr: {
    all: "Tüm İzinler (Tam Yönetici)",
    overview: "Genel Bakış",
    console: "Pelican Konsolu",
    solar: "Solar Klanı",
    badges: "Rozetler",
    profiles: "Profiller ve İzinler",
    news: "Haberler",
    event: "Etkinlikler",
    rule: "Kurallar",
    application: "İçerik Üretici Başvuruları",
    support: "Destek",
    registrations: "Etkinlik Kayıtları",
    orders: "Siparişler",
    community: "Topluluk",
    connections: "Bağlantılar",
  },
  ja: {
    all: "すべての権限（フル管理者）",
    overview: "概要",
    console: "Pelican コンソール",
    solar: "Solar クラン",
    badges: "バッジ",
    profiles: "プロフィールと権限",
    news: "ニュース",
    event: "イベント",
    rule: "ルール",
    application: "クリエイター応募",
    support: "サポート",
    registrations: "イベント登録",
    orders: "注文",
    community: "コミュニティ",
    connections: "接続",
  },
  ko: {
    all: "모든 권한(전체 관리자)",
    overview: "개요",
    console: "Pelican 콘솔",
    solar: "Solar 클랜",
    badges: "배지",
    profiles: "프로필 및 권한",
    news: "뉴스",
    event: "이벤트",
    rule: "규칙",
    application: "크리에이터 지원",
    support: "지원",
    registrations: "이벤트 등록",
    orders: "주문",
    community: "커뮤니티",
    connections: "연결",
  },
  zh: {
    all: "所有权限（完全管理员）",
    overview: "概览",
    console: "Pelican 控制台",
    solar: "Solar 战队",
    badges: "徽章",
    profiles: "资料与权限",
    news: "新闻",
    event: "活动",
    rule: "规则",
    application: "创作者申请",
    support: "支持",
    registrations: "活动报名",
    orders: "订单",
    community: "社区",
    connections: "连接",
  },
};

export function getDashboardPermissionLabel(perm: DashboardPermission, locale: string): string {
  if (locale === "ar") return DASHBOARD_PERMISSION_LABELS[perm].ar;
  return EXTRA_PERMISSION_LABELS[locale]?.[perm] ?? DASHBOARD_PERMISSION_LABELS[perm].en;
}

export type PermissionsUiCopy = {
  owner: string;
  fullAccess: string;
  fullAdmin: string;
  customAccess: string;
  permissionsCount: (count: number) => string;
  permissionsBtn: string;
  modalTitlePrefix: string;
  modalDesc: string;
  orSpecific: string;
  revokeAll: string;
  cancel: string;
  savePermissions: string;
};

const PERMISSIONS_UI_MAP: Record<string, PermissionsUiCopy> = {
  ar: {
    owner: "المالك",
    fullAccess: "كل الصلاحيات",
    fullAdmin: "كل الصلاحيات",
    customAccess: "صلاحيات مخصصة",
    permissionsCount: (n) => `${n} صلاحيات`,
    permissionsBtn: "الصلاحيات",
    modalTitlePrefix: "صلاحيات لوحة التحكم · ",
    modalDesc:
      "يمكنك منح العضو كل الصلاحيات أو اختيار صلاحيات محددة. عند منحه أي صلاحية سيظهر له رابط «لوحة التحكم» في قائمة حسابه.",
    orSpecific: "أو صلاحيات محددة:",
    revokeAll: "إزالة كل الصلاحيات",
    cancel: "إلغاء",
    savePermissions: "حفظ الصلاحيات",
  },
  en: {
    owner: "Owner",
    fullAccess: "Full Access",
    fullAdmin: "Full Admin",
    customAccess: "Custom Access",
    permissionsCount: (n) => `${n} permissions`,
    permissionsBtn: "Permissions",
    modalTitlePrefix: "Dashboard Permissions · ",
    modalDesc:
      "Grant full access or specific dashboard sections. Once granted, the Dashboard link appears in their account menu.",
    orSpecific: "Or specific permissions:",
    revokeAll: "Revoke All",
    cancel: "Cancel",
    savePermissions: "Save Permissions",
  },
  es: {
    owner: "Propietario",
    fullAccess: "Acceso completo",
    fullAdmin: "Admin completo",
    customAccess: "Acceso personalizado",
    permissionsCount: (n) => `${n} permisos`,
    permissionsBtn: "Permisos",
    modalTitlePrefix: "Permisos del panel · ",
    modalDesc:
      "Concede acceso completo o secciones específicas del panel. Una vez concedido, el enlace al panel aparecerá en su menú de cuenta.",
    orSpecific: "O permisos específicos:",
    revokeAll: "Revocar todo",
    cancel: "Cancelar",
    savePermissions: "Guardar permisos",
  },
  fr: {
    owner: "Propriétaire",
    fullAccess: "Accès complet",
    fullAdmin: "Admin complet",
    customAccess: "Accès personnalisé",
    permissionsCount: (n) => `${n} permissions`,
    permissionsBtn: "Permissions",
    modalTitlePrefix: "Permissions du tableau de bord · ",
    modalDesc:
      "Accordez un accès complet ou des sections spécifiques. Une fois accordé, le lien du tableau de bord apparaîtra dans son menu.",
    orSpecific: "Ou des permissions spécifiques :",
    revokeAll: "Tout révoquer",
    cancel: "Annuler",
    savePermissions: "Enregistrer",
  },
  de: {
    owner: "Eigentümer",
    fullAccess: "Vollzugriff",
    fullAdmin: "Volladmin",
    customAccess: "Benutzerdefiniert",
    permissionsCount: (n) => `${n} Berechtigungen`,
    permissionsBtn: "Berechtigungen",
    modalTitlePrefix: "Dashboard-Berechtigungen · ",
    modalDesc:
      "Gewähren Sie Vollzugriff oder bestimmte Bereiche. Danach erscheint der Dashboard-Link im Kontomenü.",
    orSpecific: "Oder bestimmte Berechtigungen:",
    revokeAll: "Alle widerrufen",
    cancel: "Abbrechen",
    savePermissions: "Speichern",
  },
  pt: {
    owner: "Proprietário",
    fullAccess: "Acesso total",
    fullAdmin: "Admin total",
    customAccess: "Acesso personalizado",
    permissionsCount: (n) => `${n} permissões`,
    permissionsBtn: "Permissões",
    modalTitlePrefix: "Permissões do painel · ",
    modalDesc:
      "Conceda acesso total ou seções específicas do painel. Após concedido, o link do painel aparecerá no menu da conta.",
    orSpecific: "Ou permissões específicas:",
    revokeAll: "Revogar tudo",
    cancel: "Cancelar",
    savePermissions: "Salvar permissões",
  },
  tr: {
    owner: "Sahip",
    fullAccess: "Tam Erişim",
    fullAdmin: "Tam Yönetici",
    customAccess: "Özel Erişim",
    permissionsCount: (n) => `${n} izin`,
    permissionsBtn: "İzinler",
    modalTitlePrefix: "Panel İzinleri · ",
    modalDesc:
      "Tam erişim veya belirli panel bölümleri verin. İzin verildiğinde hesap menüsünde Panel bağlantısı görünür.",
    orSpecific: "Veya belirli izinler:",
    revokeAll: "Tümünü Kaldır",
    cancel: "İptal",
    savePermissions: "İzinleri Kaydet",
  },
  ja: {
    owner: "オーナー",
    fullAccess: "フルアクセス",
    fullAdmin: "フル管理者",
    customAccess: "カスタムアクセス",
    permissionsCount: (n) => `${n} 件の権限`,
    permissionsBtn: "権限",
    modalTitlePrefix: "ダッシュボード権限 · ",
    modalDesc:
      "フルアクセスまたは特定のセクションを付与します。付与すると、アカウントメニューにダッシュボードリンクが表示されます。",
    orSpecific: "または特定の権限:",
    revokeAll: "すべて取り消す",
    cancel: "キャンセル",
    savePermissions: "権限を保存",
  },
  ko: {
    owner: "소유자",
    fullAccess: "전체 액세스",
    fullAdmin: "전체 관리자",
    customAccess: "사용자 지정 액세스",
    permissionsCount: (n) => `권한 ${n}개`,
    permissionsBtn: "권한",
    modalTitlePrefix: "대시보드 권한 · ",
    modalDesc:
      "전체 액세스 또는 특정 섹션 권한을 부여합니다. 권한이 부여되면 계정 메뉴에 대시보드 링크가 표시됩니다.",
    orSpecific: "또는 특정 권한:",
    revokeAll: "모두 취소",
    cancel: "취소",
    savePermissions: "권한 저장",
  },
  zh: {
    owner: "所有者",
    fullAccess: "完全访问",
    fullAdmin: "完全管理员",
    customAccess: "自定义访问",
    permissionsCount: (n) => `${n} 项权限`,
    permissionsBtn: "权限",
    modalTitlePrefix: "控制面板权限 · ",
    modalDesc:
      "授予完全访问权限或特定控制面板板块。授予后，控制面板链接将显示在其账户菜单中。",
    orSpecific: "或特定权限：",
    revokeAll: "撤销全部",
    cancel: "取消",
    savePermissions: "保存权限",
  },
};

export function getPermissionsUiCopy(locale: string): PermissionsUiCopy {
  return PERMISSIONS_UI_MAP[locale] ?? PERMISSIONS_UI_MAP.en;
}


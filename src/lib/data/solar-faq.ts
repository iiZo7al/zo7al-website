import type { FaqItem } from "@/lib/data/faq";

export interface SolarFaqBundle {
  eyebrow: string;
  title: string;
  text: string;
  categories: Record<string, string>;
  items: FaqItem[];
}

const AR_FAQ: SolarFaqBundle = {
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
      a: "اضغط على زر \"قدّم للانضمام للكلان\" في أعلى الصفحة أو اختر القسم المناسب لك من قائمة الأقسام، ثم املأ البيانات المطلوبة ووقّع التعهد إلكترونياً. بعد الإرسال ستحصل على رقم تتبع لمتابعة حالة طلبك.",
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

const EN_FAQ: SolarFaqBundle = {
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
      a: "Click \"Apply to Join Clan\" at the top of the page or pick a division card, complete the application form, and sign the pledge digitally. You will receive a tracking code right after submitting.",
    },
    {
      id: "solar-discord-required",
      category: "joining",
      q: "Is joining the official Discord server required?",
      a: "Yes. The official Discord server is our primary hub for announcements, meetings, tryouts, practice sessions, and daily coordination.",
    },
    {
      id: "solar-divisions-list",
      category: "divisions",
      q: "Which clan divisions are currently open?",
      a: "You can apply as a Content Creator, Streamer, Designer, Video Editor, Player (Rocket League, Fortnite, Minecraft, or FIFA), Staff & Admin, or Idea Writer.",
    },
    {
      id: "solar-contract-duration",
      category: "rules",
      q: "How long are clan contracts and can they be renewed?",
      a: "Contract durations range from 2 months to 2 years (2, 3, 4, 5, 6 months, 1 year, or 2 years), and renewals depend on staff approval and performance.",
    },
    {
      id: "solar-signature",
      category: "rules",
      q: "How do I sign the application pledge?",
      a: "Drawing your signature directly on the digital pad is the primary option, or you can download the contract image, sign it, and upload it.",
    },
    {
      id: "solar-review-time",
      category: "joining",
      q: "How long does application review take?",
      a: "Staff review applications as soon as possible. You can track your application status anytime on the Requests page or wait for staff to contact you.",
    },
    {
      id: "solar-admin-ranks",
      category: "divisions",
      q: "Can I apply for specific staff/admin ranks?",
      a: "Yes. Selecting the Staff & Admin division displays all currently open administrative sub-ranks (some ranks may be temporarily closed when full).",
    },
  ],
};

const EXTRA_BUNDLES: Record<string, SolarFaqBundle> = {
  ar: AR_FAQ,
  en: EN_FAQ,
  es: {
    ...EN_FAQ,
    eyebrow: "PREGUNTAS FRECUENTES",
    title: "Preguntas frecuentes sobre Solar System",
    text: "Todo lo que necesitas saber sobre postulaciones, divisiones, contratos y el funcionamiento de Solar System.",
    categories: {
      joining: "Postulación y registro",
      divisions: "Divisiones y rangos",
      rules: "Reglas y contrato",
    },
    items: [
      { ...EN_FAQ.items[0], q: "¿Hay salario o pago monetario en Solar Clan?", a: "No. Solar System es un clan comunitario y competitivo voluntario sin salarios ni pagos. Los miembros se unen por trabajo en equipo, colaboraciones, torneos y experiencia." },
      { ...EN_FAQ.items[1], q: "¿Cómo me postulo para unirme a Solar System Team?", a: "Haz clic en el botón de postulación en la parte superior o elige una división, completa el formulario y firma el compromiso digitalmente. Recibirás un código de seguimiento al enviar." },
      { ...EN_FAQ.items[2], q: "¿Es obligatorio unirse al servidor oficial de Discord?", a: "Sí. El servidor oficial de Discord es nuestro centro principal para anuncios, reuniones, pruebas y coordinación diaria." },
      { ...EN_FAQ.items[3], q: "¿Qué divisiones están abiertas actualmente?", a: "Puedes postular como Creador de contenido, Streamer, Diseñador, Editor de video, Jugador (Rocket League, Fortnite, Minecraft o FIFA), Staff y Admin o Guionista." },
      { ...EN_FAQ.items[4], q: "¿Cuánto duran los contratos del clan?", a: "La duración varía entre 2 meses y 2 años (2, 3, 4, 5, 6 meses, 1 o 2 años) y las renovaciones dependen de la aprobación del staff." },
      { ...EN_FAQ.items[5], q: "¿Cómo firmo el compromiso de la solicitud?", a: "Puedes dibujar tu firma directamente en el panel digital o descargar la imagen del contrato, firmarla y subirla." },
      { ...EN_FAQ.items[6], q: "¿Cuánto tarda la revisión de la solicitud?", a: "El equipo revisa las solicitudes lo antes posible. Puedes seguir el estado en cualquier momento desde la página de Solicitudes." },
      { ...EN_FAQ.items[7], q: "¿Puedo postular a rangos administrativos específicos?", a: "Sí. Al elegir la división Staff y Admin verás todos los rangos disponibles actualmente." },
    ],
  },
  fr: {
    ...EN_FAQ,
    eyebrow: "FAQ",
    title: "Questions fréquentes sur Solar System",
    text: "Tout ce qu'il faut savoir sur les candidatures, les divisions, les contrats et le fonctionnement de Solar System.",
    categories: {
      joining: "Candidature & Adhésion",
      divisions: "Divisions & Rangs",
      rules: "Règles & Contrat",
    },
    items: [
      { ...EN_FAQ.items[0], q: "Y a-t-il un salaire dans le clan Solar ?", a: "Non. Solar System est un clan communautaire et compétitif bénévole sans salaire. Les membres rejoignent pour l'esprit d'équipe, les collaborations et les tournois." },
      { ...EN_FAQ.items[1], q: "Comment postuler pour rejoindre Solar System Team ?", a: "Cliquez sur le bouton de candidature en haut de la page ou choisissez une division, remplissez le formulaire et signez numériquement. Vous recevrez un code de suivi." },
      { ...EN_FAQ.items[2], q: "Faut-il rejoindre le serveur Discord officiel ?", a: "Oui. Le serveur Discord officiel est le hub principal pour les annonces, réunions, sélections et la coordination." },
      { ...EN_FAQ.items[3], q: "Quelles divisions sont actuellement ouvertes ?", a: "Créateur de contenu, Streamer, Designer, Monteur vidéo, Joueur (Rocket League, Fortnite, Minecraft ou FIFA), Staff & Admin et Rédacteur d'idées." },
      { ...EN_FAQ.items[4], q: "Quelle est la durée des contrats ?", a: "De 2 mois à 2 ans (2, 3, 4, 5, 6 mois, 1 an ou 2 ans), renouvelables selon l'avis du staff." },
      { ...EN_FAQ.items[5], q: "Comment signer l'engagement ?", a: "Dessinez votre signature directement sur le pavé numérique ou téléchargez l'image du contrat, signez-la et importez-la." },
      { ...EN_FAQ.items[6], q: "Combien de temps prend l'examen ?", a: "Le staff examine les candidatures dès que possible. Suivez votre statut à tout moment sur la page Demandes." },
      { ...EN_FAQ.items[7], q: "Puis-je postuler à des rangs administratifs précis ?", a: "Oui. La division Staff & Admin affiche tous les sous-rangs actuellement ouverts." },
    ],
  },
  de: {
    ...EN_FAQ,
    eyebrow: "FAQ",
    title: "Häufig gestellte Fragen zu Solar System",
    text: "Alles Wissenswerte über Bewerbungen, Abteilungen, Verträge und den Ablauf bei Solar System.",
    categories: {
      joining: "Bewerbung & Beitritt",
      divisions: "Abteilungen & Ränge",
      rules: "Regeln & Vertrag",
    },
    items: [
      { ...EN_FAQ.items[0], q: "Gibt es im Solar Clan ein Gehalt oder Bezahlung?", a: "Nein. Solar System ist ein freiwilliger Community- und Wettkampf-Clan ohne Bezahlung. Mitglieder treten für Teamwork, Events und Turniere bei." },
      { ...EN_FAQ.items[1], q: "Wie bewerbe ich mich bei Solar System Team?", a: "Klicke oben auf Bewerben oder wähle eine Abteilung, fülle das Formular aus und unterschreibe digital. Danach erhältst du einen Tracking-Code." },
      { ...EN_FAQ.items[2], q: "Ist der Beitritt zum offiziellen Discord-Server Pflicht?", a: "Ja. Der offizielle Discord-Server ist die zentrale Plattform für Ankündigungen, Meetings und Koordination." },
      { ...EN_FAQ.items[3], q: "Welche Abteilungen sind aktuell offen?", a: "Content Creator, Streamer, Designer, Video-Editor, Spieler (Rocket League, Fortnite, Minecraft oder FIFA), Staff & Admin sowie Ideen-Autor." },
      { ...EN_FAQ.items[4], q: "Wie lange laufen Clan-Verträge?", a: "Zwischen 2 Monaten und 2 Jahren (2, 3, 4, 5, 6 Monate, 1 oder 2 Jahre); Verlängerungen hängen vom Staff ab." },
      { ...EN_FAQ.items[5], q: "Wie unterschreibe ich die Verpflichtung?", a: "Zeichne deine Unterschrift direkt digital oder lade das Vertragsbild herunter, unterschreibe es und lade es hoch." },
      { ...EN_FAQ.items[6], q: "Wie lange dauert die Prüfung?", a: "Das Team prüft Bewerbungen schnellstmöglich. Den Status kannst du jederzeit auf der Anfragen-Seite verfolgen." },
      { ...EN_FAQ.items[7], q: "Kann ich mich für bestimmte Admin-Ränge bewerben?", a: "Ja, unter Staff & Admin werden alle aktuell offenen Ränge angezeigt." },
    ],
  },
  pt: {
    ...EN_FAQ,
    eyebrow: "FAQ",
    title: "Perguntas Frequentes sobre Solar System",
    text: "Tudo o que você precisa saber sobre inscrições, divisões, contratos e como o Solar System funciona.",
    categories: {
      joining: "Inscrição e Entrada",
      divisions: "Divisões e Cargos",
      rules: "Regras e Contrato",
    },
    items: [
      { ...EN_FAQ.items[0], q: "Há salário ou pagamento no Clã Solar?", a: "Não. Solar System é um clã comunitário e competitivo voluntário, sem salários. Os membros participam por trabalho em equipe, eventos e torneios." },
      { ...EN_FAQ.items[1], q: "Como me candidato ao Solar System Team?", a: "Clique em candidatar-se no topo ou escolha uma divisão, preencha o formulário e assine digitalmente. Você receberá um código de acompanhamento." },
      { ...EN_FAQ.items[2], q: "É obrigatório entrar no servidor oficial do Discord?", a: "Sim. O Discord oficial é nossa central para anúncios, reuniões, testes e coordenação." },
      { ...EN_FAQ.items[3], q: "Quais divisões estão abertas?", a: "Criador de conteúdo, Streamer, Designer, Editor de vídeo, Jogador (Rocket League, Fortnite, Minecraft ou FIFA), Staff & Admin e Roteirista." },
      { ...EN_FAQ.items[4], q: "Qual a duração dos contratos?", a: "De 2 meses a 2 anos (2, 3, 4, 5, 6 meses, 1 ano ou 2 anos), com renovação sujeita à equipe." },
      { ...EN_FAQ.items[5], q: "Como assino o termo de compromisso?", a: "Desenhe sua assinatura diretamente no painel digital ou baixe a imagem do contrato, assine e envie." },
      { ...EN_FAQ.items[6], q: "Quanto tempo leva a análise?", a: "A equipe analisa o quanto antes. Você pode acompanhar o status na página de Solicitações." },
      { ...EN_FAQ.items[7], q: "Posso me candidatar a cargos administrativos específicos?", a: "Sim. Ao selecionar Staff & Admin, todos os cargos disponíveis são exibidos." },
    ],
  },
  tr: {
    ...EN_FAQ,
    eyebrow: "SSS",
    title: "Solar System Hakkında Sıkça Sorulan Sorular",
    text: "Başvurular, bölümler, sözleşmeler ve Solar System'in işleyişi hakkında bilmeniz gereken her şey.",
    categories: {
      joining: "Başvuru ve Katılım",
      divisions: "Bölümler ve Rütbeler",
      rules: "Kurallar ve Sözleşme",
    },
    items: [
      { ...EN_FAQ.items[0], q: "Solar Klanında maaş veya maddi ödeme var mı?", a: "Hayır. Solar System tamamen gönüllü bir topluluk ve rekabetçi oyun klanıdır; maaş veya ödeme yoktur." },
      { ...EN_FAQ.items[1], q: "Solar System Team'e nasıl başvurabilirim?", a: "Sayfanın üstündeki başvuru butonuna tıklayın veya bir bölüm seçin, formu doldurun ve dijital olarak imzalayın. Gönderdikten sonra takip kodu alırsınız." },
      { ...EN_FAQ.items[2], q: "Resmi Discord sunucusuna katılmak zorunlu mu?", a: "Evet. Duyurular, toplantılar, denemeler ve koordinasyon için resmi Discord sunucusu zorunludur." },
      { ...EN_FAQ.items[3], q: "Şu anda hangi bölümler açık?", a: "İçerik Üreticisi, Yayıncı, Tasarımcı, Video Editörü, Oyuncu (Rocket League, Fortnite, Minecraft veya FIFA), Yönetici & Yetkili ve Fikir Yazarı." },
      { ...EN_FAQ.items[4], q: "Klan sözleşmeleri ne kadar sürer?", a: "2 aydan 2 yıla kadar (2, 3, 4, 5, 6 ay, 1 yıl veya 2 yıl) değişir ve yenileme yönetici onayına bağlıdır." },
      { ...EN_FAQ.items[5], q: "Başvuru taahhüdünü nasıl imzalarım?", a: "Dijital imza alanına doğrudan çizebilir veya sözleşme görselini indirip imzalayarak yükleyebilirsiniz." },
      { ...EN_FAQ.items[6], q: "Başvuru incelemesi ne kadar sürer?", a: "Yetkililer başvuruları en kısa sürede inceler. Durumunuzu Talepler sayfasından takip edebilirsiniz." },
      { ...EN_FAQ.items[7], q: "Belirli yönetici rütbelerine başvurabilir miyim?", a: "Evet. Yönetici & Yetkili bölümünü seçtiğinizde açık olan tüm alt rütbeler listelenir." },
    ],
  },
  ja: {
    ...EN_FAQ,
    eyebrow: "よくある質問",
    title: "Solar System クラン FAQ",
    text: "応募方法、部門、契約、Solar Systemの運営についてよくある質問をまとめました。",
    categories: {
      joining: "応募・参加",
      divisions: "部門・ランク",
      rules: "ルール・契約",
    },
    items: [
      { ...EN_FAQ.items[0], q: "Solarクランに給与や報酬はありますか？", a: "いいえ。Solar Systemは完全ボランティアのコミュニティ＆競技クランであり、給与や金銭的報酬はありません。" },
      { ...EN_FAQ.items[1], q: "Solar System Teamへの応募方法は？", a: "ページ上部の応募ボタンをクリックするか部門カードを選び、フォームに入力してデジタル署名してください。送信後に追跡コードが発行されます。" },
      { ...EN_FAQ.items[2], q: "公式Discordサーバーへの参加は必須ですか？", a: "はい。お知らせ、ミーティング、トライアウト、日々の連絡はすべて公式Discordで行われます。" },
      { ...EN_FAQ.items[3], q: "現在募集中の部門は？", a: "クリエイター、ストリーマー、デザイナー、動画編集者、プレイヤー（Rocket League、Fortnite、Minecraft、FIFA）、運営スタッフ、アイデアライターです。" },
      { ...EN_FAQ.items[4], q: "契約期間はどのくらいですか？", a: "2ヶ月〜2年（2・3・4・5・6ヶ月、1年、2年）から選択でき、更新は運営の承認によります。" },
      { ...EN_FAQ.items[5], q: "誓約書への署名方法は？", a: "デジタル署名パッドに直接描くか、契約画像をダウンロードして署名後にアップロードしてください。" },
      { ...EN_FAQ.items[6], q: "審査にはどのくらいかかりますか？", a: "運営が可能な限り早く審査します。リクエストページでいつでも状況を確認できます。" },
      { ...EN_FAQ.items[7], q: "特定の運営ランクに応募できますか？", a: "はい。スタッフ＆運営部門を選択すると現在募集中の役職が表示されます。" },
    ],
  },
  ko: {
    ...EN_FAQ,
    eyebrow: "자주 묻는 질문",
    title: "Solar System 클랜 FAQ",
    text: "지원 방법, 부서, 계약 및 Solar System 운영에 대해 알아야 할 모든 내용입니다.",
    categories: {
      joining: "지원 및 가입",
      divisions: "부서 및 등급",
      rules: "규칙 및 계약",
    },
    items: [
      { ...EN_FAQ.items[0], q: "Solar 클랜에 급여나 금전적 보상이 있나요?", a: "아니요. Solar System은 급여가 없는 자발적 커뮤니티 및 경쟁 게임 클랜입니다." },
      { ...EN_FAQ.items[1], q: "Solar System Team에 어떻게 지원하나요?", a: "상단 지원 버튼을 누르거나 부서 카드를 선택해 양식을 작성하고 디지털 서명을 완료하세요. 제출 후 추적 코드가 발급됩니다." },
      { ...EN_FAQ.items[2], q: "공식 Discord 서버 참여가 필수인가요?", a: "네. 공지, 회의, 테스트 및 모든 소통은 공식 Discord 서버에서 이루어집니다." },
      { ...EN_FAQ.items[3], q: "현재 열려 있는 부서는 무엇인가요?", a: "크리에이터, 스트리머, 디자이너, 영상 편집자, 플레이어(Rocket League, Fortnite, Minecraft, FIFA), 운영진, 아이디어 작가입니다." },
      { ...EN_FAQ.items[4], q: "클랜 계약 기간은 어떻게 되나요?", a: "2개월부터 2년까지 선택 가능하며, 연장은 운영진 승인에 따릅니다." },
      { ...EN_FAQ.items[5], q: "서약서 서명은 어떻게 하나요?", a: "디지털 패드에 직접 서명하거나 계약서 이미지를 다운로드해 서명 후 업로드할 수 있습니다." },
      { ...EN_FAQ.items[6], q: "지원서 검토는 얼마나 걸리나요?", a: "운영진이 최대한 빠르게 검토하며, 요청 페이지에서 언제든 상태를 확인할 수 있습니다." },
      { ...EN_FAQ.items[7], q: "특정 운영진 직책에 지원할 수 있나요?", a: "네. 운영진 & 관리자 부서를 선택하면 현재 모집 중인 세부 직책이 표시됩니다." },
    ],
  },
  zh: {
    ...EN_FAQ,
    eyebrow: "常见问题",
    title: "Solar System 战队常见问题",
    text: "关于申请加入、部门划分、合约以及 Solar System 运作方式的所有信息。",
    categories: {
      joining: "申请与加入",
      divisions: "部门与头衔",
      rules: "规则与合约",
    },
    items: [
      { ...EN_FAQ.items[0], q: "Solar 战队有薪资或报酬吗？", a: "没有。Solar System 是完全志愿性质的社区与竞技战队，没有薪资或现金报酬。" },
      { ...EN_FAQ.items[1], q: "如何申请加入 Solar System Team？", a: "点击页面顶部的申请按钮或选择对应部门卡片，填写表单并完成数字签名。提交后您将获得追踪编号。" },
      { ...EN_FAQ.items[2], q: "必须加入官方 Discord 服务器吗？", a: "是的。官方 Discord 服务器是发布公告、会议、试训和日常沟通的核心平台。" },
      { ...EN_FAQ.items[3], q: "目前开放哪些部门？", a: "内容创作者、主播、设计师、视频剪辑师、选手（Rocket League、Fortnite、Minecraft 或 FIFA）、管理运营以及创意策划。" },
      { ...EN_FAQ.items[4], q: "战队合约时长是多久？", a: "合约时长为 2 个月至 2 年不等，续约需经管理团队审核批准。" },
      { ...EN_FAQ.items[5], q: "如何签署申请承诺书？", a: "您可以直接在数字签名板上手写签名，或下载合约图片签名后上传。" },
      { ...EN_FAQ.items[6], q: "审核需要多长时间？", a: "管理团队会尽快审核申请，您可以随时在请求页面查看进度。" },
      { ...EN_FAQ.items[7], q: "可以申请特定的管理职位吗？", a: "可以。选择管理与运营部门后会显示当前开放的具体管理职位。" },
    ],
  },
};

export function getSolarFaq(locale: string): SolarFaqBundle {
  return EXTRA_BUNDLES[locale] ?? AR_FAQ;
}

# إكمال ربط حسابات Zo7al Projects

التعديلات البرمجية لا تُنشئ تطبيقات OAuth أو تغيّر اسم التطبيق داخل Google. إعدادات المزوّدين الآتية مطلوبة لتشغيل الربط الفعلي. بيانات Client Secret تُضاف إلى حقول الإعداد الخاصة بكل خدمة، ولا توضع في مستودع الموقع.

## مايكروسفت

1. افتح [Microsoft Entra App registrations](https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)، وأنشئ تطبيقًا باسم **Zo7al Projects**.
2. اختر دعم الحسابات الشخصية وحسابات المؤسسات: **Accounts in any organizational directory and personal Microsoft accounts**.
3. أضف Web Redirect URI: `https://istvaveorgqcgxsdqsch.supabase.co/auth/v1/callback`.
4. أنشئ Client Secret، ثم افتح [مزودي Supabase](https://supabase.com/dashboard/project/istvaveorgqcgxsdqsch/auth/providers) وفعّل Azure. أضف Application (client) ID وقيمة السر **Value**، وعنوان Tenant: `https://login.microsoftonline.com/common`. أبقِ السماح بحسابات بلا بريد معطلًا، وأضف المطالبات الاختيارية `email` و`xms_edov` حسب [دليل Supabase الرسمي](https://supabase.com/docs/guides/auth/social-login/auth-azure).
5. بعد الحفظ، يظهر Microsoft في الموقع تلقائيًا. ربط حساب Minecraft يتم بشكل مستقل عبر إثبات ملكية اللاعب داخل السيرفر.

## مودرين

1. تطبيق المستخدمين باسم **Zo7al Projects** في Modrinth مستقل عن ربط لوحة الإدارة.
2. رابط الرجوع: `https://zo7al.is-a.dev/auth/callback`؛ صلاحيتا القراءة فقط: `USER_READ USER_READ_EMAIL`.
3. في Vercel Production، احفظ `MODRINTH_MEMBER_CLIENT_ID` و`MODRINTH_MEMBER_CLIENT_SECRET` كمتغيرات خاصة.
4. احفظ مفتاح Supabase الخاص بالسيرفر في `SUPABASE_SECRET_KEY`. يستخدم لإنشاء جلسة نظام الحسابات بعد تحقق مودرين وحذف الحسابات النهائي؛ لا يُرسل إلى المتصفح.
5. فعّل `ZO7AL_ACCOUNT_MODRINTH_ENABLED=true` ثم انشر. لا يحتاج مزود مودرين مخصصًا في Supabase. جميع إجراءات OAuth مع مودرين ترجع للموقع مباشرة. نظام الجلسات و2FA والبصمة يبقى في Supabase.
6. لا يتم دمج حساب ببريد مودرين تلقائيًا. لربطه بحسابك الأساسي، سجّل دخولك أولًا ثم اختر الربط من إعدادات الحساب.

## اسم التطبيق في قوقل

افتح مشروع OAuth الصحيح في [Google Auth Platform → Branding](https://console.cloud.google.com/auth/branding)، واجعل **App name** هو **Zo7al Projects**، ثم احفظ. الاسم الذي تعرضه Google يخضع لإعدادات العلامة التجارية والتحقق لديها؛ تعديل اسم الموقع وحده لا يغيّر شاشة اختيار حساب Google.

## البصمة أو الوجه ومفاتيح الدخول

فعّل [Supabase → Authentication → Passkeys](https://supabase.com/dashboard/project/istvaveorgqcgxsdqsch/auth/passkeys):

| الحقل | القيمة |
| --- | --- |
| RP display name | `Zo7al Projects` |
| RP ID | `zo7al.is-a.dev` |
| Origin | `https://zo7al.is-a.dev` |

بعد الحفظ، يقرأ الموقع حالة التفعيل تلقائيًا. إضافة مفتاح الدخول تتم من **حسابي → الأمان** على جهازك. لا تغيّر RP ID لاحقًا دون خطة لنقل مفاتيح المستخدمين.

## المصادقة الثنائية وديسكورد

- إعداد تطبيق 2FA يعمل مستقلًا عن الرموز الاحتياطية. الرموز الاحتياطية تحتاج دعم وتفعيل الخدمة التجريبية لدى Supabase؛ الموقع لا يتجاوز التحقق إن لم تكن متاحة.
- الخطأ المرصود من Discord يعني أن الحساب مربوط بمستخدم آخر في الموقع. ادخل بواسطة Discord إلى الحساب المرتبط، ثم أضف وسيلة دخول بديلة قبل فك الربط. بعد ذلك ادخل إلى حسابك المقصود واربط Discord منه. الموقع لا ينقل الحسابات أو يدمجها تلقائيًا.
- فعّل Manual identity linking في Supabase لربط وسائل الدخول الإضافية من إعدادات الحساب.

بعد إكمال الإعدادات، تحقق من الدخول والإلغاء والربط وفك الربط ومن تسجيل الدخول إلى حساب مفعّل عليه 2FA.

## دخول المالك وحذف الحساب

`ZO7AL_ADMIN_ACCOUNT_IDS` يحدد UUID الحسابات المسموح لها بالدخول إلى الداشبورد. لا تستخدم الاسم أو البريد لتحديد صلاحية الإدارة. كل طلب إداري يتحقق من الجلسة و2FA والحظر. سجّل الدخول بالوسيلة المرتبطة بنفس الحساب.

حذف الأدمن نهائي وفوري، ويزيل حساب Auth والملف والروابط والطلبات والمشاركات. سجلات الشراء تبقى مجهولة الهوية مع سجل منع وصول صغير للحساب المحذوف. حساب المالك محمي من الحذف.

طلب المستخدم حذف حسابه في الإعدادات يسجّله خروجًا ويخفي ملفه. تسجيل الدخول مع إكمال 2FA خلال 15 يومًا يلغي الطلب. بعد انتهاء المهلة لا يسمح بالدخول. مهمة Vercel اليومية `/api/cron/account-deletions` تكمل الحذف النهائي وتعيد محاولات Auth الفاشلة. احفظ `CRON_SECRET` خاصًا في Production لتوثيق المهمة.

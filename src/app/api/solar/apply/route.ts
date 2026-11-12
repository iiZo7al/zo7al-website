import { accountHeaders, accountUser } from "@/lib/server/account-auth";
import { createTrackedRequest, limitAttempt } from "@/lib/server/site-content";
import { siteDatabase } from "@/lib/server/site-db";
import {
  privateHeaders,
  readJSON,
  sameOrigin,
} from "@/lib/server/site-security";
import { validateSolarApplication } from "@/lib/data/solar";
import { webhookUrl } from "@/lib/server/creator-applications";
import { getSolarSettings } from "@/lib/server/solar-settings";

export const runtime = "nodejs";

const roleLabels: Record<string, string> = {
  admin: "إداري (Staff)",
  player: "لاعب تنافسي (Competitive Player)",
  creator: "صانع محتوى (Content Creator)",
  streamer: "ستريمر (Streamer)",
  writer: "كاتب أفكار (Idea Writer)",
  editor: "ممنتج (Video Editor)",
  designer: "مصمم (Designer)",
};

const contractDurationLabels: Record<string, string> = {
  "2_months": "شهرين",
  "3_months": "ثلاثة شهور",
  "4_months": "اربع شهور",
  "5_months": "خمسة شهور",
  "6_months": "ستة شهور",
  "1_year": "سنة",
  "2_years": "سنتين",
  other: "أخرى",
};

const subTypeLabels: Record<string, string> = {
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
};

const gameLabels: Record<string, string> = {
  fortnite: "فورتنايت (Fortnite)",
  rocket: "روكيت ليق (Rocket League)",
  minecraft: "ماينكرافت (Minecraft)",
  fifa: "فيفا / FC (FIFA)",
};

export async function POST(request: Request) {
  const headers = accountHeaders();
  if (!sameOrigin(request)) {
    return Response.json(
      { error: "INVALID" },
      { status: 403, headers: privateHeaders },
    );
  }

  try {
    const user = await accountUser(request, headers);
    if (!user) {
      return Response.json(
        { error: "AUTH_REQUIRED" },
        { status: 401, headers: privateHeaders },
      );
    }

    const settings = await getSolarSettings();
    if (!settings.isOpen) {
      return Response.json(
        { error: "RECRUITMENT_CLOSED" },
        { status: 403, headers: privateHeaders },
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    if (
      !(await limitAttempt("solar-apply:ip:" + ip, 4, 900)) ||
      !(await limitAttempt("solar-apply:user:" + user.id, 3, 900))
    ) {
      return Response.json(
        { error: "RATE_LIMIT" },
        { status: 429, headers: privateHeaders },
      );
    }

    const body = await readJSON(request, 64000);
    const application = validateSolarApplication(body);
    if (!application) {
      return Response.json(
        { error: "INVALID" },
        { status: 400, headers: privateHeaders },
      );
    }

    if (settings.closedRoles.includes(application.role)) {
      return Response.json(
        { error: "ROLE_CLOSED" },
        { status: 403, headers: privateHeaders },
      );
    }

    const payload = {
      ...application,
      platform: "solar",
      subject: `طلب انضمام كلان Solar — ${application.name} (${roleLabels[application.role] || application.role})`,
      appliedAt: new Date().toISOString(),
    };

    let receipt: { reference: string; token: string };
    try {
      receipt = await createTrackedRequest(
        "application",
        payload,
        undefined,
        user.id,
      );
    } catch (err) {
      if (err instanceof Error && err.message === "ALREADY_APPLIED") {
        return Response.json(
          { error: "ALREADY_APPLIED" },
          { status: 409, headers: privateHeaders },
        );
      }
      throw err;
    }

    // Optional Discord notification to configured webhook
    const rawWebhook = process.env.DISCORD_APPLICATION_WEBHOOK_URL;
    const webhook = webhookUrl(rawWebhook);
    if (webhook) {
      try {
        const fields = [
          {
            name: "👤 الاسم واللقب",
            value: `${application.name}${application.nickname ? ` (${application.nickname})` : ""}`,
            inline: true,
          },
          {
            name: "🎂 العمر",
            value: application.age ? String(application.age) : "غير محدد",
            inline: true,
          },
          {
            name: "📍 من وين؟",
            value: application.country || "غير محدد",
            inline: true,
          },
          {
            name: "💬 حساب الديسكورد",
            value: application.discord,
            inline: true,
          },
          {
            name: "📱 رقم الواتساب",
            value: application.whatsapp,
            inline: true,
          },
          {
            name: "👑 التخصص / وش تقدم؟",
            value: roleLabels[application.role] || application.role,
            inline: true,
          },
          ...(application.adminSubType
            ? [
                {
                  name: "⚙️ نوع الإشراف/الإدارة",
                  value:
                    subTypeLabels[application.adminSubType] ||
                    application.adminSubType,
                  inline: true,
                },
              ]
            : []),
          ...(application.game
            ? [
                {
                  name: "🎮 اللعبة",
                  value: gameLabels[application.game] || application.game,
                  inline: true,
                },
              ]
            : []),
          {
            name: "⏳ مدة الخبرة في التخصص",
            value: application.experienceDuration || "غير محدد",
            inline: true,
          },
          {
            name: "🛡️ خبرة سابقة في الكلانات؟",
            value: application.hasPreviousClans ? "نعم" : "لا",
            inline: true,
          },
          {
            name: "📜 مدة العقد المطلوبة",
            value:
              contractDurationLabels[application.contractDuration || ""] ||
              application.contractDurationCustom ||
              application.contractDuration ||
              "شهرين",
            inline: true,
          },
          {
            name: "✍️ التعهد وتوقيع العقد",
            value: `${application.pledgeAgreed ? "✅ موافق على التعهد" : "⚠️ لم يؤكد"}${application.signedContractUrl ? ` • [عرض صورة العقد الموقّع](${application.signedContractUrl})` : ""}`,
            inline: false,
          },
          ...(application.channelUrl
            ? [
                {
                  name: "🎥 رابط القناة",
                  value: application.channelUrl,
                  inline: false,
                },
              ]
            : []),
          ...(application.streamUrl
            ? [
                {
                  name: "🟣 رابط البث",
                  value: application.streamUrl,
                  inline: false,
                },
              ]
            : []),
          ...(application.portfolioUrl
            ? [
                {
                  name: "🎨 رابط الأعمال",
                  value: application.portfolioUrl,
                  inline: false,
                },
              ]
            : []),
          {
            name: "📝 لماذا ترغب بالانضمام إلى Solar System؟",
            value: application.whyJoin || application.bio,
            inline: false,
          },
        ];

        const discordRes = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "Solar System Team • Recruitment",
            embeds: [
              {
                author: {
                  name: "Solar System Team · كلان سولار",
                  url: "https://zo7al.is-a.dev/solar",
                },
                title: "☀️ طلب انضمام جديد لكلان Solar!",
                description: `قدّم **${application.name}** على رتبة **${roleLabels[application.role] || application.role}**. متاح للمراجعة عبر لوحة التحكم.`,
                color: 0xf59e0b, // Solar Amber
                fields,
                footer: { text: `Reference: ${receipt.reference}` },
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
        if (discordRes.ok) {
          const resJson = await discordRes.json().catch(() => null);
          if (resJson?.id) {
            await (
              await siteDatabase()
            )
              .query(
                "UPDATE site_requests SET discord_receipt=$2 WHERE id=$1",
                [receipt.reference, resJson.id],
              )
              .catch(() => {});
          }
        }
      } catch {
        /* discord webhook notification is optional and does not fail user submission */
      }
    }

    return Response.json(
      {
        ok: true,
        reference: receipt.reference,
        token: receipt.token,
      },
      { headers },
    );
  } catch {
    return Response.json(
      { error: "UNAVAILABLE" },
      { status: 503, headers: privateHeaders },
    );
  }
}

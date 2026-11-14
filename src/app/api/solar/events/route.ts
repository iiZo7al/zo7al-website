import { accountHeaders, accountUser } from "@/lib/server/account-auth";
import { createTrackedRequest, limitAttempt } from "@/lib/server/site-content";
import { siteDatabase } from "@/lib/server/site-db";
import {
  privateHeaders,
  readJSON,
  sameOrigin,
} from "@/lib/server/site-security";
import { webhookUrl } from "@/lib/server/creator-applications";
import { validateSolarEventsApplication } from "@/lib/data/solar-events";

export const runtime = "nodejs";

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

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    if (
      !(await limitAttempt("solar-events:ip:" + ip, 4, 900)) ||
      !(await limitAttempt("solar-events:user:" + user.id, 3, 900))
    ) {
      return Response.json(
        { error: "RATE_LIMIT" },
        { status: 429, headers: privateHeaders },
      );
    }

    const body = await readJSON(request, 64000);
    const application = validateSolarEventsApplication(body);
    if (!application) {
      return Response.json(
        { error: "INVALID" },
        { status: 400, headers: privateHeaders },
      );
    }

    const payload = {
      ...application,
      platform: "solar-events",
      subject: `تقديم إدارة فعاليات ديسكورد — ${application.name}`,
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

    const rawWebhook = process.env.DISCORD_APPLICATION_WEBHOOK_URL;
    const webhook = webhookUrl(rawWebhook);
    if (webhook) {
      try {
        const discordRes = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [
              {
                title: "🎉 تقديم جديد: إدارة فعاليات الديسكورد — Solar System",
                color: 0xff8a00,
                fields: [
                  { name: "👤 الاسم", value: application.name, inline: true },
                  { name: "🎂 العمر", value: application.age, inline: true },
                  { name: "💬 الديسكورد", value: application.discord, inline: true },
                  {
                    name: "✍️ التوقيع والتعهد",
                    value: `✅ موافق • [عرض صورة العقد الموقّع](${application.signedContractUrl})`,
                    inline: false,
                  },
                ],
                footer: { text: `Ref: ${receipt.reference}` },
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });

        await (
          await siteDatabase()
        ).query(
          "UPDATE site_requests SET discord_receipt = $1 WHERE id = $2",
          [
            JSON.stringify({
              ok: discordRes.ok,
              status: discordRes.status,
              sentAt: new Date().toISOString(),
            }),
            receipt.reference,
          ],
        );
      } catch {
        // non-fatal
      }
    }

    return Response.json(
      { ok: true, reference: receipt.reference, token: receipt.token },
      { status: 201, headers: privateHeaders },
    );
  } catch {
    return Response.json(
      { error: "UNAVAILABLE" },
      { status: 503, headers: privateHeaders },
    );
  }
}

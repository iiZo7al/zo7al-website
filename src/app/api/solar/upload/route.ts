import { accountHeaders, accountUser } from "@/lib/server/account-auth";
import { privateHeaders, sameOrigin } from "@/lib/server/site-security";
import { limitAttempt } from "@/lib/server/site-content";
import { saveContentImage } from "@/lib/server/content-media";
import { CONTENT_IMAGE_UPLOAD_BYTES } from "@/lib/data/content-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  const headers = accountHeaders();
  if (!sameOrigin(request)) {
    return Response.json(
      { error: "INVALID" },
      { status: 403, headers: privateHeaders },
    );
  }

  const user = await accountUser(request, headers);
  if (!user) {
    return Response.json(
      { error: "AUTH_REQUIRED" },
      { status: 401, headers: privateHeaders },
    );
  }

  if (!(await limitAttempt("solar:upload:" + user.id, 10, 900))) {
    return Response.json(
      { error: "RATE_LIMIT" },
      { status: 429, headers: privateHeaders },
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let buffer: Buffer | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image");
      if (!(file instanceof File) || !file.size) {
        return Response.json(
          { error: "IMAGE_FORMAT" },
          { status: 400, headers: privateHeaders },
        );
      }
      if (file.size > CONTENT_IMAGE_UPLOAD_BYTES) {
        return Response.json(
          { error: "IMAGE_SIZE" },
          { status: 413, headers: privateHeaders },
        );
      }
      buffer = Buffer.from(await file.arrayBuffer());
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      if (
        typeof body.dataUrl === "string" &&
        body.dataUrl.startsWith("data:image/")
      ) {
        const base64Data = body.dataUrl.split(",")[1];
        if (!base64Data) {
          return Response.json(
            { error: "IMAGE_FORMAT" },
            { status: 400, headers: privateHeaders },
          );
        }
        buffer = Buffer.from(base64Data, "base64");
      }
    }

    if (!buffer || !buffer.length) {
      return Response.json(
        { error: "INVALID" },
        { status: 400, headers: privateHeaders },
      );
    }

    const saved = await saveContentImage(buffer);
    return Response.json(
      {
        ok: true,
        id: saved.id,
        url: `/api/solar/media/${saved.id}`,
      },
      { headers: privateHeaders },
    );
  } catch (err) {
    const code =
      err instanceof Error && err.message === "IMAGE_SIZE"
        ? "IMAGE_SIZE"
        : "IMAGE_FORMAT";
    return Response.json(
      { error: code },
      { status: code === "IMAGE_SIZE" ? 413 : 400, headers: privateHeaders },
    );
  }
}

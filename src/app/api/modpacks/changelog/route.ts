import { getModpackChangelogs } from "@/lib/server/modpack-changelogs";

export async function GET(request: Request) {
  const project = new URL(request.url).searchParams.get("project");
  if (project !== null && !/^(modrinth|curseforge):[a-zA-Z0-9_-]{1,100}$/.test(project)) return Response.json({ error: "INVALID_PROJECT" }, { status: 400 });
  const data = await getModpackChangelogs(project ?? undefined);
  // Only public release notes leave the server; connected platform keys remain private.
  const complete = data.sources.every(source => source.status === "live");
  return Response.json(data, { headers: { "Cache-Control": complete ? "public, max-age=60, s-maxage=300, stale-while-revalidate=600" : "no-store" } });
}

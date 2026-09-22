import type { MetadataRoute } from "next";
function manifest(): MetadataRoute.Manifest {
  return { id: "/game", name: "Zo7al Game", short_name: "Zo7al Game", start_url: "/game", scope: "/", display: "standalone", display_override: ["fullscreen", "standalone"], background_color: "#07080b", theme_color: "#07080b", icons: [
    { src: "/assets/app/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/assets/app/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }
  ] };
}

export function GET() { return Response.json(manifest(), { headers: { "Content-Type": "application/manifest+json" } }); }

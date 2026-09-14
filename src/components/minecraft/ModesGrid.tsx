import { MINECRAFT_MODES } from "@/lib/data/minecraft";
import Reveal from "@/components/ui/Reveal";

export default function ModesGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {MINECRAFT_MODES.map((m, i) => (
        <Reveal key={m.id} delay={i * 0.06}>
          <div
            className="group relative h-full overflow-hidden rounded-2xl border p-7"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              opacity: m.status === "soon" ? 0.7 : 1,
            }}
          >
            <div
              className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: "var(--accent)" }}
              aria-hidden="true"
            />
            <p className="text-label mb-4" style={{ color: m.status === "live" ? "var(--accent)" : "var(--text-muted)" }}>
              {m.status === "live" ? "Live" : "Coming Soon"}
            </p>
            <h3 className="text-2xl font-bold">{m.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{m.description}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

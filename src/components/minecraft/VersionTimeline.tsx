import { MINECRAFT_VERSIONS } from "@/lib/data/minecraft";
import Reveal from "@/components/ui/Reveal";

export default function VersionTimeline() {
  return (
    <div className="relative grid gap-4 sm:grid-cols-3">
      <div
        className="absolute left-0 right-0 top-6 hidden h-px sm:block"
        style={{ background: "var(--border)" }}
        aria-hidden="true"
      />
      {MINECRAFT_VERSIONS.map((v, i) => (
        <Reveal key={v.id} delay={i * 0.06}>
          <div
            className="relative rounded-2xl border p-6"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <span
              className="mb-4 inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: "var(--accent)", boxShadow: "0 0 12px var(--glow)" }}
            />
            <p className="text-2xl font-bold">{v.label}</p>
            <p className="text-label mt-1" style={{ color: "var(--accent)" }}>
              {v.tag}
            </p>
            <p className="mt-3 text-sm text-[var(--text-muted)]">{v.description}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

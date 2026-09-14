export default function ProjectArt({
  variant,
}: {
  variant: "minecraft" | "modpacks" | "fortnite";
}) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)" }}>
      <div
        className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
        style={{
          background:
            variant === "minecraft"
              ? "radial-gradient(70% 60% at 30% 20%, rgba(255,122,0,0.28), transparent 60%), radial-gradient(50% 50% at 85% 80%, rgba(25,217,255,0.14), transparent 60%), var(--surface)"
              : variant === "modpacks"
              ? "radial-gradient(70% 60% at 70% 15%, rgba(43,227,123,0.26), transparent 60%), radial-gradient(50% 50% at 15% 85%, rgba(25,217,255,0.16), transparent 60%), var(--surface)"
              : "radial-gradient(70% 60% at 20% 80%, rgba(139,92,246,0.3), transparent 60%), radial-gradient(50% 50% at 85% 20%, rgba(25,217,255,0.16), transparent 60%), var(--surface)",
        }}
      >
        <svg className="absolute inset-0 h-full w-full opacity-[0.16]" aria-hidden="true">
          <defs>
            <pattern id={`grid-${variant}`} width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${variant})`} />
        </svg>

        {variant === "minecraft" && (
          <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <g opacity="0.9">
              <rect x="120" y="150" width="48" height="48" fill="var(--accent)" opacity="0.55" />
              <rect x="168" y="150" width="48" height="48" fill="var(--accent)" opacity="0.85" />
              <rect x="168" y="102" width="48" height="48" fill="var(--accent)" opacity="0.65" />
              <rect x="216" y="150" width="48" height="48" fill="var(--accent)" opacity="0.4" />
            </g>
          </svg>
        )}
        {variant === "modpacks" && (
          <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <g opacity="0.85">
              <circle cx="150" cy="150" r="34" fill="var(--accent)" opacity="0.5" />
              <circle cx="210" cy="120" r="22" fill="var(--accent-secondary)" opacity="0.6" />
              <circle cx="250" cy="180" r="16" fill="var(--accent)" opacity="0.7" />
            </g>
          </svg>
        )}
        {variant === "fortnite" && (
          <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <g opacity="0.9" stroke="var(--accent)" strokeWidth="2" fill="none">
              <polygon points="200,90 260,150 200,210 140,150" opacity="0.6" />
              <polygon points="200,120 230,150 200,180 170,150" opacity="0.85" />
            </g>
          </svg>
        )}
      </div>
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(7,8,11,0.75), transparent 55%)" }}
      />
    </div>
  );
}

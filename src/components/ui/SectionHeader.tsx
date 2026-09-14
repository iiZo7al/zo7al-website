import Reveal from "./Reveal";

export default function SectionHeader({
  eyebrow,
  title,
  text,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  align?: "left" | "center";
}) {
  return (
    <Reveal className={align === "center" ? "text-center mx-auto max-w-2xl" : "max-w-2xl"}>
      {eyebrow && <p className="text-label mb-4" style={{ color: "var(--accent)" }}>{eyebrow}</p>}
      <h2 className="text-display text-4xl sm:text-5xl md:text-6xl">{title}</h2>
      {text && <p className="mt-5 text-lg text-[var(--text-muted)] leading-relaxed">{text}</p>}
    </Reveal>
  );
}

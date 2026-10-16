"use client";

import { usePathname } from "next/navigation";

export default function BrandName({ name }: { name: string }) {
  const pathname = usePathname();
  if (pathname !== "/miku") return name;
  return (
    <span className="miku-context-brand" dir="ltr">
      <span>Zo7al</span>
      <span className="miku-context-amp">&amp;</span>
      <span className="miku-context-name">Miku</span>
    </span>
  );
}

"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, type ReactNode } from "react";

export default function MagneticButton({
  children,
  className,
  strength = 0.35,
  as: Component = "div",
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  as?: "div" | "span";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 20, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 260, damping: 20, mass: 0.4 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    // Cap the pull so it stays a micro-interaction (~4-8px).
    x.set(Math.max(-8, Math.min(8, relX * strength * 0.1)));
    y.set(Math.max(-8, Math.min(8, relY * strength * 0.1)));
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const MotionComponent = motion[Component];

  return (
    <MotionComponent
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}

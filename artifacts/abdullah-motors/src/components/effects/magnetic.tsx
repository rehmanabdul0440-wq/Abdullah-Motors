import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useTouchDevice } from "@/hooks/use-touch-device";
import { cn } from "@/lib/utils";

type MagneticProps = {
  children: ReactNode;
  className?: string;
  /** Max pixel offset the element drifts toward the cursor. */
  strength?: number;
  /** Extra activation radius in px beyond the element's box. */
  radius?: number;
};

/**
 * Wraps a CTA in an invisible activation area; the child element drifts a
 * few pixels toward the pointer inside that area and springs back on leave.
 * Disabled on touch devices — renders children inline with no wrapper effects.
 */
export function Magnetic({ children, className, strength = 10, radius = 40 }: MagneticProps) {
  const isTouch = useTouchDevice();
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 22, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 260, damping: 22, mass: 0.5 });

  if (isTouch) {
    return <span className={cn("inline-flex", className)}>{children}</span>;
  }

  const handleMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const maxDx = rect.width / 2 + radius;
    const maxDy = rect.height / 2 + radius;
    x.set(Math.max(-strength, Math.min(strength, (dx / maxDx) * strength)));
    y.set(Math.max(-strength, Math.min(strength, (dy / maxDy) * strength)));
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <span
      ref={wrapRef}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{ padding: `${radius}px`, margin: `-${radius}px` }}
      className={cn("relative inline-flex", className)}
    >
      <motion.span style={{ x: sx, y: sy }} className="inline-flex">
        {children}
      </motion.span>
    </span>
  );
}

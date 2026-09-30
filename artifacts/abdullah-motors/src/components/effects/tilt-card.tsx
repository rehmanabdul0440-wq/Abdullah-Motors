import { useRef, type ReactNode, type CSSProperties } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useTouchDevice } from "@/hooks/use-touch-device";
import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees. Keep small (4–8) for a premium feel. */
  max?: number;
  /** Show a cursor-following radial glow underneath the tilt. */
  glow?: boolean;
  style?: CSSProperties;
};

export function TiltCard({ children, className, max = 6, glow = true, style }: TiltCardProps) {
  const isTouch = useTouchDevice();
  const ref = useRef<HTMLDivElement | null>(null);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), {
    stiffness: 220,
    damping: 22,
    mass: 0.4,
  });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), {
    stiffness: 220,
    damping: 22,
    mass: 0.4,
  });
  const glowX = useTransform(px, (v) => `${v * 100}%`);
  const glowY = useTransform(py, (v) => `${v * 100}%`);
  const glowOpacity = useSpring(0, { stiffness: 180, damping: 24 });
  const glowBackground = useTransform(
    [glowX, glowY] as never,
    ([x, y]: string[]) =>
      `radial-gradient(280px circle at ${x} ${y}, color-mix(in oklab, var(--primary) 32%, transparent), transparent 65%)`,
  );

  if (isTouch) {
    // Simple lift+shadow on tap is handled by the card's own hover classes.
    return (
      <div className={cn("active:scale-[0.99] transition-transform", className)} style={style}>
        {children}
      </div>
    );
  }

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const handleEnter = () => glowOpacity.set(1);
  const handleLeave = () => {
    glowOpacity.set(0);
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      style={{
        rotateX: rx,
        rotateY: ry,
        transformStyle: "preserve-3d",
        transformPerspective: 900,
        ...style,
      }}
      className={cn("relative", className)}
    >
      {glow && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            opacity: glowOpacity,
            background: glowBackground,
          }}
        />
      )}
      <div style={{ transform: "translateZ(0.01px)" }}>{children}</div>
    </motion.div>
  );
}

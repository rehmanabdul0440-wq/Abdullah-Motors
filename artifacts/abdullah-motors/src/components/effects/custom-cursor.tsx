import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useTouchDevice } from "@/hooks/use-touch-device";

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, label, summary, [data-cursor="link"], [data-cursor="button"]';

export function CustomCursor() {
  const isTouch = useTouchDevice();
  const [mounted, setMounted] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const raf = useRef<number | null>(null);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isTouch) return;
    document.documentElement.classList.add("has-custom-cursor");
    return () => document.documentElement.classList.remove("has-custom-cursor");
  }, [isTouch]);

  useEffect(() => {
    if (isTouch) return;

    const onMove = (e: PointerEvent) => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        x.set(e.clientX);
        y.set(e.clientY);
        setVisible(true);
      });
      const target = e.target as Element | null;
      setHovering(!!target?.closest(INTERACTIVE_SELECTOR));
    };
    const onLeave = () => setVisible(false);
    const onDown = () => setHovering((h) => h);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [isTouch, x, y]);

  if (!mounted || isTouch) return null;

  return (
    <>
      {/* Outer ring — smooth follow */}
      <motion.div
        aria-hidden
        style={{ x: sx, y: sy, opacity: visible ? 1 : 0 }}
        className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200"
      >
        <motion.div
          animate={{
            width: hovering ? 44 : 28,
            height: hovering ? 44 : 28,
            borderColor: hovering
              ? "color-mix(in oklab, var(--primary) 90%, transparent)"
              : "color-mix(in oklab, var(--foreground) 60%, transparent)",
            backgroundColor: hovering
              ? "color-mix(in oklab, var(--primary) 12%, transparent)"
              : "transparent",
          }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="rounded-full border mix-blend-difference"
        />
      </motion.div>
      {/* Inner dot — snappy */}
      <motion.div
        aria-hidden
        style={{ x, y, opacity: visible ? 1 : 0 }}
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary transition-opacity duration-150"
      />
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "motion/react";

type AnimatedCounterProps = {
  value: string;
  duration?: number;
  className?: string;
};

// Parses the first numeric run out of a string and preserves the surrounding
// prefix / suffix (e.g. "$", "+", "%", "★", "K"). Handles decimals like "4.9".
function splitValue(value: string) {
  const match = value.match(/^([^\d.-]*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!match) return { prefix: "", number: 0, suffix: value, decimals: 0 };
  const [, prefix, num, suffix] = match;
  const decimals = num.includes(".") ? num.split(".")[1].length : 0;
  return { prefix, number: parseFloat(num), suffix, decimals };
}

export function AnimatedCounter({ value, duration = 1.5, className }: AnimatedCounterProps) {
  const { prefix, number, suffix, decimals } = splitValue(value);
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (latest) => latest.toFixed(decimals));
  const [display, setDisplay] = useState(decimals ? (0).toFixed(decimals) : "0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, number, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, number, duration, mv, rounded]);

  return (
    <motion.span ref={ref} className={className} aria-label={value}>
      {prefix}
      {display}
      {suffix}
    </motion.span>
  );
}

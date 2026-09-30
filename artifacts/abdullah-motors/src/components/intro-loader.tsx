import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const SESSION_KEY = "aurora_intro_shown";

export function IntroLoader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, oklch(0.62 0.22 295 / 0.35), transparent 60%)",
            }}
          />
          <motion.div
            animate={{
              opacity: [0.7, 1, 0.7],
              filter: ["blur(0.5px)", "blur(0px)", "blur(0.5px)"],
            }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="relative font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            Abdullah<span className="text-gradient-primary">Motors</span>
          </motion.div>
          <div className="relative mt-8 h-[2px] w-48 overflow-hidden rounded-full bg-border/60">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="h-full w-1/2 bg-gradient-primary"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

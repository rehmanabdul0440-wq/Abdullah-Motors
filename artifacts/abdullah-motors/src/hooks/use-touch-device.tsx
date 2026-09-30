import { useEffect, useState } from "react";

/**
 * Returns true on touch-primary devices (phones, most tablets) and false on
 * mouse/desktop. SSR-safe: defaults to true until the media query resolves so
 * we never briefly enable desktop-only interactions on touch devices.
 */
export function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setIsTouch(!mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isTouch;
}

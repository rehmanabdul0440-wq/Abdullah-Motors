import { cn } from "@/lib/utils";

/**
 * Subtle animated gradient divider with a slow glow pulse.
 * GPU-friendly: only opacity/background-position animate.
 */
export function GlowDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("mx-auto my-4 h-px w-full max-w-7xl glow-divider", className)} />
  );
}

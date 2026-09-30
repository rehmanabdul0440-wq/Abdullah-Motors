import { cn } from "@/lib/utils";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("inline-block", className)}>
      <span className="block h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin [border-image:linear-gradient(135deg,var(--primary-from),var(--primary-to))_1]" />
      <span className="sr-only">{label}…</span>
    </span>
  );
}

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        <div className="absolute inset-1 rounded-full bg-gradient-primary opacity-20 blur-md" />
      </div>
      <p className="text-caption uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

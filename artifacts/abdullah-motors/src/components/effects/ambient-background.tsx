/**
 * Sitewide ambient background: two slow-drifting radial gradient blobs
 * plus a faint fixed grid. All animation is transform/opacity-only so it
 * stays on the compositor thread. pointer-events-none and aria-hidden.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ contain: "strict" }}
    >
      {/* Faint grid */}
      <div className="absolute inset-0 opacity-[0.05] ambient-grid" />
      {/* Drifting mesh blobs */}
      <div className="absolute -top-1/4 -left-1/4 h-[70vmax] w-[70vmax] rounded-full opacity-30 blur-3xl will-change-transform ambient-blob ambient-blob-a" />
      <div className="absolute -bottom-1/3 -right-1/4 h-[65vmax] w-[65vmax] rounded-full opacity-25 blur-3xl will-change-transform ambient-blob ambient-blob-b" />
      {/* Vignette to keep contrast under text */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_40%,transparent_40%,var(--background)_100%)]" />
    </div>
  );
}

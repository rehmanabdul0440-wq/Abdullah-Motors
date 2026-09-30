import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { IntroLoader } from "@/components/intro-loader";
import { CustomCursor } from "@/components/effects/custom-cursor";
import { AmbientBackground } from "@/components/effects/ambient-background";
import { PageTransition } from "@/components/effects/page-transition";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-24">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_40%_at_50%_30%,color-mix(in_oklab,var(--primary)_20%,transparent),transparent_70%)]" />
      <div className="glass-surface relative mx-auto max-w-lg rounded-3xl p-10 text-center page-transition">
        <p className="text-caption uppercase tracking-[0.3em] text-muted-foreground">Error 404</p>
        <h1 className="mt-3 text-display-lg">
          <span className="text-gradient-primary">Lost the trail.</span>
        </h1>
        <p className="mt-4 text-body text-muted-foreground">
          This route isn't in our inventory. Let's get you back on the road.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
          >
            Back to home
          </Link>
          <Link
            to="/cars"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface/50 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Browse cars
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Abdullah Motors — Premium Cars, Delivered Differently" },
      {
        name: "description",
        content:
          "Abdullah Motors is a trusted premium dealership. Curated inventory, concierge test drives, and a high-touch buying experience.",
      },
      { name: "author", content: "Abdullah Motors" },
      { name: "theme-color", content: "#0A0A0F" },
      { property: "og:title", content: "Abdullah Motors — Premium Cars, Delivered Differently" },
      {
        property: "og:description",
        content:
          "Curated luxury, electric, and performance vehicles with a concierge digital experience.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="relative flex min-h-screen flex-col bg-background">
          <AmbientBackground />
          <IntroLoader />
          <CustomCursor />
          {!isAdminRoute && <Navbar />}
          <main className={`flex-1 ${isAdminRoute ? "" : "pt-16"}`}>
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
          {!isAdminRoute && <Footer />}
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PageLoader } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Car,
  Calendar,
  Mail,
  MessageSquare,
  FileText,
  LogOut,
  Globe,
  ShieldAlert,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, profile, loading, signOut, isAdminOrStaff } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!loading) {
      if (!user && !isLoginPage) {
        navigate({ to: "/admin/login" });
      } else if (user && isAdminOrStaff && isLoginPage) {
        navigate({ to: "/admin" });
      }
    }
  }, [user, isAdminOrStaff, loading, pathname, isLoginPage, navigate]);

  // Show page loader while loading auth status
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <PageLoader label="Verifying Credentials" />
      </div>
    );
  }

  // If not logged in and on login page, render login route directly (no admin shell)
  if (!user && isLoginPage) {
    return <Outlet />;
  }

  // Guard: Not logged in and not on login page (waiting for redirect)
  if (!user) {
    return null;
  }

  // Guard: Logged in as regular customer (unauthorized)
  if (!isAdminOrStaff) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-24 bg-background">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_40%_at_50%_30%,color-mix(in_oklab,var(--primary)_20%,transparent),transparent_70%)]" />
        <div className="glass-surface relative mx-auto max-w-md w-full rounded-3xl p-8 text-center border border-border/50 shadow-2xl backdrop-blur-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <p className="text-caption uppercase tracking-[0.3em] text-muted-foreground mb-2">
            Access Denied
          </p>
          <h1 className="text-display-sm text-foreground mb-4">
            <span className="text-gradient-primary">Not Authorized</span>
          </h1>
          <p className="text-body text-muted-foreground leading-relaxed mb-8">
            Your account is registered as a{" "}
            <span className="text-foreground font-semibold">Customer</span>. Only staff or
            administrative accounts can access the back-office dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition-all hover:scale-[1.02] cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Go to Showroom
            </Link>
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                toast.success("Signed out successfully");
                navigate({ to: "/admin/login" });
              }}
              className="rounded-xl border border-border bg-surface/50 hover:bg-accent transition-colors"
            >
              Sign In with Admin Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Log Out click
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Successfully logged out");
      navigate({ to: "/admin/login" });
    } catch (e) {
      toast.error("Logout failed. Try again.");
    }
  };

  // If on login page but already logged in as admin/staff (waiting for redirect)
  if (isLoginPage) {
    return null;
  }

  const navLinks = [
    { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
    { label: "Manage Cars", to: "/admin/cars", icon: Car },
    { label: "Bookings", to: "/admin/bookings", icon: Calendar },
    { label: "Enquiries", to: "/admin/enquiries", icon: Mail },
    { label: "Testimonials", to: "/admin/testimonials", icon: MessageSquare },
    { label: "Blog Posts", to: "/admin/blogs", icon: FileText },
  ];

  const adminName = profile?.full_name || user.email || "Administrator";
  const adminRole = profile?.role || "staff";
  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* 1. Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r border-border/40 bg-surface/30 backdrop-blur-md flex flex-col justify-between p-6">
        <div className="flex flex-col gap-8">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2 px-2 hover:opacity-90 transition-opacity">
            <span className="font-display text-xl font-bold tracking-tight text-gradient-primary">
              Abdullah<span className="text-foreground font-light">Motors</span>
            </span>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-bold tracking-widest text-primary/80 border-primary/20 bg-primary/5"
            >
              Admin
            </Badge>
          </Link>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-white/[0.03] [&.active]:bg-gradient-primary [&.active]:text-primary-foreground [&.active]:shadow-glow"
                activeProps={{ className: "active" }}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Panel */}
        <div className="flex flex-col gap-4 border-t border-border/40 pt-4">
          <Link
            to="/"
            className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all border border-dashed border-border/40"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              Visit Showroom
            </span>
            <ArrowLeft className="h-3 w-3 rotate-180 opacity-50" />
          </Link>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="flex w-full items-center justify-start gap-3 px-4 py-3 h-auto text-sm font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 h-16 border-b border-border/40 bg-background/50 backdrop-blur-md px-8 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              System Admin
            </span>
          </div>

          {/* Admin User Widget */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-sm font-medium text-foreground">{adminName}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                {adminRole}
              </span>
            </div>

            <Avatar className="h-9 w-9 border border-primary/20 shadow-glow">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={adminName} />}
              <AvatarFallback className="bg-surface text-xs font-bold text-gradient-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

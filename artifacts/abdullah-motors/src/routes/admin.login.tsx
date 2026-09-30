import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Lock, ShieldCheck, RefreshCw, KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Toggle states for reset password mode
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Handle Login Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Successfully authenticated");
      // Check user role from profile
      const { data: profile, error: profileErr } = (await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single()) as {
        data: Database["public"]["Tables"]["profiles"]["Row"] | null;
        error: unknown;
      };

      if (profileErr) throw profileErr;

      if (profile && (profile.role === "admin" || profile.role === "staff")) {
        navigate({ to: "/admin" });
      } else {
        toast.error("Access denied: Customers cannot view admin dashboard.");
        // Reroute is handled automatically by the guard, but navigating explicitly to showroom
        navigate({ to: "/" });
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error((err as Error).message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password Submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your registered email address");
      return;
    }

    setResetLoading(true);
    try {
      // For local development or client redirection, get the origin
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/admin` : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo,
      });

      if (error) throw error;

      toast.success("Password reset instructions sent to your email!");
      setIsResetMode(false);
    } catch (err: unknown) {
      console.error(err);
      toast.error((err as Error).message || "Failed to send reset link. Try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden bg-background">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_50%_at_50%_50%,color-mix(in_oklab,var(--primary)_25%,transparent),transparent_80%)]" />

      <div className="w-full max-w-md page-transition">
        {/* Logo Brand Title */}
        <div className="text-center mb-8">
          <span className="font-display text-3xl font-bold tracking-tight text-gradient-primary">
            Abdullah<span className="text-foreground font-light">Motors</span>
          </span>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2 font-semibold">
            Administrative Control Panel
          </p>
        </div>

        {/* Dynamic Card Container based on mode */}
        {!isResetMode ? (
          <Card className="glass-surface border border-border/40 shadow-2xl backdrop-blur-md relative overflow-hidden rounded-3xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold font-display text-foreground">
                Sign In
              </CardTitle>
              <CardDescription>Enter credentials to access the admin system</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@abdullahmotors.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-xl bg-surface/50 border-border/40 focus:border-primary/50 text-sm h-11"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setIsResetMode(true)}
                      className="text-xs text-primary font-medium hover:underline hover:text-primary/95 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 rounded-xl bg-surface/50 border-border/40 focus:border-primary/50 text-sm h-11"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-gradient-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-95 shadow-glow cursor-pointer transition-all duration-200"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" /> Authenticate
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate({ to: "/" })}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer w-full justify-center"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to main site
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Card className="glass-surface border border-border/40 shadow-2xl backdrop-blur-md relative overflow-hidden rounded-3xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold font-display text-foreground">
                Reset Password
              </CardTitle>
              <CardDescription>Receive secure reset instructions in your inbox</CardDescription>
            </CardHeader>
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                {/* Reset Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Registered Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="admin@abdullahmotors.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10 rounded-xl bg-surface/50 border-border/40 focus:border-primary/50 text-sm h-11"
                      disabled={resetLoading}
                      required
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full h-11 rounded-xl bg-gradient-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-95 shadow-glow cursor-pointer transition-all duration-200"
                >
                  {resetLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" /> Send Reset Link
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsResetMode(false)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer w-full justify-center"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to sign in
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}

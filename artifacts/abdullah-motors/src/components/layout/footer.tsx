import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Facebook, Instagram, Twitter, Youtube, Zap, Mail, MapPin, Phone, Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

const columns = [
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Careers", to: "/about" },
      { label: "Press", to: "/blog" },
      { label: "Blog", to: "/blog" },
    ],
  },
  {
    title: "Inventory",
    links: [
      { label: "New Arrivals", to: "/cars" },
      { label: "Certified Pre-Owned", to: "/cars" },
      { label: "Electric", to: "/cars" },
      { label: "Performance", to: "/cars" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact", to: "/contact" },
      { label: "Book Test Drive", to: "/contact" },
      { label: "Financing", to: "/financing" },
      { label: "Trade-In", to: "/contact" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-border">
      {/* subtle gradient glow line at the top border */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(0.66 0.19 265 / 0.6), oklch(0.62 0.22 295 / 0.6), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-transparent to-background/0"
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-[var(--shadow-glow)]">
                <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              </span>
              <span className="font-display text-lg font-bold">
                Abdullah<span className="text-gradient-primary">Motors</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-body-sm text-muted-foreground">
              The next generation of automotive retail — curated performance, electric, and luxury
              vehicles delivered with a concierge experience.
            </p>

            <ul className="mt-6 space-y-3 text-body-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-gold" />
                888 Sunset Boulevard, Los Angeles, CA
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-gold" />
                +1 (555) 018-2044
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-gold" />
              concierge@abdullahmotors.com
              </li>
            </ul>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h4 className="text-caption font-semibold uppercase tracking-widest text-muted-foreground">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-body-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-2">
            <h4 className="text-caption font-semibold uppercase tracking-widest text-muted-foreground">
              Newsletter
            </h4>
            <p className="mt-4 text-body-sm text-muted-foreground">
              Get new arrivals and private previews.
            </p>
            <FooterNewsletter />
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-border pt-8 sm:flex-row sm:items-center">
          <p className="text-caption text-muted-foreground">
              © {new Date().getFullYear()} Abdullah Motors. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-white/20 hover:text-foreground hover:scale-105"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Valid email required.");
      return;
    }
    setErrorMsg("");
    setStatus("submitting");

    const { error } = await supabase
      .from("newsletter_subscribers")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert([{ email: email.trim().toLowerCase() }] as any);

    if (error) {
      if (error.code === "23505") {
        setStatus("success"); // already subscribed — treat as success
      } else {
        setErrorMsg("Try again later.");
        setStatus("error");
      }
    } else {
      setStatus("success");
    }
  };

  if (status === "success") {
    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-primary">
        <CheckCircle2 className="h-4 w-4" />
        <span>You're subscribed!</span>
      </div>
    );
  }

  return (
    <form className="mt-4 flex flex-col gap-2" onSubmit={handleSubscribe}>
      <Input
        id="footer-newsletter-email"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setErrorMsg("");
          setStatus("idle");
        }}
        placeholder="you@domain.com"
        aria-label="Email address"
        disabled={status === "submitting"}
      />
      {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
      <Button type="submit" size="sm" disabled={status === "submitting"}>
        {status === "submitting" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          "Subscribe"
        )}
      </Button>
    </form>
  );
}

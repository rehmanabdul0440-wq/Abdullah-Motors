import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Abdullah Motors — Visit, Call or Message" },
      {
        name: "description",
        content: "Reach our concierge team for test drives, financing, or general questions.",
      },
      { property: "og:title", content: "Contact Abdullah Motors" },
      {
        property: "og:description",
        content: "Reach our concierge team for test drives, financing, or general questions.",
      },
    ],
  }),
  component: ContactPage,
});

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  website_url_honeypot: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

function ContactPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      website_url_honeypot: "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    // Honeypot — silently reject bots
    if (values.website_url_honeypot) {
      setSent(true);
      setTimeout(() => {
        setSent(false);
        reset();
      }, 3000);
      return;
    }

    const { error } = await supabase.from("enquiries").insert([
      {
        car_id: null, // general contact — no specific car
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        subject: values.subject || null,
        message: values.message,
        status: "new",
      });

    if (error) {
      toast.error(error.message || "Failed to send message. Please try again.");
    } else {
      setSent(true);
      reset();
      setTimeout(() => setSent(false), 5000);
    }
  };

  return (
    <div className="pt-32 pb-24">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <span className="text-caption uppercase text-muted-foreground">Get in touch</span>
          <h1 className="text-display-lg mt-2 text-foreground">
            Let's talk <span className="text-gradient-primary">cars</span>
          </h1>
          <p className="mt-4 text-body text-muted-foreground">
            Send a message and one of our specialists will get back within a business day.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-surface rounded-3xl p-6 md:p-8 lg:col-span-3"
          >
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow-strong)]"
                >
                  <CheckCircle2 className="h-8 w-8" />
                </motion.div>
                <h2 className="mt-5 text-title text-foreground">Message sent!</h2>
                <p className="mt-2 text-body-sm text-muted-foreground max-w-xs">
                  Thanks for reaching out. A specialist will reply within one business day.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Honeypot — hidden from real users */}
                <input
                  type="text"
                  {...register("website_url_honeypot")}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                  style={{ display: "none" }}
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="con-name">Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="con-name"
                      placeholder="Jane Doe"
                      {...register("name")}
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="con-email">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="con-email"
                      type="email"
                      placeholder="jane@email.com"
                      {...register("email")}
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="con-phone">Phone</Label>
                    <Input
                      id="con-phone"
                      type="tel"
                      placeholder="+1 555 000 0000"
                      {...register("phone")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="con-subject">Subject</Label>
                    <Input
                      id="con-subject"
                      placeholder="Test drive enquiry"
                      {...register("subject")}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="con-message">Message <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="con-message"
                    rows={6}
                    placeholder="Tell us how we can help…"
                    {...register("message")}
                    aria-invalid={!!errors.message}
                  />
                  {errors.message && (
                    <p className="text-xs text-red-500">{errors.message.message}</p>
                  )}
                </div>
                <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Send message
                    </>
                  )}
                </Button>
              </form>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="glass-surface rounded-3xl p-6 md:p-8">
              <h2 className="text-title text-foreground">Abdullah Motors HQ</h2>
              <ul className="mt-6 space-y-5 text-sm">
                <InfoRow
                  icon={MapPin}
                  label="Address"
                  value={siteConfig.contact.address || "Showroom location to be confirmed"}
                />
                <InfoRow
                  icon={Phone}
                  label="Phone"
                  value={siteConfig.contact.phone || "Contact number to be confirmed"}
                />
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={siteConfig.contact.email || "Email address to be confirmed"}
                />
                <InfoRow
                  icon={Clock}
                  label="Hours"
                  value={siteConfig.contact.hours || "Please contact us for current hours"}
                />
              </ul>
            </div>

            {siteConfig.contact.address ? (
              <div className="glass-surface overflow-hidden rounded-3xl">
                <iframe
                  title={`Map to ${siteConfig.name}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(siteConfig.contact.address)}&output=embed`}
                  className="aspect-video w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="p-4">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteConfig.contact.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Open directions in Google Maps
                  </a>
                </div>
              </div>
            ) : (
              <div className="glass-surface flex aspect-video flex-col items-center justify-center rounded-3xl p-6 text-center">
                <MapPin className="h-8 w-8 text-primary" aria-hidden="true" />
                <p className="mt-3 font-medium text-foreground">Showroom map unavailable</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Add the verified showroom address in the site configuration to enable directions.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <li className="flex gap-4">
      <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-caption uppercase text-muted-foreground">{label}</p>
        <p className="whitespace-pre-line text-foreground">{value}</p>
      </div>
    </li>
  );
}

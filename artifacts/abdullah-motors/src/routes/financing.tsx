import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Calculator, CheckCircle2, ShieldCheck, Zap, Percent, Send, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { submitFinanceApplication } from "@/lib/queries";
import { formatPrice } from "@/lib/site-config";

export const Route = createFileRoute("/financing")({
  head: () => ({
    meta: [
      { title: "Auto Financing — Abdullah Motors" },
      {
        name: "description",
        content:
          "Flexible auto financing with 12+ prime lenders. Get pre-approved in minutes with no impact to your credit.",
      },
      { property: "og:title", content: "Auto Financing — Abdullah Motors" },
      {
        property: "og:description",
        content: "Flexible auto financing with 12+ prime lenders. Get pre-approved in minutes.",
      },
    ],
  }),
  component: FinancingPage,
});

const banks = [
  "Meridian Bank",
  "Northlake",
  "Vanta Capital",
  "First Bay",
  "Prime Credit",
  "Ascent Finance",
];

const options = [
  {
    icon: Percent,
    title: "Low APR Loans",
    desc: "Rates from 4.9% APR for qualified buyers on 36–84 month terms.",
  },
  {
    icon: Zap,
    title: "Instant Pre-Approval",
    desc: "Soft-pull application, no hit to your credit, decisions in under 60 seconds.",
  },
  {
    icon: ShieldCheck,
    title: "GAP & Extended Warranty",
    desc: "Optional protection bundled into your monthly payment.",
  },
];

function FinancingPage() {
  return (
    <div className="pt-32 pb-24">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <span className="text-caption uppercase text-muted-foreground">Financing</span>
          <h1 className="text-display-lg mt-2 text-foreground">
            Drive today, pay <span className="text-gradient-primary">your way</span>
          </h1>
          <p className="mt-4 text-body text-muted-foreground">
          Share a few details and our team will contact you to discuss vehicle financing options.
          </p>
        </motion.div>

        {/* Options */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {options.map((o, i) => (
            <motion.div
              key={o.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-surface rounded-3xl p-8"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-[var(--shadow-glow)]">
                <o.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-6 text-title text-foreground">{o.title}</h3>
              <p className="mt-2 text-muted-foreground">{o.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Calculator */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 lg:px-8">
        <EMICalculator />
      </section>

      {/* Pre-approval CTA */}
      <section className="mx-auto mt-24 max-w-5xl px-4 sm:px-6 lg:px-8">
        <PreApproveForm />
      </section>

    </div>
  );
}

function EMICalculator() {
  const [price, setPrice] = useState(8000000);
  const [down, setDown] = useState(1600000);
  const [tenure, setTenure] = useState(60);
  const [rate, setRate] = useState(5.9);

  const principal = Math.max(price - down, 0);
  const monthlyRate = rate / 100 / 12;
  const emi =
    monthlyRate === 0
      ? principal / tenure
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
        (Math.pow(1 + monthlyRate, tenure) - 1);
  const totalPayable = emi * tenure + down;
  const totalInterest = emi * tenure - principal;

  const fmt = (n: number) => formatPrice(Math.round(n));

  return (
    <div className="glass-surface overflow-hidden rounded-3xl">
      <div className="grid gap-0 lg:grid-cols-5">
        <div className="p-8 lg:col-span-3">
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-primary" />
            <h2 className="text-heading text-foreground">EMI Calculator</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Estimate your monthly payment. Adjust the sliders to explore.
          </p>

          <div className="mt-8 space-y-6">
            <SliderRow
              label="Vehicle Price"
              value={fmt(price)}
              min={10000}
              max={30000000}
              step={100000}
              current={price}
              onChange={setPrice}
            />
            <SliderRow
              label="Down Payment"
              value={fmt(down)}
              min={0}
              max={price}
              step={50000}
              current={down}
              onChange={setDown}
            />
            <SliderRow
              label="Tenure (months)"
              value={`${tenure} mo`}
              min={12}
              max={84}
              step={12}
              current={tenure}
              onChange={setTenure}
            />
            <SliderRow
              label="Interest Rate"
              value={`${rate.toFixed(1)}%`}
              min={2}
              max={15}
              step={0.1}
              current={rate}
              onChange={setRate}
            />
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-primary p-8 text-primary-foreground lg:col-span-2">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,#fff2,transparent_50%)]" />
          <div className="relative">
            <p className="text-caption uppercase opacity-80">Estimated monthly</p>
            <p className="mt-2 font-display text-5xl font-bold">{fmt(emi)}</p>
            <p className="mt-1 text-sm opacity-80">per month for {tenure} months</p>

            <dl className="mt-8 space-y-3 text-sm">
              <Row label="Loan amount" value={fmt(principal)} />
              <Row label="Total interest" value={fmt(totalInterest)} />
              <Row label="Total payable" value={fmt(totalPayable)} />
            </dl>

            <Button
              size="lg"
              variant="glass"
              className="mt-8 w-full"
              onClick={() => document.getElementById("finance-application-name")?.focus()}
            >
              Get pre-approved
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label className="text-sm text-muted-foreground">{label}</Label>
        <span className="font-display text-lg font-semibold text-foreground">{value}</span>
      </div>
      <Slider
        className="mt-3"
        min={min}
        max={max}
        step={step}
        value={[current]}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-white/20 pt-3">
      <dt className="opacity-80">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

const financeApplicationSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a valid phone number."),
  annual_income: z.number().positive("Enter an amount greater than zero."),
  requested_amount: z.number().positive("Enter an amount greater than zero."),
});

type FinanceApplicationValues = z.infer<typeof financeApplicationSchema>;

function PreApproveForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FinanceApplicationValues>({
    resolver: zodResolver(financeApplicationSchema),
  });

  const onSubmit = async (values: FinanceApplicationValues) => {
    setError("");
    try {
      await submitFinanceApplication(values);
      reset();
      setSent(true);
    } catch {
      setError("We couldn't submit your request. Please try again or contact our team.");
    }
  };

  return (
    <div className="glass-surface rounded-3xl p-6 md:p-10">
      <div className="max-w-xl">
        <h2 id="finance-application-name" className="text-display-md text-foreground">
          Request a finance consultation
        </h2>
        <p className="mt-2 text-muted-foreground">
          Your details are shared only with our dealership team so we can follow up about your request.
        </p>
      </div>
      {sent ? (
        <div role="status" className="mt-8 flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold text-foreground">Request received</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Our team will review your details and contact you. This is not a credit decision.
            </p>
          </div>
        </div>
      ) : (
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-5 sm:grid-cols-2" noValidate>
        <div className="space-y-2">
          <Label htmlFor="pa-name">Full name</Label>
          <Input id="pa-name" autoComplete="name" {...register("full_name")} aria-invalid={!!errors.full_name} />
          {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="pa-email">Email</Label>
          <Input id="pa-email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="pa-phone">Phone</Label>
          <Input id="pa-phone" type="tel" autoComplete="tel" {...register("phone")} aria-invalid={!!errors.phone} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="pa-income">Annual income</Label>
          <Input id="pa-income" type="number" min="1" step="1" inputMode="decimal" {...register("annual_income", { valueAsNumber: true })} aria-invalid={!!errors.annual_income} />
          {errors.annual_income && <p className="text-xs text-destructive">{errors.annual_income.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="pa-loan">Requested finance amount</Label>
          <Input id="pa-loan" type="number" min="1" step="1" inputMode="decimal" {...register("requested_amount", { valueAsNumber: true })} aria-invalid={!!errors.requested_amount} />
          {errors.requested_amount && <p className="text-xs text-destructive">{errors.requested_amount.message}</p>}
        </div>
        <div className="sm:col-span-2">
          {error && <p className="mb-3 text-sm text-destructive" role="alert">{error}</p>}
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending request
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Request a call
              </>
            )}
          </Button>
        </div>
      </form>
      )}
    </div>
  );
}

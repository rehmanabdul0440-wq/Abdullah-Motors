import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedCounter } from "@/components/animated-counter";
import { TiltCard } from "@/components/effects/tilt-card";
import { Magnetic } from "@/components/effects/magnetic";
import { GlowDivider } from "@/components/effects/glow-divider";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ArrowRight,
  Search,
  Star,
  ShieldCheck,
  Award,
  Users,
  Wrench,
  Car,
  Zap,
  Crown,
  Fuel,
  GaugeCircle,
  Cog,
  BadgeCheck,
  Wallet,
  HeartHandshake,
  ChevronLeft,
  ChevronRight,
  Mail,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import heroCar from "@/assets/hero-car.jpg";
import heroVideo from "@/assets/backGroundcar.mp4.asset.json";
import { BackgroundVideo } from "@/components/effects/background-video";
import car1 from "@/assets/car-1.jpg";
import car2 from "@/assets/car-2.jpg";
import car3 from "@/assets/car-3.jpg";
import car4 from "@/assets/car-4.jpg";
import car5 from "@/assets/car-5.jpg";
import car6 from "@/assets/car-6.jpg";

import { useQuery } from "@tanstack/react-query";
import {
  fetchFeaturedCars,
  fetchRecentCars,
  fetchApprovedTestimonials,
  type CarRow,
  type TestimonialRow,
} from "@/lib/queries";
import { CarGridSkeleton } from "@/components/skeletons/car-skeletons";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

// ---------- Mock data ----------
const trustStats = [
  { icon: Car, value: "500+", label: "Cars Sold" },
  { icon: Star, value: "4.9★", label: "Customer Rating" },
  { icon: Award, value: "10+", label: "Years Experience" },
  { icon: ShieldCheck, value: "100%", label: "Certified Inspections" },
];

const categories = [
  { icon: Car, label: "SUV" },
  { icon: Car, label: "Sedan" },
  { icon: Car, label: "Hatchback" },
  { icon: Zap, label: "Electric" },
  { icon: Crown, label: "Luxury" },
];

type CarItem = {
  id: string;
  slug?: string;
  title: string;
  year: number;
  price: string;
  fuel: string;
  transmission: string;
  mileage: string;
  image: string;
  badge?: "featured" | "new" | "certified";
};

const featuredCars: CarItem[] = [
  {
    id: "1",
    title: "Aurora GT Coupe",
    year: 2024,
    price: "$142,900",
    fuel: "Petrol",
    transmission: "Auto",
    mileage: "3,200 mi",
    image: heroCar,
    badge: "featured",
  },
  {
    id: "2",
    title: "Nova E-Sedan Long Range",
    year: 2024,
    price: "$78,500",
    fuel: "Electric",
    transmission: "Auto",
    mileage: "1,800 mi",
    image: car1,
    badge: "featured",
  },
  {
    id: "3",
    title: "Titan Range SUV",
    year: 2023,
    price: "$96,000",
    fuel: "Hybrid",
    transmission: "Auto",
    mileage: "8,400 mi",
    image: car2,
    badge: "featured",
  },
  {
    id: "4",
    title: "Vortex R Sport",
    year: 2024,
    price: "$118,750",
    fuel: "Petrol",
    transmission: "Manual",
    mileage: "2,100 mi",
    image: car3,
    badge: "featured",
  },
  {
    id: "5",
    title: "Meridian Executive",
    year: 2023,
    price: "$64,200",
    fuel: "Petrol",
    transmission: "Auto",
    mileage: "12,000 mi",
    image: car4,
    badge: "featured",
  },
  {
    id: "6",
    title: "Pulse EV Hatch",
    year: 2024,
    price: "$42,900",
    fuel: "Electric",
    transmission: "Auto",
    mileage: "900 mi",
    image: car5,
    badge: "featured",
  },
];

const recentCars: CarItem[] = [
  {
    id: "7",
    title: "Solstice GT Roadster",
    year: 2024,
    price: "$156,000",
    fuel: "Petrol",
    transmission: "Auto",
    mileage: "450 mi",
    image: car6,
    badge: "new",
  },
  {
    id: "8",
    title: "Aurora E-Cross",
    year: 2024,
    price: "$88,900",
    fuel: "Electric",
    transmission: "Auto",
    mileage: "220 mi",
    image: car1,
    badge: "new",
  },
  {
    id: "9",
    title: "Onyx Luxury SUV",
    year: 2024,
    price: "$104,500",
    fuel: "Hybrid",
    transmission: "Auto",
    mileage: "600 mi",
    image: car2,
    badge: "new",
  },
  {
    id: "10",
    title: "Crimson R Coupe",
    year: 2024,
    price: "$132,000",
    fuel: "Petrol",
    transmission: "Auto",
    mileage: "310 mi",
    image: car3,
    badge: "new",
  },
  {
    id: "11",
    title: "Silverline Executive",
    year: 2024,
    price: "$71,900",
    fuel: "Petrol",
    transmission: "Auto",
    mileage: "1,100 mi",
    image: car4,
    badge: "certified",
  },
  {
    id: "12",
    title: "Volt City EV",
    year: 2024,
    price: "$38,500",
    fuel: "Electric",
    transmission: "Auto",
    mileage: "180 mi",
    image: car5,
    badge: "new",
  },
];

const features = [
  {
    icon: BadgeCheck,
    title: "Certified Quality",
    desc: "Every vehicle passes a 200-point multi-technician inspection.",
  },
  {
    icon: Wallet,
    title: "Transparent Pricing",
    desc: "No hidden fees. Clear breakdowns on every listing.",
  },
  {
    icon: HeartHandshake,
    title: "Easy Financing",
    desc: "Get pre-approved in minutes with flexible monthly plans.",
  },
  {
    icon: Wrench,
    title: "After-Sales Support",
    desc: "Concierge service, extended warranty, and priority servicing.",
  },
];

const testimonials = [
  {
    name: "Marcus L.",
    role: "Verified buyer",
    rating: 5,
    quote:
      "The entire experience felt like the future — from browsing to delivery. My GT arrived spotless.",
  },
  {
    name: "Priya S.",
    role: "Verified buyer",
    rating: 5,
    quote: "Transparent pricing, zero pressure. The concierge test drive at my office sealed it.",
  },
  {
    name: "Daniel K.",
    role: "Verified buyer",
    rating: 5,
    quote:
      "Financing was painless and the after-sales team actually picks up the phone. Rare these days.",
  },
  {
    name: "Elena R.",
    role: "Verified buyer",
    rating: 5,
    quote: "Aurora made buying my first EV effortless. The digital tour was next level.",
  },
];

// ---------- Helpers ----------
function primaryImage(car: CarRow): string {
  const primary = car.car_images?.find((i) => i.is_primary);
  const first = car.car_images?.[0];
  return primary?.image_url ?? first?.image_url ?? heroCar;
}

function carToItem(car: CarRow): CarItem {
  return {
    id: car.id,
    slug: car.slug,
    title: car.title,
    year: car.year,
    price: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(car.price),
    fuel: car.fuel_type.charAt(0).toUpperCase() + car.fuel_type.slice(1),
    transmission: car.transmission === "automatic" ? "Auto" : "Manual",
    mileage: car.mileage.toLocaleString() + " mi",
    image: primaryImage(car),
    badge: car.is_featured
      ? "featured"
      : car.condition === "new"
        ? "new"
        : car.condition === "certified"
          ? "certified"
          : undefined,
  };
}

// ---------- Sections ----------
function Index() {
  const featuredQ = useQuery({
    queryKey: ["home", "featured-cars"],
    queryFn: () => fetchFeaturedCars(6),
  });
  const recentQ = useQuery({
    queryKey: ["home", "recent-cars"],
    queryFn: () => fetchRecentCars(6),
  });
  const testimonialsQ = useQuery({
    queryKey: ["home", "testimonials"],
    queryFn: () => fetchApprovedTestimonials(8),
  });

  const featuredItems = (featuredQ.data ?? []).map(carToItem);
  const recentItems = (recentQ.data ?? []).map(carToItem);

  return (
    <div className="relative">
      <Hero />
      <TrustStrip />
      <CategoriesSection />
      <GlowDivider />
      <CarGrid
        title="Featured Cars"
        subtitle="Hand-picked by our specialists"
        cars={featuredItems}
        isLoading={featuredQ.isLoading}
        isError={featuredQ.isError}
      />
      <GlowDivider />
      <WhyChooseUs />
      <GlowDivider />
      <CarGrid
        title="Just Arrived"
        subtitle="Recently added to our inventory"
        cars={recentItems}
        isLoading={recentQ.isLoading}
        isError={recentQ.isError}
      />
      <GlowDivider />
      <Testimonials
        data={testimonialsQ.data ?? null}
        isLoading={testimonialsQ.isLoading}
        isError={testimonialsQ.isError}
      />
      <FinancingBanner />
      <NewsletterCTA />
    </div>
  );
}

// ---------- Hero ----------
function Hero() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  // Background video is handled by BackgroundVideo component

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
      {/* Background video with slow Ken Burns zoom */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1.18 }}
          transition={{ duration: 24, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
        >
          <BackgroundVideo />
        </motion.div>
        {/* Bottom-to-top dark gradient for legibility — lighter so video shows through */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/20 to-transparent" />
      </div>

      {/* Animated gradient glow behind headline */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-70 blur-3xl"
        animate={{
          background: [
            "radial-gradient(circle at 30% 40%, oklch(0.62 0.22 295 / 0.5), transparent 60%)",
            "radial-gradient(circle at 70% 60%, oklch(0.66 0.19 265 / 0.5), transparent 60%)",
            "radial-gradient(circle at 30% 40%, oklch(0.62 0.22 295 / 0.5), transparent 60%)",
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Badge variant="featured" className="mb-6">
            <Sparkles className="h-3 w-3" />
            New 2024 arrivals
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
          className="text-display-xl max-w-3xl"
        >
          Find Your <span className="text-gradient-primary">Next Drive</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: "easeOut" }}
          className="mt-6 max-w-xl text-body text-muted-foreground"
        >
          Curated luxury, electric, and performance vehicles. Delivered with concierge test drives
          and a fully digital buying experience.
        </motion.p>

        {/* Search bar */}
          <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
           onSubmit={(e) => {
             e.preventDefault();
             navigate({ to: "/cars" });
           }}
          className="glass-surface mt-10 flex max-w-2xl items-center gap-2 rounded-full p-2"
        >
          <div className="flex flex-1 items-center gap-3 px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by brand, model, or keyword…"
              className="w-full bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button type="submit" size="default">
            Search
          </Button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85, ease: "easeOut" }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
           <Magnetic>
             <Button size="lg" asChild>
               <Link to="/cars">
                 Browse Cars
                 <ArrowRight className="h-4 w-4" />
               </Link>
             </Button>
           </Magnetic>
           <Magnetic>
             <Button size="lg" variant="glass" asChild>
               <Link to="/contact">Book Test Drive</Link>
             </Button>
           </Magnetic>
        </motion.div>
      </div>
    </section>
  );
}

// ---------- Trust Strip ----------
function TrustStrip() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const blobY = useTransform(scrollYProgress, [0, 1], [-20, 20]);
  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-y border-border bg-surface/40 py-12"
    >
      <motion.div
        aria-hidden
        style={{ y: blobY }}
        className="pointer-events-none absolute inset-x-0 -top-24 h-64 opacity-40 blur-3xl"
      >
        <div className="mx-auto h-full w-3/4 bg-[radial-gradient(50%_60%_at_50%_50%,color-mix(in_oklab,var(--primary)_28%,transparent),transparent_70%)]" />
      </motion.div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {trustStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary/10 text-primary ring-1 ring-border">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-2xl font-semibold text-foreground">
                    <AnimatedCounter value={stat.value} />
                  </div>
                  <div className="text-body-sm text-muted-foreground">{stat.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- Section wrapper ----------
function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <div className="mb-3 text-caption uppercase tracking-widest text-primary">{eyebrow}</div>
        )}
        <h2 className="text-display-md">{title}</h2>
        {subtitle && <p className="mt-2 text-body text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

// ---------- Categories ----------
function CategoriesSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Explore"
          title="Browse by Category"
          subtitle="Find the shape that fits your life."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className="glass-surface group flex flex-col items-center gap-3 rounded-2xl px-4 py-8 text-center transition-all duration-300 hover:border-white/20 hover:shadow-[var(--shadow-glow)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary/10 text-primary ring-1 ring-border transition-all duration-300 group-hover:bg-gradient-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-body-sm font-medium text-foreground">{cat.label}</div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- Car Card + Grid ----------
function CarCard({ car }: { car: CarItem }) {
  return (
    <TiltCard className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-xl transition-shadow duration-300 hover:shadow-[var(--shadow-glow)]">
      <Link to="/cars/$id" params={{ id: car.slug ?? car.id }} className="flex h-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-surface">
          <img
            src={car.image}
            alt={car.title}
            loading="lazy"
            width={1200}
            height={800}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {car.badge && (
            <div className="absolute left-3 top-3">
              <Badge variant={car.badge}>
                {car.badge === "featured" && "Featured"}
                {car.badge === "new" && "New"}
                {car.badge === "certified" && "Certified"}
              </Badge>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card to-transparent" />
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-title text-foreground">{car.title}</h3>
              <div className="text-body-sm text-muted-foreground">{car.year}</div>
            </div>
            <div className="text-title text-gradient-primary">{car.price}</div>
          </div>

          <div className="flex items-center gap-4 border-t border-border pt-4 text-caption text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5" />
              {car.fuel}
            </span>
            <span className="flex items-center gap-1.5">
              <Cog className="h-3.5 w-3.5" />
              {car.transmission}
            </span>
            <span className="flex items-center gap-1.5">
              <GaugeCircle className="h-3.5 w-3.5" />
              {car.mileage}
            </span>
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}

function CarGrid({
  title,
  subtitle,
  cars,
  isLoading,
  isError,
}: {
  title: string;
  subtitle?: string;
  cars: CarItem[];
  isLoading?: boolean;
  isError?: boolean;
}) {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title={title} subtitle={subtitle} />
        {isLoading ? (
          <CarGridSkeleton count={6} />
        ) : isError ? (
          <div className="glass-surface rounded-2xl p-10 text-center">
            <p className="text-body text-muted-foreground">
              We couldn't load this part of the collection. Please try again shortly.
            </p>
          </div>
        ) : cars.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No cars available right now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car, i) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              >
                <CarCard car={car} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------- Why Choose Us ----------
function WhyChooseUs() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const blobY = useTransform(scrollYProgress, [0, 1], [-40, 40]);
  return (
    <section ref={ref} className="relative overflow-hidden py-24">
      <motion.div aria-hidden style={{ y: blobY }} className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 40% at 50% 0%, oklch(0.62 0.22 295 / 0.12), transparent 70%)",
          }}
        />
      </motion.div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Why Abdullah"
          title="Built around your drive"
          subtitle="Everything we do is designed for calm, confident car ownership."
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="glass-surface rounded-2xl p-6"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-title text-foreground">{f.title}</h3>
                <p className="mt-2 text-body-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- Testimonials ----------
function Testimonials({
  data,
  isLoading,
  isError,
}: {
  data: TestimonialRow[] | null;
  isLoading: boolean;
  isError?: boolean;
}) {
  const items = data ?? [];
  const [index, setIndex] = useState(0);
  const total = items.length;

  useEffect(() => {
    if (total === 0) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % total), 6000);
    return () => clearInterval(t);
  }, [total]);

  const go = (dir: number) => setIndex((i) => (i + dir + total) % total);

  if (isLoading) {
    return (
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Testimonials" title="Loved by drivers" />
          <div className="glass-surface mx-auto max-w-3xl animate-pulse rounded-2xl p-8 sm:p-10">
            <div className="h-4 w-24 rounded-full bg-surface/60" />
            <div className="mt-6 h-20 rounded-lg bg-surface/60" />
            <div className="mt-8 flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-surface/60" />
              <div className="space-y-2">
                <div className="h-3 w-32 rounded bg-surface/60" />
                <div className="h-3 w-24 rounded bg-surface/60" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Testimonials" title="Loved by drivers" />
          <div className="glass-surface mx-auto max-w-3xl rounded-2xl p-10 text-center">
            <p className="text-body text-muted-foreground">
              Customer stories are temporarily unavailable. Please check back shortly.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Testimonials" title="Loved by drivers" />
          <div className="glass-surface mx-auto max-w-3xl rounded-2xl p-10 text-center">
            <p className="text-body text-muted-foreground">
              Our customer stories are being curated. Be the first to share your Abdullah Motors
              experience.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Testimonials" title="Loved by drivers" />

        <div className="relative">
          <div className="overflow-hidden rounded-2xl">
            <motion.div
              className="flex"
              animate={{ x: `-${index * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
            >
              {items.map((t, idx) => {
                const name = t.customer_name;
                const role = "Verified buyer";
                const quote = t.message;
                const rating = t.rating;
                const avatar = t.avatar_url;
                return (
                  <div key={idx} className="w-full shrink-0 px-1">
                    <div className="glass-surface mx-auto max-w-3xl rounded-2xl p-8 sm:p-10">
                      <div className="flex items-center gap-1 text-gold">
                        {Array.from({ length: rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <p className="mt-6 text-body sm:text-title text-foreground">"{quote}"</p>
                      <div className="mt-8 flex items-center gap-3">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={name}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">
                            {name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="text-body-sm font-semibold text-foreground">{name}</div>
                          <div className="text-caption text-muted-foreground">{role}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => go(-1)}
              aria-label="Previous testimonial"
              className="glass-surface flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:border-white/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? "w-6 bg-gradient-primary" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => go(1)}
              aria-label="Next testimonial"
              className="glass-surface flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:border-white/20"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Financing Banner ----------
function FinancingBanner() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-border"
        >
          <div className="absolute inset-0 bg-gradient-primary opacity-90" />
          <div
            aria-hidden
            className="absolute -inset-24 opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 20% 30%, oklch(0.78 0.14 85 / 0.5), transparent 60%), radial-gradient(circle at 80% 70%, oklch(0.99 0 0 / 0.15), transparent 60%)",
            }}
          />
          <div className="relative flex flex-col items-start justify-between gap-6 p-8 sm:p-12 md:flex-row md:items-center">
            <div className="max-w-xl text-primary-foreground">
              <Users className="mb-3 h-6 w-6 opacity-80" />
              <h3 className="text-display-md">Flexible financing available</h3>
              <p className="mt-2 text-body opacity-90">
                Get pre-approved in minutes with transparent monthly plans tailored to you.
              </p>
            </div>
            <Button variant="gold" size="lg">
              Explore financing
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ---------- Newsletter ----------
function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
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
        // Duplicate — be friendly
        setStatus("success");
      } else {
        setErrorMsg("Something went wrong. Please try again.");
        setStatus("error");
      }
    } else {
      setStatus("success");
    }
  };

  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-display-md"
        >
          Stay in the <span className="text-gradient-primary">fast lane</span>
        </motion.h2>
        <p className="mt-3 text-body text-muted-foreground">
          New arrivals, exclusive test drives, and financing offers — straight to your inbox.
        </p>

        {status === "success" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-3"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow-strong)]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="text-title text-foreground">You're in the fast lane!</p>
            <p className="text-body-sm text-muted-foreground">We'll notify you of new arrivals and exclusive previews.</p>
          </motion.div>
        ) : (
          <form
            onSubmit={handleSubscribe}
            className="glass-surface mx-auto mt-8 flex max-w-lg items-center gap-2 rounded-full p-2"
          >
            <div className="flex flex-1 items-center gap-3 px-4">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                id="newsletter-email-home"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg("");
                  setStatus("idle");
                }}
                placeholder="you@example.com"
                className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:shadow-none"
                disabled={status === "submitting"}
              />
            </div>
            <Button type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Subscribe"
              )}
            </Button>
          </form>
        )}

        {errorMsg && (
          <p className="mt-2 text-xs text-red-500">{errorMsg}</p>
        )}
        <p className="mt-3 text-caption text-muted-foreground">No spam. Unsubscribe any time.</p>
      </div>
    </section>
  );
}

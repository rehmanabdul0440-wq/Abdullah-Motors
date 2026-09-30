import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CarDetailsSkeleton } from "@/components/skeletons/car-skeletons";
import { useTouchDevice } from "@/hooks/use-touch-device";
import { useQuery } from "@tanstack/react-query";
import { fetchCarBySlug, fetchRecentCars, incrementCarViews } from "@/lib/queries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronLeft,
  Fuel,
  Cog,
  Gauge,
  Cpu,
  Users,
  Palette,
  Sparkles,
  Phone,
  Mail,
  Share2,
  Facebook,
  Twitter,
  Link as LinkIcon,
  X,
  Check,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import car1 from "@/assets/car-1.jpg";
import car2 from "@/assets/car-2.jpg";
import car3 from "@/assets/car-3.jpg";
import car4 from "@/assets/car-4.jpg";
import car5 from "@/assets/car-5.jpg";
import car6 from "@/assets/car-6.jpg";
import heroCar from "@/assets/hero-car.jpg";

// ---------- Mock data ----------
type CarDetail = {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  bodyType: string;
  condition: "New" | "Used" | "Certified";
  images: string[];
  specs: {
    fuel: string;
    transmission: string;
    mileage: string;
    engine: string;
    seating: string;
    color: string;
  };
  description: string;
  features: string[];
};

type RelatedCarItem = {
  id: string;
  slug: string;
  title: string;
  year: number;
  price: number;
  image: string;
  badge: "new" | "certified" | "featured";
  bodyType: string;
};

const MOCK_CAR: CarDetail = {
  id: "1",
  title: "Aurora GT Coupe",
  brand: "Aurora",
  model: "GT Coupe",
  year: 2024,
  price: 142900,
  bodyType: "Coupe",
  condition: "New",
  images: [heroCar, car1, car2, car3, car4, car5],
  specs: {
    fuel: "Petrol",
    transmission: "8-Speed Auto",
    mileage: "3,200 mi",
    engine: "4.0L V8 Twin-Turbo",
    seating: "2+2",
    color: "Nebula Silver",
  },
  description:
    "The Aurora GT Coupe is a statement of intent — a hand-assembled grand tourer engineered around a carbon-fibre monocoque and a twin-turbo V8 that delivers 612 horsepower to the rear wheels. Every surface, from the milled aluminium switchgear to the Nappa leather cockpit, has been considered for the driver. It's built for long, effortless miles and short, unforgettable ones.",
  features: [
    "Panoramic Sunroof",
    "Nappa Leather Seats",
    "Heated & Ventilated Seats",
    "Adaptive Cruise Control",
    "360° Camera",
    "Bose Premium Audio",
    "Wireless CarPlay",
    "Head-Up Display",
    "Launch Control",
    "Carbon Ceramic Brakes",
    "ABS + ESC",
    "Ambient Lighting",
  ],
};

// ---------- Route ----------
export const Route = createFileRoute("/cars/$id")({
  loader: ({ params }) => {
    if (!params.id) throw notFound();
    return { slug: params.id };
  },
  head: () => ({
    meta: [
      { title: "Car Details — Abdullah Motors" },
      {
        name: "description",
        content: "View full specs, images, and book a test drive at Abdullah Motors.",
      },
    ],
  }),
  component: CarDetailPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-32 text-center">
      <h1 className="text-display-md">Car not found</h1>
      <p className="mt-3 text-muted-foreground">This vehicle isn't in the current inventory.</p>
      <Link to="/cars" className="mt-6 inline-block">
        <Button>Browse all cars</Button>
      </Link>
    </div>
  ),
  errorComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-32 text-center">
      <h1 className="text-display-md">Something went wrong</h1>
      <p className="mt-3 text-muted-foreground">Please try again in a moment.</p>
    </div>
  ),
});

// ---------- Helpers ----------
const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

function CarDetailPage() {
  const { slug } = Route.useLoaderData() as { slug: string };

  const {
    data: carRow,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["car", slug],
    queryFn: () => fetchCarBySlug(slug),
    retry: 1,
  });

  const { data: relatedRows } = useQuery({
    queryKey: ["home", "recent-cars"],
    queryFn: () => fetchRecentCars(4),
  });

  // Increment views_count once on mount (fire-and-forget)
  useEffect(() => {
    if (carRow?.id) {
      void incrementCarViews(carRow.id);
    }
  }, [carRow?.id]);

  // Build display shape from Supabase row
  const car: CarDetail | null = useMemo(() => {
    if (!carRow) return null;
    return {
      id: carRow.id,
      title: carRow.title,
      brand: carRow.brands?.name ?? "",
      model: carRow.models?.name ?? "",
      year: carRow.year,
      price: carRow.price,
      bodyType: carRow.categories?.name ?? "",
      condition:
        carRow.condition === "certified"
          ? "Certified"
          : carRow.condition === "used"
            ? "Used"
            : "New",
      images: [
        ...carRow.car_images.sort((a, b) => a.sort_order - b.sort_order).map((i) => i.image_url),
      ],
      specs: {
        fuel: carRow.fuel_type.charAt(0).toUpperCase() + carRow.fuel_type.slice(1),
        transmission: carRow.transmission === "automatic" ? "Automatic" : "Manual",
        mileage: carRow.mileage.toLocaleString() + " mi",
        engine: carRow.engine ?? "N/A",
        seating: carRow.seating_capacity ? String(carRow.seating_capacity) : "N/A",
        color: carRow.color ?? "N/A",
      },
      description: carRow.description ?? "",
      features: Array.isArray(carRow.features) ? (carRow.features as string[]) : [],
    };
  }, [carRow]);

  // Map related cars
  const RELATED = (relatedRows ?? [])
    .filter((r) => r.id !== carRow?.id)
    .slice(0, 4)
    .map((r) => {
      const imgs = r.car_images ?? [];
      const primary = imgs.find((i) => i.is_primary) ?? imgs[0];
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        year: r.year,
        price: r.price,
        image: primary?.image_url ?? heroCar,
        badge: r.is_featured
          ? ("featured" as const)
          : r.condition === "certified"
            ? ("certified" as const)
            : ("new" as const),
        bodyType: r.categories?.name ?? "",
      };
    });

  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [testDriveOpen, setTestDriveOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const [galleryOut, setGalleryOut] = useState(false);
  const isTouch = useTouchDevice();
  const [zoom, setZoom] = useState<{ x: number; y: number; on: boolean }>({
    x: 50,
    y: 50,
    on: false,
  });

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setGalleryOut(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [car]);

  if (isLoading) return <CarDetailsSkeleton />;
  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="text-display-md">Vehicle details unavailable</h1>
        <p className="mt-3 text-muted-foreground">
          We couldn't reach the inventory service. Please try again shortly.
        </p>
        <Button className="mt-6" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }
  if (car === null) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="text-display-md">Car not found</h1>
        <p className="mt-3 text-muted-foreground">This vehicle isn't in our inventory.</p>
        <Link to="/cars" className="mt-6 inline-block">
          <Button>Browse all cars</Button>
        </Link>
      </div>
    );
  }

  const images = car.images.length > 0 ? car.images : [heroCar];

  return (
    <div className="relative pb-32">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_70%)]" />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-caption text-muted-foreground"
        >
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/cars" className="hover:text-foreground">
            Cars
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{car.title}</span>
        </nav>
      </div>

      {/* Gallery */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div
          ref={galleryRef}
          className="relative overflow-hidden rounded-3xl border border-border bg-surface/50"
        >
          <div className="relative aspect-[16/9] w-full">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeIdx}
                src={images[activeIdx]}
                alt={`${car.title} — view ${activeIdx + 1}`}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: zoom.on && !isTouch ? 1.6 : 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{
                  opacity: { duration: 0.45 },
                  scale: { type: "spring", stiffness: 180, damping: 26 },
                }}
                style={
                  zoom.on && !isTouch
                    ? { transformOrigin: `${zoom.x}% ${zoom.y}%` }
                    : { transformOrigin: "center center" }
                }
                onPointerMove={(e) => {
                  if (isTouch) return;
                  const r = (e.currentTarget as HTMLImageElement).getBoundingClientRect();
                  setZoom({
                    x: ((e.clientX - r.left) / r.width) * 100,
                    y: ((e.clientY - r.top) / r.height) * 100,
                    on: true,
                  });
                }}
                onPointerLeave={() => setZoom((z) => ({ ...z, on: false }))}
                className="absolute inset-0 h-full w-full cursor-zoom-in object-cover will-change-transform"
                onClick={() => setLightbox(activeIdx)}
              />
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute left-4 top-4">
              <Badge variant="featured">Featured</Badge>
            </div>
            {/* Prev / Next */}
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => setActiveIdx((i) => (i - 1 + images.length) % images.length)}
              className="glass-surface absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-2.5 text-foreground transition hover:scale-105"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => setActiveIdx((i) => (i + 1) % images.length)}
              className="glass-surface absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2.5 text-foreground transition hover:scale-105"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={cn(
                "relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border transition",
                i === activeIdx
                  ? "border-primary shadow-[var(--shadow-glow)]"
                  : "border-border opacity-70 hover:opacity-100",
              )}
              aria-label={`Show image ${i + 1}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </section>

      {/* Two-column info */}
      <section className="mx-auto mt-12 grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        {/* LEFT */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-caption uppercase tracking-widest text-muted-foreground">
            <span>{car.brand}</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
            <span>{car.year}</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
            <span>{car.condition}</span>
          </div>
          <h1 className="mt-3 text-display-lg">
            {car.title.split(" ")[0]}{" "}
            <span className="text-gradient-primary">{car.title.split(" ").slice(1).join(" ")}</span>
          </h1>

          {/* Spec grid */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SpecCard icon={<Fuel className="h-4 w-4" />} label="Fuel" value={car.specs.fuel} />
            <SpecCard
              icon={<Cog className="h-4 w-4" />}
              label="Transmission"
              value={car.specs.transmission}
            />
            <SpecCard
              icon={<Gauge className="h-4 w-4" />}
              label="Mileage"
              value={car.specs.mileage}
            />
            <SpecCard icon={<Cpu className="h-4 w-4" />} label="Engine" value={car.specs.engine} />
            <SpecCard
              icon={<Users className="h-4 w-4" />}
              label="Seating"
              value={car.specs.seating}
            />
            <SpecCard
              icon={<Palette className="h-4 w-4" />}
              label="Color"
              value={car.specs.color}
            />
          </div>

          {/* Description */}
          <div className="mt-12">
            <h2 className="text-heading">Overview</h2>
            <p className="mt-4 text-body text-muted-foreground">{car.description}</p>
          </div>

          {/* Features */}
          <div className="mt-12">
            <h2 className="text-heading">Features & Equipment</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {car.features.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-2 text-body-sm text-foreground/90 transition hover:border-white/20"
                >
                  <Check className="h-3.5 w-3.5 text-primary" />
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT sticky */}
        <aside>
          <div className="lg:sticky lg:top-24">
            <div className="glass-surface rounded-2xl p-6">
              <div className="text-caption uppercase tracking-widest text-muted-foreground">
                Price
              </div>
              <div className="mt-1 text-display-md text-gradient-primary">{fmtUSD(car.price)}</div>
              <div className="mt-1 text-caption text-muted-foreground">
                Inclusive of dealer prep. Registration extra.
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Button size="lg" onClick={() => setTestDriveOpen(true)}>
                  <Calendar className="h-4 w-4" />
                  Book Test Drive
                </Button>
                <Button size="lg" variant="glass" onClick={() => setEnquiryOpen(true)}>
                  <Mail className="h-4 w-4" />
                  Send Enquiry
                </Button>
              </div>

              {/* Dealer */}
              <div className="mt-6 rounded-xl border border-border bg-background/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">
                    AM
                  </div>
                  <div>
                    <div className="text-body-sm font-semibold">Abdullah Motors — Flagship</div>
                    <div className="text-caption text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> 221 Skyline Ave, San Francisco
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-body-sm">
                  <a
                    href="tel:+15550100"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="h-4 w-4" /> +1 (555) 010-0100
                  </a>
                  <a
                    href="mailto:sales@auroramotors.co"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="h-4 w-4" /> sales@auroramotors.co
                  </a>
                </div>
              </div>

              {/* Share */}
              <div className="mt-6">
                <div className="text-caption uppercase tracking-widest text-muted-foreground">
                  Share this car
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <ShareBtn icon={<Twitter className="h-4 w-4" />} label="Share on X" />
                  <ShareBtn icon={<Facebook className="h-4 w-4" />} label="Share on Facebook" />
                  <ShareBtn icon={<Share2 className="h-4 w-4" />} label="Share" />
                  <ShareBtn icon={<LinkIcon className="h-4 w-4" />} label="Copy link" />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* EMI calculator */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <EmiCalculator price={car.price} />
      </section>

      {/* You may also like */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-caption uppercase tracking-widest text-muted-foreground">
              More to explore
            </div>
            <h2 className="mt-2 text-heading">You May Also Like</h2>
          </div>
          <Link to="/cars" className="text-body-sm text-muted-foreground hover:text-foreground">
            View all →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((r) => (
            <RelatedCard key={r.id} car={r} />
          ))}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl"
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setLightbox(null)}
              className="glass-surface absolute right-5 top-5 rounded-full p-2 hover:scale-105"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Previous"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((i) => (i! - 1 + images.length) % images.length);
              }}
              className="glass-surface absolute left-5 top-1/2 -translate-y-1/2 rounded-full p-2.5 hover:scale-105"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((i) => (i! + 1) % images.length);
              }}
              className="glass-surface absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-2.5 hover:scale-105"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <motion.img
              key={lightbox}
              src={images[lightbox]}
              alt=""
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-[var(--shadow-glow-strong)]"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <TestDriveDialog open={testDriveOpen} onOpenChange={setTestDriveOpen} carId={car.id} carTitle={car.title} />
      <EnquiryDialog open={enquiryOpen} onOpenChange={setEnquiryOpen} carId={car.id} carTitle={car.title} />

      {/* Sticky mini-gallery — appears after main gallery scrolls off-screen */}
      <AnimatePresence>
        {galleryOut && (
          <motion.button
            type="button"
            onClick={() =>
              galleryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            aria-label="Jump back to gallery"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="glass-surface fixed bottom-6 left-6 z-40 hidden items-center gap-3 rounded-2xl p-2 pr-4 shadow-[var(--shadow-glow)] hover:border-white/20 md:flex"
          >
            <div className="relative h-14 w-20 overflow-hidden rounded-xl">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeIdx}
                  src={images[activeIdx]}
                  alt=""
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="h-full w-full object-cover"
                />
              </AnimatePresence>
            </div>
            <div className="text-left">
              <div className="text-caption uppercase tracking-widest text-muted-foreground">
                Gallery
              </div>
              <div className="text-body-sm font-semibold text-foreground">
                {activeIdx + 1} / {images.length}
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Subcomponents ----------
function SpecCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4 transition hover:border-white/15 hover:bg-surface/60">
      <div className="flex items-center gap-2 text-caption uppercase tracking-widest text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-body-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function ShareBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="glass-surface flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:scale-105 hover:text-foreground"
    >
      {icon}
    </button>
  );
}

function RelatedCard({ car }: { car: RelatedCarItem }) {
  return (
    <Link to="/cars/$id" params={{ id: car.slug }} className="block">
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="group overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-xl transition-shadow duration-300 hover:shadow-[var(--shadow-glow)]"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-surface">
          <img
            src={car.image}
            alt={car.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3">
            <Badge variant={car.badge}>
              {car.badge === "featured" ? "Featured" : car.badge === "new" ? "New" : "Certified"}
            </Badge>
          </div>
        </div>
        <div className="p-5">
          <div className="text-title">{car.title}</div>
          <div className="text-body-sm text-muted-foreground">
            {car.year} · {car.bodyType}
          </div>
          <div className="mt-3 text-title text-gradient-primary">{fmtUSD(car.price)}</div>
        </div>
      </motion.div>
    </Link>
  );
}

// ---------- EMI Calculator ----------
function EmiCalculator({ price }: { price: number }) {
  const [downPct, setDownPct] = useState(20);
  const [tenure, setTenure] = useState(60); // months
  const [rate, setRate] = useState(6.5); // annual %

  const { down, principal, monthly, total, interest } = useMemo(() => {
    const down = Math.round((price * downPct) / 100);
    const principal = price - down;
    const r = rate / 100 / 12;
    const n = tenure;
    const monthly =
      r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = monthly * n;
    const interest = total - principal;
    return { down, principal, monthly, total, interest };
  }, [price, downPct, tenure, rate]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/40 p-6 sm:p-10">
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
      <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch">
        <div className="flex-1">
          <div className="text-caption uppercase tracking-widest text-muted-foreground">
            Financing
          </div>
          <h2 className="mt-2 text-heading">EMI Calculator</h2>
          <p className="mt-2 max-w-md text-body-sm text-muted-foreground">
            Estimate your monthly payment. Actual rates depend on credit profile and lender terms.
          </p>

          <div className="mt-8 space-y-8">
            <SliderRow label="Down payment" value={`${downPct}% · ${fmtUSD(down)}`}>
              <Slider
                min={5}
                max={60}
                step={1}
                value={[downPct]}
                onValueChange={(v) => setDownPct(v[0])}
              />
            </SliderRow>
            <SliderRow label="Loan tenure" value={`${tenure} months`}>
              <Slider
                min={12}
                max={84}
                step={6}
                value={[tenure]}
                onValueChange={(v) => setTenure(v[0])}
              />
            </SliderRow>
            <SliderRow label="Interest rate" value={`${rate.toFixed(2)}% APR`}>
              <Slider
                min={2}
                max={14}
                step={0.25}
                value={[rate]}
                onValueChange={(v) => setRate(v[0])}
              />
            </SliderRow>
          </div>
        </div>

        <div className="glass-surface flex-1 rounded-2xl p-6">
          <div className="text-caption uppercase tracking-widest text-muted-foreground">
            Estimated monthly
          </div>
          <div className="mt-2 text-display-md text-gradient-primary">
            {fmtUSD(Math.round(monthly))}
          </div>
          <div className="mt-1 text-caption text-muted-foreground">
            per month for {tenure} months
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <MiniStat label="Loan amount" value={fmtUSD(principal)} />
            <MiniStat label="Down payment" value={fmtUSD(down)} />
            <MiniStat label="Total interest" value={fmtUSD(Math.round(interest))} />
            <MiniStat label="Total payable" value={fmtUSD(Math.round(total + down))} />
          </div>

          <Button className="mt-6 w-full" variant="glass">
            <Sparkles className="h-4 w-4" /> Get pre-approved
          </Button>
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-body-sm text-muted-foreground">{label}</span>
        <span className="text-body-sm font-semibold text-foreground">{value}</span>
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="text-caption text-muted-foreground">{label}</div>
      <div className="mt-1 text-body-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

// ---------- Dialogs ----------
// ---------- Dialogs ----------

function SuccessState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-10 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow-strong)]"
      >
        <Check className="h-8 w-8" />
      </motion.div>
      <div className="mt-5 text-title">You're all set</div>
      <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">{message}</p>
    </motion.div>
  );
}

const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(7, "Phone number must be at least 7 digits"),
  date: z.string().min(1, "Preferred date is required"),
  time: z.string().min(1, "Preferred time is required"),
  fax_number_honeypot: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

function TestDriveDialog({
  open,
  onOpenChange,
  carId,
  carTitle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  carId: string;
  carTitle: string;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      date: "",
      time: "",
      fax_number_honeypot: "",
    },
  });

  const onSubmit = async (values: BookingFormValues) => {
    if (values.fax_number_honeypot) {
      // Silently reject spam bots
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        onOpenChange(false);
        reset();
      }, 2000);
      return;
    }

    setStatus("submitting");
    const { error } = await supabase.from("test_drive_bookings").insert([
      {
        car_id: carId,
        name: values.name,
        email: values.email,
        phone: values.phone,
        preferred_date: values.date,
        preferred_time: values.time,
        status: "pending",
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    if (error) {
      toast.error(error.message || "Failed to book test drive");
      setStatus("idle");
    } else {
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        onOpenChange(false);
        reset();
      }, 2000);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setStatus("idle");
          reset();
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="glass-surface max-w-lg border-border">
        {status === "success" ? (
          <SuccessState
            message={`Your test drive request for the ${carTitle} has been received. A specialist will confirm shortly.`}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Book a test drive</DialogTitle>
              <DialogDescription>
                Reserve a slot for the <span className="text-foreground">{carTitle}</span>. No
                commitment required.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              {/* Honeypot field */}
              <input
                type="text"
                {...register("fax_number_honeypot")}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                style={{ display: "none" }}
              />

              <Field label="Full name" htmlFor="td-name" error={errors.name?.message}>
                <Input id="td-name" placeholder="Alex Morgan" {...register("name")} />
              </Field>
              <Field label="Email" htmlFor="td-email" error={errors.email?.message}>
                <Input id="td-email" type="email" placeholder="you@example.com" {...register("email")} />
              </Field>
              <Field label="Phone" htmlFor="td-phone" error={errors.phone?.message}>
                <Input id="td-phone" type="tel" placeholder="+1 (555) 000-0000" {...register("phone")} />
              </Field>
              <Field label="Preferred date" htmlFor="td-date" error={errors.date?.message}>
                <div className="relative">
                  <Input id="td-date" type="date" {...register("date")} />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </Field>
              <Field label="Preferred time" htmlFor="td-time" className="sm:col-span-2" error={errors.time?.message}>
                <div className="relative">
                  <Input id="td-time" type="time" {...register("time")} />
                  <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </Field>
              <DialogFooter className="sm:col-span-2 gap-2 sm:justify-between">
                <Button type="button" variant="glass" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={status === "submitting"}>
                  {status === "submitting" ? "Submitting…" : "Confirm test drive"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

const enquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(7, "Phone number must be at least 7 digits"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  website_honeypot: z.string().optional(),
});

type EnquiryFormValues = z.infer<typeof enquirySchema>;

function EnquiryDialog({
  open,
  onOpenChange,
  carId,
  carTitle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  carId: string;
  carTitle: string;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      website_honeypot: "",
    },
  });

  const onSubmit = async (values: EnquiryFormValues) => {
    if (values.website_honeypot) {
      // Silently reject spam bots
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        onOpenChange(false);
        reset();
      }, 2000);
      return;
    }

    setStatus("submitting");
    const { error } = await supabase.from("enquiries").insert([
      {
        car_id: carId,
        name: values.name,
        email: values.email,
        phone: values.phone,
        message: values.message,
        status: "new",
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    if (error) {
      toast.error(error.message || "Failed to send enquiry");
      setStatus("idle");
    } else {
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        onOpenChange(false);
        reset();
      }, 2000);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setStatus("idle");
          reset();
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="glass-surface max-w-lg border-border">
        {status === "success" ? (
          <SuccessState
            message={`Thanks — we've received your enquiry about the ${carTitle} and will be in touch within one business day.`}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Send an enquiry</DialogTitle>
              <DialogDescription>
                Ask us anything about the <span className="text-foreground">{carTitle}</span>.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              {/* Honeypot field */}
              <input
                type="text"
                {...register("website_honeypot")}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                style={{ display: "none" }}
              />

              <Field label="Full name" htmlFor="eq-name" error={errors.name?.message}>
                <Input id="eq-name" placeholder="Alex Morgan" {...register("name")} />
              </Field>
              <Field label="Email" htmlFor="eq-email" error={errors.email?.message}>
                <Input id="eq-email" type="email" placeholder="you@example.com" {...register("email")} />
              </Field>
              <Field label="Phone" htmlFor="eq-phone" className="sm:col-span-2" error={errors.phone?.message}>
                <Input id="eq-phone" type="tel" placeholder="+1 (555) 000-0000" {...register("phone")} />
              </Field>
              <Field label="Message" htmlFor="eq-msg" className="sm:col-span-2" error={errors.message?.message}>
                <Textarea
                  id="eq-msg"
                  rows={4}
                  placeholder="I'd like to know more about financing, availability, and delivery timelines…"
                  {...register("message")}
                />
              </Field>
              <DialogFooter className="sm:col-span-2 gap-2 sm:justify-between">
                <Button type="button" variant="glass" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={status === "submitting"}>
                  {status === "submitting" ? "Sending…" : "Send enquiry"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  className,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label
        htmlFor={htmlFor}
        className="mb-2 block text-caption uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </Label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

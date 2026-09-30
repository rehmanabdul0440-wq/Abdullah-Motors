import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Check, Minus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { fetchCarsByIds, fetchRecentCars, type CarRow } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

import car1 from "@/assets/car-1.jpg";

export const Route = createFileRoute("/compare")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      ids: (search.ids as string) || "",
    };
  },
  head: () => ({
    meta: [
      { title: "Compare Cars — Abdullah Motors" },
      {
        name: "description",
        content: "Compare up to four cars side-by-side on price, specs, and features.",
      },
      { property: "og:title", content: "Compare Cars — Abdullah Motors" },
      {
        property: "og:description",
        content: "Compare up to four cars side-by-side on price, specs, and features.",
      },
    ],
  }),
  component: ComparePage,
});

type CompareCar = {
  id: string;
  name: string;
  image: string;
  price: string;
  year: number;
  fuel: string;
  transmission: string;
  mileage: string;
  engine: string;
  seating: string;
  features: string[];
};

const ROWS: { key: keyof CompareCar; label: string }[] = [
  { key: "price", label: "Price" },
  { key: "year", label: "Year" },
  { key: "fuel", label: "Fuel Type" },
  { key: "transmission", label: "Transmission" },
  { key: "mileage", label: "Mileage" },
  { key: "engine", label: "Engine" },
  { key: "seating", label: "Seating" },
];

function ComparePage() {
  const { ids } = Route.useSearch() as { ids: string };
  const navigate = Route.useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const carIds = ids ? ids.split(",").filter(Boolean) : [];

  // Fetch cars specified by IDs
  const { data: dbCars, isLoading: isCarsLoading } = useQuery({
    queryKey: ["compare-cars", carIds],
    queryFn: () => fetchCarsByIds(carIds),
    enabled: carIds.length > 0,
  });

  // Fallback to top 3 recent cars if no IDs are selected
  const { data: fallbackCars, isLoading: isFallbackLoading } = useQuery({
    queryKey: ["compare-fallback"],
    queryFn: () => fetchRecentCars(3),
    enabled: carIds.length === 0,
  });

  // Available cars for picker search
  const { data: pickerCars } = useQuery({
    queryKey: ["compare-picker-search"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("id, title, price, year, car_images(image_url, is_primary)")
        .eq("status", "available")
        .limit(100);
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || []) as any[];
    },
  });

  const displayedRows = carIds.length > 0 ? (dbCars ?? []) : (fallbackCars ?? []);
  const isLoading = carIds.length > 0 ? isCarsLoading : isFallbackLoading;

  const selected: CompareCar[] = displayedRows.map((car) => {
    const primary = car.car_images?.find((i) => i.is_primary);
    const first = car.car_images?.[0];
    const image = primary?.image_url ?? first?.image_url ?? car1;

    return {
      id: car.id,
      name: car.title,
      image,
      price: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(car.price),
      year: car.year,
      fuel: car.fuel_type.charAt(0).toUpperCase() + car.fuel_type.slice(1),
      transmission: car.transmission === "automatic" ? "Automatic" : "Manual",
      mileage: car.mileage.toLocaleString() + " mi",
      engine: car.engine ?? "N/A",
      seating: car.seating_capacity ? String(car.seating_capacity) : "N/A",
      features: Array.isArray(car.features) ? (car.features as string[]) : [],
    };
  });

  const currentIds = carIds.length > 0 ? carIds : selected.map((s) => s.id);

  const remove = (id: string) => {
    const newIds = currentIds.filter((x) => x !== id);
    void navigate({ search: { ids: newIds.join(",") } });
  };

  const add = (carId: string) => {
    if (currentIds.includes(carId)) return;
    const newIds = [...currentIds, carId];
    void navigate({ search: { ids: newIds.join(",") } });
    setPickerOpen(false);
    setQuery("");
  };

  // Filter available cars for picker
  const available = (pickerCars ?? [])
    .filter(
      (c) => !currentIds.includes(c.id) && c.title.toLowerCase().includes(query.toLowerCase()),
    )
    .map((c) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const primary = c.car_images?.find((i: any) => i.is_primary);
      const first = c.car_images?.[0];
      return {
        id: c.id,
        name: c.title,
        price: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(c.price),
        year: c.year,
        image: primary?.image_url ?? first?.image_url ?? car1,
      };
    });

  if (isLoading) {
    return (
      <div className="pt-24 pb-24 text-center">
        <p className="text-muted-foreground animate-pulse">Loading comparison specs…</p>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <span className="text-caption uppercase text-muted-foreground">Side-by-side</span>
          <h1 className="text-display-lg mt-2 text-foreground">
            Compare <span className="text-gradient-primary">Cars</span>
          </h1>
          <p className="mt-4 text-body text-muted-foreground">
            Add up to four vehicles and weigh price, specs, and features at a glance.
          </p>
        </motion.div>

        {/* Desktop: columns */}
        {selected.length > 0 && (
          <div className="mt-12 hidden lg:block">
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `200px repeat(${Math.max(selected.length + (selected.length < 4 ? 1 : 0), 1)}, minmax(0, 1fr))`,
              }}
            >
              <div />
              {selected.map((car) => (
                <CarHeader key={car.id} car={car} onRemove={() => remove(car.id)} />
              ))}
              {selected.length < 4 && <AddCard onClick={() => setPickerOpen(true)} />}

              {ROWS.map((row, i) => (
                <div key={row.key} className="contents">
                  <div
                    className={cn(
                      "py-4 pr-4 text-sm font-medium text-muted-foreground",
                      i % 2 === 0 && "bg-surface/40",
                    )}
                  >
                    {row.label}
                  </div>
                  {selected.map((car) => (
                    <div
                      key={car.id}
                      className={cn(
                        "py-4 px-4 text-sm text-foreground",
                        i % 2 === 0 && "bg-surface/40",
                      )}
                    >
                      {car[row.key] as string}
                    </div>
                  ))}
                  {selected.length < 4 && <div className={cn(i % 2 === 0 && "bg-surface/40")} />}
                </div>
              ))}

              <div className="contents">
                <div className="py-4 pr-4 text-sm font-medium text-muted-foreground bg-surface/40">
                  Features
                </div>
                {selected.map((car) => (
                  <div key={car.id} className="py-4 px-4 text-sm text-foreground bg-surface/40">
                    <ul className="space-y-1.5">
                      {car.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {selected.length < 4 && <div className="bg-surface/40" />}
              </div>
            </div>
          </div>
        )}

        {/* Mobile: stacked cards */}
        {selected.length > 0 && (
          <div className="mt-10 grid gap-4 lg:hidden">
            {selected.map((car) => (
              <div key={car.id} className="glass-surface relative rounded-3xl p-5">
                <button
                  onClick={() => remove(car.id)}
                  className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/60 text-foreground"
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="aspect-video w-full overflow-hidden rounded-2xl bg-surface">
                  <img src={car.image} alt={car.name} className="h-full w-full object-cover" />
                </div>
                <h3 className="mt-4 text-title text-foreground">{car.name}</h3>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {ROWS.map((row) => (
                    <div key={row.key} className="flex flex-col">
                      <dt className="text-caption uppercase text-muted-foreground">{row.label}</dt>
                      <dd className="text-foreground">{car[row.key] as string}</dd>
                    </div>
                  ))}
                </dl>
                {car.features.length > 0 && (
                  <div className="mt-4">
                    <p className="text-caption uppercase text-muted-foreground">Features</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {car.features.map((f) => (
                        <li
                          key={f}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-foreground"
                        >
                          <Check className="h-3 w-3 text-primary" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {selected.length < 4 && (
              <button
                onClick={() => setPickerOpen(true)}
                className="glass-surface flex min-h-56 flex-col items-center justify-center gap-3 rounded-3xl border-dashed text-muted-foreground transition-colors hover:text-foreground"
              >
                <Plus className="h-8 w-8" />
                <span className="text-sm font-medium">Add Another Car</span>
              </button>
            )}
          </div>
        )}

        {selected.length === 0 && (
          <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border p-16 text-center">
            <Minus className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No cars selected yet.</p>
            <Button onClick={() => setPickerOpen(true)}>Add a car</Button>
          </div>
        )}
      </section>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="glass-surface">
          <DialogHeader>
            <DialogTitle>Add a car to compare</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brand or model…"
              className="pl-9"
            />
          </div>
          <ul className="mt-2 max-h-72 space-y-1 overflow-auto pr-1">
            {available.map((car) => (
              <li key={car.id}>
                <button
                  onClick={() => add(car.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition-colors hover:border-border hover:bg-surface/60"
                >
                  <img
                    src={car.image}
                    alt={car.name}
                    className="h-12 w-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{car.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {car.year} · {car.price}
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            ))}
            {available.length === 0 && (
              <li className="p-6 text-center text-sm text-muted-foreground">No matches.</li>
            )}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CarHeader({ car, onRemove }: { car: CompareCar; onRemove: () => void }) {
  return (
    <div className="glass-surface sticky top-20 z-10 rounded-2xl p-3">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-surface">
        <img src={car.image} alt={car.name} className="h-full w-full object-cover" />
        <button
          onClick={onRemove}
          aria-label="Remove"
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-3 line-clamp-1 font-display text-sm font-semibold text-foreground">
        {car.name}
      </p>
      <p className="text-xs text-muted-foreground">{car.year}</p>
    </div>
  );
}

function AddCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="sticky top-20 z-10 flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
    >
      <Plus className="h-6 w-6" />
      <span className="text-xs font-medium">Add Another Car</span>
    </button>
  );
}

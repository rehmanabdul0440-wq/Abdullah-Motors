import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Cog,
  Fuel,
  GaugeCircle,
  Grid3x3,
  List,
  SlidersHorizontal,
  X,
  Search as SearchIcon,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CarGridSkeleton } from "@/components/skeletons/car-skeletons";

import { useQuery } from "@tanstack/react-query";
import { fetchCars, fetchBrands, type CarRow } from "@/lib/queries";

import car1 from "@/assets/car-1.jpg";

export const Route = createFileRoute("/cars")({
  head: () => ({
    meta: [
      { title: "Explore Our Cars — Abdullah Motors" },
      {
        name: "description",
        content:
          "Browse the full Abdullah Motors inventory. Filter by brand, body type, fuel, transmission, year, and condition — then compare up to four cars side-by-side.",
      },
      { property: "og:title", content: "Explore Our Cars — Abdullah Motors" },
      {
        property: "og:description",
        content:
          "The full Abdullah Motors inventory with rich filters, sorting, and side-by-side comparison.",
      },
    ],
  }),
  component: CarsPage,
});

// ---------- Types & mock inventory ----------
type Condition = "New" | "Used" | "Certified";
type BodyType = "SUV" | "Sedan" | "Hatchback" | "Coupe" | "Roadster";
type FuelType = "Petrol" | "Electric" | "Hybrid" | "Diesel";
type Transmission = "Auto" | "Manual";

type CarItem = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  bodyType: BodyType;
  year: number;
  price: number;
  fuel: FuelType;
  transmission: Transmission;
  mileage: string;
  mileageNum: number;
  condition: Condition;
  image: string;
  badge?: "featured" | "new" | "certified";
};

const BODY_TYPES: BodyType[] = ["SUV", "Sedan", "Hatchback", "Coupe", "Roadster"];
const FUEL_TYPES: FuelType[] = ["Petrol", "Electric", "Hybrid", "Diesel"];
const TRANSMISSIONS: Transmission[] = ["Auto", "Manual"];
const CONDITIONS: Condition[] = ["New", "Used", "Certified"];

const PRICE_MIN = 30000;
const PRICE_MAX = 160000;
const YEAR_MIN = 2020;
const YEAR_MAX = 2024;
const PAGE_SIZE = 9;

type SortKey = "price-asc" | "price-desc" | "newest";
type ViewMode = "grid" | "list";

type FiltersState = {
  price: [number, number];
  year: [number, number];
  brands: string[];
  bodyTypes: BodyType[];
  fuels: FuelType[];
  transmissions: Transmission[];
  conditions: Condition[];
};

const EMPTY_FILTERS: FiltersState = {
  price: [PRICE_MIN, PRICE_MAX],
  year: [YEAR_MIN, YEAR_MAX],
  brands: [],
  bodyTypes: [],
  fuels: [],
  transmissions: [],
  conditions: [],
};

// ---------- Helpers ----------
const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

function primaryImage(car: CarRow): string {
  const images = car.car_images ?? [];
  const primary = images.find((i) => i.is_primary);
  const first = images[0];
  // Fall back to local placeholder if no Supabase image
  return primary?.image_url ?? first?.image_url ?? car1;
}

function carRowToItem(car: CarRow): CarItem {
  return {
    id: car.id,
    slug: car.slug,
    title: car.title,
    brand: car.brands?.name ?? "",
    bodyType: (car.categories?.name as BodyType | undefined) ?? "SUV",
    year: car.year,
    price: car.price,
    fuel: (car.fuel_type.charAt(0).toUpperCase() + car.fuel_type.slice(1)) as FuelType,
    transmission: (car.transmission === "automatic" ? "Auto" : "Manual") as Transmission,
    mileage: car.mileage.toLocaleString() + " mi",
    mileageNum: car.mileage,
    condition: (car.condition.charAt(0).toUpperCase() + car.condition.slice(1)) as Condition,
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

// ---------- Page ----------
function CarsPage() {
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareCarMap, setCompareCarMap] = useState<Record<string, CarItem>>({});
  const [mobileOpen, setMobileOpen] = useState(false);

  const queryFilters = {
    brands: filters.brands,
    categories: filters.bodyTypes,
    fuels: filters.fuels.map((f) => f.toLowerCase()),
    transmissions: filters.transmissions.map((t) => (t === "Auto" ? "automatic" : "manual")),
    conditions: filters.conditions.map((c) => c.toLowerCase()),
    priceMin: filters.price[0],
    priceMax: filters.price[1],
    yearMin: filters.year[0],
    yearMax: filters.year[1],
    sort,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["cars", queryFilters],
    queryFn: () => fetchCars(queryFilters),
    placeholderData: (prev) => prev,
  });

  const cars = (data?.cars ?? []).map(carRowToItem);
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggleCompare = (car: CarItem) => {
    setCompareIds((prev) => {
      if (prev.includes(car.id)) return prev.filter((x) => x !== car.id);
      if (prev.length >= 4) return prev;
      return [...prev, car.id];
    });
    setCompareCarMap((prev) => ({ ...prev, [car.id]: car }));
  };

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const applyFilters = (next: FiltersState) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <div className="relative pb-32">
      {/* Header */}
      <section className="border-b border-border bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-caption text-muted-foreground"
          >
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">Cars</span>
          </nav>
          <h1 className="mt-4 text-display-lg">
            Explore Our <span className="text-gradient-primary">Cars</span>
          </h1>
          <p className="mt-3 max-w-xl text-body text-muted-foreground">
            Filter by price, brand, body, fuel, and more. Compare up to four cars side-by-side.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <FiltersPanel value={filters} onChange={applyFilters} onClear={clearAll} />
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0">
          {/* Top bar */}
          <div className="glass-surface mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="glass" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="h-[85vh] overflow-y-auto rounded-t-3xl border-border bg-background"
                >
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="py-4">
                    <FiltersPanel
                      value={filters}
                      onChange={setFilters}
                      onClear={clearAll}
                      embedded
                    />
                  </div>
                  <SheetFooter className="gap-2 sm:justify-between">
                    <Button variant="glass" onClick={clearAll}>
                      Clear All
                    </Button>
                    <Button
                      onClick={() => {
                        setPage(1);
                        setMobileOpen(false);
                      }}
                    >
                      Apply Filters
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              <div className="text-body-sm text-muted-foreground">
                {isFetching ? (
                  <span className="text-muted-foreground">Loading…</span>
                ) : (
                  <>
                    <span className="font-semibold text-foreground">{total}</span> cars found
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={sort}
                onValueChange={(v) => {
                  setSort(v as SortKey);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[180px] rounded-full border-border bg-input/60 text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex overflow-hidden rounded-full border border-border">
                <button
                  type="button"
                  aria-label="Grid view"
                  onClick={() => setView("grid")}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground",
                    view === "grid" && "bg-gradient-primary text-primary-foreground",
                  )}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="List view"
                  onClick={() => setView("list")}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground",
                    view === "list" && "bg-gradient-primary text-primary-foreground",
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <CarGridSkeleton count={6} />
          ) : isError ? (
            <div className="glass-surface rounded-3xl px-6 py-20 text-center">
              <h2 className="text-heading text-foreground">Inventory unavailable</h2>
              <p className="mx-auto mt-2 max-w-md text-body-sm text-muted-foreground">
                We couldn't reach the showroom inventory. Please refresh and try again.
              </p>
              <Button className="mt-6" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </div>
          ) : cars.length === 0 ? (
            <EmptyState onClear={clearAll} />
          ) : (
            <div
              className={cn(
                "grid gap-6",
                view === "grid" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1",
              )}
            >
              {cars.map((car, i) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: (i % 6) * 0.05 }}
                >
                  <CarCard
                    car={car}
                    view={view}
                    selected={compareIds.includes(car.id)}
                    onToggleCompare={() => toggleCompare(car)}
                    disabled={!compareIds.includes(car.id) && compareIds.length >= 4}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {cars.length > 0 && pageCount > 1 && (
            <Pagination
              page={page}
              pageCount={pageCount}
              onChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </div>
      </div>

      {/* Compare bar */}
      <CompareBar
        items={compareIds.map((id) => compareCarMap[id]).filter(Boolean) as CarItem[]}
        onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
        onClear={() => {
          setCompareIds([]);
          setCompareCarMap({});
        }}
      />
    </div>
  );
}

// ---------- Filters ----------
function FiltersPanel({
  value,
  onChange,
  onClear,
  embedded = false,
}: {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  onClear: () => void;
  embedded?: boolean;
}) {
  const { data: brandsData } = useQuery({
    queryKey: ["filter-brands"],
    queryFn: fetchBrands,
  });

  const brands = brandsData?.map((b) => b.name) ?? [];

  const set = <K extends keyof FiltersState>(key: K, v: FiltersState[K]) =>
    onChange({ ...value, [key]: v });

  const toggleIn = <T,>(list: T[], item: T): T[] =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  const wrapperClass = embedded ? "" : "glass-surface rounded-2xl p-5";

  return (
    <div className={wrapperClass}>
      {!embedded && (
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-title text-foreground">Filters</h2>
          <button
            type="button"
            onClick={onClear}
            className="text-caption text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Clear All
          </button>
        </div>
      )}

      <FilterGroup label="Price Range">
        <Slider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={1000}
          value={value.price}
          onValueChange={(v) => set("price", [v[0], v[1]] as [number, number])}
        />
        <div className="mt-3 flex justify-between text-caption text-muted-foreground">
          <span>${value.price[0].toLocaleString()}</span>
          <span>${value.price[1].toLocaleString()}</span>
        </div>
      </FilterGroup>

      <FilterGroup label="Year">
        <Slider
          min={YEAR_MIN}
          max={YEAR_MAX}
          step={1}
          value={value.year}
          onValueChange={(v) => set("year", [v[0], v[1]] as [number, number])}
        />
        <div className="mt-3 flex justify-between text-caption text-muted-foreground">
          <span>{value.year[0]}</span>
          <span>{value.year[1]}</span>
        </div>
      </FilterGroup>

      <FilterGroup label="Brand">
        <CheckboxList
          items={brands}
          selected={value.brands}
          onToggle={(b) => set("brands", toggleIn(value.brands, b))}
        />
      </FilterGroup>

      <FilterGroup label="Body Type">
        <CheckboxList
          items={BODY_TYPES}
          selected={value.bodyTypes}
          onToggle={(b) => set("bodyTypes", toggleIn(value.bodyTypes, b))}
        />
      </FilterGroup>

      <FilterGroup label="Fuel Type">
        <CheckboxList
          items={FUEL_TYPES}
          selected={value.fuels}
          onToggle={(b) => set("fuels", toggleIn(value.fuels, b))}
        />
      </FilterGroup>

      <FilterGroup label="Transmission">
        <CheckboxList
          items={TRANSMISSIONS}
          selected={value.transmissions}
          onToggle={(b) => set("transmissions", toggleIn(value.transmissions, b))}
        />
      </FilterGroup>

      <FilterGroup label="Condition" last>
        <CheckboxList
          items={CONDITIONS}
          selected={value.conditions}
          onToggle={(b) => set("conditions", toggleIn(value.conditions, b))}
        />
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={cn("py-4", !last && "border-b border-border")}>
      <div className="mb-3 text-caption font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function CheckboxList<T extends string>({
  items,
  selected,
  onToggle,
}: {
  items: readonly T[];
  selected: T[];
  onToggle: (item: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => {
        const id = `chk-${item}`;
        const checked = selected.includes(item);
        return (
          <label
            key={item}
            htmlFor={id}
            className="flex cursor-pointer items-center gap-3 text-body-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Checkbox id={id} checked={checked} onCheckedChange={() => onToggle(item)} />
            <span className={cn(checked && "text-foreground")}>{item}</span>
          </label>
        );
      })}
    </div>
  );
}

// ---------- Car card ----------
function CarCard({
  car,
  view,
  selected,
  onToggleCompare,
  disabled,
}: {
  car: CarItem;
  view: ViewMode;
  selected: boolean;
  onToggleCompare: () => void;
  disabled: boolean;
}) {
  const isList = view === "list";
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "group relative flex overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-xl transition-shadow duration-300 hover:shadow-[var(--shadow-glow)]",
        isList ? "flex-col sm:flex-row" : "flex-col",
        selected && "ring-2 ring-primary",
      )}
    >
      <Link
        to="/cars/$id"
        params={{ id: car.slug }}
        className={cn(
          "relative block overflow-hidden bg-surface",
          isList ? "aspect-[16/10] sm:aspect-auto sm:w-2/5 sm:min-h-full" : "aspect-[16/10]",
        )}
      >
        <img
          src={car.image}
          alt={car.title}
          loading="lazy"
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card to-transparent" />
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-title text-foreground">{car.title}</h3>
            <div className="text-body-sm text-muted-foreground">
              {car.year} · {car.condition}
            </div>
          </div>
          <div className="text-title text-gradient-primary">${car.price.toLocaleString()}</div>
        </div>

        {isList && (
          <p className="text-body-sm text-muted-foreground">
            {car.brand} {car.bodyType} — precision-inspected and ready for concierge delivery.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4 text-caption text-muted-foreground">
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

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 text-caption text-muted-foreground transition-colors hover:text-foreground",
              disabled && "cursor-not-allowed opacity-50 hover:text-muted-foreground",
            )}
          >
            <Checkbox checked={selected} disabled={disabled} onCheckedChange={onToggleCompare} />
            Compare
          </label>
          <Button size="sm" variant="glass" asChild>
            <Link to="/cars/$id" params={{ id: car.slug }}>
              View
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------- Empty state ----------
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="glass-surface flex flex-col items-center justify-center rounded-3xl px-6 py-20 text-center">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary/10 ring-1 ring-border">
        <SearchIcon className="h-8 w-8 text-primary" />
        <div className="absolute inset-0 -z-10 rounded-full bg-gradient-primary/20 blur-2xl" />
      </div>
      <h3 className="text-heading text-foreground">No cars match those filters</h3>
      <p className="mt-2 max-w-sm text-body-sm text-muted-foreground">
        Try widening the price range, clearing a checkbox, or resetting everything to explore the
        full inventory.
      </p>
      <Button className="mt-6" onClick={onClear}>
        Clear Filters
      </Button>
    </div>
  );
}

// ---------- Pagination ----------
function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <button
        type="button"
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="glass-surface flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p) => (
        <button
          type="button"
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-body-sm transition-all",
            p === page
              ? "bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]"
              : "glass-surface text-muted-foreground hover:text-foreground",
          )}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        aria-label="Next page"
        disabled={page === pageCount}
        onClick={() => onChange(page + 1)}
        className="glass-surface flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

// ---------- Compare bar ----------
function CompareBar({
  items,
  onRemove,
  onClear,
}: {
  items: CarItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed inset-x-0 bottom-4 z-40 mx-auto max-w-4xl px-4"
        >
          <div className="glass-surface flex flex-col gap-3 rounded-2xl p-3 shadow-[var(--shadow-glow-strong)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 overflow-x-auto">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
                <ArrowLeftRight className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                {items.map((car) => (
                  <div
                    key={car.id}
                    className="group relative flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface/80 py-1 pl-1 pr-2"
                  >
                    <img src={car.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                    <span className="max-w-[10rem] truncate text-caption text-foreground">
                      {car.title}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${car.title}`}
                      onClick={() => onRemove(car.id)}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                  <div
                    key={`slot-${i}`}
                    className="hidden h-9 w-9 shrink-0 rounded-full border border-dashed border-border sm:block"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:justify-end">
              <div className="hidden text-caption text-muted-foreground sm:block">
                {items.length}/4 selected
              </div>
              <Button variant="glass" size="sm" onClick={onClear}>
                Clear
              </Button>
              <Button size="sm" disabled={items.length < 2} asChild={items.length >= 2}>
                {items.length >= 2 ? (
                  <Link to="/compare" search={{ ids: items.map((i) => i.id).join(",") }}>
                    Compare Now
                  </Link>
                ) : (
                  <span>Compare Now</span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

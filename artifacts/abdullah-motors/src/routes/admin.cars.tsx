import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Search, Edit, Trash2, Eye, Star, StarOff,
  ChevronUp, ChevronDown, Filter, X, Loader2, ImageOff,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { supabase } from "@/lib/supabase";
import {
  fetchAllCarsAdmin, fetchCategories, type CarAdminRow,
} from "@/lib/queries";

export const Route = createFileRoute("/admin/cars")({
  component: AdminCars,
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    available: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    reserved:  "bg-purple-500/10 text-purple-400 border-purple-500/20",
    sold:      "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <Badge className={`text-[10px] uppercase font-bold tracking-wider rounded-full px-2 py-0.5 border ${map[status] ?? ""}`}>
      {status}
    </Badge>
  );
}

function ConditionBadge({ condition }: { condition: string }) {
  const map: Record<string, string> = {
    new:       "bg-blue-500/10 text-blue-400 border-blue-500/20",
    certified: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    used:      "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return (
    <Badge className={`text-[10px] uppercase font-bold tracking-wider rounded-md px-1.5 py-0.5 border ${map[condition] ?? ""}`}>
      {condition}
    </Badge>
  );
}

type SortKey = "newest" | "oldest" | "price-asc" | "price-desc";

// ── Component ─────────────────────────────────────────────────────────────────

function AdminCars() {
  const qc = useQueryClient();

  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("all");
  const [categoryFilter, setCategory] = useState("all");
  const [sort, setSort]             = useState<SortKey>("newest");
  const [deleteTarget, setDeleteTarget] = useState<CarAdminRow | null>(null);

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ["admin", "cars"],
    queryFn:  fetchAllCarsAdmin,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn:  fetchCategories,
  });

  // ── Client-side filter + sort ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = [...cars];

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.brands?.name ?? "").toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all")   rows = rows.filter((c) => c.status   === statusFilter);
    if (categoryFilter !== "all") rows = rows.filter((c) => c.category_id === categoryFilter);

    switch (sort) {
      case "oldest":     rows.sort((a, b) => a.created_at.localeCompare(b.created_at)); break;
      case "price-asc":  rows.sort((a, b) => a.price - b.price); break;
      case "price-desc": rows.sort((a, b) => b.price - a.price); break;
      default:           rows.sort((a, b) => b.created_at.localeCompare(a.created_at)); break;
    }

    return rows;
  }, [cars, search, statusFilter, categoryFilter, sort]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "cars"] });
    void qc.invalidateQueries({ queryKey: ["cars"] });
    void qc.invalidateQueries({ queryKey: ["home"] });
  };

  const toggleFeatured = useMutation({
    mutationFn: async (car: CarAdminRow) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("cars")
        .update({ is_featured: !car.is_featured })
        .eq("id", car.id);
      if (error) throw error;
    },
    onSuccess: (_, car) => {
      toast.success(`${car.is_featured ? "Removed from" : "Added to"} featured`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCar = useMutation({
    mutationFn: async (car: CarAdminRow) => {
      // Remove storage files first (best-effort)
      for (const img of car.car_images) {
        const path = img.image_url.split("/car-images/").pop();
        if (path) {
          await supabase.storage.from("car-images").remove([path]);
        }
      }
      // Delete car row (cascades car_images DB rows via FK)
      const { error } = await supabase.from("cars").delete().eq("id", car.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Car deleted successfully");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setDeleteTarget(null);
    },
  });

  const hasFilters = search || statusFilter !== "all" || categoryFilter !== "all";

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display-sm text-foreground">Manage Inventory</h1>
          <p className="text-body text-muted-foreground mt-1">
            {isLoading ? "Loading…" : `${filtered.length} of ${cars.length} cars shown`}
          </p>
        </div>
        <Link to="/admin/cars/new">
          <Button className="rounded-xl bg-gradient-primary text-primary-foreground font-medium flex items-center gap-2 hover:opacity-95 shadow-glow cursor-pointer">
            <Plus className="h-4 w-4" /> Add New Car
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="glass-surface border border-border/40 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-title text-foreground">Cars List</CardTitle>
              <CardDescription>Search, filter, and manage all listings</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cars-search"
                  placeholder="Search title or brand…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-xl bg-surface/50 border-border/40 focus:border-primary/50 text-sm h-10"
                />
              </div>

              {/* Status filter */}
              <Select value={statusFilter} onValueChange={setStatus}>
                <SelectTrigger className="w-36 h-10 rounded-xl bg-surface/50 border-border/40 text-sm">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>

              {/* Category filter */}
              <Select value={categoryFilter} onValueChange={setCategory}>
                <SelectTrigger className="w-40 h-10 rounded-xl bg-surface/50 border-border/40 text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="w-36 h-10 rounded-xl bg-surface/50 border-border/40 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-asc">Price ↑</SelectItem>
                  <SelectItem value="price-desc">Price ↓</SelectItem>
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => { setSearch(""); setStatus("all"); setCategory("all"); }}
                  title="Clear filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              {hasFilters ? "No cars match your filters." : "No cars in inventory yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/40 hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium w-14">Image</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Car</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Condition</TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => setSort(sort === "price-asc" ? "price-desc" : "price-asc")}
                      >
                        Price
                        {sort === "price-asc" ? <ChevronUp className="h-3 w-3" /> : sort === "price-desc" ? <ChevronDown className="h-3 w-3" /> : null}
                      </button>
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">Mileage</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Specs</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-center">Featured</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence initial={false}>
                    {filtered.map((car) => {
                      const primary = car.car_images.find((i) => i.is_primary) ?? car.car_images[0];
                      return (
                        <motion.tr
                          key={car.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b border-border/40 hover:bg-white/[0.01]"
                        >
                          {/* Thumbnail */}
                          <TableCell>
                            <div className="h-10 w-14 rounded-lg overflow-hidden bg-surface flex items-center justify-center shrink-0">
                              {primary ? (
                                <img
                                  src={primary.image_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                              )}
                            </div>
                          </TableCell>

                          {/* Car info */}
                          <TableCell>
                            <div className="font-semibold text-foreground leading-tight">{car.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {car.brands?.name} · {car.year}
                            </div>
                          </TableCell>

                          <TableCell><ConditionBadge condition={car.condition} /></TableCell>

                          <TableCell className="font-medium text-foreground tabular-nums">
                            {fmtUSD(car.price)}
                          </TableCell>

                          <TableCell className="text-muted-foreground tabular-nums text-sm">
                            {car.mileage.toLocaleString()} mi
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground">
                            {car.fuel_type} · {car.transmission}
                          </TableCell>

                          <TableCell><StatusBadge status={car.status} /></TableCell>

                          {/* Featured toggle */}
                          <TableCell className="text-center">
                            <button
                              onClick={() => toggleFeatured.mutate(car)}
                              disabled={toggleFeatured.isPending}
                              title={car.is_featured ? "Remove from featured" : "Add to featured"}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-white/5"
                            >
                              {car.is_featured ? (
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              ) : (
                                <StarOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Link to="/cars/$id" params={{ id: car.slug }}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground" title="View public page">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link to="/admin/cars/$carId/edit" params={{ carId: car.id }}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary" title="Edit car">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                                title="Delete car"
                                onClick={() => setDeleteTarget(car)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="glass-surface border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete car?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.title}</span> and all
              its images. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={deleteCar.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCar.isPending}
              onClick={() => deleteTarget && deleteCar.mutate(deleteTarget)}
            >
              {deleteCar.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</>
              ) : (
                "Yes, delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

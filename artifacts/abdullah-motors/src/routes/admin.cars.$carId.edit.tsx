import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import {
  ArrowLeft, Loader2, Upload, Trash2, Star, StarOff,
  GripVertical, ImageOff, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { fetchCarAdminById } from "@/lib/queries";
import { CarForm, type CarFormValues } from "@/components/admin/car-form";
import { Button }   from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/cars/$carId/edit")({
  component: EditCarPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type CarImage = {
  id:         string;
  image_url:  string;
  is_primary: boolean;
  sort_order: number;
};

// ── Edit Car Page ─────────────────────────────────────────────────────────────

function EditCarPage() {
  const { carId } = Route.useParams();
  const navigate   = useNavigate();
  const qc         = useQueryClient();

  const { data: car, isLoading, isError } = useQuery({
    queryKey: ["admin", "car", carId],
    queryFn:  () => fetchCarAdminById(carId),
  });

  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "cars"] });
    void qc.invalidateQueries({ queryKey: ["admin", "car", carId] });
    void qc.invalidateQueries({ queryKey: ["cars"] });
    void qc.invalidateQueries({ queryKey: ["home"] });
    void qc.invalidateQueries({ queryKey: ["car", car?.slug] });
  };

  // ── Update car details ──────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);

  const handleSave = async (values: CarFormValues) => {
    setSaving(true);
    const payload = {
      title:            values.title,
      slug:             values.slug,
      brand_id:         values.brand_id,
      model_id:         values.model_id,
      category_id:      values.category_id,
      year:             values.year,
      price:            values.price,
      mileage:          values.mileage,
      fuel_type:        values.fuel_type,
      transmission:     values.transmission,
      condition:        values.condition,
      color:            values.color || null,
      engine:           values.engine || null,
      seating_capacity: values.seating_capacity ? Number(values.seating_capacity) : null,
      description:      values.description || null,
      features:         values.features,
      status:           values.status,
      is_featured:      values.is_featured,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("cars")
      .update(payload)
      .eq("id", carId);

    setSaving(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("That slug is already taken by another car.");
      } else {
        toast.error(error.message);
      }
      throw error;
    }

    toast.success("Car details saved");
    invalidateAll();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !car) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-foreground font-semibold">Car not found</p>
        <Link to="/admin/cars"><Button variant="outline">Back to Cars</Button></Link>
      </div>
    );
  }

  // Build defaultValues for the form
  const formDefaults: Partial<CarFormValues> = {
    title:            car.title,
    slug:             car.slug,
    brand_id:         car.brand_id,
    model_id:         car.model_id,
    category_id:      car.category_id,
    year:             car.year,
    price:            car.price,
    mileage:          car.mileage,
    fuel_type:        car.fuel_type,
    transmission:     car.transmission,
    condition:        car.condition,
    color:            car.color ?? "",
    engine:           car.engine ?? "",
    seating_capacity: car.seating_capacity ?? ("" as unknown as number),
    description:      car.description ?? "",
    features:         Array.isArray(car.features) ? (car.features as string[]) : [],
    status:           car.status,
    is_featured:      car.is_featured,
  };

  return (
    <div className="space-y-8 page-transition max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/cars"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Cars
        </Link>
      </div>
      <div>
        <h1 className="text-display-sm text-foreground">Edit Car</h1>
        <p className="text-body text-muted-foreground mt-1 font-mono text-sm">{car.title}</p>
      </div>

      {/* Car Details Form */}
      <div className="glass-surface rounded-2xl border border-border/40 p-6 md:p-8">
        <h2 className="text-title font-semibold text-foreground mb-6">Car Details</h2>
        <CarForm
          key={car.id} // remount if car changes
          defaultValues={formDefaults}
          onSubmit={handleSave}
          isSubmitting={saving}
          submitLabel="Save changes"
          onCancel={() => navigate({ to: "/admin/cars" })}
        />
      </div>

      {/* Image Management */}
      <div className="glass-surface rounded-2xl border border-border/40 p-6 md:p-8">
        <ImageManager carId={car.id} images={car.car_images} onMutate={invalidateAll} />
      </div>
    </div>
  );
}

// ── Image Manager ─────────────────────────────────────────────────────────────

function ImageManager({
  carId,
  images: rawImages,
  onMutate,
}: {
  carId:    string;
  images:   CarImage[];
  onMutate: () => void;
}) {
  const [images, setImages] = useState<CarImage[]>(
    [...rawImages].sort((a, b) => a.sort_order - b.sort_order),
  );
  const [uploading, setUploading]       = useState(false);
  const [dragOver, setDragOver]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CarImage | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep local state in sync when parent refetches
  const prevCarId = useRef(carId);
  if (prevCarId.current !== carId || rawImages.length !== images.length) {
    prevCarId.current = carId;
    setImages([...rawImages].sort((a, b) => a.sort_order - b.sort_order));
  }

  // ── Upload ────────────────────────────────────────────────────────────────
  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setUploading(true);

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 10 MB limit`);
          continue;
        }

        const ext      = file.name.split(".").pop() ?? "jpg";
        const filename = `${carId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: storageErr } = await supabase.storage
          .from("car-images")
          .upload(filename, file, { cacheControl: "3600", upsert: false });

        if (storageErr) {
          toast.error(`Upload failed: ${storageErr.message}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("car-images")
          .getPublicUrl(filename);

        const nextOrder = images.length > 0
          ? Math.max(...images.map((i) => i.sort_order)) + 1
          : 0;

        const isPrimary = images.length === 0; // first image → primary

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: row, error: dbErr } = await (supabase as any)
          .from("car_images")
          .insert([{ car_id: carId, image_url: urlData.publicUrl, is_primary: isPrimary, sort_order: nextOrder }])
          .select()
          .single();

        if (dbErr) {
          toast.error(`DB insert failed: ${dbErr.message}`);
          continue;
        }

        setImages((prev) => [...prev, row as CarImage]);
        toast.success("Image uploaded");
      }

      setUploading(false);
      onMutate();
    },
    [carId, images, onMutate],
  );

  // ── Drag-and-drop handlers ────────────────────────────────────────────────
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  // ── Reorder ───────────────────────────────────────────────────────────────
  const handleReorder = async (newOrder: CarImage[]) => {
    setImages(newOrder);

    // Batch update sort_order
    const updates = newOrder.map((img, idx) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("car_images")
        .update({ sort_order: idx })
        .eq("id", img.id),
    );
    const results = await Promise.all(updates);
    const failed  = results.filter((r) => r.error);
    if (failed.length) {
      toast.error("Failed to save new order");
    } else {
      onMutate();
    }
  };

  // ── Set Primary ───────────────────────────────────────────────────────────
  const setPrimary = async (img: CarImage) => {
    // Clear all primaries for this car, then set the new one
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: clearErr } = await (supabase as any)
      .from("car_images")
      .update({ is_primary: false })
      .eq("car_id", carId);

    if (clearErr) { toast.error(clearErr.message); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: setErr } = await (supabase as any)
      .from("car_images")
      .update({ is_primary: true })
      .eq("id", img.id);

    if (setErr) { toast.error(setErr.message); return; }

    setImages((prev) => prev.map((i) => ({ ...i, is_primary: i.id === img.id })));
    toast.success("Primary image updated");
    onMutate();
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    // Extract storage path after /car-images/
    const path = deleteTarget.image_url.split("/car-images/").pop();
    if (path) {
      const { error: storageErr } = await supabase.storage
        .from("car-images")
        .remove([path]);
      if (storageErr) {
        // Non-fatal — file may already be gone
        console.warn("Storage delete:", storageErr.message);
      }
    }

    const { error: dbErr } = await supabase
      .from("car_images")
      .delete()
      .eq("id", deleteTarget.id);

    setDeleting(false);
    if (dbErr) {
      toast.error(dbErr.message);
    } else {
      setImages((prev) => {
        const next = prev.filter((i) => i.id !== deleteTarget.id);
        // If we deleted the primary, promote the first remaining image
        if (deleteTarget.is_primary && next.length > 0) {
          void (supabase as any)
            .from("car_images")
            .update({ is_primary: true })
            .eq("id", next[0].id);
          next[0] = { ...next[0], is_primary: true };
        }
        return next;
      });
      toast.success("Image deleted");
      onMutate();
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-title font-semibold text-foreground">Images</h2>
          <span className="text-xs text-muted-foreground">{images.length} image{images.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer select-none",
            dragOver
              ? "border-primary bg-primary/5 text-primary"
              : "border-border/40 bg-surface/30 text-muted-foreground hover:border-border hover:bg-surface/50",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Uploading…</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8" />
              <div>
                <p className="text-sm font-medium text-foreground">Drop images here or click to browse</p>
                <p className="text-xs mt-1">PNG, JPG, WebP · max 10 MB each</p>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              void uploadFiles(files);
              e.target.value = "";
            }}
          />
        </div>

        {/* Image grid — drag to reorder via Framer Reorder */}
        {images.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
              <GripVertical className="h-3.5 w-3.5" /> Drag to reorder · Star to set primary
            </p>
            <Reorder.Group
              axis="y"
              values={images}
              onReorder={handleReorder}
              className="space-y-2"
            >
              <AnimatePresence>
                {images.map((img) => (
                  <Reorder.Item
                    key={img.id}
                    value={img}
                    className="flex items-center gap-3 rounded-xl border border-border/40 bg-surface/30 p-2 pr-3 cursor-grab active:cursor-grabbing"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileDrag={{ scale: 1.02, boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
                  >
                    {/* Drag handle */}
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />

                    {/* Thumbnail */}
                    <div className="h-14 w-20 rounded-lg overflow-hidden bg-surface shrink-0">
                      <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                    </div>

                    {/* URL truncated */}
                    <p className="flex-1 truncate text-xs text-muted-foreground font-mono">
                      {img.image_url.split("/").pop()}
                    </p>

                    {/* Primary badge */}
                    {img.is_primary && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-2 py-0.5">
                        Primary
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => void setPrimary(img)}
                        title={img.is_primary ? "Already primary" : "Set as primary"}
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                          img.is_primary
                            ? "text-yellow-400 cursor-default"
                            : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/5",
                        )}
                      >
                        {img.is_primary ? <Star className="h-4 w-4 fill-yellow-400" /> : <StarOff className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(img)}
                        title="Delete image"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          </div>
        )}

        {images.length === 0 && !uploading && (
          <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
            <ImageOff className="h-6 w-6" />
            <p className="text-sm">No images yet — upload some above</p>
          </div>
        )}
      </div>

      {/* Delete Image Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="glass-surface border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete image?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the image from storage and from this car's gallery. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTarget && (
            <div className="my-2 rounded-xl overflow-hidden aspect-video bg-surface max-h-40">
              <img src={deleteTarget.image_url} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={() => void confirmDelete()}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Shared car form used by both /admin/cars/new and /admin/cars/:id/edit.
 * Exported as CarForm so the two route files can import it.
 */
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, X, ChevronDown } from "lucide-react";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label }    from "@/components/ui/label";
import { Badge }    from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fetchBrands, fetchModels, fetchCategories } from "@/lib/queries";

// ── Zod schema ────────────────────────────────────────────────────────────────

export const carSchema = z.object({
  title:            z.string().min(2, "Title is required"),
  slug:             z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug: lowercase, digits and hyphens only"),
  brand_id:         z.string().min(1, "Brand is required"),
  model_id:         z.string().min(1, "Model is required"),
  category_id:      z.string().min(1, "Category is required"),
  year:             z.coerce.number().min(1980).max(new Date().getFullYear() + 1),
  price:            z.coerce.number().min(1, "Price is required"),
  mileage:          z.coerce.number().min(0),
  fuel_type:        z.enum(["petrol", "diesel", "electric", "hybrid", "cng"]),
  transmission:     z.enum(["manual", "automatic"]),
  condition:        z.enum(["new", "used", "certified"]),
  color:            z.string().optional(),
  engine:           z.string().optional(),
  seating_capacity: z.coerce.number().min(1).max(20).optional().or(z.literal("")),
  description:      z.string().optional(),
  features:         z.array(z.string()).default([]),
  status:           z.enum(["available", "reserved", "sold"]),
  is_featured:      z.boolean(),
});

export type CarFormValues = z.infer<typeof carSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FormField({
  label, id, required, error, children, hint,
}: {
  label: string; id: string; required?: boolean;
  error?: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint  && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-title font-semibold text-foreground">{title}</h3>
        <div className="flex-1 h-px bg-border/50" />
      </div>
      {children}
    </div>
  );
}

// Tag input for features
function TagInput({
  value, onChange,
}: { value: string[]; onChange: (v: string[]) => void }) {
  const [inputVal, setInputVal] = useState("");

  const add = () => {
    const trimmed = inputVal.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputVal("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="flex items-center gap-1 rounded-full py-1 px-3 text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
          }}
          placeholder="Type feature and press Enter…"
          className="rounded-xl bg-surface/50 border-border/40 text-sm"
        />
        <Button type="button" variant="outline" size="icon" onClick={add} className="rounded-xl shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Main Form ─────────────────────────────────────────────────────────────────

export function CarForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = "Save car",
  onCancel,
}: {
  defaultValues?: Partial<CarFormValues>;
  onSubmit: (values: CarFormValues) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CarFormValues>({
    resolver: zodResolver(carSchema) as import("react-hook-form").Resolver<CarFormValues>,
    defaultValues: {
      title:            "",
      slug:             "",
      brand_id:         "",
      model_id:         "",
      category_id:      "",
      year:             new Date().getFullYear(),
      price:            0,
      mileage:          0,
      fuel_type:        "petrol",
      transmission:     "automatic",
      condition:        "new",
      color:            "",
      engine:           "",
      seating_capacity: "" as unknown as number,
      description:      "",
      features:         [],
      status:           "available",
      is_featured:      false,
      ...defaultValues,
    },
  });

  const watchedTitle   = watch("title");
  const watchedBrandId = watch("brand_id");
  const [slugEdited, setSlugEdited] = useState(!!defaultValues?.slug);

  // Auto-generate slug from title when creating
  useEffect(() => {
    if (!slugEdited && watchedTitle) {
      setValue("slug", slugify(watchedTitle), { shouldValidate: false });
    }
  }, [watchedTitle, slugEdited, setValue]);

  // Fetch selects
  const { data: brands = [] }     = useQuery({ queryKey: ["brands"],                  queryFn: fetchBrands });
  const { data: models = [] }     = useQuery({ queryKey: ["models", watchedBrandId], queryFn: () => fetchModels(watchedBrandId || undefined) });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"],              queryFn: fetchCategories });

  // Reset model when brand changes
  useEffect(() => {
    setValue("model_id", "");
  }, [watchedBrandId, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* ── Identity ── */}
      <Section title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Title" id="car-title" required error={errors.title?.message}>
            <Input id="car-title" placeholder="2024 Toyota Camry XSE" {...register("title")} className="rounded-xl bg-surface/50 border-border/40" />
          </FormField>
          <FormField label="Slug (URL)" id="car-slug" required error={errors.slug?.message} hint="Auto-generated from title; must be unique">
            <Input
              id="car-slug"
              placeholder="2024-toyota-camry-xse"
              {...register("slug")}
              onChange={(e) => { register("slug").onChange(e); setSlugEdited(true); }}
              className="rounded-xl bg-surface/50 border-border/40 font-mono text-sm"
            />
          </FormField>
        </div>
      </Section>

      {/* ── Classification ── */}
      <Section title="Classification">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Brand */}
          <FormField label="Brand" id="car-brand" required error={errors.brand_id?.message}>
            <Controller
              name="brand_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="car-brand" className="rounded-xl bg-surface/50 border-border/40">
                    <SelectValue placeholder="Select brand…" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          {/* Model */}
          <FormField label="Model" id="car-model" required error={errors.model_id?.message}>
            <Controller
              name="model_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!watchedBrandId}>
                  <SelectTrigger id="car-model" className="rounded-xl bg-surface/50 border-border/40">
                    <SelectValue placeholder={watchedBrandId ? "Select model…" : "Pick brand first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          {/* Category */}
          <FormField label="Category" id="car-category" required error={errors.category_id?.message}>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="car-category" className="rounded-xl bg-surface/50 border-border/40">
                    <SelectValue placeholder="Select category…" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Condition */}
          <FormField label="Condition" id="car-condition" required error={errors.condition?.message}>
            <Controller
              name="condition"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="car-condition" className="rounded-xl bg-surface/50 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="certified">Certified Pre-Owned</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          {/* Status */}
          <FormField label="Status" id="car-status" required error={errors.status?.message}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="car-status" className="rounded-xl bg-surface/50 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          {/* Year */}
          <FormField label="Year" id="car-year" required error={errors.year?.message}>
            <Input id="car-year" type="number" min={1980} max={new Date().getFullYear() + 1} {...register("year")} className="rounded-xl bg-surface/50 border-border/40" />
          </FormField>
        </div>
      </Section>

      {/* ── Pricing & Specs ── */}
      <Section title="Pricing & Specs">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Price (USD)" id="car-price" required error={errors.price?.message}>
            <Input id="car-price" type="number" min={0} placeholder="42000" {...register("price")} className="rounded-xl bg-surface/50 border-border/40" />
          </FormField>
          <FormField label="Mileage (mi)" id="car-mileage" error={errors.mileage?.message}>
            <Input id="car-mileage" type="number" min={0} placeholder="0" {...register("mileage")} className="rounded-xl bg-surface/50 border-border/40" />
          </FormField>
          <FormField label="Fuel Type" id="car-fuel" required error={errors.fuel_type?.message}>
            <Controller
              name="fuel_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="car-fuel" className="rounded-xl bg-surface/50 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="cng">CNG</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField label="Transmission" id="car-trans" required error={errors.transmission?.message}>
            <Controller
              name="transmission"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="car-trans" className="rounded-xl bg-surface/50 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">Automatic</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Engine" id="car-engine" error={errors.engine?.message}>
            <Input id="car-engine" placeholder="3.5L V6" {...register("engine")} className="rounded-xl bg-surface/50 border-border/40" />
          </FormField>
          <FormField label="Colour" id="car-color" error={errors.color?.message}>
            <Input id="car-color" placeholder="Pearl White" {...register("color")} className="rounded-xl bg-surface/50 border-border/40" />
          </FormField>
          <FormField label="Seating Capacity" id="car-seats" error={errors.seating_capacity?.message}>
            <Input id="car-seats" type="number" min={1} max={20} placeholder="5" {...register("seating_capacity")} className="rounded-xl bg-surface/50 border-border/40" />
          </FormField>
        </div>
      </Section>

      {/* ── Description & Features ── */}
      <Section title="Description & Features">
        <FormField label="Description" id="car-desc" error={errors.description?.message}>
          <Textarea
            id="car-desc"
            rows={5}
            placeholder="Write a compelling description…"
            {...register("description")}
            className="rounded-xl bg-surface/50 border-border/40 resize-none"
          />
        </FormField>

        <FormField label="Features" id="car-features" hint="Press Enter or comma to add a feature tag">
          <Controller
            name="features"
            control={control}
            render={({ field }) => (
              <TagInput value={field.value} onChange={field.onChange} />
            )}
          />
        </FormField>
      </Section>

      {/* ── Settings ── */}
      <Section title="Settings">
        <div className="flex flex-wrap gap-4">
          {/* Is Featured toggle */}
          <Controller
            name="is_featured"
            control={control}
            render={({ field }) => (
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all",
                  field.value
                    ? "border-yellow-400/40 bg-yellow-400/5 text-yellow-400"
                    : "border-border/40 bg-surface/50 text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <span className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                  field.value ? "border-yellow-400 bg-yellow-400" : "border-muted-foreground",
                )}>
                  {field.value && <span className="block h-2.5 w-2.5 rounded-full bg-black" />}
                </span>
                Featured listing
              </button>
            )}
          />
        </div>
      </Section>

      {/* ── Footer actions ── */}
      <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-6">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl">
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-gradient-primary text-primary-foreground font-medium hover:opacity-95 shadow-glow"
        >
          {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : submitLabel}
        </Button>
      </div>
    </form>
  );
}

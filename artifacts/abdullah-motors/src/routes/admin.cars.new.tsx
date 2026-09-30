import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { CarForm, type CarFormValues } from "@/components/admin/car-form";

export const Route = createFileRoute("/admin/cars/new")({
  component: NewCarPage,
});

function NewCarPage() {
  const navigate  = useNavigate();
  const qc        = useQueryClient();

  const handleSubmit = async (values: CarFormValues) => {
    // Build the insert payload — clean up optional empties
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
    const { data, error } = await (supabase as any)
      .from("cars")
      .insert([payload])
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        toast.error("A car with that slug already exists. Please use a unique slug.");
      } else {
        toast.error(error.message);
      }
      throw error; // keep form in submitting=false state
    }

    // Invalidate both admin and public caches
    void qc.invalidateQueries({ queryKey: ["admin", "cars"] });
    void qc.invalidateQueries({ queryKey: ["cars"] });
    void qc.invalidateQueries({ queryKey: ["home"] });

    toast.success("Car created! Now add images.");
    // Redirect to edit page so the user can upload images immediately
    navigate({ to: "/admin/cars/$carId/edit", params: { carId: (data as { id: string }).id } });
  };

  return (
    <div className="space-y-6 page-transition max-w-4xl">
      {/* Back + Title */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/cars"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Cars
        </Link>
      </div>

      <div>
        <h1 className="text-display-sm text-foreground">Add New Car</h1>
        <p className="text-body text-muted-foreground mt-1">
          Fill in the details below. You'll be able to add images after saving.
        </p>
      </div>

      <div className="glass-surface rounded-2xl border border-border/40 p-6 md:p-8">
        <CarForm
          onSubmit={handleSubmit}
          submitLabel="Create car & add images →"
          onCancel={() => navigate({ to: "/admin/cars" })}
        />
      </div>
    </div>
  );
}

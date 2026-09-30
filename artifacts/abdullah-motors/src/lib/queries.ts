import { supabase } from "./supabase";

// ---------- Types ----------

export type CarRow = {
  id: string;
  title: string;
  slug: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: "petrol" | "diesel" | "electric" | "hybrid" | "cng";
  transmission: "manual" | "automatic";
  condition: "new" | "used" | "certified";
  is_featured: boolean;
  status: "available" | "reserved" | "sold";
  engine: string | null;
  color: string | null;
  seating_capacity: number | null;
  description: string | null;
  features: unknown;
  views_count: number;
  created_at: string;
  // joined
  brands: { name: string } | null;
  models: { name: string } | null;
  categories: { name: string } | null;
  car_images: { image_url: string; is_primary: boolean; sort_order: number }[];
};

export type BlogRow = {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  author_id: string | null;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

export type TestimonialRow = {
  id: string;
  customer_name: string;
  avatar_url: string | null;
  rating: number;
  message: string;
  is_approved: boolean;
  created_at: string;
};

export type FinanceApplicationRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  annual_income: number;
  requested_amount: number;
  status: "new" | "reviewing" | "approved" | "declined" | "contacted";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// ---------- Formatters ----------

const CAR_FIELDS = `
  id, title, slug, year, price, mileage,
  fuel_type, transmission, condition,
  is_featured, status, engine, color,
  seating_capacity, description, features,
  views_count, created_at,
  brands ( name ),
  models ( name ),
  categories ( name ),
  car_images ( image_url, is_primary, sort_order )
`.trim();

// ---------- Cars ----------

export async function fetchFeaturedCars(limit = 6): Promise<CarRow[]> {
  const { data, error } = await supabase
    .from("cars")
    .select(CAR_FIELDS)
    .eq("is_featured", true)
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CarRow[];
}

export async function fetchRecentCars(limit = 6): Promise<CarRow[]> {
  const { data, error } = await supabase
    .from("cars")
    .select(CAR_FIELDS)
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CarRow[];
}

export type CarsFilters = {
  brands?: string[];
  categories?: string[];
  fuels?: string[];
  transmissions?: string[];
  conditions?: string[];
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  sort?: "newest" | "price-asc" | "price-desc";
  page?: number;
  pageSize?: number;
};

export async function fetchCars(
  filters: CarsFilters = {},
): Promise<{ cars: CarRow[]; total: number }> {
  const {
    brands = [],
    categories = [],
    fuels = [],
    transmissions = [],
    conditions = [],
    priceMin,
    priceMax,
    yearMin,
    yearMax,
    sort = "newest",
    page = 1,
    pageSize = 9,
  } = filters;

  let query = supabase
    .from("cars")
    .select(CAR_FIELDS + ", count", { count: "exact" })
    .eq("status", "available");

  if (priceMin !== undefined) query = query.gte("price", priceMin);
  if (priceMax !== undefined) query = query.lte("price", priceMax);
  if (yearMin !== undefined) query = query.gte("year", yearMin);
  if (yearMax !== undefined) query = query.lte("year", yearMax);
  if (fuels.length) query = query.in("fuel_type", fuels);
  if (transmissions.length) query = query.in("transmission", transmissions);
  if (conditions.length) query = query.in("condition", conditions);

  // brand/category filter by name — needs a separate step via subquery IDs
  if (brands.length) {
    const { data: brandRows } = await supabase.from("brands").select("id").in("name", brands);
    const ids = (brandRows ?? []).map((b: { id: string }) => b.id);
    if (ids.length) query = query.in("brand_id", ids);
    else return { cars: [], total: 0 };
  }
  if (categories.length) {
    const { data: catRows } = await supabase.from("categories").select("id").in("name", categories);
    const ids = (catRows ?? []).map((c: { id: string }) => c.id);
    if (ids.length) query = query.in("category_id", ids);
    else return { cars: [], total: 0 };
  }

  switch (sort) {
    case "price-asc":
      query = query.order("price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);
  return {
    cars: (data ?? []) as unknown as CarRow[],
    total: count ?? 0,
  };
}

export async function fetchCarBySlug(slug: string): Promise<CarRow | null> {
  const { data, error } = await supabase.from("cars").select(CAR_FIELDS).eq("slug", slug).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data as unknown as CarRow;
}

export async function fetchCarsByIds(ids: string[]): Promise<CarRow[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase.from("cars").select(CAR_FIELDS).in("id", ids);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CarRow[];
}

export async function incrementCarViews(carId: string): Promise<void> {
  const { error } = await supabase.rpc("increment_car_views", { car_id: carId });
  if (error) throw new Error(error.message);
}

// ---------- Brands ----------

export async function fetchBrands(): Promise<
  { id: string; name: string; logo_url: string | null }[]
> {
  const { data, error } = await supabase.from("brands").select("id, name, logo_url").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ---------- Models ----------

export async function fetchModels(brandId?: string): Promise<
  { id: string; brand_id: string; name: string; slug: string }[]
> {
  let query = supabase.from("models").select("id, brand_id, name, slug").order("name");
  if (brandId) query = query.eq("brand_id", brandId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ---------- Categories ----------

export async function fetchCategories(): Promise<
  { id: string; name: string; slug: string }[]
> {
  const { data, error } = await supabase.from("categories").select("id, name, slug").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ---------- Admin: Cars ----------

export type CarAdminRow = {
  id: string;
  title: string;
  slug: string;
  brand_id: string;
  model_id: string;
  category_id: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: "petrol" | "diesel" | "electric" | "hybrid" | "cng";
  transmission: "manual" | "automatic";
  condition: "new" | "used" | "certified";
  color: string | null;
  engine: string | null;
  seating_capacity: number | null;
  description: string | null;
  features: unknown;
  status: "available" | "reserved" | "sold";
  is_featured: boolean;
  views_count: number;
  created_at: string;
  brands: { name: string } | null;
  models: { name: string } | null;
  categories: { name: string } | null;
  car_images: { id: string; image_url: string; is_primary: boolean; sort_order: number }[];
};

const ADMIN_CAR_FIELDS = `
  id, title, slug, brand_id, model_id, category_id,
  year, price, mileage, fuel_type, transmission, condition,
  color, engine, seating_capacity, description, features,
  status, is_featured, views_count, created_at,
  brands ( name ),
  models ( name ),
  categories ( name ),
  car_images ( id, image_url, is_primary, sort_order )
`.trim();

export async function fetchAllCarsAdmin(): Promise<CarAdminRow[]> {
  const { data, error } = await supabase
    .from("cars")
    .select(ADMIN_CAR_FIELDS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CarAdminRow[];
}

export async function fetchCarAdminById(id: string): Promise<CarAdminRow | null> {
  const { data, error } = await supabase
    .from("cars")
    .select(ADMIN_CAR_FIELDS)
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data as unknown as CarAdminRow;
}

// ---------- Testimonials ----------

export async function fetchApprovedTestimonials(limit = 10): Promise<TestimonialRow[]> {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as TestimonialRow[];
}

// ---------- Blogs ----------

export async function fetchPublishedBlogs(limit?: number): Promise<BlogRow[]> {
  let query = supabase
    .from("blogs")
    .select(
      "id, title, slug, content, cover_image_url, status, published_at, created_at, author_id, profiles (full_name, avatar_url)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as BlogRow[];
}

export async function fetchBlogBySlug(slug: string): Promise<BlogRow | null> {
  const { data, error } = await supabase
    .from("blogs")
    .select(
      "id, title, slug, content, cover_image_url, status, published_at, created_at, author_id, profiles (full_name, avatar_url)",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data as unknown as BlogRow;
}

export async function submitFinanceApplication(input: {
  full_name: string;
  email: string;
  phone: string;
  annual_income: number;
  requested_amount: number;
}): Promise<void> {
  const { error } = await supabase
    .from("finance_applications")
    .insert({ ...input, status: "new" });

  if (error) throw new Error(error.message);
}

export async function fetchFinanceApplications(): Promise<FinanceApplicationRow[]> {
  const { data, error } = await supabase
    .from("finance_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as FinanceApplicationRow[];
}

export async function updateFinanceApplication(
  id: string,
  input: {
    status?: FinanceApplicationRow["status"];
    notes?: string | null;
  },
): Promise<FinanceApplicationRow> {
  const { data, error } = await supabase
    .from("finance_applications")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as FinanceApplicationRow;
}

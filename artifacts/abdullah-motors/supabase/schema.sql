-- =============================================================================
-- Abdullah Motors — Full Supabase Database Schema
-- Run this entire file top-to-bottom in the Supabase SQL Editor (one execution).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0.  Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_trgm";    -- trigram indexes for search

-- ---------------------------------------------------------------------------
-- 1.  Custom ENUM types
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role          as enum ('customer', 'staff', 'admin');
  create type fuel_type          as enum ('petrol', 'diesel', 'electric', 'hybrid', 'cng');
  create type transmission_type  as enum ('manual', 'automatic');
  create type car_condition      as enum ('new', 'used', 'certified');
  create type car_status         as enum ('available', 'reserved', 'sold');
  create type enquiry_status     as enum ('new', 'contacted', 'closed');
  create type booking_status     as enum ('pending', 'confirmed', 'completed', 'cancelled');
  create type blog_status        as enum ('draft', 'published');
  create type finance_application_status as enum ('new', 'reviewing', 'approved', 'declined', 'contacted');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2.  TABLES
-- ---------------------------------------------------------------------------

-- 2.1  profiles  (extends auth.users 1-to-1)
create table if not exists public.profiles (
  id          uuid          primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  role        user_role     not null default 'customer',
  avatar_url  text,
  created_at  timestamptz   not null default now()
);

-- 2.2  brands
create table if not exists public.brands (
  id          uuid          primary key default gen_random_uuid(),
  name        text          not null,
  slug        text          not null unique,
  logo_url    text,
  created_at  timestamptz   not null default now()
);

-- 2.3  models
create table if not exists public.models (
  id        uuid  primary key default gen_random_uuid(),
  brand_id  uuid  not null references public.brands (id) on delete cascade,
  name      text  not null,
  slug      text  not null,
  unique (brand_id, slug)
);

-- 2.4  categories
create table if not exists public.categories (
  id    uuid  primary key default gen_random_uuid(),
  name  text  not null,
  slug  text  not null unique
);

-- 2.5  cars
create table if not exists public.cars (
  id                uuid              primary key default gen_random_uuid(),
  title             text              not null,
  slug              text              not null unique,
  brand_id          uuid              not null references public.brands    (id),
  model_id          uuid              not null references public.models    (id),
  category_id       uuid              not null references public.categories (id),
  year              smallint          not null,
  price             numeric(12, 2)    not null,
  mileage           integer           not null default 0,
  fuel_type         fuel_type         not null,
  transmission      transmission_type not null,
  condition         car_condition     not null,
  color             text,
  engine            text,
  seating_capacity  smallint,
  description       text,
  features          jsonb             not null default '[]',
  status            car_status        not null default 'available',
  is_featured       boolean           not null default false,
  views_count       integer           not null default 0,
  created_by        uuid              references public.profiles (id) on delete set null,
  created_at        timestamptz       not null default now(),
  updated_at        timestamptz       not null default now()
);

-- 2.6  car_images
create table if not exists public.car_images (
  id          uuid     primary key default gen_random_uuid(),
  car_id      uuid     not null references public.cars (id) on delete cascade,
  image_url   text     not null,
  is_primary  boolean  not null default false,
  sort_order  integer  not null default 0
);

-- 2.7  enquiries
create table if not exists public.enquiries (
  id          uuid            primary key default gen_random_uuid(),
  car_id      uuid            references public.cars (id) on delete set null,
  name        text            not null,
  email       text            not null,
  phone       text,
  subject     text,
  message     text            not null,
  status      enquiry_status  not null default 'new',
  created_at  timestamptz     not null default now()
);

-- 2.8  test_drive_bookings
create table if not exists public.test_drive_bookings (
  id              uuid            primary key default gen_random_uuid(),
  car_id          uuid            not null references public.cars (id) on delete cascade,
  name            text            not null,
  email           text            not null,
  phone           text            not null,
  preferred_date  date            not null,
  preferred_time  text            not null,
  status          booking_status  not null default 'pending',
  notes           text,
  created_at      timestamptz     not null default now()
);

-- 2.9  testimonials
create table if not exists public.testimonials (
  id             uuid         primary key default gen_random_uuid(),
  customer_name  text         not null,
  avatar_url     text,
  rating         smallint     not null check (rating between 1 and 5),
  message        text         not null,
  car_id         uuid         references public.cars (id) on delete set null,
  is_approved    boolean      not null default false,
  created_at     timestamptz  not null default now()
);

-- 2.10  blogs
create table if not exists public.blogs (
  id               uuid         primary key default gen_random_uuid(),
  title            text         not null,
  slug             text         not null unique,
  content          text         not null,
  cover_image_url  text,
  author_id        uuid         references public.profiles (id) on delete set null,
  status           blog_status  not null default 'draft',
  published_at     timestamptz,
  created_at       timestamptz  not null default now()
);

-- 2.11  newsletter_subscribers
create table if not exists public.newsletter_subscribers (
  id             uuid         primary key default gen_random_uuid(),
  email          text         not null unique,
  subscribed_at  timestamptz  not null default now()
);

-- 2.12  finance_applications
create table if not exists public.finance_applications (
  id               uuid                      primary key default gen_random_uuid(),
  full_name        text                      not null,
  email            text                      not null,
  phone            text                      not null,
  annual_income    numeric(12, 2)             not null check (annual_income > 0),
  requested_amount numeric(12, 2)             not null check (requested_amount > 0),
  status           finance_application_status not null default 'new',
  notes            text,
  created_at       timestamptz                not null default now(),
  updated_at       timestamptz                not null default now()
);

-- ---------------------------------------------------------------------------
-- 3.  INDEXES
-- ---------------------------------------------------------------------------
create index if not exists idx_cars_slug        on public.cars (slug);
create index if not exists idx_cars_status      on public.cars (status);
create index if not exists idx_cars_brand_id    on public.cars (brand_id);
create index if not exists idx_cars_category_id on public.cars (category_id);
create index if not exists idx_cars_is_featured on public.cars (is_featured);
create index if not exists idx_cars_composite   on public.cars (status, is_featured, created_at desc);
create index if not exists idx_blogs_slug       on public.blogs (slug);
create index if not exists idx_blogs_status     on public.blogs (status);
create index if not exists idx_finance_applications_status
  on public.finance_applications (status);
create index if not exists idx_finance_applications_created_at
  on public.finance_applications (created_at desc);

-- ---------------------------------------------------------------------------
-- 4.  TRIGGER — auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 5.  TRIGGER — auto-update updated_at on cars
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cars_set_updated_at on public.cars;
create trigger cars_set_updated_at
  before update on public.cars
  for each row execute procedure public.set_updated_at();

drop trigger if exists finance_applications_set_updated_at on public.finance_applications;
create trigger finance_applications_set_updated_at
  before update on public.finance_applications
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5.1  FUNCTION — increment_car_views (bypasses RLS write restriction)
-- ---------------------------------------------------------------------------
create or replace function public.increment_car_views(car_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.cars
  set views_count = views_count + 1
  where id = car_id and status = 'available';
end;
$$;
revoke all on function public.increment_car_views(uuid) from public;
grant execute on function public.increment_car_views(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6.  ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

-- Enable RLS on every table
alter table public.profiles              enable row level security;
alter table public.brands                enable row level security;
alter table public.models                enable row level security;
alter table public.categories            enable row level security;
alter table public.cars                  enable row level security;
alter table public.car_images            enable row level security;
alter table public.enquiries             enable row level security;
alter table public.test_drive_bookings   enable row level security;
alter table public.testimonials          enable row level security;
alter table public.blogs                 enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.finance_applications  enable row level security;

-- Helper: is the caller an admin or staff?
create or replace function public.is_staff_or_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'staff')
  );
$$;

-- Make the policy section safe to re-run.
drop policy if exists "Public cannot read profiles" on public.profiles;
drop policy if exists "Own profile readable" on public.profiles;
drop policy if exists "Staff can manage profiles" on public.profiles;
drop policy if exists "Anyone can read brands" on public.brands;
drop policy if exists "Staff can manage brands" on public.brands;
drop policy if exists "Anyone can read models" on public.models;
drop policy if exists "Staff can manage models" on public.models;
drop policy if exists "Anyone can read categories" on public.categories;
drop policy if exists "Staff can manage categories" on public.categories;
drop policy if exists "Anyone can read available cars" on public.cars;
drop policy if exists "Staff can manage cars" on public.cars;
drop policy if exists "Anyone can read car images" on public.car_images;
drop policy if exists "Staff can manage car images" on public.car_images;
drop policy if exists "Anyone can submit enquiry" on public.enquiries;
drop policy if exists "Staff can manage enquiries" on public.enquiries;
drop policy if exists "Anyone can book test drive" on public.test_drive_bookings;
drop policy if exists "Staff can manage bookings" on public.test_drive_bookings;
drop policy if exists "Anyone can read approved testimonials" on public.testimonials;
drop policy if exists "Anyone can submit testimonial" on public.testimonials;
drop policy if exists "Staff can manage testimonials" on public.testimonials;
drop policy if exists "Anyone can read published blogs" on public.blogs;
drop policy if exists "Staff can manage blogs" on public.blogs;
drop policy if exists "Anyone can subscribe" on public.newsletter_subscribers;
drop policy if exists "Staff can manage subscribers" on public.newsletter_subscribers;
drop policy if exists "Anyone can submit finance application" on public.finance_applications;
drop policy if exists "Staff can manage finance applications" on public.finance_applications;

-- ---- profiles ----
create policy "Public cannot read profiles"    on public.profiles for select using (false);
create policy "Own profile readable"           on public.profiles for select using (auth.uid() = id);
create policy "Staff can manage profiles"      on public.profiles for all    using (public.is_staff_or_admin());

-- ---- brands ----
create policy "Anyone can read brands"         on public.brands for select using (true);
create policy "Staff can manage brands"        on public.brands for all    using (public.is_staff_or_admin());

-- ---- models ----
create policy "Anyone can read models"         on public.models for select using (true);
create policy "Staff can manage models"        on public.models for all    using (public.is_staff_or_admin());

-- ---- categories ----
create policy "Anyone can read categories"     on public.categories for select using (true);
create policy "Staff can manage categories"    on public.categories for all    using (public.is_staff_or_admin());

-- ---- cars ----
create policy "Anyone can read available cars" on public.cars for select using (status = 'available');
create policy "Staff can manage cars"          on public.cars for all    using (public.is_staff_or_admin());

-- ---- car_images ----
create policy "Anyone can read car images"     on public.car_images for select using (true);
create policy "Staff can manage car images"    on public.car_images for all    using (public.is_staff_or_admin());

-- ---- enquiries ----
create policy "Anyone can submit enquiry"      on public.enquiries for insert with check (true);
create policy "Staff can manage enquiries"     on public.enquiries for all    using (public.is_staff_or_admin());

-- ---- test_drive_bookings ----
create policy "Anyone can book test drive"     on public.test_drive_bookings for insert with check (true);
create policy "Staff can manage bookings"      on public.test_drive_bookings for all    using (public.is_staff_or_admin());

-- ---- testimonials ----
create policy "Anyone can read approved testimonials"
  on public.testimonials for select using (is_approved = true);
create policy "Anyone can submit testimonial"
  on public.testimonials for insert with check (is_approved = false);
create policy "Staff can manage testimonials"
  on public.testimonials for all using (public.is_staff_or_admin());

-- ---- blogs ----
create policy "Anyone can read published blogs"
  on public.blogs for select using (status = 'published');
create policy "Staff can manage blogs"
  on public.blogs for all using (public.is_staff_or_admin());

-- ---- newsletter_subscribers ----
create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert with check (true);
create policy "Staff can manage subscribers"
  on public.newsletter_subscribers for all using (public.is_staff_or_admin());

-- ---- finance_applications ----
create policy "Anyone can submit finance application"
  on public.finance_applications for insert
  with check (status = 'new');
create policy "Staff can manage finance applications"
  on public.finance_applications for all
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

-- ---------------------------------------------------------------------------
-- 7.  STORAGE BUCKETS
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('car-images',  'car-images',  true),
  ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

-- Public read on car-images
create policy "Public read car-images"
  on storage.objects for select
  using (bucket_id = 'car-images');

-- Authenticated staff/admin write on car-images
create policy "Staff write car-images"
  on storage.objects for insert
  with check (
    bucket_id = 'car-images'
    and auth.role() = 'authenticated'
    and public.is_staff_or_admin()
  );

create policy "Staff update car-images"
  on storage.objects for update
  using (
    bucket_id = 'car-images'
    and auth.role() = 'authenticated'
    and public.is_staff_or_admin()
  );

create policy "Staff delete car-images"
  on storage.objects for delete
  using (
    bucket_id = 'car-images'
    and auth.role() = 'authenticated'
    and public.is_staff_or_admin()
  );

-- Public read on blog-images
create policy "Public read blog-images"
  on storage.objects for select
  using (bucket_id = 'blog-images');

-- Authenticated staff/admin write on blog-images
create policy "Staff write blog-images"
  on storage.objects for insert
  with check (
    bucket_id = 'blog-images'
    and auth.role() = 'authenticated'
    and public.is_staff_or_admin()
  );

create policy "Staff update blog-images"
  on storage.objects for update
  using (
    bucket_id = 'blog-images'
    and auth.role() = 'authenticated'
    and public.is_staff_or_admin()
  );

create policy "Staff delete blog-images"
  on storage.objects for delete
  using (
    bucket_id = 'blog-images'
    and auth.role() = 'authenticated'
    and public.is_staff_or_admin()
  );

-- ---------------------------------------------------------------------------
-- 8.  SEED DATA
-- ---------------------------------------------------------------------------

-- 8.1  Brands
insert into public.brands (id, name, slug, logo_url) values
  ('00000000-0000-0000-0000-000000000001', 'Toyota',     'toyota',     null),
  ('00000000-0000-0000-0000-000000000002', 'Honda',      'honda',      null),
  ('00000000-0000-0000-0000-000000000003', 'BMW',        'bmw',        null),
  ('00000000-0000-0000-0000-000000000004', 'Tesla',      'tesla',      null),
  ('00000000-0000-0000-0000-000000000005', 'Hyundai',    'hyundai',    null)
on conflict (slug) do nothing;

-- 8.2  Models
insert into public.models (id, brand_id, name, slug) values
  -- Toyota
  ('00000000-0000-0001-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Camry',     'camry'),
  ('00000000-0000-0001-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Fortuner',  'fortuner'),
  ('00000000-0000-0001-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Corolla',   'corolla'),
  -- Honda
  ('00000000-0000-0001-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Civic',     'civic'),
  ('00000000-0000-0001-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'CR-V',      'cr-v'),
  ('00000000-0000-0001-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'City',      'city'),
  -- BMW
  ('00000000-0000-0001-0000-000000000007', '00000000-0000-0000-0000-000000000003', '3 Series',  '3-series'),
  ('00000000-0000-0001-0000-000000000008', '00000000-0000-0000-0000-000000000003', '5 Series',  '5-series'),
  ('00000000-0000-0001-0000-000000000009', '00000000-0000-0000-0000-000000000003', 'X5',        'x5'),
  -- Tesla
  ('00000000-0000-0001-0000-000000000010', '00000000-0000-0000-0000-000000000004', 'Model 3',   'model-3'),
  ('00000000-0000-0001-0000-000000000011', '00000000-0000-0000-0000-000000000004', 'Model Y',   'model-y'),
  -- Hyundai
  ('00000000-0000-0001-0000-000000000012', '00000000-0000-0000-0000-000000000005', 'Tucson',    'tucson'),
  ('00000000-0000-0001-0000-000000000013', '00000000-0000-0000-0000-000000000005', 'Creta',     'creta')
on conflict do nothing;

-- 8.3  Categories
insert into public.categories (id, name, slug) values
  ('00000000-0000-0002-0000-000000000001', 'SUV',       'suv'),
  ('00000000-0000-0002-0000-000000000002', 'Sedan',     'sedan'),
  ('00000000-0000-0002-0000-000000000003', 'Hatchback', 'hatchback'),
  ('00000000-0000-0002-0000-000000000004', 'Electric',  'electric'),
  ('00000000-0000-0002-0000-000000000005', 'Luxury',    'luxury')
on conflict (slug) do nothing;

-- 8.4  Cars (15 cars)
insert into public.cars (
  id, title, slug, brand_id, model_id, category_id,
  year, price, mileage, fuel_type, transmission, condition,
  color, engine, seating_capacity, description,
  features, status, is_featured
) values
  -- 1
  ('00000000-0000-0003-0000-000000000001',
   'Toyota Camry 2024 – Hybrid Elite',
   'toyota-camry-2024-hybrid-elite',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0001-0000-000000000001',
   '00000000-0000-0002-0000-000000000002',
   2024, 4200000, 0, 'hybrid', 'automatic', 'new',
   'Pearl White', '2.5L Hybrid', 5,
   'The all-new Camry Hybrid Elite blends striking design with exceptional efficiency.',
   '["Apple CarPlay","Android Auto","Adaptive Cruise Control","Lane Keep Assist","Wireless Charging"]',
   'available', true),

  -- 2
  ('00000000-0000-0003-0000-000000000002',
   'Toyota Fortuner 2023 – Sigma 4',
   'toyota-fortuner-2023-sigma-4',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0001-0000-000000000002',
   '00000000-0000-0002-0000-000000000001',
   2023, 5500000, 12000, 'diesel', 'automatic', 'used',
   'Sparkling Black', '2.8L 4-Cylinder Turbo Diesel', 7,
   'Powerful SUV with legendary off-road capability and luxury interior.',
   '["4WD","Rear AC","Premium Sound System","Leather Seats","Sunroof"]',
   'available', true),

  -- 3
  ('00000000-0000-0003-0000-000000000003',
   'Honda Civic 2024 – RS Turbo',
   'honda-civic-2024-rs-turbo',
   '00000000-0000-0000-0000-000000000002',
   '00000000-0000-0001-0000-000000000004',
   '00000000-0000-0002-0000-000000000002',
   2024, 3100000, 0, 'petrol', 'automatic', 'new',
   'Sonic Grey Pearl', '1.5L VTEC Turbo', 5,
   'The Civic RS Turbo offers sporty performance with everyday practicality.',
   '["Honda Sensing","10.2\" Touchscreen","Bose Audio","LED Headlights","Smart Entry"]',
   'available', true),

  -- 4
  ('00000000-0000-0003-0000-000000000004',
   'Honda CR-V 2023 – Prestige',
   'honda-crv-2023-prestige',
   '00000000-0000-0000-0000-000000000002',
   '00000000-0000-0001-0000-000000000005',
   '00000000-0000-0002-0000-000000000001',
   2023, 4800000, 8500, 'petrol', 'automatic', 'certified',
   'Lunar Silver', '1.5L Turbo', 5,
   'Certified pre-owned CR-V with full service history and warranty coverage.',
   '["Panoramic Sunroof","Heated Seats","Wireless CarPlay","360 Camera","Honda Sensing"]',
   'available', false),

  -- 5
  ('00000000-0000-0003-0000-000000000005',
   'BMW 3 Series 2024 – M Sport',
   'bmw-3-series-2024-m-sport',
   '00000000-0000-0000-0000-000000000003',
   '00000000-0000-0001-0000-000000000007',
   '00000000-0000-0002-0000-000000000005',
   2024, 8900000, 0, 'petrol', 'automatic', 'new',
   'Alpine White', '2.0L TwinPower Turbo', 5,
   'Precision, performance, and pure driving pleasure in every corner.',
   '["M Sport Package","Live Cockpit Pro","Harman Kardon","Adaptive Suspension","Head-Up Display"]',
   'available', true),

  -- 6
  ('00000000-0000-0003-0000-000000000006',
   'BMW 5 Series 2023 – Luxury Line',
   'bmw-5-series-2023-luxury-line',
   '00000000-0000-0000-0000-000000000003',
   '00000000-0000-0001-0000-000000000008',
   '00000000-0000-0002-0000-000000000005',
   2023, 11200000, 15000, 'petrol', 'automatic', 'used',
   'Carbon Black', '3.0L 6-Cylinder', 5,
   'The ultimate executive sedan, offering unrivalled comfort and technology.',
   '["Massage Seats","Bowers & Wilkins Audio","Executive Lounge","Gesture Control","Full LED"]',
   'available', false),

  -- 7
  ('00000000-0000-0003-0000-000000000007',
   'Tesla Model 3 2024 – Long Range AWD',
   'tesla-model-3-2024-long-range-awd',
   '00000000-0000-0000-0000-000000000004',
   '00000000-0000-0001-0000-000000000010',
   '00000000-0000-0002-0000-000000000004',
   2024, 6800000, 0, 'electric', 'automatic', 'new',
   'Deep Blue', 'Dual Motor AWD', 5,
   '358-mile range, 0-60 in 4.2 seconds — the perfect blend of range and performance.',
   '["Autopilot","15\" Touchscreen","Over-the-Air Updates","Sentry Mode","Premium Audio"]',
   'available', true),

  -- 8
  ('00000000-0000-0003-0000-000000000008',
   'Tesla Model Y 2024 – Performance',
   'tesla-model-y-2024-performance',
   '00000000-0000-0000-0000-000000000004',
   '00000000-0000-0001-0000-000000000011',
   '00000000-0000-0002-0000-000000000004',
   2024, 8500000, 2000, 'electric', 'automatic', 'new',
   'Midnight Silver', 'Performance Dual Motor', 7,
   'Uncompromising performance SUV with 330+ mile range and third-row seating.',
   '["Full Self-Driving","Glass Roof","Tow Package","Heated Rear Seats","Premium Audio"]',
   'available', true),

  -- 9
  ('00000000-0000-0003-0000-000000000009',
   'Hyundai Tucson 2024 – N Line',
   'hyundai-tucson-2024-n-line',
   '00000000-0000-0000-0000-000000000005',
   '00000000-0000-0001-0000-000000000012',
   '00000000-0000-0002-0000-000000000001',
   2024, 3900000, 0, 'petrol', 'automatic', 'new',
   'Shadow Gray', '1.6L Turbo', 5,
   'Sporty N Line styling with advanced safety and connectivity.',
   '["Bose Premium Audio","10.25\" Navigation","Heated Seats","BlueLink Connected","Smart Cruise"]',
   'available', false),

  -- 10
  ('00000000-0000-0003-0000-000000000010',
   'Hyundai Creta 2024 – SX(O)',
   'hyundai-creta-2024-sxo',
   '00000000-0000-0000-0000-000000000005',
   '00000000-0000-0001-0000-000000000013',
   '00000000-0000-0002-0000-000000000001',
   2024, 2100000, 0, 'petrol', 'automatic', 'new',
   'Abyss Black', '1.4L T-GDi', 5,
   'India''s most popular compact SUV, fully loaded with premium features.',
   '["Panoramic Sunroof","Bose Sound","360 Camera","ADAS","Ventilated Seats"]',
   'available', true),

  -- 11
  ('00000000-0000-0003-0000-000000000011',
   'BMW X5 2023 – xDrive40i',
   'bmw-x5-2023-xdrive40i',
   '00000000-0000-0000-0000-000000000003',
   '00000000-0000-0001-0000-000000000009',
   '00000000-0000-0002-0000-000000000005',
   2023, 13500000, 18000, 'petrol', 'automatic', 'used',
   'Sophisto Grey', '3.0L 6-Cyl Turbo', 7,
   'Flagship luxury SUV with xDrive AWD and the newest BMW Operating System 8.',
   '["Panoramic Sky Lounge","Bowers & Wilkins","Third Row","Air Suspension","Driving Assistant Pro"]',
   'available', false),

  -- 12
  ('00000000-0000-0003-0000-000000000012',
   'Toyota Corolla 2024 – Altis Premium',
   'toyota-corolla-2024-altis-premium',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0001-0000-000000000003',
   '00000000-0000-0002-0000-000000000002',
   2024, 2800000, 0, 'petrol', 'automatic', 'new',
   'Platinum White Pearl', '1.8L VVT-i', 5,
   'The world''s best-selling car, reimagined with a bold new design and Toyota Safety Sense.',
   '["Toyota Safety Sense","9\" Touchscreen","Wireless CarPlay","LED Headlights","Smart Entry"]',
   'available', false),

  -- 13
  ('00000000-0000-0003-0000-000000000013',
   'Honda City 2023 – ZX CVT',
   'honda-city-2023-zx-cvt',
   '00000000-0000-0000-0000-000000000002',
   '00000000-0000-0001-0000-000000000006',
   '00000000-0000-0002-0000-000000000002',
   2023, 1650000, 22000, 'petrol', 'automatic', 'certified',
   'Radiant Red', '1.5L i-VTEC', 5,
   'Certified pre-owned City ZX — the premium sedan choice for families.',
   '["Honda Sensing","8\" Touchscreen","Sunroof","One-Touch Power Windows","Rear Camera"]',
   'available', false),

  -- 14
  ('00000000-0000-0003-0000-000000000014',
   'Hyundai Tucson 2022 – Platinum DCT',
   'hyundai-tucson-2022-platinum',
   '00000000-0000-0000-0000-000000000005',
   '00000000-0000-0001-0000-000000000012',
   '00000000-0000-0002-0000-000000000001',
   2022, 2600000, 35000, 'petrol', 'automatic', 'used',
   'Phantom Black', '2.0L MPi', 5,
   'Low-mileage used Tucson with full service record and fresh inspection certificate.',
   '["SmartSense","Dual Sunroof","Leather Seats","10.25\" Screen","Wireless Charging"]',
   'available', false),

  -- 15
  ('00000000-0000-0003-0000-000000000015',
   'Tesla Model 3 2022 – Standard Range RWD',
   'tesla-model-3-2022-standard-range',
   '00000000-0000-0000-0000-000000000004',
   '00000000-0000-0001-0000-000000000010',
   '00000000-0000-0002-0000-000000000004',
   2022, 4200000, 28000, 'electric', 'automatic', 'used',
   'Pearl White Multi-Coat', 'Single Motor RWD', 5,
   '272-mile range, low total cost of ownership, and full software update history available.',
   '["Autopilot","Sentry Mode","15\" Touchscreen","Premium Audio","Over-the-Air Updates"]',
   'available', false)

on conflict (slug) do nothing;

-- 8.5  Approved Testimonials
insert into public.testimonials (customer_name, rating, message, is_approved) values
  ('Arjun Mehta',      5,
   'Bought a Tesla Model 3 from Abdullah Motors and the experience was seamless. The team was transparent with pricing and the delivery was on time. Highly recommend!',
   true),
  ('Sana Qureshi',     5,
   'The showroom ambiance and the knowledge of the sales team blew me away. Got my BMW 3 Series exactly as spec''d online. Zero surprises — just delight.',
   true),
  ('Ravi Fernandez',   4,
   'Great selection of certified pre-owned cars. Picked up a Honda CR-V at a great price with a fresh warranty. Minor paperwork delay but the team was very helpful.',
   true),
  ('Fatima Al-Hassan', 5,
   'First-time car buyer and they made the whole financing process stress-free. My Hyundai Creta was delivered spotless with a full tank. Five stars!',
   true)
on conflict do nothing;

-- 8.6  Published Blog Posts
insert into public.blogs (title, slug, content, status, published_at) values
  (
    'Top 5 Electric Cars in India 2024: Our Expert Picks',
    'top-5-electric-cars-india-2024',
    'The electric vehicle revolution has finally arrived in India at scale. With longer ranges, faster charging networks, and competitive prices, 2024 is the year to make the switch.

## 1. Tesla Model 3 Long Range
Unmatched software, over-the-air updates, and a supercharger network that puts competition to shame. At ₹68 lakh, it''s premium but worth every rupee.

## 2. Hyundai Ioniq 5
A stunning design language paired with ultra-fast 800V charging. The Ioniq 5 recharges 10–80% in under 18 minutes at a compatible DCFC station.

## 3. Tata Nexon EV Max
The value king. 437 km claimed range and Tata''s extensive service network make it the pragmatic choice for first-time EV buyers.

## 4. BYD Atto 3
Chinese quality that surprises at every turn. Loaded with features and backed by a competitive warranty.

## 5. MG ZS EV Excite Pro
Practical family EV with solid real-world range, best-in-class warranty, and a growing fast-charging ecosystem.

Make the switch — the running costs alone pay for the premium in 3–4 years.',
    'published',
    now() - interval '7 days'
  ),
  (
    'How to Inspect a Used Car Like a Pro',
    'how-to-inspect-used-car-like-a-pro',
    'Buying a used car is one of the best financial decisions you can make — if you know what to look for. Here''s our complete checklist.

## Exterior Checks
- Inspect all panel gaps under natural daylight — uneven gaps signal a past accident.
- Look down the side of each panel for ripples or waviness (paintwork repairs).
- Check tyre wear patterns — uneven wear indicates suspension or alignment issues.

## Under the Hood
- Oil should be amber-brown, not black and gritty.
- Coolant should be green, pink, or orange — never milky (head gasket red flag).
- Check all belts for cracking or fraying.

## Interior
- Test every button, knob, and screen.
- Check seat bolster wear — high-mileage cars show it quickly.
- Smell for mould (flood damage) or burning (electrical issues).

## Test Drive
- Accelerate hard from a standstill — any hesitation or judder?
- Brake firmly at 60 km/h — does the car pull to one side?
- Park and check underneath for fresh fluid spots.

All our certified pre-owned vehicles have passed a 150-point inspection covering every item above — and more.',
    'published',
    now() - interval '3 days'
  )
on conflict (slug) do nothing;

-- =============================================================================
-- End of schema — ready to run in Supabase SQL Editor.
-- =============================================================================

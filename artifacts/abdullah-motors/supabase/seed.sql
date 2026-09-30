-- Abdullah Motors demo seed
-- Run after schema.sql. Every statement is safe to run more than once.

insert into public.brands (id, name, slug, logo_url) values
  ('00000000-0000-0000-0000-000000000001', 'Toyota', 'toyota', null),
  ('00000000-0000-0000-0000-000000000002', 'Honda', 'honda', null),
  ('00000000-0000-0000-0000-000000000004', 'Tesla', 'tesla', null)
on conflict (slug) do update set name = excluded.name;

insert into public.models (id, brand_id, name, slug) values
  ('00000000-0000-0001-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Camry', 'camry'),
  ('00000000-0000-0001-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Civic', 'civic'),
  ('00000000-0000-0001-0000-000000000010', '00000000-0000-0000-0000-000000000004', 'Model 3', 'model-3')
on conflict (brand_id, slug) do update set name = excluded.name;

insert into public.categories (id, name, slug) values
  ('00000000-0000-0002-0000-000000000001', 'SUV', 'suv'),
  ('00000000-0000-0002-0000-000000000002', 'Sedan', 'sedan'),
  ('00000000-0000-0002-0000-000000000004', 'Electric', 'electric')
on conflict (slug) do update set name = excluded.name;

insert into public.cars (
  id, title, slug, brand_id, model_id, category_id, year, price, mileage,
  fuel_type, transmission, condition, color, engine, seating_capacity,
  description, features, status, is_featured
) values
  (
    '10000000-0000-0000-0000-000000000001',
    'Toyota Camry 2024 Hybrid Elite',
    'demo-toyota-camry-2024-hybrid-elite',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0001-0000-000000000001',
    '00000000-0000-0002-0000-000000000002',
    2024, 4200000, 0, 'hybrid', 'automatic', 'new',
    'Pearl White', '2.5L Hybrid', 5,
    'A refined hybrid sedan prepared for quiet commutes and confident long-distance drives.',
    '["Apple CarPlay","Adaptive Cruise Control","Lane Keep Assist","Wireless Charging"]',
    'available', true
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Honda Civic 2024 RS Turbo',
    'demo-honda-civic-2024-rs-turbo',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0001-0000-000000000004',
    '00000000-0000-0002-0000-000000000002',
    2024, 3100000, 0, 'petrol', 'automatic', 'new',
    'Sonic Grey Pearl', '1.5L VTEC Turbo', 5,
    'A composed daily sedan with a sharper edge, clean history, and full modern safety kit.',
    '["Honda Sensing","10.2-inch Touchscreen","Bose Audio","LED Headlights"]',
    'available', true
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Tesla Model 3 Long Range AWD',
    'demo-tesla-model-3-long-range-awd',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0001-0000-000000000010',
    '00000000-0000-0002-0000-000000000004',
    2024, 6800000, 0, 'electric', 'automatic', 'new',
    'Deep Blue', 'Dual Motor AWD', 5,
    'Long-range electric performance with a transparent delivery history and complete software records.',
    '["Autopilot","Over-the-Air Updates","Sentry Mode","Premium Audio"]',
    'available', true
  )
on conflict (slug) do nothing;

insert into public.car_images (car_id, image_url, is_primary, sort_order)
select * from (
  values
    ('10000000-0000-0000-0000-000000000001'::uuid, 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1800&q=85', true, 0),
    ('10000000-0000-0000-0000-000000000002'::uuid, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1800&q=85', true, 0),
    ('10000000-0000-0000-0000-000000000003'::uuid, 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1800&q=85', true, 0)
) as sample(car_id, image_url, is_primary, sort_order)
where not exists (
  select 1 from public.car_images existing
  where existing.car_id = sample.car_id and existing.image_url = sample.image_url
);

insert into public.testimonials (customer_name, rating, message, is_approved)
select sample.customer_name, sample.rating, sample.message, true
from (
  values
    ('Arjun Mehta', 5, 'The team explained every step, kept the pricing clear, and delivered my car exactly when promised.'),
    ('Sana Qureshi', 5, 'A calm, knowledgeable buying experience. The inspection and handover were both thorough.')
) as sample(customer_name, rating, message)
where not exists (
  select 1 from public.testimonials existing
  where existing.customer_name = sample.customer_name and existing.message = sample.message
);

insert into public.blogs (title, slug, content, status, published_at)
values
  (
    'How to Inspect a Used Car Like a Pro',
    'demo-how-to-inspect-a-used-car',
    E'Buying a used car is a smart decision when you know what to check.\\n\\n## Exterior\\nLook for consistent panel gaps, matching paint, and even tyre wear.\\n\\n## Test drive\\nListen for unusual sounds, test the brakes, and confirm the steering stays straight.\\n\\nEvery Abdullah Motors certified vehicle also receives a documented inspection before it reaches the showroom.',
    'published',
    now() - interval '3 days'
  ),
  (
    'Should Your Next Car Be Hybrid or Electric?',
    'demo-hybrid-or-electric',
    E'Hybrids are a flexible bridge for mixed driving, while electric vehicles reward drivers with lower running costs and a quieter daily experience. Consider your charging access, typical distance, and ownership timeline before choosing.',
    'published',
    now() - interval '1 day'
  )
on conflict (slug) do nothing;
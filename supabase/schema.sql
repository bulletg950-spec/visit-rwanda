-- =====================================================================
-- VISIT RWANDA: full schema, constraints, indexes, RLS, RPCs, storage
-- Run once in Supabase SQL Editor (or `supabase db push`).
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- 1. ROLES & PROFILES ----------
create table if not exists public.roles (
  name text primary key,
  description text,
  permissions jsonb not null default '[]'::jsonb
);
insert into public.roles (name, description, permissions) values
 ('user','Regular visitor','["bookings:own","reviews:own"]'),
 ('super_admin','Full control over the platform','["*"]'),
 ('admin','Manage attractions, users, bookings and content','["attractions","users","bookings","content","reviews","messages","reports"]'),
 ('content_manager','Manage images, videos, destinations, descriptions','["attractions","media","destinations","products"]'),
 ('booking_manager','Manage reservations and booking requests','["bookings","messages","reports"]'),
 ('editor','Edit and publish tourism content','["attractions","content","reviews"]')
on conflict (name) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  nationality text,
  avatar_url text,
  role text not null default 'user' references public.roles(name),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_role_idx on public.profiles(role);

-- Role helpers (SECURITY DEFINER so RLS policies can use them without recursion)
create or replace function public.current_role_name() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;
create or replace function public.has_role(r text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() = any(r), false)
$$;
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(array['super_admin','admin','content_manager','booking_manager','editor'])
$$;

-- New auth user -> profile (ALWAYS role 'user'; role comes from metadata never)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone, avatar_url)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Block privilege escalation: only a super_admin (or the SQL editor / service role) can change role or is_active
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at = now();
  if auth.uid() is not null and (new.role is distinct from old.role or new.is_active is distinct from old.is_active or new.id is distinct from old.id) then
    if not public.has_role(array['super_admin']) then
      raise exception 'Only a super admin can change roles or account status';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ---------- 2. CONTENT TABLES ----------
create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  province text check (province in ('Kigali City','Northern','Southern','Eastern','Western')),
  tagline text,
  description text,
  hero_image_url text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attractions (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references public.destinations(id) on delete set null,
  name text not null,
  slug text not null unique,
  category text not null default 'recreation' check (category in
    ('national_park','lake','mountain','adventure','wildlife','cultural','historical','museum','city','recreation','landscape')),
  short_description text,
  description text,
  main_image_url text,
  province text check (province in ('Kigali City','Northern','Southern','Eastern','Western')),
  district text,
  sector text,
  exact_location text,
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  google_maps_url text,
  contact_phone text,
  contact_email text,
  website_url text,
  opening_hours text,
  entrance_fee_info text,
  entrance_fee_amount numeric(12,2) check (entrance_fee_amount is null or entrance_fee_amount >= 0),
  currency text not null default 'USD',
  activities text[] not null default '{}',
  accommodation_info text,
  facilities text[] not null default '{}',
  accessibility_info text,
  best_time_to_visit text,
  visit_duration text,
  safety_info text,
  faqs jsonb not null default '[]'::jsonb,
  booking_enabled boolean not null default true,
  available_times text[] not null default '{08:00,10:00,13:00,15:00}',
  daily_capacity int check (daily_capacity is null or daily_capacity > 0),
  max_group_size int not null default 20 check (max_group_size > 0),
  cancellation_hours int not null default 48 check (cancellation_hours >= 0),
  cancellation_policy text,
  verification_status text not null default 'awaiting' check (verification_status in ('verified','awaiting')),
  verification_notes text,
  verified_at timestamptz,
  is_demo boolean not null default false,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists attractions_province_idx on public.attractions(province);
create index if not exists attractions_category_idx on public.attractions(category);
create index if not exists attractions_destination_idx on public.attractions(destination_id);
create index if not exists attractions_published_idx on public.attractions(is_published, is_featured);

create table if not exists public.attraction_images (
  id uuid primary key default gen_random_uuid(),
  attraction_id uuid not null references public.attractions(id) on delete cascade,
  url text not null,
  alt_text text,
  display_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists attraction_images_attr_idx on public.attraction_images(attraction_id, display_order);

create table if not exists public.attraction_videos (
  id uuid primary key default gen_random_uuid(),
  attraction_id uuid not null references public.attractions(id) on delete cascade,
  title text not null,
  description text,
  video_url text not null,
  poster_url text,
  display_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists attraction_videos_attr_idx on public.attraction_videos(attraction_id, display_order);

create table if not exists public.tourism_products (
  id uuid primary key default gen_random_uuid(),
  attraction_id uuid references public.attractions(id) on delete cascade,
  name text not null,
  slug text not null unique,
  product_type text not null default 'experience' check (product_type in ('experience','accommodation','ticket','transport')),
  description text,
  image_url text,
  price numeric(12,2) check (price is null or price >= 0),   -- null = price to be confirmed
  currency text not null default 'USD',
  daily_capacity int check (daily_capacity is null or daily_capacity > 0),
  is_demo boolean not null default false,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tourism_products_attr_idx on public.tourism_products(attraction_id);
create index if not exists tourism_products_type_idx on public.tourism_products(product_type, is_published);

create table if not exists public.tourism_packages (
  id uuid primary key default gen_random_uuid(),
  attraction_id uuid references public.attractions(id) on delete set null,
  title text not null,
  slug text not null unique,
  description text,
  image_url text,
  duration_days int check (duration_days is null or duration_days > 0),
  price_per_person numeric(12,2) check (price_per_person is null or price_per_person >= 0),
  currency text not null default 'USD',
  includes text[] not null default '{}',
  is_demo boolean not null default false,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- 3. BOOKINGS & AVAILABILITY ----------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references public.profiles(id) on delete restrict,
  attraction_id uuid not null references public.attractions(id) on delete restrict,
  product_id uuid references public.tourism_products(id) on delete set null,
  package_id uuid references public.tourism_packages(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null,
  nationality text,
  experience text,
  booking_date date not null,
  preferred_time text,
  visitors int not null check (visitors > 0),
  special_requests text,
  unit_price numeric(12,2) check (unit_price is null or unit_price >= 0),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bookings_user_idx on public.bookings(user_id, created_at desc);
create index if not exists bookings_capacity_idx on public.bookings(attraction_id, booking_date, status);
create index if not exists bookings_status_idx on public.bookings(status);

create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  attraction_id uuid not null references public.attractions(id) on delete cascade,
  product_id uuid references public.tourism_products(id) on delete cascade,
  date date not null,
  capacity int check (capacity is null or capacity >= 0),
  is_closed boolean not null default false,
  note text,
  created_at timestamptz not null default now()
);
create unique index if not exists availability_unique_idx on public.availability
  (attraction_id, coalesce(product_id, '00000000-0000-0000-0000-000000000000'::uuid), date);

-- ---------- 4. REVIEWS, MESSAGES, CMS ----------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  attraction_id uuid not null references public.attractions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_name text,
  rating int not null check (rating between 1 and 5),
  title text,
  comment text check (comment is null or char_length(comment) <= 2000),
  is_approved boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, attraction_id)
);
create index if not exists reviews_attr_idx on public.reviews(attraction_id, is_approved);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject text check (subject is null or char_length(subject) <= 200),
  message text not null check (char_length(message) between 1 and 5000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.homepage_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text,
  body text,
  image_url text,
  data jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.website_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  video_url text not null,
  poster_url text,
  kind text not null default 'homepage' check (kind in ('homepage','destination','gallery')),
  attraction_id uuid references public.attractions(id) on delete set null,
  is_featured boolean not null default false,
  display_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists website_videos_kind_idx on public.website_videos(kind, is_published, is_featured, created_at desc);

create table if not exists public.admin_activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  actor_email text,
  action text not null,
  table_name text,
  record_id text,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_logs_created_idx on public.admin_activity_logs(created_at desc);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- 5. AUDIT TRIGGER ----------
create or replace function public.log_admin_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare rec jsonb; uid uuid := auth.uid();
begin
  if uid is null or not public.is_staff() then
    return coalesce(new, old);
  end if;
  rec := to_jsonb(coalesce(new, old));
  insert into public.admin_activity_logs(actor_id, actor_email, action, table_name, record_id, details)
  values (uid, (select email from public.profiles where id = uid), tg_op, tg_table_name, rec->>'id',
          jsonb_build_object('label', coalesce(rec->>'name', rec->>'title', rec->>'reference', rec->>'key', rec->>'email')));
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['destinations','attractions','attraction_images','attraction_videos','tourism_products',
    'tourism_packages','bookings','availability','reviews','homepage_content','website_videos','profiles']
  loop
    execute format('drop trigger if exists audit_%1$s on public.%1$s', t);
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$s for each row execute function public.log_admin_activity()', t);
  end loop;
  foreach t in array array['destinations','attractions','tourism_products','bookings']
  loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format('create trigger touch_%1$s before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ---------- 6. ROW LEVEL SECURITY ----------
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.attractions enable row level security;
alter table public.attraction_images enable row level security;
alter table public.attraction_videos enable row level security;
alter table public.tourism_products enable row level security;
alter table public.tourism_packages enable row level security;
alter table public.bookings enable row level security;
alter table public.availability enable row level security;
alter table public.reviews enable row level security;
alter table public.contact_messages enable row level security;
alter table public.homepage_content enable row level security;
alter table public.website_videos enable row level security;
alter table public.admin_activity_logs enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- roles & profiles
drop policy if exists roles_read on public.roles;
create policy roles_read on public.roles for select using (public.is_staff());
drop policy if exists roles_write on public.roles;
create policy roles_write on public.roles for all using (public.has_role(array['super_admin'])) with check (public.has_role(array['super_admin']));

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.has_role(array['super_admin','admin']));
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update using (id = auth.uid() or public.has_role(array['super_admin']))
  with check (id = auth.uid() or public.has_role(array['super_admin']));
-- no insert policy (trigger creates profiles), no delete policy (cascade from auth.users)

-- published-content tables: public reads published rows; staff manage
do $$
declare t text; roles_arr text;
begin
  foreach t in array array['destinations','attractions','tourism_products','tourism_packages','homepage_content','website_videos']
  loop
    execute format('drop policy if exists %1$s_public_read on public.%1$s', t);
    execute format('create policy %1$s_public_read on public.%1$s for select using (is_published)', t);
    execute format('drop policy if exists %1$s_staff_read on public.%1$s', t);
    execute format('create policy %1$s_staff_read on public.%1$s for select using (public.is_staff())', t);
    execute format('drop policy if exists %1$s_staff_write on public.%1$s', t);
    roles_arr := case when t in ('tourism_products','tourism_packages')
      then 'array[''super_admin'',''admin'',''content_manager'']'
      else 'array[''super_admin'',''admin'',''content_manager'',''editor'']' end;
    execute format('create policy %1$s_staff_write on public.%1$s for all using (public.has_role(%2$s)) with check (public.has_role(%2$s))', t, roles_arr);
  end loop;
end $$;

-- images / videos follow their attraction's publication
drop policy if exists attraction_images_public_read on public.attraction_images;
create policy attraction_images_public_read on public.attraction_images for select
  using (is_published and exists (select 1 from public.attractions a where a.id = attraction_id and a.is_published));
drop policy if exists attraction_images_staff on public.attraction_images;
create policy attraction_images_staff on public.attraction_images for all
  using (public.has_role(array['super_admin','admin','content_manager','editor']))
  with check (public.has_role(array['super_admin','admin','content_manager','editor']));
drop policy if exists attraction_videos_public_read on public.attraction_videos;
create policy attraction_videos_public_read on public.attraction_videos for select
  using (is_published and exists (select 1 from public.attractions a where a.id = attraction_id and a.is_published));
drop policy if exists attraction_videos_staff on public.attraction_videos;
create policy attraction_videos_staff on public.attraction_videos for all
  using (public.has_role(array['super_admin','admin','content_manager','editor']))
  with check (public.has_role(array['super_admin','admin','content_manager','editor']));

-- availability: public may read, staff manage
drop policy if exists availability_read on public.availability;
create policy availability_read on public.availability for select using (true);
drop policy if exists availability_staff on public.availability;
create policy availability_staff on public.availability for all
  using (public.has_role(array['super_admin','admin','booking_manager']))
  with check (public.has_role(array['super_admin','admin','booking_manager']));

-- bookings: users read ONLY their own; creation/cancellation happen through RPCs; staff manage
drop policy if exists bookings_own_read on public.bookings;
create policy bookings_own_read on public.bookings for select using (user_id = auth.uid());
drop policy if exists bookings_staff_read on public.bookings;
create policy bookings_staff_read on public.bookings for select using (public.has_role(array['super_admin','admin','booking_manager']));
drop policy if exists bookings_staff_update on public.bookings;
create policy bookings_staff_update on public.bookings for update
  using (public.has_role(array['super_admin','admin','booking_manager']))
  with check (public.has_role(array['super_admin','admin','booking_manager']));
drop policy if exists bookings_staff_delete on public.bookings;
create policy bookings_staff_delete on public.bookings for delete using (public.has_role(array['super_admin']));

-- reviews
drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews for select using (is_approved);
drop policy if exists reviews_own_read on public.reviews;
create policy reviews_own_read on public.reviews for select using (user_id = auth.uid());
drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews for insert to authenticated
  with check (user_id = auth.uid() and is_approved = false and is_featured = false);
drop policy if exists reviews_staff on public.reviews;
create policy reviews_staff on public.reviews for all
  using (public.has_role(array['super_admin','admin','content_manager','editor']))
  with check (public.has_role(array['super_admin','admin','content_manager','editor']));

-- messages & newsletter
drop policy if exists contact_insert on public.contact_messages;
create policy contact_insert on public.contact_messages for insert to anon, authenticated with check (true);
drop policy if exists contact_staff on public.contact_messages;
create policy contact_staff on public.contact_messages for all
  using (public.has_role(array['super_admin','admin','booking_manager']))
  with check (public.has_role(array['super_admin','admin','booking_manager']));
drop policy if exists newsletter_insert on public.newsletter_subscribers;
create policy newsletter_insert on public.newsletter_subscribers for insert to anon, authenticated with check (true);
drop policy if exists newsletter_staff on public.newsletter_subscribers;
create policy newsletter_staff on public.newsletter_subscribers for all
  using (public.has_role(array['super_admin','admin']))
  with check (public.has_role(array['super_admin','admin']));

-- audit logs: read-only for admins; rows are written only by the SECURITY DEFINER trigger
drop policy if exists logs_read on public.admin_activity_logs;
create policy logs_read on public.admin_activity_logs for select using (public.has_role(array['super_admin','admin']));

-- ---------- 7. BOOKING RPCs (capacity safe, server-side pricing) ----------
create or replace function public.get_remaining_capacity(p_attraction uuid, p_product uuid, p_date date)
returns integer language plpgsql stable security definer set search_path = public as $$
declare av_cap int; closed boolean; a_cap int; p_cap int; cap int; booked int; product_scope boolean;
begin
  select a.is_closed, a.capacity into closed, av_cap from public.availability a
    where a.attraction_id = p_attraction and a.date = p_date and a.product_id is not distinct from p_product limit 1;
  if coalesce(closed, false) then return 0; end if;
  select daily_capacity into a_cap from public.attractions where id = p_attraction;
  if p_product is not null then select daily_capacity into p_cap from public.tourism_products where id = p_product; end if;
  cap := coalesce(av_cap, p_cap, a_cap);
  if cap is null then return null; end if;            -- null = unlimited
  product_scope := p_product is not null and (av_cap is not null or p_cap is not null);
  select coalesce(sum(visitors), 0) into booked from public.bookings
    where attraction_id = p_attraction and booking_date = p_date and status in ('pending','confirmed')
      and (not product_scope or product_id is not distinct from p_product);
  return greatest(cap - booked, 0);
end $$;

create or replace function public.create_booking(
  p_attraction uuid, p_product uuid, p_package uuid, p_date date, p_time text, p_visitors int,
  p_full_name text, p_email text, p_phone text, p_nationality text, p_experience text, p_requests text)
returns public.bookings language plpgsql security definer set search_path = public as $$
declare a public.attractions; remaining int; unit numeric; cur text; b public.bookings; ref text; prod public.tourism_products; pkg public.tourism_packages;
begin
  if auth.uid() is null then raise exception 'Please sign in to book'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and is_active) then raise exception 'Account disabled'; end if;
  -- lock the attraction row: serialises concurrent bookings => no double booking
  select * into a from public.attractions where id = p_attraction and is_published for update;
  if not found then raise exception 'Attraction not found'; end if;
  if not a.booking_enabled then raise exception 'Booking is not available for this attraction'; end if;
  if p_date is null or p_date < current_date then raise exception 'Choose a date today or later'; end if;
  if p_visitors is null or p_visitors < 1 or p_visitors > a.max_group_size then
    raise exception 'Visitors must be between 1 and %', a.max_group_size; end if;
  if char_length(trim(coalesce(p_full_name,''))) < 2 or coalesce(p_email,'') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(trim(coalesce(p_phone,''))) < 5 then
    raise exception 'Name, valid email and phone are required'; end if;

  remaining := public.get_remaining_capacity(p_attraction, p_product, p_date);
  if remaining is not null and p_visitors > remaining then
    raise exception 'Only % place(s) left on this date', remaining; end if;

  cur := a.currency; unit := a.entrance_fee_amount;
  if p_package is not null then
    select * into pkg from public.tourism_packages where id = p_package and is_published;
    if not found then raise exception 'Package not found'; end if;
    unit := pkg.price_per_person; cur := pkg.currency;
  elsif p_product is not null then
    select * into prod from public.tourism_products where id = p_product and is_published and (attraction_id = p_attraction or attraction_id is null);
    if not found then raise exception 'Experience not found'; end if;
    unit := prod.price; cur := prod.currency;
  end if;

  loop
    ref := 'VR-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.bookings where reference = ref);
  end loop;

  insert into public.bookings (reference, user_id, attraction_id, product_id, package_id, full_name, email, phone, nationality,
    experience, booking_date, preferred_time, visitors, special_requests, unit_price, total_amount, currency, status)
  values (ref, auth.uid(), p_attraction, p_product, p_package, trim(p_full_name), lower(trim(p_email)), trim(p_phone), p_nationality,
    p_experience, p_date, p_time, p_visitors, p_requests, unit, coalesce(unit, 0) * p_visitors, cur, 'pending')
  returning * into b;
  return b;
end $$;

create or replace function public.cancel_booking(p_booking uuid)
returns public.bookings language plpgsql security definer set search_path = public as $$
declare b public.bookings; hours int;
begin
  select * into b from public.bookings where id = p_booking and user_id = auth.uid() for update;
  if not found then raise exception 'Booking not found'; end if;
  if b.status not in ('pending','confirmed') then raise exception 'This booking can no longer be cancelled'; end if;
  select cancellation_hours into hours from public.attractions where id = b.attraction_id;
  if (b.booking_date::timestamp - make_interval(hours => coalesce(hours, 0))) < now() then
    raise exception 'Free cancellation closed % hours before the visit', coalesce(hours, 0); end if;
  update public.bookings set status = 'cancelled', cancelled_at = now() where id = p_booking returning * into b;
  return b;
end $$;

revoke all on function public.create_booking from public, anon;
grant execute on function public.create_booking to authenticated;
revoke all on function public.cancel_booking from public, anon;
grant execute on function public.cancel_booking to authenticated;
grant execute on function public.get_remaining_capacity to anon, authenticated;

-- ---------- 8. STORAGE ----------
insert into storage.buckets (id, name, public, file_size_limit) values
  ('media', 'media', true, 524288000),      -- 500 MB (Supabase Free plan caps at 50 MB globally)
  ('avatars', 'avatars', true, 5242880)
on conflict (id) do nothing;

drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects for select using (bucket_id in ('media','avatars'));
drop policy if exists media_staff_write on storage.objects;
create policy media_staff_write on storage.objects for all
  using (bucket_id = 'media' and public.has_role(array['super_admin','admin','content_manager','editor']))
  with check (bucket_id = 'media' and public.has_role(array['super_admin','admin','content_manager','editor']));
drop policy if exists avatar_own_write on storage.objects;
create policy avatar_own_write on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

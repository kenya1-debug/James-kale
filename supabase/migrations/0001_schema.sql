-- James Kale & Co. Advocates : core schema + RLS
-- Run in Supabase SQL editor or via `supabase db push`.

create extension if not exists "pgcrypto";

-- ───────────── ENUMS ─────────────
create type public.user_role      as enum ('admin', 'staff');
create type public.request_status as enum ('new', 'contacted', 'scheduled', 'closed');
create type public.post_status    as enum ('draft', 'scheduled', 'published');

-- ───────────── HELPERS ─────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ───────────── PROFILES / ROLES ─────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        public.user_role not null default 'staff',
  is_active   boolean not null default false,   -- must be switched on by an admin
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- New auth users get an INACTIVE staff profile. Promote the first admin manually (see bottom).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role helpers (security definer avoids RLS recursion on profiles)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'admin' and is_active);
$$;
create or replace function public.is_staff_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and is_active);
$$;

-- ───────────── SITE SETTINGS (firm details, credentials, memberships, courts) ─────────────
create table public.site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);
create trigger trg_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ───────────── PRACTICE AREAS ─────────────
create table public.practice_areas (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null,
  title_sw        text,
  summary         text not null,
  summary_sw      text,
  icon            text,
  body_md         text not null default '',
  body_md_sw      text,
  how_we_help     jsonb not null default '[]'::jsonb,   -- [{ "title": "...", "text": "..." }]
  seo_title       text,
  seo_description text,
  sort_order      int not null default 0,
  published       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_pa_updated before update on public.practice_areas
  for each row execute function public.set_updated_at();

-- ───────────── FAQS ─────────────
create table public.faqs (
  id               uuid primary key default gen_random_uuid(),
  practice_area_id uuid references public.practice_areas(id) on delete cascade, -- null = general FAQ
  question         text not null,
  question_sw      text,
  answer           text not null,
  answer_sw        text,
  sort_order       int not null default 0,
  published        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index faqs_pa_idx on public.faqs(practice_area_id);
create trigger trg_faqs_updated before update on public.faqs
  for each row execute function public.set_updated_at();

-- ───────────── TESTIMONIALS ─────────────
create table public.testimonials (
  id           uuid primary key default gen_random_uuid(),
  author_name  text not null,          -- may be initials, e.g. "J.K."
  author_role  text,                   -- e.g. "Landowner, Baringo"
  quote        text not null,
  quote_sw     text,
  sort_order   int not null default 0,
  published    boolean not null default false,   -- off by default: verify consent + LSK rules first
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_testimonials_updated before update on public.testimonials
  for each row execute function public.set_updated_at();

-- ───────────── BLOG ─────────────
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table public.posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null,
  excerpt         text,
  content_html    text not null default '',          -- sanitised HTML from the rich text editor
  cover_image     text,                              -- storage path in blog-images bucket
  cover_alt       text,
  category_id     uuid references public.categories(id) on delete set null,
  author_id       uuid references public.profiles(id) on delete set null,
  status          public.post_status not null default 'draft',
  published_at    timestamptz,                       -- for 'scheduled', the go-live time
  reading_minutes int not null default 3,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint published_needs_date check (status = 'draft' or published_at is not null)
);
create index posts_public_idx on public.posts(status, published_at desc);
create index posts_category_idx on public.posts(category_id);
create trigger trg_posts_updated before update on public.posts
  for each row execute function public.set_updated_at();

-- ───────────── AVAILABILITY ─────────────
create table public.availability (
  day_of_week   smallint primary key check (day_of_week between 0 and 6),  -- 0 = Sunday
  is_open       boolean not null default false,
  open_time     time,
  close_time    time,
  break_start   time,
  break_end     time,
  slot_minutes  smallint not null default 60 check (slot_minutes in (15, 20, 30, 45, 60, 90)),
  updated_at    timestamptz not null default now(),
  constraint open_needs_times check (not is_open or (open_time is not null and close_time is not null and open_time < close_time))
);
create trigger trg_availability_updated before update on public.availability
  for each row execute function public.set_updated_at();

create table public.availability_exceptions (   -- public holidays, court days, leave
  id          uuid primary key default gen_random_uuid(),
  on_date     date not null unique,
  reason      text,
  created_at  timestamptz not null default now()
);

-- ───────────── CONSULTATIONS ─────────────
create table public.consultations (
  id               uuid primary key default gen_random_uuid(),
  full_name        text not null check (char_length(full_name) between 2 and 120),
  phone            text not null check (char_length(phone) between 7 and 20),
  email            text check (email is null or (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  practice_area_id uuid references public.practice_areas(id) on delete set null,
  preferred_date   date not null,
  preferred_time   time not null,
  description      text not null check (char_length(description) between 10 and 2000),
  consent_given    boolean not null check (consent_given),     -- Data Protection Act consent
  status           public.request_status not null default 'new',
  admin_notes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index consultations_status_idx on public.consultations(status, created_at desc);
create index consultations_date_idx on public.consultations(preferred_date);
-- No double booking while a request is still active
create unique index consultations_slot_unique
  on public.consultations(preferred_date, preferred_time)
  where status in ('new', 'contacted', 'scheduled');
create trigger trg_consultations_updated before update on public.consultations
  for each row execute function public.set_updated_at();

-- ───────────── CONTACT MESSAGES ─────────────
create table public.contact_messages (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null check (char_length(full_name) between 2 and 120),
  phone        text check (phone is null or char_length(phone) between 7 and 20),
  email        text check (email is null or (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  subject      text check (subject is null or char_length(subject) <= 200),
  message      text not null check (char_length(message) between 10 and 3000),
  consent_given boolean not null check (consent_given),
  status       public.request_status not null default 'new',
  admin_notes  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint contact_has_channel check (phone is not null or email is not null)
);
create index contact_status_idx on public.contact_messages(status, created_at desc);
create trigger trg_contact_updated before update on public.contact_messages
  for each row execute function public.set_updated_at();

-- ───────────── BOOKING SLOT FUNCTION (exposes ONLY taken times, no personal data) ─────────────
create or replace function public.get_booked_slots(p_date date)
returns table (slot time)
language sql stable security definer set search_path = public as $$
  select preferred_time from public.consultations
  where preferred_date = p_date and status in ('new', 'contacted', 'scheduled');
$$;
revoke all on function public.get_booked_slots(date) from public;
grant execute on function public.get_booked_slots(date) to anon, authenticated;

-- ───────────── ANALYTICS VIEWS (respect the caller's RLS) ─────────────
create or replace view public.v_requests_per_week with (security_invoker = true) as
  select date_trunc('week', created_at)::date as week_start, count(*) as total
  from public.consultations
  group by 1 order by 1 desc;

create or replace view public.v_top_practice_areas with (security_invoker = true) as
  select pa.title, count(c.id) as total
  from public.practice_areas pa
  left join public.consultations c on c.practice_area_id = pa.id
  group by pa.title order by total desc;

-- ───────────── ROW LEVEL SECURITY ─────────────
alter table public.profiles                 enable row level security;
alter table public.site_settings            enable row level security;
alter table public.practice_areas           enable row level security;
alter table public.faqs                     enable row level security;
alter table public.testimonials             enable row level security;
alter table public.categories               enable row level security;
alter table public.posts                    enable row level security;
alter table public.availability             enable row level security;
alter table public.availability_exceptions  enable row level security;
alter table public.consultations            enable row level security;
alter table public.contact_messages         enable row level security;

-- profiles: users read their own row; admins manage all
create policy profiles_self_read   on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_admin_all   on public.profiles for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- public READ of published content + admin full access
create policy settings_public_read on public.site_settings for select to anon, authenticated using (true);
create policy settings_admin_all   on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy pa_public_read on public.practice_areas for select to anon, authenticated using (published);
create policy pa_admin_all   on public.practice_areas for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy faqs_public_read on public.faqs for select to anon, authenticated using (published);
create policy faqs_admin_all   on public.faqs for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy testimonials_public_read on public.testimonials for select to anon, authenticated using (published);
create policy testimonials_admin_all   on public.testimonials for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy categories_public_read on public.categories for select to anon, authenticated using (true);
create policy categories_admin_all   on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Scheduled posts go live automatically once published_at has passed (no cron needed)
create policy posts_public_read on public.posts for select to anon, authenticated
  using (status in ('published', 'scheduled') and published_at <= now());
create policy posts_admin_all on public.posts for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy availability_public_read on public.availability for select to anon, authenticated using (true);
create policy availability_admin_all   on public.availability for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy avail_exc_public_read on public.availability_exceptions for select to anon, authenticated using (true);
create policy avail_exc_admin_all   on public.availability_exceptions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Forms: public can only INSERT a clean 'new' row; they can never read anything back
create policy consultations_public_insert on public.consultations for insert to anon, authenticated
  with check (status = 'new' and admin_notes is null);
create policy consultations_staff_read   on public.consultations for select to authenticated using (public.is_staff_or_admin());
create policy consultations_staff_update on public.consultations for update to authenticated
  using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy consultations_admin_delete on public.consultations for delete to authenticated using (public.is_admin());

create policy contact_public_insert on public.contact_messages for insert to anon, authenticated
  with check (status = 'new' and admin_notes is null);
create policy contact_staff_read   on public.contact_messages for select to authenticated using (public.is_staff_or_admin());
create policy contact_staff_update on public.contact_messages for update to authenticated
  using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy contact_admin_delete on public.contact_messages for delete to authenticated using (public.is_admin());

-- Defence in depth: anon never needs table-level SELECT on confidential tables
revoke select, update, delete on public.consultations   from anon;
revoke select, update, delete on public.contact_messages from anon;
revoke all on public.profiles from anon;

-- ───────────── STORAGE (blog images) ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy blog_images_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'blog-images');
create policy blog_images_admin_write on storage.objects for insert to authenticated
  with check (bucket_id = 'blog-images' and public.is_admin());
create policy blog_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'blog-images' and public.is_admin());
create policy blog_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'blog-images' and public.is_admin());

-- ───────────── FIRST ADMIN (run once after creating the user in Auth > Users) ─────────────
-- update public.profiles set role = 'admin', is_active = true where id = '<AUTH_USER_UUID>';
-- Also: Auth > Providers > Email > disable "Allow new users to sign up".

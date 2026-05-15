-- Chill Supabase schema
-- Tables for products, shopping list, product history, favorite recipes and user settings.

create extension if not exists "pgcrypto";

-- User profiles linked to Supabase Auth users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Products currently tracked in the user's fridge
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null check (category in ('vegetables', 'dairy', 'meat', 'groceries', 'other')),
  expiry_date date not null,
  price numeric(10, 2) default 0 check (price >= 0),
  status text not null default 'active' check (status in ('active', 'eaten', 'wasted', 'deleted')),
  barcode text,
  notes text,
  added_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Shopping list items
create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text check (category in ('vegetables', 'dairy', 'meat', 'groceries', 'other')),
  quantity text,
  bought boolean not null default false,
  source text default 'manual' check (source in ('manual', 'recipe', 'expired', 'auto')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- History of actions with products: eaten, wasted, added, deleted
create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  category text check (category in ('vegetables', 'dairy', 'meat', 'groceries', 'other')),
  event_type text not null check (event_type in ('added', 'eaten', 'wasted', 'deleted')),
  price numeric(10, 2) default 0 check (price >= 0),
  event_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Favorite recipes and recipe interaction stats
create table if not exists public.favorite_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_name text not null,
  liked boolean not null default true,
  views_count integer not null default 0 check (views_count >= 0),
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, recipe_name)
);

-- User preferences and app settings
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  theme text not null default 'light' check (theme in ('light', 'dark', 'system')),
  diet_preferences text[] not null default '{}',
  notifications_enabled boolean not null default true,
  expiry_warning_days integer not null default 3 check (expiry_warning_days >= 0),
  currency text not null default 'RUB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Auto-create profile and settings after user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Triggers
create or replace trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create or replace trigger set_shopping_items_updated_at
before update on public.shopping_items
for each row execute function public.set_updated_at();

create or replace trigger set_favorite_recipes_updated_at
before update on public.favorite_recipes
for each row execute function public.set_updated_at();

create or replace trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create or replace trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Indexes
create index if not exists idx_products_user_id on public.products(user_id);
create index if not exists idx_products_expiry_date on public.products(expiry_date);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_shopping_items_user_id on public.shopping_items(user_id);
create index if not exists idx_product_events_user_id on public.product_events(user_id);
create index if not exists idx_product_events_event_type on public.product_events(event_type);
create index if not exists idx_product_events_event_at on public.product_events(event_at);
create index if not exists idx_favorite_recipes_user_id on public.favorite_recipes(user_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.shopping_items enable row level security;
alter table public.product_events enable row level security;
alter table public.favorite_recipes enable row level security;
alter table public.user_settings enable row level security;

-- Profiles policies
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Products policies
create policy "Users can read own products"
on public.products for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own products"
on public.products for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own products"
on public.products for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own products"
on public.products for delete
to authenticated
using (auth.uid() = user_id);

-- Shopping policies
create policy "Users can read own shopping items"
on public.shopping_items for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own shopping items"
on public.shopping_items for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own shopping items"
on public.shopping_items for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own shopping items"
on public.shopping_items for delete
to authenticated
using (auth.uid() = user_id);

-- Product events policies
create policy "Users can read own product events"
on public.product_events for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own product events"
on public.product_events for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own product events"
on public.product_events for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own product events"
on public.product_events for delete
to authenticated
using (auth.uid() = user_id);

-- Favorite recipes policies
create policy "Users can read own favorite recipes"
on public.favorite_recipes for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own favorite recipes"
on public.favorite_recipes for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own favorite recipes"
on public.favorite_recipes for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own favorite recipes"
on public.favorite_recipes for delete
to authenticated
using (auth.uid() = user_id);

-- User settings policies
create policy "Users can read own settings"
on public.user_settings for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own settings"
on public.user_settings for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own settings"
on public.user_settings for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

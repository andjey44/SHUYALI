-- Enable per-user data isolation for Chill.
-- Every authenticated user can only access rows where user_id = auth.uid().

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.shopping_items enable row level security;
alter table public.product_events enable row level security;
alter table public.favorite_recipes enable row level security;
alter table public.user_settings enable row level security;

-- Remove old policies if they exist

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

drop policy if exists "Users can read own products" on public.products;
drop policy if exists "Users can insert own products" on public.products;
drop policy if exists "Users can update own products" on public.products;
drop policy if exists "Users can delete own products" on public.products;

drop policy if exists "Users can read own shopping items" on public.shopping_items;
drop policy if exists "Users can insert own shopping items" on public.shopping_items;
drop policy if exists "Users can update own shopping items" on public.shopping_items;
drop policy if exists "Users can delete own shopping items" on public.shopping_items;

drop policy if exists "Users can read own product events" on public.product_events;
drop policy if exists "Users can insert own product events" on public.product_events;
drop policy if exists "Users can update own product events" on public.product_events;
drop policy if exists "Users can delete own product events" on public.product_events;

drop policy if exists "Users can read own favorite recipes" on public.favorite_recipes;
drop policy if exists "Users can insert own favorite recipes" on public.favorite_recipes;
drop policy if exists "Users can update own favorite recipes" on public.favorite_recipes;
drop policy if exists "Users can delete own favorite recipes" on public.favorite_recipes;

drop policy if exists "Users can read own settings" on public.user_settings;
drop policy if exists "Users can insert own settings" on public.user_settings;
drop policy if exists "Users can update own settings" on public.user_settings;

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

create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
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

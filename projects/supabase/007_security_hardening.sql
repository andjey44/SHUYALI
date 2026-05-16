-- Chill MVP security hardening
-- Protects user data with Row Level Security and explicit ownership checks.

-- Profiles
alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- User settings
alter table public.user_settings enable row level security;

drop policy if exists "Users can read own settings" on public.user_settings;
drop policy if exists "Users can insert own settings" on public.user_settings;
drop policy if exists "Users can update own settings" on public.user_settings;

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

-- Products
alter table public.products enable row level security;

drop policy if exists "Users can read own products" on public.products;
drop policy if exists "Users can insert own products" on public.products;
drop policy if exists "Users can update own products" on public.products;
drop policy if exists "Users can delete own products" on public.products;

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

-- Shopping items
alter table public.shopping_items enable row level security;

drop policy if exists "Users can read own shopping items" on public.shopping_items;
drop policy if exists "Users can insert own shopping items" on public.shopping_items;
drop policy if exists "Users can update own shopping items" on public.shopping_items;
drop policy if exists "Users can delete own shopping items" on public.shopping_items;

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

-- Product events
alter table public.product_events enable row level security;

drop policy if exists "Users can read own product events" on public.product_events;
drop policy if exists "Users can insert own product events" on public.product_events;
drop policy if exists "Users can update own product events" on public.product_events;
drop policy if exists "Users can delete own product events" on public.product_events;

create policy "Users can read own product events"
on public.product_events for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own product events"
on public.product_events for insert
to authenticated
with check (auth.uid() = user_id);

-- Product events are history records. Users should not edit or delete them from the client.
-- If correction is needed later, it should be implemented through trusted backend logic.

-- Subscriptions
alter table public.subscriptions enable row level security;

drop policy if exists "Users can read own subscription" on public.subscriptions;
drop policy if exists "Users can insert own subscription" on public.subscriptions;
drop policy if exists "Users can update own subscription" on public.subscriptions;
drop policy if exists "Users can update own subscription in MVP test mode" on public.subscriptions;

create policy "Users can read own subscription"
on public.subscriptions for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own subscription"
on public.subscriptions for insert
to authenticated
with check (auth.uid() = user_id);

-- MVP test mode only: allows the user to activate their own Pro status from the client.
-- Production version must remove this policy and update subscriptions only from Stripe webhook/backend.
create policy "Users can update own subscription in MVP test mode"
on public.subscriptions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Recipes are public read-only catalog.
alter table public.recipes enable row level security;

drop policy if exists "Anyone can read active recipes" on public.recipes;
drop policy if exists "Authenticated users can modify recipes" on public.recipes;

create policy "Anyone can read active recipes"
on public.recipes for select
to anon, authenticated
using (is_active = true);

-- No insert/update/delete policy for recipes from anon/authenticated clients.
-- Recipe catalog changes should be applied only through migrations/admin role.

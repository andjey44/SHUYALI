-- Chill Paywall and subscription MVP
-- Adds a 7-day trial and test Premium activation support.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null default 'premium' check (plan in ('premium')),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_trial_ends_at on public.subscriptions(trial_ends_at);

drop policy if exists "Users can read own subscription" on public.subscriptions;
drop policy if exists "Users can insert own subscription" on public.subscriptions;
drop policy if exists "Users can update own subscription" on public.subscriptions;

create policy "Users can read own subscription"
on public.subscriptions for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own subscription"
on public.subscriptions for insert
to authenticated
with check (auth.uid() = user_id);

-- MVP test mode: user can activate own subscription from frontend.
-- In production this update should be done only by Stripe webhook/backend.
create policy "Users can update own subscription"
on public.subscriptions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create or replace function public.ensure_user_subscription(target_user_id uuid)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  subscription_row public.subscriptions;
begin
  insert into public.subscriptions (user_id)
  values (target_user_id)
  on conflict (user_id) do nothing;

  select * into subscription_row
  from public.subscriptions
  where user_id = target_user_id;

  return subscription_row;
end;
$$;

-- Update existing new-user trigger to also create a trial subscription.
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

  insert into public.subscriptions (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Give already registered users a trial if they do not have a subscription row yet.
insert into public.subscriptions (user_id)
select id
from auth.users
where id not in (select user_id from public.subscriptions);

-- Auto-confirm new users for Chill.
-- This removes the need for email confirmation after registration.

create or replace function auth.auto_confirm_user_email()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.email_confirmed_at is null then
    update auth.users
    set email_confirmed_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists auto_confirm_user_email on auth.users;

create trigger auto_confirm_user_email
after insert on auth.users
for each row
execute function auth.auto_confirm_user_email();

-- Confirm already existing unconfirmed users
update auth.users
set email_confirmed_at = now()
where email_confirmed_at is null;

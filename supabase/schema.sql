-- =====================================================================
-- LDR app — database schema (Supabase / Postgres)
--
-- Reconstructed from the statements run in the Supabase SQL Editor.
-- Run top to bottom on a fresh Supabase project to recreate the database.
-- Order matters: tables → helper function → trigger → grants → RLS/policies
--                → pairing functions → timeline (moments) → photo storage.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

-- A couple: the shared space two partners belong to.
create table public.couples (
  id         uuid primary key default gen_random_uuid(),
  pair_code  text unique,                       -- created on demand by create_couple()
  start_date date,                              -- the day they got together (set from Profile)
  created_at timestamptz not null default now()
);

-- A profile for each account. auth.users holds the login; this holds app data.
create table public.users (
  id        uuid primary key references auth.users(id) on delete cascade,
  name      text,
  timezone  text,                               -- IANA name, e.g. America/Los_Angeles
  couple_id uuid references public.couples(id)  -- null until paired; written only by pairing functions
);


-- ---------------------------------------------------------------------
-- 2. Helper: "my couple id", used inside policies
--    security definer → reads users without users' own RLS (avoids recursion)
-- ---------------------------------------------------------------------

create or replace function public.my_couple_id()
returns uuid
language sql stable
security definer set search_path = ''
as $$
  select couple_id from public.users where id = (select auth.uid());
$$;


-- ---------------------------------------------------------------------
-- 3. Profile row created automatically at sign-up
--    Same transaction as the account: if it fails, sign-up fails too.
--    name / timezone come from signUp({ options: { data: { name, timezone } } }).
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, name, timezone)
  values (new.id,
          new.raw_user_meta_data ->> 'name',
          new.raw_user_meta_data ->> 'timezone');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------
-- 4. Grants: which operations the app's logged-in role may attempt
--    (rows are then filtered by the RLS policies below)
-- ---------------------------------------------------------------------

-- users: may read; may update ONLY name and timezone (couple_id stays locked)
revoke insert, update on public.users from anon, authenticated;
grant select on public.users to authenticated;
grant update (name, timezone) on public.users to authenticated;

-- couples: may read; may update ONLY start_date; never insert/delete directly
revoke insert, update, delete on public.couples from anon, authenticated;
grant select on public.couples to authenticated;
grant update (start_date) on public.couples to authenticated;


-- ---------------------------------------------------------------------
-- 5. Row Level Security: which rows
-- ---------------------------------------------------------------------

alter table public.users   enable row level security;
alter table public.couples enable row level security;

-- users: I can read my own row, and every row in my couple (my partner)
create policy "read own row" on public.users
  for select to authenticated
  using (id = (select auth.uid()));

create policy "member read partner data" on public.users
  for select to authenticated
  using (couple_id = public.my_couple_id());

-- users: I can update only my own row (columns limited by the grant above)
create policy "update own row" on public.users
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- couples: members can read their couple
create policy "members read couple" on public.couples
  for select to authenticated
  using (id = public.my_couple_id());

-- couples: members can set their start date (not in the future, allowing for time zones ahead of UTC)
create policy "members update start date" on public.couples
  for update to authenticated
  using (id = public.my_couple_id())
  with check (id = public.my_couple_id() and start_date <= current_date + 1);


-- ---------------------------------------------------------------------
-- 6. Pairing — the only way couple_id ever changes
--    security definer: can do what the client may not, but only these steps.
--    One transaction each; raise exception rolls everything back.
-- ---------------------------------------------------------------------

create or replace function public.create_couple()
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  new_code text := upper(substr(md5(random()::text), 1, 6));
  new_id   uuid;
begin
  if (select couple_id from public.users where id = (select auth.uid())) is not null then
    raise exception 'already paired';
  end if;
  insert into public.couples (pair_code) values (new_code) returning id into new_id;
  update public.users set couple_id = new_id where id = (select auth.uid());
  return new_code;
end;
$$;

create or replace function public.join_couple(code text)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  target uuid;
begin
  if (select couple_id from public.users where id = (select auth.uid())) is not null then
    raise exception 'already paired';
  end if;
  -- lock the couple row so two people joining at the same moment can't both get in
  select id into target from public.couples where pair_code = upper(code) for update;
  if target is null then
    raise exception 'invalid code';
  end if;
  if (select count(*) from public.users where couple_id = target) >= 2 then
    raise exception 'couple is full';
  end if;
  update public.users set couple_id = target where id = (select auth.uid());
  return target;
end;
$$;


-- ---------------------------------------------------------------------
-- 7. Timeline: photos and letters share one table
-- ---------------------------------------------------------------------

create table public.moments (
  id           uuid primary key default gen_random_uuid(),
  couple_id    uuid not null references public.couples(id) on delete cascade,
  author_id    uuid not null references public.users(id)   on delete cascade,
  kind         text not null check (kind in ('photo', 'letter')),
  storage_path text,          -- photos: path inside the private "photos" bucket
  body         text,          -- photo caption, or the letter's text
  created_at   timestamptz not null default now(),
  check (
    (kind = 'photo'  and storage_path is not null) or
    (kind = 'letter' and body is not null and length(trim(body)) > 0)
  )
);
create index moments_timeline on public.moments (couple_id, created_at desc);

alter table public.moments enable row level security;

create policy "couple reads moments" on public.moments
  for select to authenticated
  using (couple_id = public.my_couple_id());

create policy "couple adds moments as themselves" on public.moments
  for insert to authenticated
  with check (couple_id = public.my_couple_id() and author_id = (select auth.uid()));

create policy "author deletes own moments" on public.moments
  for delete to authenticated
  using (author_id = (select auth.uid()));


-- ---------------------------------------------------------------------
-- 8. Private photo storage
--    Files live at "<couple_id>/<timestamp>.<ext>"; only that couple can read or upload.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png', 'image/heic']);

create policy "couple reads photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.my_couple_id()::text);

create policy "couple uploads photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = public.my_couple_id()::text);

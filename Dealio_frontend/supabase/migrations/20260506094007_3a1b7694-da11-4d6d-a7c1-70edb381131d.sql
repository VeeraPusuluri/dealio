-- Roles enum
create type public.app_role as enum ('builder','cp','customer','bank','vendor','admin','nri','landowner');

-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- User roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security-definer role check
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Profiles policies
create policy "Profiles: users select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles: admins select all"
  on public.profiles for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Profiles: users update own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Profiles: users insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- user_roles policies
create policy "Roles: users select own"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Roles: admins select all"
  on public.user_roles for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Roles: admins insert"
  on public.user_roles for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Roles: admins update"
  on public.user_roles for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Roles: admins delete"
  on public.user_roles for delete
  using (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + default role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _role public.app_role;
begin
  insert into public.profiles (id, name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email,
    new.raw_user_meta_data->>'phone'
  );

  begin
    _role := coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'customer');
  exception when others then
    _role := 'customer';
  end;

  insert into public.user_roles (user_id, role) values (new.id, _role)
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger for profiles
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  created_at timestamptz default now() not null
);

-- Groups
create table if not exists groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  invite_code text unique not null default encode(gen_random_bytes(6), 'hex'),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- Group members (composite PK — no extra UUID needed)
create table if not exists group_members (
  group_id uuid references groups(id) on delete cascade not null,
  user_id  uuid references profiles(id) on delete cascade not null,
  joined_at timestamptz default now() not null,
  primary key (group_id, user_id)
);

-- User stickers per group
create table if not exists user_stickers (
  user_id    uuid references profiles(id) on delete cascade not null,
  group_id   uuid references groups(id) on delete cascade not null,
  sticker_id text not null,
  quantity   smallint not null default 0 check (quantity >= 0 and quantity <= 99),
  updated_at timestamptz default now() not null,
  primary key (user_id, group_id, sticker_id)
);

-- ─── RLS ────────────────────────────────────────────────────────────────────

alter table profiles      enable row level security;
alter table groups        enable row level security;
alter table group_members enable row level security;
alter table user_stickers enable row level security;

-- Profiles
create policy "profiles_select" on profiles
  for select to authenticated using (true);

create policy "profiles_insert" on profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "profiles_update" on profiles
  for update to authenticated using (auth.uid() = id);

-- Groups: any authenticated user may read (invite_code is the secret)
create policy "groups_select" on groups
  for select to authenticated using (true);

create policy "groups_insert" on groups
  for insert to authenticated with check (auth.uid() = created_by);

create policy "groups_update" on groups
  for update to authenticated using (auth.uid() = created_by);

-- Group members: visible to fellow members
create policy "group_members_select" on group_members
  for select to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id  = auth.uid()
    )
  );

create policy "group_members_insert" on group_members
  for insert to authenticated with check (auth.uid() = user_id);

create policy "group_members_delete" on group_members
  for delete to authenticated using (
    auth.uid() = user_id
    or exists (
      select 1 from groups g
      where g.id = group_members.group_id
        and g.created_by = auth.uid()
    )
  );

-- User stickers: visible to group members; only owner writes
create policy "user_stickers_select" on user_stickers
  for select to authenticated using (
    exists (
      select 1 from group_members gm
      where gm.group_id = user_stickers.group_id
        and gm.user_id  = auth.uid()
    )
  );

create policy "user_stickers_insert" on user_stickers
  for insert to authenticated with check (
    auth.uid() = user_id
    and exists (
      select 1 from group_members gm
      where gm.group_id = user_stickers.group_id
        and gm.user_id  = auth.uid()
    )
  );

create policy "user_stickers_update" on user_stickers
  for update to authenticated using (auth.uid() = user_id);

create policy "user_stickers_delete" on user_stickers
  for delete to authenticated using (auth.uid() = user_id);

-- ─── Triggers ───────────────────────────────────────────────────────────────

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at fresh on user_stickers
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_stickers_updated_at on user_stickers;
create trigger user_stickers_updated_at
  before update on user_stickers
  for each row execute function update_updated_at();

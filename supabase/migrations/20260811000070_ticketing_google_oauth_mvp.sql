-- Bremen ticketing MVP.
--
-- This migration keeps public performance content in the entity graph while
-- adding normalized transactional tables for sales, tickets, and check-in.
-- It also lets non-POSTECH Google OAuth users exist in Supabase Auth without
-- creating public.members rows or gaining member/admin privileges.

-- =====================================================================
-- Auth signup routing
-- =====================================================================

create or replace function public.enforce_postech_email()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  signup_context text;
begin
  signup_context := coalesce(
    nullif(btrim(new.raw_user_meta_data->>'account_context'), ''),
    case
      when nullif(btrim(coalesce(
        new.raw_user_meta_data->>'student_year',
        new.raw_user_meta_data->>'cohort'
      )), '') is not null then 'member'
      else 'ticket'
    end
  );

  if signup_context = 'member'
    and (new.email is null or new.email !~* '@postech\.ac\.kr$') then
    raise exception 'POSTECH email required (@postech.ac.kr)'
      using errcode = '22023', hint = '포스텍 메일로만 멤버 계정을 만들 수 있습니다.';
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  existing_id uuid;
  raw_year text;
  year_digits text;
  submitted_year int;
  submitted_name text;
  signup_context text;
begin
  raw_year := nullif(btrim(coalesce(
    new.raw_user_meta_data->>'student_year',
    new.raw_user_meta_data->>'cohort'
  )), '');

  signup_context := coalesce(
    nullif(btrim(new.raw_user_meta_data->>'account_context'), ''),
    case when raw_year is not null then 'member' else 'ticket' end
  );

  -- Ticket customers are Auth users, not Bremen roster members.
  if signup_context <> 'member' then
    return new;
  end if;

  if new.email is null or new.email !~* '@postech\.ac\.kr$' then
    raise exception 'POSTECH email required (@postech.ac.kr)'
      using errcode = '22023', hint = '포스텍 메일로만 멤버 계정을 만들 수 있습니다.';
  end if;

  submitted_name := nullif(btrim(coalesce(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'member_name'
  )), '');

  if raw_year is not null then
    year_digits := regexp_replace(raw_year, '\D', '', 'g');

    begin
      if length(year_digits) between 1 and 2 then
        submitted_year := 2000 + year_digits::int;
      elsif length(year_digits) >= 8 then
        submitted_year := substring(year_digits from 1 for 4)::int;
      else
        submitted_year := year_digits::int;
      end if;

      if submitted_year < 2000 or submitted_year > 2099 then
        submitted_year := null;
      end if;
    exception when invalid_text_representation then
      submitted_year := null;
    end;
  end if;

  if new.email is not null then
    select id into existing_id
    from public.members
    where lower(email) = lower(new.email)
      and auth_user_id is null
    limit 1;
  end if;

  if existing_id is null then
    if submitted_name is null or submitted_year is null then
      raise exception 'Member name and student year are required'
        using errcode = '22023',
              hint = '이름과 학번을 정확히 입력해야 가입할 수 있습니다.';
    end if;

    select id into existing_id
    from public.members
    where auth_user_id is null
      and student_year = submitted_year
      and btrim(name) = submitted_name
    limit 1;
  end if;

  if existing_id is not null then
    update public.members
    set auth_user_id = new.id,
        email = new.email,
        approved_at = coalesce(approved_at, now())
    where id = existing_id;
  else
    insert into public.members (
      auth_user_id,
      email,
      name,
      student_year,
      role
    )
    values (
      new.id,
      new.email,
      submitted_name,
      submitted_year,
      'member'
    );
  end if;

  return new;
end;
$$;

-- =====================================================================
-- Ticketing enums
-- =====================================================================

do $$
begin
  create type public.ticket_event_status as enum (
    'draft',
    'published',
    'sales_open',
    'sales_closed',
    'ended',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ticket_order_status as enum (
    'pending_payment',
    'payment_review',
    'confirmed',
    'cancelled',
    'expired',
    'refunded'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ticket_order_channel as enum (
    'online',
    'onsite',
    'performer',
    'admin_invite'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ticket_kind as enum ('paid', 'complimentary');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ticket_status as enum ('issued', 'checked_in', 'void');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ticket_staff_role as enum ('manager', 'door', 'viewer');
exception when duplicate_object then null;
end $$;

-- =====================================================================
-- Ticketing tables
-- =====================================================================

create table if not exists public.ticket_customers (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(btrim(email)) > 0)
);

create table if not exists public.ticket_events (
  id uuid primary key default gen_random_uuid(),
  performance_entity_id uuid not null unique references public.entities(id) on delete restrict,
  slug text not null unique,
  status public.ticket_event_status not null default 'draft',
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue_name text not null,
  venue_address text,
  sales_open_at timestamptz,
  sales_close_at timestamptz,
  capacity int not null,
  max_per_order int not null default 6,
  payment_due_minutes int not null default 1440,
  contact_text text,
  refund_policy text,
  created_by_member_id uuid not null references public.members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(btrim(slug)) > 0),
  check (length(btrim(venue_name)) > 0),
  check (capacity > 0),
  check (max_per_order between 1 and 20),
  check (payment_due_minutes between 10 and 10080),
  check (ends_at is null or ends_at > starts_at),
  check (sales_close_at is null or sales_open_at is null or sales_close_at > sales_open_at)
);

create table if not exists public.ticket_payment_settings (
  event_id uuid primary key references public.ticket_events(id) on delete cascade,
  bank_name text not null,
  account_number text not null,
  account_holder text not null,
  transfer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(btrim(bank_name)) > 0),
  check (length(btrim(account_number)) > 0),
  check (length(btrim(account_holder)) > 0)
);

create table if not exists public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ticket_events(id) on delete cascade,
  name text not null,
  description text,
  kind public.ticket_kind not null default 'paid',
  price_won int not null default 0,
  inventory_limit int,
  active boolean not null default true,
  public_sale boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, name),
  check (length(btrim(name)) > 0),
  check (price_won >= 0),
  check (inventory_limit is null or inventory_limit > 0),
  check ((kind = 'paid' and price_won > 0) or (kind = 'complimentary' and price_won = 0))
);

create table if not exists public.ticket_orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ticket_events(id) on delete restrict,
  buyer_user_id uuid references auth.users(id) on delete set null,
  order_number text not null unique,
  channel public.ticket_order_channel not null default 'online',
  status public.ticket_order_status not null default 'pending_payment',
  buyer_name text not null,
  buyer_email text,
  buyer_phone text,
  depositor_name text,
  quantity int not null,
  total_amount int not null,
  payment_due_at timestamptz,
  paid_reported_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by_member_id uuid references public.members(id) on delete set null,
  cancelled_at timestamptz,
  cancelled_by_member_id uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(btrim(order_number)) > 0),
  check (length(btrim(buyer_name)) > 0),
  check (quantity > 0),
  check (total_amount >= 0),
  check (channel <> 'online' or buyer_user_id is not null)
);

create table if not exists public.ticket_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ticket_orders(id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types(id) on delete restrict,
  quantity int not null,
  unit_price int not null,
  line_total int not null,
  created_at timestamptz not null default now(),
  unique (order_id, ticket_type_id),
  check (quantity > 0),
  check (unit_price >= 0),
  check (line_total = quantity * unit_price)
);

create table if not exists public.ticket_event_staff (
  event_id uuid not null references public.ticket_events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  role public.ticket_staff_role not null,
  created_by_member_id uuid not null references public.members(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (event_id, member_id)
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ticket_events(id) on delete restrict,
  order_id uuid not null references public.ticket_orders(id) on delete restrict,
  ticket_type_id uuid not null references public.ticket_types(id) on delete restrict,
  serial_code text not null unique,
  qr_token uuid not null unique default gen_random_uuid(),
  holder_name text not null,
  status public.ticket_status not null default 'issued',
  issued_at timestamptz not null default now(),
  checked_in_at timestamptz,
  checked_in_by_member_id uuid references public.members(id) on delete set null,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  check (length(btrim(serial_code)) > 0),
  check (length(btrim(holder_name)) > 0)
);

create table if not exists public.ticket_checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ticket_events(id) on delete restrict,
  ticket_id uuid not null unique references public.tickets(id) on delete restrict,
  checked_in_by_member_id uuid not null references public.members(id) on delete restrict,
  checked_in_at timestamptz not null default now()
);

-- Foreign-key and operational indexes.
create index if not exists ticket_events_status_starts_idx
  on public.ticket_events(status, starts_at);
create index if not exists ticket_events_creator_idx
  on public.ticket_events(created_by_member_id);
create index if not exists ticket_types_event_sort_idx
  on public.ticket_types(event_id, sort_order);
create index if not exists ticket_orders_event_status_created_idx
  on public.ticket_orders(event_id, status, created_at desc);
create index if not exists ticket_orders_buyer_created_idx
  on public.ticket_orders(buyer_user_id, created_at desc);
create index if not exists ticket_orders_confirmed_by_idx
  on public.ticket_orders(confirmed_by_member_id);
create index if not exists ticket_orders_cancelled_by_idx
  on public.ticket_orders(cancelled_by_member_id);
create index if not exists ticket_order_items_type_idx
  on public.ticket_order_items(ticket_type_id);
create index if not exists ticket_event_staff_member_idx
  on public.ticket_event_staff(member_id, event_id);
create index if not exists ticket_event_staff_creator_idx
  on public.ticket_event_staff(created_by_member_id);
create index if not exists tickets_order_idx
  on public.tickets(order_id);
create index if not exists tickets_event_status_idx
  on public.tickets(event_id, status);
create index if not exists tickets_type_idx
  on public.tickets(ticket_type_id);
create index if not exists tickets_checked_in_by_idx
  on public.tickets(checked_in_by_member_id);
create index if not exists ticket_checkins_event_time_idx
  on public.ticket_checkins(event_id, checked_in_at desc);
create index if not exists ticket_checkins_staff_idx
  on public.ticket_checkins(checked_in_by_member_id);

create trigger ticket_customers_set_updated_at
  before update on public.ticket_customers
  for each row execute function public.set_updated_at();
create trigger ticket_events_set_updated_at
  before update on public.ticket_events
  for each row execute function public.set_updated_at();
create trigger ticket_payment_settings_set_updated_at
  before update on public.ticket_payment_settings
  for each row execute function public.set_updated_at();
create trigger ticket_types_set_updated_at
  before update on public.ticket_types
  for each row execute function public.set_updated_at();
create trigger ticket_orders_set_updated_at
  before update on public.ticket_orders
  for each row execute function public.set_updated_at();

-- The linked public.entities record already participates in the append-only CMS
-- audit. Transactional ticket tables remain outside that content-only audit.

-- =====================================================================
-- Ticket authorization helpers
-- =====================================================================

create or replace function private.can_manage_ticket_event(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, private
as $$
  select private.is_admin() or exists (
    select 1
    from public.ticket_event_staff staff
    where staff.event_id = target_event_id
      and staff.member_id = private.current_member_id()
      and staff.role = 'manager'
  );
$$;

create or replace function private.can_view_ticket_event(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, private
as $$
  select private.is_admin() or exists (
    select 1
    from public.ticket_event_staff staff
    where staff.event_id = target_event_id
      and staff.member_id = private.current_member_id()
      and staff.role in ('manager', 'door', 'viewer')
  );
$$;

create or replace function private.can_check_in_ticket_event(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, private
as $$
  select private.is_admin() or exists (
    select 1
    from public.ticket_event_staff staff
    where staff.event_id = target_event_id
      and staff.member_id = private.current_member_id()
      and staff.role in ('manager', 'door')
  );
$$;

revoke all on function private.can_manage_ticket_event(uuid) from public;
revoke all on function private.can_view_ticket_event(uuid) from public;
revoke all on function private.can_check_in_ticket_event(uuid) from public;
grant execute on function private.can_manage_ticket_event(uuid) to authenticated;
grant execute on function private.can_view_ticket_event(uuid) to authenticated;
grant execute on function private.can_check_in_ticket_event(uuid) to authenticated;

-- =====================================================================
-- RLS
-- =====================================================================

alter table public.ticket_customers enable row level security;
alter table public.ticket_events enable row level security;
alter table public.ticket_payment_settings enable row level security;
alter table public.ticket_types enable row level security;
alter table public.ticket_orders enable row level security;
alter table public.ticket_order_items enable row level security;
alter table public.ticket_event_staff enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_checkins enable row level security;

create policy "ticket_customers_self_read"
  on public.ticket_customers for select
  using (auth_user_id = (select auth.uid()));
create policy "ticket_customers_self_insert"
  on public.ticket_customers for insert
  with check (auth_user_id = (select auth.uid()));
create policy "ticket_customers_self_update"
  on public.ticket_customers for update
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));
create policy "ticket_customers_admin_read"
  on public.ticket_customers for select
  using (private.is_admin());

create policy "ticket_events_public_read"
  on public.ticket_events for select
  using (
    status in ('published', 'sales_open', 'sales_closed', 'ended')
    and exists (
      select 1 from public.entities entity_ref
      where entity_ref.id = performance_entity_id
        and entity_ref.published = true
    )
  );
create policy "ticket_events_staff_read"
  on public.ticket_events for select
  using (private.can_view_ticket_event(id));
create policy "ticket_events_admin_all"
  on public.ticket_events for all
  using (private.is_admin())
  with check (private.is_admin());
create policy "ticket_events_manager_update"
  on public.ticket_events for update
  using (private.can_manage_ticket_event(id))
  with check (private.can_manage_ticket_event(id));

create policy "ticket_payment_settings_owner_read"
  on public.ticket_payment_settings for select
  using (exists (
    select 1 from public.ticket_orders owned_order
    where owned_order.event_id = ticket_payment_settings.event_id
      and owned_order.buyer_user_id = (select auth.uid())
  ));
create policy "ticket_payment_settings_staff_read"
  on public.ticket_payment_settings for select
  using (private.can_view_ticket_event(event_id));
create policy "ticket_payment_settings_admin_all"
  on public.ticket_payment_settings for all
  using (private.is_admin())
  with check (private.is_admin());
create policy "ticket_payment_settings_manager_all"
  on public.ticket_payment_settings for all
  using (private.can_manage_ticket_event(event_id))
  with check (private.can_manage_ticket_event(event_id));

create policy "ticket_types_public_read"
  on public.ticket_types for select
  using (
    active = true
    and public_sale = true
    and exists (
      select 1 from public.ticket_events event_ref
      where event_ref.id = event_id
        and event_ref.status in ('published', 'sales_open', 'sales_closed', 'ended')
    )
  );
create policy "ticket_types_staff_read"
  on public.ticket_types for select
  using (private.can_view_ticket_event(event_id));
create policy "ticket_types_admin_all"
  on public.ticket_types for all
  using (private.is_admin())
  with check (private.is_admin());
create policy "ticket_types_manager_all"
  on public.ticket_types for all
  using (private.can_manage_ticket_event(event_id))
  with check (private.can_manage_ticket_event(event_id));

create policy "ticket_orders_owner_read"
  on public.ticket_orders for select
  using (buyer_user_id = (select auth.uid()));
create policy "ticket_orders_staff_read"
  on public.ticket_orders for select
  using (private.can_view_ticket_event(event_id));
create policy "ticket_orders_admin_all"
  on public.ticket_orders for all
  using (private.is_admin())
  with check (private.is_admin());

create policy "ticket_order_items_owner_read"
  on public.ticket_order_items for select
  using (exists (
    select 1 from public.ticket_orders owned_order
    where owned_order.id = order_id
      and owned_order.buyer_user_id = (select auth.uid())
  ));
create policy "ticket_order_items_staff_read"
  on public.ticket_order_items for select
  using (exists (
    select 1 from public.ticket_orders staff_order
    where staff_order.id = order_id
      and private.can_view_ticket_event(staff_order.event_id)
  ));
create policy "ticket_order_items_admin_all"
  on public.ticket_order_items for all
  using (private.is_admin())
  with check (private.is_admin());

create policy "ticket_event_staff_self_read"
  on public.ticket_event_staff for select
  using (member_id = private.current_member_id());
create policy "ticket_event_staff_manager_read"
  on public.ticket_event_staff for select
  using (private.can_manage_ticket_event(event_id));
create policy "ticket_event_staff_admin_all"
  on public.ticket_event_staff for all
  using (private.is_admin())
  with check (private.is_admin());
create policy "ticket_event_staff_manager_all"
  on public.ticket_event_staff for all
  using (private.can_manage_ticket_event(event_id))
  with check (private.can_manage_ticket_event(event_id));

create policy "tickets_owner_read"
  on public.tickets for select
  using (exists (
    select 1 from public.ticket_orders owned_order
    where owned_order.id = order_id
      and owned_order.buyer_user_id = (select auth.uid())
  ));
create policy "tickets_staff_read"
  on public.tickets for select
  using (private.can_view_ticket_event(event_id));
create policy "tickets_admin_all"
  on public.tickets for all
  using (private.is_admin())
  with check (private.is_admin());

create policy "ticket_checkins_owner_read"
  on public.ticket_checkins for select
  using (exists (
    select 1
    from public.tickets owned_ticket
    join public.ticket_orders owned_order on owned_order.id = owned_ticket.order_id
    where owned_ticket.id = ticket_id
      and owned_order.buyer_user_id = (select auth.uid())
  ));
create policy "ticket_checkins_staff_read"
  on public.ticket_checkins for select
  using (private.can_view_ticket_event(event_id));
create policy "ticket_checkins_admin_all"
  on public.ticket_checkins for all
  using (private.is_admin())
  with check (private.is_admin());

-- =====================================================================
-- Atomic ticket operations
-- =====================================================================

create or replace function public.get_ticket_event_availability(p_event_id uuid)
returns table (
  capacity int,
  reserved int,
  remaining int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    event_ref.capacity,
    coalesce(sum(order_ref.quantity) filter (
      where order_ref.status in ('payment_review', 'confirmed')
        or (
          order_ref.status = 'pending_payment'
          and (order_ref.payment_due_at is null or order_ref.payment_due_at >= now())
        )
    ), 0)::int as reserved,
    greatest(
      event_ref.capacity - coalesce(sum(order_ref.quantity) filter (
        where order_ref.status in ('payment_review', 'confirmed')
          or (
            order_ref.status = 'pending_payment'
            and (order_ref.payment_due_at is null or order_ref.payment_due_at >= now())
          )
      ), 0)::int,
      0
    ) as remaining
  from public.ticket_events event_ref
  left join public.ticket_orders order_ref on order_ref.event_id = event_ref.id
  where event_ref.id = p_event_id
    and event_ref.status in ('published', 'sales_open', 'sales_closed', 'ended')
  group by event_ref.id, event_ref.capacity;
$$;

create or replace function public.create_ticket_event(
  p_title text,
  p_slug text,
  p_summary text,
  p_poster_url text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_venue_name text,
  p_venue_address text,
  p_status public.ticket_event_status,
  p_sales_open_at timestamptz,
  p_sales_close_at timestamptz,
  p_capacity int,
  p_max_per_order int,
  p_payment_due_minutes int,
  p_ticket_name text,
  p_ticket_price_won int,
  p_bank_name text,
  p_account_number text,
  p_account_holder text,
  p_transfer_note text,
  p_contact_text text,
  p_refund_policy text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, private
as $$
declare
  actor_member_id uuid;
  performance_schema_id uuid;
  section_relation_schema_id uuid;
  performance_archive_section_id uuid;
  performance_id uuid;
  event_id uuid;
  archive_sort_order int;
  normalized_slug text;
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  actor_member_id := private.current_member_id();
  normalized_slug := lower(regexp_replace(btrim(p_slug), '[^a-zA-Z0-9-]+', '-', 'g'));
  normalized_slug := btrim(normalized_slug, '-');

  if normalized_slug = '' then
    raise exception 'A URL slug is required' using errcode = '22023';
  end if;

  select id into performance_schema_id
  from public.entity_schemas
  where schema_key = 'performance/v1'
    and kind = 'entity'
    and active = true;

  if performance_schema_id is null then
    raise exception 'Active performance/v1 schema is required';
  end if;

  select id into section_relation_schema_id
  from public.entity_schemas
  where schema_key = 'relation/section-entity/v1'
    and kind = 'relation'
    and active = true;

  select id into performance_archive_section_id
  from public.entities
  where slug = 'section:performances-archive'
  limit 1;

  insert into public.entities (
    schema_id,
    slug,
    title,
    summary,
    thumbnail_url,
    published,
    visibility,
    sort_at,
    owner_member_id,
    data
  )
  values (
    performance_schema_id,
    normalized_slug,
    btrim(p_title),
    nullif(btrim(p_summary), ''),
    nullif(btrim(p_poster_url), ''),
    p_status <> 'draft' and p_status <> 'cancelled',
    'public',
    p_starts_at,
    actor_member_id,
    jsonb_build_object(
      'event_date', to_char(p_starts_at at time zone 'Asia/Seoul', 'YYYY-MM-DD'),
      'display_date', to_char(p_starts_at at time zone 'Asia/Seoul', 'YYYY.MM.DD HH24:MI'),
      'venue', btrim(p_venue_name),
      'venue_address', nullif(btrim(p_venue_address), ''),
      'type', 'special',
      'year', to_char(p_starts_at at time zone 'Asia/Seoul', 'YYYY')
    )
  )
  returning id into performance_id;

  -- Keep the normal performance archive complete after ticket sales end.
  if section_relation_schema_id is not null
    and performance_archive_section_id is not null then
    select coalesce(max(sort_order), 0) + 10 into archive_sort_order
    from public.entity_relations
    where from_entity_id = performance_archive_section_id;

    insert into public.entity_relations (
      from_entity_id,
      to_entity_id,
      schema_id,
      relation_type,
      slot,
      sort_order,
      props,
      created_by_member_id
    ) values (
      performance_archive_section_id,
      performance_id,
      section_relation_schema_id,
      'item',
      'season-' || to_char(p_starts_at at time zone 'Asia/Seoul', 'YYYY'),
      archive_sort_order,
      '{}'::jsonb,
      actor_member_id
    );
  end if;

  insert into public.ticket_events (
    performance_entity_id,
    slug,
    status,
    starts_at,
    ends_at,
    venue_name,
    venue_address,
    sales_open_at,
    sales_close_at,
    capacity,
    max_per_order,
    payment_due_minutes,
    contact_text,
    refund_policy,
    created_by_member_id
  )
  values (
    performance_id,
    normalized_slug,
    p_status,
    p_starts_at,
    p_ends_at,
    btrim(p_venue_name),
    nullif(btrim(p_venue_address), ''),
    p_sales_open_at,
    p_sales_close_at,
    p_capacity,
    p_max_per_order,
    p_payment_due_minutes,
    nullif(btrim(p_contact_text), ''),
    nullif(btrim(p_refund_policy), ''),
    actor_member_id
  )
  returning id into event_id;

  insert into public.ticket_payment_settings (
    event_id,
    bank_name,
    account_number,
    account_holder,
    transfer_note
  ) values (
    event_id,
    btrim(p_bank_name),
    btrim(p_account_number),
    btrim(p_account_holder),
    nullif(btrim(p_transfer_note), '')
  );

  insert into public.ticket_types (
    event_id,
    name,
    description,
    kind,
    price_won,
    inventory_limit,
    public_sale,
    sort_order
  ) values (
    event_id,
    btrim(p_ticket_name),
    '공연 입장권',
    'paid',
    p_ticket_price_won,
    p_capacity,
    true,
    10
  );

  insert into public.ticket_event_staff (
    event_id,
    member_id,
    role,
    created_by_member_id
  ) values (
    event_id,
    actor_member_id,
    'manager',
    actor_member_id
  );

  return event_id;
end;
$$;

create or replace function public.create_ticket_order(
  p_event_id uuid,
  p_ticket_type_id uuid,
  p_quantity int,
  p_buyer_name text,
  p_buyer_phone text,
  p_depositor_name text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, private
as $$
declare
  buyer_id uuid;
  buyer_email text;
  event_row public.ticket_events%rowtype;
  ticket_type_row public.ticket_types%rowtype;
  reserved_count int;
  type_reserved_count int;
  order_id uuid;
  order_code text;
begin
  buyer_id := auth.uid();
  if buyer_id is null then
    raise exception 'Sign in before reserving tickets' using errcode = '42501';
  end if;

  if not exists (
    select 1 from auth.identities identity_ref
    where identity_ref.user_id = buyer_id
      and identity_ref.provider = 'google'
  ) and not exists (
    select 1 from public.members member_ref
    where member_ref.auth_user_id = buyer_id
  ) then
    raise exception 'Google sign-in is required for ticket customers'
      using errcode = '42501';
  end if;

  if p_quantity is null or p_quantity < 1 then
    raise exception 'Choose at least one ticket' using errcode = '22023';
  end if;

  select * into event_row
  from public.ticket_events
  where id = p_event_id
  for update;

  if not found or event_row.status <> 'sales_open' then
    raise exception 'Ticket sales are not open' using errcode = '22023';
  end if;

  if event_row.sales_open_at is not null and now() < event_row.sales_open_at then
    raise exception 'Ticket sales have not opened yet' using errcode = '22023';
  end if;

  if event_row.sales_close_at is not null and now() >= event_row.sales_close_at then
    raise exception 'Ticket sales are closed' using errcode = '22023';
  end if;

  if p_quantity > event_row.max_per_order then
    raise exception 'Ticket quantity exceeds the per-order limit' using errcode = '22023';
  end if;

  select * into ticket_type_row
  from public.ticket_types
  where id = p_ticket_type_id
    and event_id = p_event_id
    and active = true
    and public_sale = true;

  if not found then
    raise exception 'Ticket type is not available' using errcode = '22023';
  end if;

  update public.ticket_orders
  set status = 'expired'
  where event_id = p_event_id
    and status = 'pending_payment'
    and payment_due_at is not null
    and payment_due_at < now();

  select coalesce(sum(quantity), 0)::int into reserved_count
  from public.ticket_orders
  where event_id = p_event_id
    and status in ('pending_payment', 'payment_review', 'confirmed');

  if reserved_count + p_quantity > event_row.capacity then
    raise exception 'Not enough tickets remain' using errcode = '22023';
  end if;

  if ticket_type_row.inventory_limit is not null then
    select coalesce(sum(item.quantity), 0)::int into type_reserved_count
    from public.ticket_order_items item
    join public.ticket_orders existing_order on existing_order.id = item.order_id
    where item.ticket_type_id = p_ticket_type_id
      and existing_order.status in ('pending_payment', 'payment_review', 'confirmed');

    if type_reserved_count + p_quantity > ticket_type_row.inventory_limit then
      raise exception 'Not enough tickets remain for this type' using errcode = '22023';
    end if;
  end if;

  select email into buyer_email from auth.users where id = buyer_id;
  if buyer_email is null then
    raise exception 'A verified email is required' using errcode = '22023';
  end if;

  insert into public.ticket_customers (
    auth_user_id,
    email,
    display_name,
    avatar_url
  )
  select
    buyer_id,
    buyer_email,
    nullif(btrim(p_buyer_name), ''),
    nullif(raw_user_meta_data->>'avatar_url', '')
  from auth.users
  where id = buyer_id
  on conflict (auth_user_id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      avatar_url = coalesce(excluded.avatar_url, public.ticket_customers.avatar_url),
      updated_at = now();

  order_code := 'BRM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.ticket_orders (
    event_id,
    buyer_user_id,
    order_number,
    channel,
    status,
    buyer_name,
    buyer_email,
    buyer_phone,
    depositor_name,
    quantity,
    total_amount,
    payment_due_at
  ) values (
    p_event_id,
    buyer_id,
    order_code,
    'online',
    'pending_payment',
    btrim(p_buyer_name),
    buyer_email,
    nullif(btrim(p_buyer_phone), ''),
    nullif(btrim(p_depositor_name), ''),
    p_quantity,
    p_quantity * ticket_type_row.price_won,
    now() + make_interval(mins => event_row.payment_due_minutes)
  ) returning id into order_id;

  insert into public.ticket_order_items (
    order_id,
    ticket_type_id,
    quantity,
    unit_price,
    line_total
  ) values (
    order_id,
    p_ticket_type_id,
    p_quantity,
    ticket_type_row.price_won,
    p_quantity * ticket_type_row.price_won
  );

  return order_id;
end;
$$;

create or replace function public.report_ticket_order_paid(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update public.ticket_orders
  set status = 'payment_review',
      paid_reported_at = now()
  where id = p_order_id
    and buyer_user_id = auth.uid()
    and status = 'pending_payment'
    and (payment_due_at is null or payment_due_at >= now());

  if not found then
    raise exception 'This order cannot be reported as paid' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.approve_ticket_order(p_order_id uuid)
returns int
language plpgsql
security definer
set search_path = public, auth, private
as $$
declare
  actor_member_id uuid;
  order_row public.ticket_orders%rowtype;
  event_slug text;
  item record;
  ticket_index int;
  issued_count int := 0;
begin
  select * into order_row
  from public.ticket_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found' using errcode = '22023';
  end if;

  if not private.can_manage_ticket_event(order_row.event_id) then
    raise exception 'Event manager access required' using errcode = '42501';
  end if;

  if order_row.status not in ('pending_payment', 'payment_review') then
    raise exception 'This order cannot be approved' using errcode = '22023';
  end if;

  actor_member_id := private.current_member_id();
  select slug into event_slug from public.ticket_events where id = order_row.event_id;

  update public.ticket_orders
  set status = 'confirmed',
      confirmed_at = now(),
      confirmed_by_member_id = actor_member_id
  where id = p_order_id;

  for item in
    select ticket_type_id, quantity
    from public.ticket_order_items
    where order_id = p_order_id
  loop
    for ticket_index in 1..item.quantity loop
      insert into public.tickets (
        event_id,
        order_id,
        ticket_type_id,
        serial_code,
        holder_name
      ) values (
        order_row.event_id,
        p_order_id,
        item.ticket_type_id,
        upper(substr(event_slug, 1, 8)) || '-' ||
          upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
        order_row.buyer_name
      );
      issued_count := issued_count + 1;
    end loop;
  end loop;

  return issued_count;
end;
$$;

create or replace function public.cancel_ticket_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, private
as $$
declare
  actor_member_id uuid;
  order_row public.ticket_orders%rowtype;
begin
  select * into order_row
  from public.ticket_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found' using errcode = '22023';
  end if;

  if not private.can_manage_ticket_event(order_row.event_id) then
    raise exception 'Event manager access required' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.tickets
    where order_id = p_order_id and status = 'checked_in'
  ) then
    raise exception 'Checked-in tickets cannot be cancelled' using errcode = '22023';
  end if;

  actor_member_id := private.current_member_id();

  update public.ticket_orders
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by_member_id = actor_member_id
  where id = p_order_id
    and status not in ('cancelled', 'expired', 'refunded');

  update public.tickets
  set status = 'void',
      voided_at = now()
  where order_id = p_order_id
    and status = 'issued';
end;
$$;

create or replace function public.update_ticket_event_status(
  p_event_id uuid,
  p_status public.ticket_event_status
)
returns void
language plpgsql
security definer
set search_path = public, auth, private
as $$
declare
  performance_id uuid;
begin
  if not private.can_manage_ticket_event(p_event_id) then
    raise exception 'Event manager access required' using errcode = '42501';
  end if;

  update public.ticket_events
  set status = p_status
  where id = p_event_id
  returning performance_entity_id into performance_id;

  if performance_id is null then
    raise exception 'Ticket event not found' using errcode = '22023';
  end if;

  update public.entities
  set published = p_status not in ('draft', 'cancelled')
  where id = performance_id;
end;
$$;

create or replace function public.check_in_ticket(
  p_event_id uuid,
  p_qr_token uuid
)
returns table (
  result text,
  ticket_id uuid,
  serial_code text,
  holder_name text,
  order_number text,
  checked_in_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, private
as $$
declare
  actor_member_id uuid;
  ticket_row record;
begin
  if not private.can_check_in_ticket_event(p_event_id) then
    raise exception 'Door staff access required' using errcode = '42501';
  end if;

  actor_member_id := private.current_member_id();

  select
    ticket_ref.id,
    ticket_ref.serial_code,
    ticket_ref.holder_name,
    ticket_ref.status,
    ticket_ref.checked_in_at,
    order_ref.order_number
  into ticket_row
  from public.tickets ticket_ref
  join public.ticket_orders order_ref on order_ref.id = ticket_ref.order_id
  where ticket_ref.event_id = p_event_id
    and ticket_ref.qr_token = p_qr_token
  for update of ticket_ref;

  if not found then
    return query select 'invalid', null::uuid, null::text, null::text, null::text, null::timestamptz;
    return;
  end if;

  if ticket_row.status = 'checked_in' then
    return query select
      'already_used',
      ticket_row.id,
      ticket_row.serial_code,
      ticket_row.holder_name,
      ticket_row.order_number,
      ticket_row.checked_in_at;
    return;
  end if;

  if ticket_row.status <> 'issued' then
    return query select
      'invalid',
      ticket_row.id,
      ticket_row.serial_code,
      ticket_row.holder_name,
      ticket_row.order_number,
      ticket_row.checked_in_at;
    return;
  end if;

  update public.tickets
  set status = 'checked_in',
      checked_in_at = now(),
      checked_in_by_member_id = actor_member_id
  where id = ticket_row.id;

  insert into public.ticket_checkins (
    event_id,
    ticket_id,
    checked_in_by_member_id
  ) values (
    p_event_id,
    ticket_row.id,
    actor_member_id
  );

  return query select
    'checked_in',
    ticket_row.id,
    ticket_row.serial_code,
    ticket_row.holder_name,
    ticket_row.order_number,
    now();
end;
$$;

revoke all on function public.create_ticket_event(
  text, text, text, text, timestamptz, timestamptz, text, text,
  public.ticket_event_status, timestamptz, timestamptz, int, int, int,
  text, int, text, text, text, text, text, text
) from public;
revoke all on function public.get_ticket_event_availability(uuid) from public;
revoke all on function public.create_ticket_order(uuid, uuid, int, text, text, text) from public;
revoke all on function public.report_ticket_order_paid(uuid) from public;
revoke all on function public.approve_ticket_order(uuid) from public;
revoke all on function public.cancel_ticket_order(uuid) from public;
revoke all on function public.update_ticket_event_status(uuid, public.ticket_event_status) from public;
revoke all on function public.check_in_ticket(uuid, uuid) from public;

grant execute on function public.create_ticket_event(
  text, text, text, text, timestamptz, timestamptz, text, text,
  public.ticket_event_status, timestamptz, timestamptz, int, int, int,
  text, int, text, text, text, text, text, text
) to authenticated;
grant execute on function public.get_ticket_event_availability(uuid) to anon, authenticated;
grant execute on function public.create_ticket_order(uuid, uuid, int, text, text, text) to authenticated;
grant execute on function public.report_ticket_order_paid(uuid) to authenticated;
grant execute on function public.approve_ticket_order(uuid) to authenticated;
grant execute on function public.cancel_ticket_order(uuid) to authenticated;
grant execute on function public.update_ticket_event_status(uuid, public.ticket_event_status) to authenticated;
grant execute on function public.check_in_ticket(uuid, uuid) to authenticated;

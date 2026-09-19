-- =========================================================
-- BookStack-Silapathar RBAC & Security Database Migration
-- Execute this script in Supabase SQL Editor
-- =========================================================

-- 1. CREATE ENUM FOR USER ROLES
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('USER', 'STORE_OWNER', 'ADMIN');
  end if;
end $$;

-- 2. UPDATE PUBLIC.USERS TABLE
-- Add role column
alter table public.users add column if not exists role public.user_role not null default 'USER'::public.user_role;

-- Drop default UUID generator on id if present to prepare for auth.users linking
alter table public.users alter column id drop default;

-- Ensure Foreign Key from public.users.id to auth.users.id
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'fk_users_auth_users'
  ) then
    alter table public.users 
      add constraint fk_users_auth_users 
      foreign key (id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- 3. FUNCTION TO GET CURRENT USER ROLE
create or replace function public.get_user_role()
returns public.user_role as $$
  select role from public.users where id = auth.uid();
$$ language sql security definer stable set search_path = public, pg_temp;

-- 4. AUTOMATED USER REGISTRATION TRIGGER ON AUTH.USERS (Unconditionally assigns USER role)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    'USER'::public.user_role
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(excluded.name, public.users.name);
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. TRIGGER TO PREVENT NON-ADMIN ROLE SELF-MODIFICATION ON PUBLIC.USERS
create or replace function public.enforce_user_role_security()
returns trigger as $$
begin
  -- If role column is being changed during UPDATE
  if new.role is distinct from old.role then
    -- Strictly allow ONLY platform ADMINs to modify roles
    if public.get_user_role() <> 'ADMIN'::public.user_role then
      raise exception 'Unauthorized: Only platform Administrators can change user roles.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists check_user_role_update on public.users;
create trigger check_user_role_update
  before update on public.users
  for each row execute function public.enforce_user_role_security();

-- 6. ADMIN ROLE ASSIGNMENT RPC
create or replace function public.admin_change_user_role(
  p_target_user_id uuid,
  p_new_role public.user_role
)
returns boolean as $$
begin
  if public.get_user_role() <> 'ADMIN'::public.user_role then
    raise exception 'Unauthorized: Only platform Administrators can change user roles.';
  end if;

  update public.users
  set role = p_new_role
  where id = p_target_user_id;

  return true;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

revoke execute on function public.admin_change_user_role(uuid, public.user_role) from public, anon;
grant execute on function public.admin_change_user_role(uuid, public.user_role) to authenticated;

-- 7. ATOMIC RESERVATION TRANSACTION RPC
create or replace function public.create_reservation_tx(
  p_inventory_id uuid,
  p_quantity integer default 1
)
returns uuid as $$
declare
  v_user_id uuid := auth.uid();
  v_inv record;
  v_order_id uuid;
  v_total_amount numeric(10,2);
begin
  if v_user_id is null then
    raise exception 'Authentication required to place a reservation.';
  end if;

  if p_quantity <= 0 then
    raise exception 'Quantity must be at least 1.';
  end if;

  -- Atomic Row Lock on book_inventory
  select id, stock, price, book_id, bookstall_id 
  into v_inv
  from public.book_inventory
  where id = p_inventory_id
  for update;

  if not found then
    raise exception 'Store inventory item not found.';
  end if;

  if v_inv.stock < p_quantity then
    raise exception 'Insufficient stock available at this bookstore.';
  end if;

  v_total_amount := (v_inv.price * p_quantity);

  -- Decrement stock atomically
  update public.book_inventory
  set stock = stock - p_quantity
  where id = p_inventory_id;

  -- Insert Order record
  insert into public.orders (user_id, bookstall_id, total_amount, status, payment_method)
  values (v_user_id, v_inv.bookstall_id, v_total_amount, 'reserved', 'offline')
  returning id into v_order_id;

  -- Insert Order Item record
  insert into public.order_items (order_id, book_id, quantity, price_at_purchase)
  values (v_order_id, v_inv.book_id, p_quantity, v_inv.price);

  return v_order_id;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

revoke execute on function public.create_reservation_tx(uuid, integer) from public, anon;
grant execute on function public.create_reservation_tx(uuid, integer) to authenticated;

-- 8. ATOMIC CANCELLATION TRANSACTION RPC
create or replace function public.cancel_reservation_tx(
  p_order_id uuid
)
returns boolean as $$
declare
  v_user_id uuid := auth.uid();
  v_user_role public.user_role;
  v_order record;
  v_item record;
begin
  select get_user_role() into v_user_role;

  -- Lock order row
  select id, status, bookstall_id, user_id
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order record not found.';
  end if;

  if v_order.status = 'cancelled' then
    raise exception 'Order is already cancelled.';
  end if;

  -- Authorization check: Customer (own order), Store Owner (own stall), or Admin
  if not (
    (v_order.user_id = v_user_id) or
    (v_user_role = 'STORE_OWNER' and exists (select 1 from public.bookstalls where id = v_order.bookstall_id and owner_id = v_user_id)) or
    (v_user_role = 'ADMIN')
  ) then
    raise exception 'Unauthorized to cancel this reservation.';
  end if;

  -- Mark status cancelled
  update public.orders set status = 'cancelled' where id = p_order_id;

  -- Restore stock to store inventory
  for v_item in 
    select book_id, quantity from public.order_items where order_id = p_order_id
  loop
    update public.book_inventory
    set stock = stock + v_item.quantity
    where book_id = v_item.book_id and bookstall_id = v_order.bookstall_id;
  end loop;

  return true;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

revoke execute on function public.cancel_reservation_tx(uuid) from public, anon;
grant execute on function public.cancel_reservation_tx(uuid) to authenticated;

-- 9. ATOMIC COMPLETION TRANSACTION RPC
create or replace function public.complete_reservation_tx(
  p_order_id uuid
)
returns boolean as $$
declare
  v_user_id uuid := auth.uid();
  v_user_role public.user_role;
  v_order record;
begin
  select get_user_role() into v_user_role;

  -- Lock order row
  select id, status, bookstall_id
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order record not found.';
  end if;

  if v_order.status <> 'reserved' then
    raise exception 'Only active reservations can be marked as completed.';
  end if;

  -- Authorization Check: Store Owner (own stall) or Admin ONLY
  if not (
    (v_user_role = 'STORE_OWNER' and exists (select 1 from public.bookstalls where id = v_order.bookstall_id and owner_id = v_user_id)) or
    (v_user_role = 'ADMIN')
  ) then
    raise exception 'Unauthorized to mark this reservation as completed.';
  end if;

  -- Mark status completed
  update public.orders set status = 'completed' where id = p_order_id;

  return true;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

revoke execute on function public.complete_reservation_tx(uuid) from public, anon;
grant execute on function public.complete_reservation_tx(uuid) to authenticated;

-- 10. SAFE CATALOG BOOK & STORE INVENTORY ADDITION RPC
create or replace function public.add_new_catalog_book_and_inventory(
  p_title text,
  p_author text,
  p_category text,
  p_description text,
  p_isbn text,
  p_image_url text,
  p_bookstall_id uuid,
  p_price numeric,
  p_stock integer
)
returns uuid as $$
declare
  v_user_id uuid := auth.uid();
  v_user_role public.user_role;
  v_new_book_id uuid;
  v_new_inv_id uuid;
begin
  select get_user_role() into v_user_role;

  -- Authorization Check: Store Owner (owning this bookstall) or Admin
  if not (
    (v_user_role = 'STORE_OWNER' and exists (select 1 from public.bookstalls where id = p_bookstall_id and owner_id = v_user_id)) or
    (v_user_role = 'ADMIN')
  ) then
    raise exception 'Unauthorized to add inventory for this store.';
  end if;

  -- Insert Master Catalog Book
  insert into public.books (title, author, category, description, isbn, image_url, price, bookstall_id)
  values (p_title, p_author, p_category, p_description, p_isbn, p_image_url, p_price, p_bookstall_id)
  returning id into v_new_book_id;

  -- Insert Store Inventory Entry
  insert into public.book_inventory (book_id, bookstall_id, price, stock)
  values (v_new_book_id, p_bookstall_id, p_price, p_stock)
  returning id into v_new_inv_id;

  return v_new_inv_id;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

revoke execute on function public.add_new_catalog_book_and_inventory(text, text, text, text, text, text, uuid, numeric, integer) from public, anon;
grant execute on function public.add_new_catalog_book_and_inventory(text, text, text, text, text, text, uuid, numeric, integer) to authenticated;

-- 11. ENABLE ROW-LEVEL SECURITY (RLS) ON ALL TABLES
alter table public.users enable row level security;
alter table public.bookstalls enable row level security;
alter table public.books enable row level security;
alter table public.book_inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- 12. RLS POLICIES

-- USERS TABLE POLICIES
drop policy if exists "Users view own profile or admin views all" on public.users;
create policy "Users view own profile or admin views all"
  on public.users for select to authenticated
  using (id = auth.uid() or get_user_role() = 'ADMIN');

drop policy if exists "Users update own profile or admin updates all" on public.users;
create policy "Users update own profile or admin updates all"
  on public.users for update to authenticated
  using (id = auth.uid() or get_user_role() = 'ADMIN')
  with check (
    (get_user_role() = 'ADMIN') or 
    (id = auth.uid() and role = (select role from public.users where id = auth.uid()))
  );

-- BOOKSTALLS TABLE POLICIES
drop policy if exists "Bookstalls are publicly viewable" on public.bookstalls;
create policy "Bookstalls are publicly viewable"
  on public.bookstalls for select to public
  using (true);

drop policy if exists "Admins create or delete bookstalls" on public.bookstalls;
create policy "Admins create or delete bookstalls"
  on public.bookstalls for all to authenticated
  using (get_user_role() = 'ADMIN');

drop policy if exists "Store owners update owned bookstalls without changing owner_id" on public.bookstalls;
create policy "Store owners update owned bookstalls without changing owner_id"
  on public.bookstalls for update to authenticated
  using (
    (get_user_role() = 'STORE_OWNER' and owner_id = auth.uid()) or get_user_role() = 'ADMIN'
  )
  with check (
    (get_user_role() = 'STORE_OWNER' and owner_id = auth.uid() and owner_id = owner_id) or get_user_role() = 'ADMIN'
  );

-- BOOKS TABLE POLICIES (MASTER CATALOG)
drop policy if exists "Books catalog is publicly viewable" on public.books;
create policy "Books catalog is publicly viewable"
  on public.books for select to public
  using (true);

drop policy if exists "Admins manage master books catalog" on public.books;
create policy "Admins manage master books catalog"
  on public.books for all to authenticated
  using (get_user_role() = 'ADMIN');

-- BOOK_INVENTORY POLICIES
drop policy if exists "Book inventory is publicly viewable" on public.book_inventory;
create policy "Book inventory is publicly viewable"
  on public.book_inventory for select to public
  using (true);

drop policy if exists "Store owners and admins manage store inventory" on public.book_inventory;
create policy "Store owners and admins manage store inventory"
  on public.book_inventory for all to authenticated
  using (
    get_user_role() = 'ADMIN' or 
    (get_user_role() = 'STORE_OWNER' and exists (
      select 1 from public.bookstalls where id = book_inventory.bookstall_id and owner_id = auth.uid()
    ))
  );

-- ORDERS TABLE POLICIES
drop policy if exists "Users view own orders, store owners view stall orders, admin views all" on public.orders;
create policy "Users view own orders, store owners view stall orders, admin views all"
  on public.orders for select to authenticated
  using (
    user_id = auth.uid() or
    get_user_role() = 'ADMIN' or
    (get_user_role() = 'STORE_OWNER' and exists (
      select 1 from public.bookstalls where id = orders.bookstall_id and owner_id = auth.uid()
    ))
  );

-- ORDER_ITEMS TABLE POLICIES
drop policy if exists "Order items viewable by order stakeholders" on public.order_items;
create policy "Order items viewable by order stakeholders"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and (
        o.user_id = auth.uid() or
        get_user_role() = 'ADMIN' or
        (get_user_role() = 'STORE_OWNER' and exists (
          select 1 from public.bookstalls s where s.id = o.bookstall_id and s.owner_id = auth.uid()
        ))
      )
    )
  );

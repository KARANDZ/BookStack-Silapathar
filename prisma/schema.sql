create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  created_at timestamptz default now()
);

create table if not exists bookstalls (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text not null default 'Silapathar',
  phone text,
  logo_url text,
  owner_id uuid references users(id),
  created_at timestamptz default now()
);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  bookstall_id uuid references bookstalls(id) on delete cascade,
  title text not null,
  author text,
  isbn text,
  price numeric(10,2) not null,
  stock integer default 0,
  image_url text,
  category text,
  description text,
  created_at timestamptz default now()
);

create type order_status as enum ('pending','reserved','completed','cancelled');

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  bookstall_id uuid references bookstalls(id),
  total_amount numeric(10,2) default 0,
  status order_status default 'pending',
  payment_method text,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  book_id uuid references books(id),
  quantity integer not null default 1,
  price_at_purchase numeric(10,2) not null
);

create index if not exists idx_books_title on books using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(author,'')));

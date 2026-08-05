# 📚 BookStack Silapathar - Town Bookstall Marketplace & Reservation Platform

> A modern, full-stack web application connecting readers with local bookstalls in **Silapathar**. Browse inventory across local stores, search books in real-time, reserve copies for offline pickup, and manage sales via an integrated administrative dashboard.

---

## Live Demo
https://bookstack-silapathar.vercel.app/

## GitHub Repository
https://github.com/KARANDZ/BookStack-Silapathar

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [Customer Portal](#customer-portal)
  - [Admin Panel](#admin-panel)
- [Tech Stack](#-tech-stack)
- [Database Schema & Architecture](#-database-schema--architecture)
- [Recent Updates & Architecture Refactoring](#-recent-updates--architecture-refactoring)
- [Project Directory Structure](#-project-directory-structure)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup (Supabase)](#database-setup-supabase)
  - [Installation & Local Development](#installation--local-development)
- [Workflow & Order Lifecycle](#-workflow--order-lifecycle)
- [Future Enhancements](#-future-enhancements)

---

## 🌟 Overview

**LocalBookHub** solves a common local commerce problem: book lovers often don't know which local bookstore has a specific book in stock, leading to wasted store visits or turning to giant online e-commerce platforms. 

LocalBookHub bridges this gap by aggregating local bookstall inventories into a central, searchable marketplace. Customers can instantly search for titles, authors, categories, or specific bookstores in **Silapathar**, check live stock levels, and reserve books for store pickup. Local bookstall owners gain access to an intuitive admin dashboard to track revenue, fulfill reservations, and manage inventory.

---

## ✨ Key Features

### Customer Portal
- 🏪 **Bookstall Directory**: Browse local bookstalls in Silapathar with store logos, addresses, and contact info.
- 🔍 **Multi-Field Real-Time Search**: Search by title, author, category, or bookstore name across all participating bookstalls.
- 📖 **Detailed Inventory Views**: Inspect store-specific book availability, pricing, descriptions, cover images, and stock status.
- 🛍️ **Instant Book Reservation**: Reserve books online for physical store pickup without upfront payment ("Pay at Store / Offline").
- 📜 **Booking Tracking & Customer Cancellation**: Track reservation history, view pickup details, and cancel reservations with automatic stock restoration back to store inventory.

### Admin Panel
- 📊 **Analytics Dashboard**: Real-time business metrics including Total Orders, Pending Pickups, Completed Count, Cancelled Count, and Total Revenue (₹).
- 📦 **Order Fulfillment**: Review incoming book pickup reservations with itemized customer order breakdowns.
- ✅ **Pick-up Completion**: Mark orders as "Picked Up" once customers collect their reserved books.
- ❌ **Order Cancellation & Stock Restoration**: Cancel orders with automatic, real-time stock restoration back to `book_inventory`.

---

## 🛠️ Tech Stack

### Frontend & Core
- **Framework**: [Next.js 14](https://nextjs.org/) (Pages Router)
- **UI Library**: [React 18](https://react.dev/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) with PostCSS & Autoprefixer
- **Data Fetching**: Supabase JS SDK (`@supabase/supabase-js`)

### Backend & Database
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
- **API Engine**: Next.js Serverless API Routes (`/pages/api/*`)
- **Database Extension**: PostgreSQL `pgcrypto` for UUID generation

---

## 🗄️ Database Schema & Architecture

The database follows a **normalized relational architecture** on PostgreSQL hosted on Supabase:

### 1. Master Catalog vs. Store Inventory

- **`books` (Master Catalog)**: Contains master information about books (`id`, `title`, `author`, `isbn`, `category`, `description`, `image_url`). It represents *what books exist in the system*, independent of store stock.
- **`book_inventory` (Store Inventory Source of Truth)**: Maps `(book_id + bookstall_id)` with store-specific `stock` and `price`. This table is the **single source of truth** for availability.

### Data Models

```sql
-- 1. Users Table
create table users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  created_at timestamptz default now()
);

-- 2. Bookstalls Table
create table bookstalls (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text not null default 'Silapathar',
  phone text,
  logo_url text,
  owner_id uuid references users(id),
  created_at timestamptz default now()
);

-- 3. Books Table (Master Catalog)
create table books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  isbn text,
  image_url text,
  category text,
  description text,
  created_at timestamptz default now()
);

-- 4. Book Inventory Table (Single Source of Truth for Stock & Price)
create table book_inventory (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id) on delete cascade,
  bookstall_id uuid references bookstalls(id) on delete cascade,
  stock integer not null default 0,
  price numeric(10,2) not null,
  created_at timestamptz default now()
);

-- 5. Orders Table
create type order_status as enum ('pending', 'reserved', 'completed', 'cancelled');

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  bookstall_id uuid references bookstalls(id),
  total_amount numeric(10,2) default 0,
  status order_status default 'pending',
  payment_method text default 'offline',
  created_at timestamptz default now()
);

-- 6. Order Items Table
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  book_id uuid references books(id),
  quantity integer not null default 1,
  price_at_purchase numeric(10,2) not null
);
```

---

## ⚡ Recent Updates & Architecture Refactoring

### 1. `book_inventory` Single Source of Truth Restoration
- Updated all frontend pages (`/search`, `/stall/[id]`, `/book/[id]`) and backend API routes (`/api/orders`, `/api/books/search`) to query `book_inventory` joined with `books` and `bookstalls`.
- Fixed book availability logic so stock and price read directly from `book_inventory.stock` and `book_inventory.price`.
- Restored store page metrics so "Titles Available" is calculated from active store inventory records.

### 2. Multi-Field Search & Live Filters
- Expanded `/search` and `/api/books/search` to search across book title, author, category, and bookstore name.
- Added live clear button, loading skeletons, and interactive search feedback.

### 3. Order Management & Automated Stock Restoration
- Updated reservation placement (`/api/orders`) to validate stock against `book_inventory.stock` and decrement `book_inventory.stock`.
- Added customer-side cancellation on `/bookings` with stock restoration back to `book_inventory`.
- Updated admin order cancellation (`/admin/orders`) to safely loop through order items and restore stock to `book_inventory`.
- Corrected status badge color coding (`reserved` = Amber, `completed` = Emerald, `cancelled` = Rose).

### 4. UI & Aesthetic Overhaul
- Redesigned header with glassmorphism backdrop, brand logo badge, and active link highlights.
- Added image error fallback handlers for books and store logos.
- Updated store directory, book detail view, and admin metrics cards with clean modern styling.
### 4. Modern UI / UX Redesign

The user interface was completely modernized to provide a cleaner and more intuitive experience while preserving the original functionality.

#### Improvements

- Redesigned responsive homepage with improved visual hierarchy.
- Modernized search interface with loading states and interactive feedback.
- Redesigned Book Cards with inventory badges, pricing emphasis, and better spacing.
- Improved bookstore directory layout and navigation.
- Enhanced Book Detail pages with cleaner information hierarchy.
- Refined Admin Dashboard using modern analytics cards and improved action buttons.
- Added consistent color palette, rounded components, improved shadows, and hover animations.
- Improved responsive behavior for desktop, tablet, and mobile devices.
- Added image fallback handling for books and bookstore logos.
- Improved typography and spacing across the application.
---

## 📁 Project Directory Structure

```text
localbookhub_full/
├── components/            # Reusable UI Components
│   ├── BookCard.js        # Card component receiving `inventory` (stock, price, books, bookstalls)
│   ├── Header.js          # Main navigation bar (Home, Search, My Bookings, Admin)
│   ├── Layout.js          # Global page layout container wrapper with footer
│   └── StallCard.js       # Bookstall card component for directory listing
├── lib/
│   └── supabaseClient.js  # Supabase client instantiation (@supabase/supabase-js)
├── pages/                 # Next.js Pages & Routing
│   ├── _app.js            # Custom App component & global CSS imports
│   ├── index.js           # Homepage (Bookstall Directory for Silapathar)
│   ├── search.js          # Search page querying book_inventory
│   ├── bookings.js        # Customer reservation history & cancellation
│   ├── admin/             # Administrative Management Module
│   │   ├── index.js       # Admin panel navigation hub
│   │   ├── dashboard.js   # Real-time revenue & order statistics
│   │   └── orders.js      # Order fulfillment (Mark Completed / Cancel Order)
│   ├── api/               # Serverless REST API Handlers
│   │   ├── bookstalls.js  # GET: Fetch all registered bookstalls
│   │   ├── orders.js      # POST: Reserve book & decrement book_inventory stock
│   │   ├── books/
│   │   │   └── search.js  # GET: Search book_inventory endpoint
│   │   └── stalls/
│   │       └── [id]/
│   │           └── books.js # GET: Fetch inventory for specific stall
│   ├── book/
│   │   └── [id].js        # Detailed book & store inventory reservation page
│   └── stall/
│       └── [id].js        # Individual bookstall showcase & store inventory page
├── prisma/
│   └── schema.sql         # PostgreSQL schema definition & initial setup script
├── public/                # Static assets (images, logos, placeholders)
├── styles/
│   └── globals.css        # Tailwind CSS directives & global styling rules
├── .env.local.example     # Environment variable template
├── next.config.js         # Next.js configuration
├── package.json           # Project dependencies & scripts
├── postcss.config.js      # PostCSS configuration
└── tailwind.config.js     # Tailwind CSS design system configuration
```

---

## 🔌 API Reference

### 1. `GET /api/bookstalls`
- **Description**: Returns all registered bookstalls ordered by name.
- **Response**: Array of bookstall objects (`id`, `name`, `address`, `city`, `phone`, `logo_url`).

### 2. `GET /api/books/search?q={query}`
- **Description**: Searches `book_inventory` joined with `books` and `bookstalls` by title, author, category, or store name.
- **Parameters**: `q` (Search string).
- **Response**: Array of `book_inventory` objects with joined `books` and `bookstalls`.

### 3. `GET /api/stalls/[id]/books`
- **Description**: Retrieves all inventory items available at a specific bookstall.
- **Response**: Array of `book_inventory` objects belonging to the store.

### 4. `POST /api/orders`
- **Description**: Core transaction handler to place a book reservation.
- **Request Body**:
  ```json
  {
    "inventory_id": "UUID",
    "quantity": 1
  }
  ```
- **Execution Flow**:
  1. Validates stock availability against `book_inventory`.
  2. Inserts order record into `orders` with status `'reserved'`.
  3. Inserts order item line in `order_items`.
  4. Atomically decrements `stock` count in the `book_inventory` table.
- **Response**: `{ "success": true, "message": "Book reserved successfully", "order_id": "UUID" }`

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Supabase Account**: A free account on [Supabase.com](https://supabase.com/)

---

### Environment Configuration

1. Create a `.env.local` file in the root directory by copying `.env.local.example`:

   ```bash
   cp .env.local.example .env.local
   ```

2. Configure your Supabase project credentials in `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   NEXT_PUBLIC_SITE_NAME=LocalBookHub
   ```

---

### Database Setup (Supabase)

1. Log into your **Supabase Dashboard** and create a new PostgreSQL project.
2. Open the **SQL Editor** tab in your Supabase dashboard.
3. Open [`prisma/schema.sql`](file:///c:/Users/das65/OneDrive/Desktop/localbookhub_full/prisma/schema.sql) from this repository.
4. Copy and paste the script into the Supabase SQL Editor and click **Run**.
5. Ensure tables (`users`, `bookstalls`, `books`, `book_inventory`, `orders`, `order_items`) are created successfully.

---

### Installation & Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Access Application**:
   Open your browser and navigate to `http://localhost:3000`.

4. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 🔄 Workflow & Order Lifecycle

```mermaid
graph TD;
    A[Customer browses or searches book inventory] --> B[View Book Details & Store Stock from book_inventory];
    B --> C[Click 'Book Now' / Reserve];
    C --> D[System creates Order with status 'reserved'];
    D --> E[System automatically decrements stock in book_inventory];
    E --> F[Customer visits Bookstall in Silapathar];
    F --> G{Store fulfillment action};
    G -->|Customer picks up book| H[Admin marks 'Picked Up' -> Status: 'completed'];
    G -->|Reservation cancelled| I[Customer or Admin cancels -> Status: 'cancelled'];
    I --> J[System automatically restores stock back to book_inventory];
```

---

## 💡 Future Enhancements

- 🔐 **User Authentication**: Complete integration with Supabase Auth for customer logins & store owner role-based access control.
- 💳 **Online Payment Gateway**: Integration with Razorpay / UPI for optional advance payment.
- 📍 **Geolocation & Map View**: Interactive map showing bookstall locations in Silapathar.
- 🔔 **SMS / WhatsApp Notifications**: Instant notification alerts to bookstall owners when new reservations are placed.

---

## 📄 License & Credits

Designed & Developed for **BookStack Silapathar**. Built with Next.js, Tailwind CSS, and Supabase.
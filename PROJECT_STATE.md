# Project State Summary: BookStack-Silapathar (LocalBookHub)

## 1. Project Architecture
* **Frontend**: Next.js 14 (Pages Router), React 18, Tailwind CSS v3.
* **Backend**: Next.js Serverless API routes (`/pages/api/*`).
* **Database & Client**: Supabase PostgreSQL database accessed via `@supabase/supabase-js` client SDK (`lib/supabaseClient.js`).
* **Pattern**: Hybrid client-side Supabase queries (using `NEXT_PUBLIC_SUPABASE_ANON_KEY`) for data rendering and Next.js serverless API routes (`/api/orders`) for reservation transactions.

## 2. Authentication / Session Flow
* **Current Status**: No active authentication or session management implemented in the codebase.
* **Client Setup**: `lib/supabaseClient.js` instantiates a public Supabase client using `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
* **User Context**: Users browse, search, and reserve books anonymously without logging in.
* **User Records**: A `users` table exists in the database schema, but no auth middleware, login/signup forms, session cookies, or JWT verification exist in pages or API handlers.

## 3. Supabase Database and Tables
Defined in `prisma/schema.sql` and utilized across application code:
* **`users`**: User records (`id`, `name`, `email`, `created_at`).
* **`bookstalls`**: Bookstore entities (`id`, `name`, `address`, `city`, `phone`, `logo_url`, `owner_id`, `created_at`).
* **`books`**: Master bibliographic catalog (`id`, `title`, `author`, `isbn`, `image_url`, `category`, `description`, `created_at`).
* **`book_inventory`**: Single source of truth for store stock & pricing (`id`, `book_id`, `bookstall_id`, `stock`, `price`, `created_at`).
* **`orders`**: Customer store pickup reservations (`id`, `user_id`, `bookstall_id`, `total_amount`, `status`, `payment_method`, `created_at`). `status` uses enum `order_status` (`'pending'`, `'reserved'`, `'completed'`, `'cancelled'`).
* **`order_items`**: Order line items (`id`, `order_id`, `book_id`, `quantity`, `price_at_purchase`).

## 4. Important Database Relationships
* `bookstalls.owner_id` $\rightarrow$ `users.id`
* `book_inventory.book_id` $\rightarrow$ `books.id` (ON DELETE CASCADE)
* `book_inventory.bookstall_id` $\rightarrow$ `bookstalls.id` (ON DELETE CASCADE)
* `orders.user_id` $\rightarrow$ `users.id`
* `orders.bookstall_id` $\rightarrow$ `bookstalls.id`
* `order_items.order_id` $\rightarrow$ `orders.id` (ON DELETE CASCADE)
* `order_items.book_id` $\rightarrow$ `books.id`

## 5. Current User / Admin Access
* **Public Access**: Entire application, including admin module (`/admin`, `/admin/dashboard`, `/admin/orders`), is publicly accessible without login or role verification.
* **Administrative Operations**: Anyone can view sales statistics, complete orders, or cancel customer reservations.
* **Customer Actions**: Any visitor can place reservations or cancel existing reservations on `/bookings`.

## 6. Store / Book / Inventory System
* **Master vs. Store Inventory Architecture**:
  * `books` holds master book metadata (`title`, `author`, `isbn`, `category`, `description`, `image_url`).
  * `book_inventory` links `book_id` and `bookstall_id` with store-specific `stock` and `price`.
* **Queries & Search**: `/search`, `/stall/[id]`, and `/book/[id]` query `book_inventory` joined with `books` and `bookstalls` to display accurate real-time store availability.

## 7. Reservation System
* **Offline / Pay at Store Workflow**:
  1. **Placement**: Customer clicks "Book Now" on `/book/[id]` or `BookCard`. Calls `POST /api/orders` with `inventory_id` and `quantity`.
  2. **Transaction**: `POST /api/orders` checks `book_inventory.stock`, creates an `orders` record (status `'reserved'`), inserts `order_items`, and decrements `book_inventory.stock`.
  3. **Cancellation**: Executed on `/bookings` (customer) or `/admin/orders` (admin). Updates order status to `'cancelled'`, reads `order_items`, and restores stock back to `book_inventory`.
  4. **Fulfillment**: Admin marks order as `'completed'` on `/admin/orders` upon store pickup.

## 8. Important Pages and API Routes
* **Pages**:
  * `pages/index.js`: Homepage / Bookstall Directory.
  * `pages/search.js`: Real-time multi-field inventory search.
  * `pages/stall/[id].js`: Bookstall inventory showcase.
  * `pages/book/[id].js`: Detailed book inventory view & reservation trigger.
  * `pages/bookings.js`: Customer reservation history & cancellation.
  * `pages/admin/index.js`: Admin management hub.
  * `pages/admin/dashboard.js`: Business metrics & revenue analytics.
  * `pages/admin/orders.js`: Order fulfillment and cancellation interface.
* **API Routes**:
  * `pages/api/orders.js`: `POST` handler for placing reservations & updating stock.
  * `pages/api/bookstalls.js`: `GET` handler for listing bookstalls.
  * `pages/api/books/search.js`: `GET` search endpoint over `book_inventory`.
  * `pages/api/stalls/[id]/books.js`: `GET` legacy endpoint querying `books` by `bookstall_id`.

## 9. Current Authorization / Security
* **Security Model**: None (Open).
* **Guards & Middleware**: No session authorization checks or protected route wrappers.
* **Database Security**: Supabase Row-Level Security (RLS) is not configured in `prisma/schema.sql`.
* **Client Database Operations**: Frontend client code directly updates `orders` and `book_inventory` tables via Supabase JS SDK.

## 10. Recent Git Upgrade History
* `b6657cc`: Initial commit.
* `0a8fc66`: Removed build artifacts and environment files from repository.
* `26531fc` & `e156cc4`: Added live demo link to README.
* `d396414`: Fixed website link in README.
* `7f1e3f9`: Major feature update — restored `book_inventory` architecture as single source of truth, implemented multi-field search, added automated stock restoration on order cancellation, and modernized UI/UX layout.

## 11. Important Files for Upcoming RBAC Work
* **Authentication & Client Setup**:
  * `lib/supabaseClient.js`: Needs Supabase Auth configuration / helper client.
  * `pages/_app.js`: Provider context wrapper for user authentication & session state.
* **Navigation & Guards**:
  * `components/Header.js`: Dynamic navigation showing login/logout status and conditionally rendering Admin links based on user role.
* **Protected Routes & Role Checks**:
  * `pages/admin/index.js`, `pages/admin/dashboard.js`, `pages/admin/orders.js`: Require guard logic for `admin` / `store_owner` roles.
  * `pages/bookings.js`: Needs session check and filtering to show only the authenticated user's orders (`user_id = auth.uid()`).
* **API & Database Security**:
  * `pages/api/orders.js`: Requires authentication token validation and binding orders to `user_id`.
  * `prisma/schema.sql`: Database schema updates to add `role` (e.g. `'customer'`, `'store_owner'`, `'admin'`) to `users` and define Row-Level Security (RLS) policies.

## 12. Known Risks or Limitations
* **Unprotected Admin & Order Operations**: Anyone can access `/admin` pages and modify order statuses or cancel reservations.
* **Unfiltered Bookings View**: `/bookings` displays all database orders rather than scoping reservations to an authenticated customer.
* **Concurrency in Stock Updates**: Stock decrementing (`/api/orders`) and restoration (`/bookings`, `/admin/orders`) use separate `SELECT` then `UPDATE` queries without database transactions or row-level locking.
* **Legacy API Inconsistency**: `pages/api/stalls/[id]/books.js` queries `books.bookstall_id` (legacy column) instead of joining `book_inventory`.
* **Direct Client Database Mutations**: Frontend pages execute direct `update()` calls on Supabase tables via anon key, which will break if Row-Level Security (RLS) is turned on without corresponding policies.

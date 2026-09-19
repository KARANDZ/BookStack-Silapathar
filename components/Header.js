import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Header() {
  const router = useRouter();
  const { user, role, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => router.pathname === path;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        
        {/* BRAND LOGO */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-sm group-hover:scale-105 transition-transform">
            📚
          </div>
          <div>
            <span className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 bg-clip-text text-transparent block leading-tight">
              LocalBookHub
            </span>
            <span className="block text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-indigo-600 -mt-0.5">
              Silapathar Marketplace
            </span>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/')
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Stores
          </Link>

          <Link
            href="/search"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              isActive('/search')
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🔍</span>
            <span>Search Books</span>
          </Link>

          {user && (
            <Link
              href="/bookings"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/bookings')
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>🛍️</span>
              <span>My Bookings</span>
            </Link>
          )}

          {/* STORE OWNER OR ADMIN PORTAL LINK */}
          {(role === 'STORE_OWNER' || role === 'ADMIN') && (
            <Link
              href="/store-admin/orders"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                router.pathname.startsWith('/store-admin')
                  ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>🏪</span>
              <span>Store Admin</span>
            </Link>
          )}

          {/* STRICTLY ADMIN DASHBOARD LINK */}
          {role === 'ADMIN' && (
            <Link
              href="/admin/dashboard"
              className={`ml-1 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
                router.pathname.startsWith('/admin')
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-900 text-white hover:bg-slate-800 border-slate-900'
              }`}
            >
              ⚙️ Admin Panel
            </Link>
          )}
        </nav>

        {/* RIGHT DESKTOP AUTH CONTROLS */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <span className="block text-xs font-bold text-slate-800 line-clamp-1 max-w-[140px]">
                  {user.email}
                </span>
                <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {role}
                </span>
              </div>

              <button
                onClick={signOut}
                className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* MOBILE HAMBURGER TOGGLER BUTTON */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-indigo-700 border border-indigo-200">
              {role}
            </span>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

      </div>

      {/* MOBILE MENU DRAWER CONTAINER */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-3 shadow-lg animate-fadeIn">
          {user && (
            <div className="pb-2 border-b border-slate-100">
              <span className="block text-xs font-bold text-slate-800 truncate">
                {user.email}
              </span>
              <span className="text-[10px] text-slate-500">Role: {role}</span>
            </div>
          )}

          <nav className="flex flex-col space-y-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              🏪 Browse Stores
            </Link>

            <Link
              href="/search"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/search')
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              🔍 Search Book Inventory
            </Link>

            {user && (
              <Link
                href="/bookings"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/bookings')
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                🛍️ My Reservations
              </Link>
            )}

            {(role === 'STORE_OWNER' || role === 'ADMIN') && (
              <Link
                href="/store-admin/orders"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  router.pathname.startsWith('/store-admin')
                    ? 'bg-amber-100 text-amber-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                🏪 Store Admin Portal
              </Link>
            )}

            {role === 'ADMIN' && (
              <Link
                href="/admin/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  router.pathname.startsWith('/admin')
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-900 text-white'
                }`}
              >
                ⚙️ Admin Platform Panel
              </Link>
            )}
          </nav>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            {user ? (
              <button
                onClick={signOut}
                className="w-full py-2 text-center text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 w-full">
                <Link
                  href="/login"
                  className="py-2 text-center text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="py-2 text-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}


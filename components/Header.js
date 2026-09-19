import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const router = useRouter();
  const { user, role, signOut } = useAuth();

  const isActive = (path) => router.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        
        {/* BRAND LOGO */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
            📚
          </div>
          <div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 bg-clip-text text-transparent">
              LocalBookHub
            </span>
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-indigo-600 -mt-1">
              Silapathar Marketplace
            </span>
          </div>
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="flex items-center gap-1 sm:gap-2">
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

        {/* AUTH USER PROFILE / SIGN IN CONTROLS */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
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

      </div>
    </header>
  );
}

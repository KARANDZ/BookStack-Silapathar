import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Header() {
  const router = useRouter();

  const isActive = (path) => router.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        
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
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Stores
          </Link>

          <Link
            href="/search"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              isActive('/search')
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🔍</span>
            <span>Search Books</span>
          </Link>

          <Link
            href="/bookings"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              isActive('/bookings')
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🛍️</span>
            <span>My Bookings</span>
          </Link>

          <Link
            href="/admin"
            className={`ml-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
              router.pathname.startsWith('/admin')
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-900 text-white hover:bg-slate-800 border-slate-900'
            }`}
          >
            Admin Dashboard
          </Link>
        </nav>

      </div>
    </header>
  );
}

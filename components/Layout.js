import Header from './Header';
import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans w-full max-w-full overflow-x-hidden">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8">
        {children}
      </main>
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 text-slate-500 text-xs sm:text-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-lg">📚</span>
            <span className="font-bold text-slate-800">LocalBookHub Silapathar</span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="text-xs text-slate-500">Direct Store Pickups</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 font-medium">
            <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <Link href="/search" className="hover:text-indigo-600 transition-colors">Search</Link>
            <Link href="/bookings" className="hover:text-indigo-600 transition-colors">Bookings</Link>
            <Link href="/admin/dashboard" className="hover:text-indigo-600 transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


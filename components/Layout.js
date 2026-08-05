import Header from './Header';
import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <span className="font-semibold text-slate-700">LocalBookHub Silapathar</span>
            <span>• Direct Store Pickups</span>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/search" className="hover:underline">Search</Link>
            <Link href="/bookings" className="hover:underline">Bookings</Link>
            <Link href="/admin" className="hover:underline">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

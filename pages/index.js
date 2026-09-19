import Layout from '../components/Layout';
import StallCard from '../components/StallCard';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function Home() {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadStalls() {
      try {
        const { data, error } = await supabase
          .from('bookstalls')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error('Supabase fetch error:', error);
          setErrorMsg('Failed to load bookstalls. Please verify Supabase setup.');
        } else {
          setStalls(data || []);
        }
      } catch (err) {
        console.error('Home load error:', err);
        setErrorMsg('Network error while connecting to server.');
      }
      setLoading(false);
    }
    loadStalls();
  }, []);

  return (
    <Layout>
      {/* HERO SECTION */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-2xl p-5 sm:p-8 md:p-10 text-white shadow-xl mb-8 sm:mb-10 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative max-w-2xl">
          <span className="inline-block px-3 py-1 bg-indigo-500/30 backdrop-blur border border-indigo-400/30 rounded-full text-[11px] sm:text-xs font-semibold tracking-wide text-indigo-200 mb-3">
            📍 Silapathar Town Marketplace
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Discover & Reserve Books from Local Bookstalls
          </h1>
          <p className="mt-2.5 text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed">
            Search physical inventory across bookstalls in Silapathar, check real-time stock, and hold copies for instant store pick-up without online payment!
          </p>

          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <Link
              href="/search"
              className="px-5 py-2.5 bg-white text-indigo-950 font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-md text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <span>🔍</span>
              <span>Search All Books</span>
            </Link>
            <Link
              href="/bookings"
              className="px-5 py-2.5 bg-indigo-600/60 hover:bg-indigo-600 text-white font-semibold rounded-xl border border-indigo-400/40 transition-colors text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <span>🛍️</span>
              <span>My Reservations</span>
            </Link>
          </div>
        </div>
      </div>

      {/* STALLS DIRECTORY */}
      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Registered Bookstalls</h2>
            <p className="text-xs sm:text-sm text-slate-500">Explore participating bookstores in town</p>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-full">
            {stalls.length} Stores Available
          </span>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-slate-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs sm:text-sm font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {!loading && !errorMsg && stalls.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto shadow-sm">
            <div className="text-4xl mb-3">🏪</div>
            <h3 className="text-lg font-bold text-slate-900">No Bookstalls Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              There are no bookstalls configured in the database yet.
            </p>
          </div>
        )}

        {!loading && stalls.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {stalls.map((stall) => (
              <StallCard key={stall.id} stall={stall} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}


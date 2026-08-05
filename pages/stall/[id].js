import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import BookCard from '../../components/BookCard';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function StallPage() {
  const router = useRouter();
  const { id } = router.query;

  const [stall, setStall] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function loadStallData() {
      setLoading(true);

      // 1️⃣ Load bookstore details
      const { data: stallData, error: stallError } = await supabase
        .from('bookstalls')
        .select('*')
        .eq('id', id)
        .single();

      if (stallError) {
        console.error('Stall fetch error:', stallError);
      } else {
        setStall(stallData);
      }

      // 2️⃣ Load inventory for this bookstore from 'book_inventory' joined with master 'books'
      const { data: invData, error: invError } = await supabase
        .from('book_inventory')
        .select(`
          id,
          stock,
          price,
          book_id,
          bookstall_id,
          created_at,
          books (
            id,
            title,
            author,
            category,
            image_url,
            description,
            isbn
          )
        `)
        .eq('bookstall_id', id)
        .order('created_at', { ascending: false });

      if (invError) {
        console.error('Book inventory fetch error:', invError);
      } else {
        // Attach bookstalls info to each inventory item for BookCard
        const formatted = (invData || []).map((item) => ({
          ...item,
          bookstalls: stallData,
        }));
        setInventory(formatted);
      }

      setLoading(false);
    }

    loadStallData();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="py-12 text-center text-slate-500">
          <div className="text-3xl mb-2 animate-pulse">🏪</div>
          <p>Loading store inventory...</p>
        </div>
      </Layout>
    );
  }

  if (!stall) {
    return (
      <Layout>
        <div className="py-12 max-w-md mx-auto text-center bg-white rounded-2xl border border-slate-200 p-8">
          <div className="text-4xl mb-3">🏪</div>
          <h2 className="text-xl font-bold text-slate-900">Bookstall Not Found</h2>
          <p className="text-sm text-slate-500 mt-1">
            This store could not be located in Silapathar directory.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block bg-indigo-600 text-white font-semibold text-sm px-4 py-2 rounded-lg"
          >
            Browse All Stores
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/" className="hover:text-indigo-600">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">{stall.name}</span>
        </div>

        {/* STORE HEADER BANNER */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {stall.logo_url ? (
              <img
                src={stall.logo_url}
                alt={stall.name}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-md">
                {stall.name?.charAt(0) || '🏪'}
              </div>
            )}

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                {stall.city || 'SILAPATHAR'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {stall.name}
              </h1>
              {stall.address && (
                <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
                  <span>📍</span>
                  <span>{stall.address}</span>
                </p>
              )}
              {stall.phone && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span>📞</span>
                  <span>Phone: {stall.phone}</span>
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 text-center sm:text-right w-full sm:w-auto">
            <span className="text-2xl font-extrabold text-indigo-600">{inventory.length}</span>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Titles Available
            </span>
          </div>
        </div>

        {/* INVENTORY SECTION */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Books Available at Store</h2>
            <span className="text-xs text-slate-500 font-medium">Live store stock</span>
          </div>

          {inventory.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <div className="text-3xl mb-2">📚</div>
              <h3 className="text-base font-bold text-slate-800">No Books Listed Yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                This bookstore does not currently have active inventory listings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.map((inv) => (
                <BookCard key={inv.id} inventory={inv} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

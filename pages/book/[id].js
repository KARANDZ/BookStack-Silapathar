import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BookPage() {
  const router = useRouter();
  const { id } = router.query;

  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!id) return;

    async function loadInventoryItem() {
      setLoading(true);
      
      // Query book_inventory table by inventory ID or book_id
      const { data, error } = await supabase
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
            description,
            image_url,
            category,
            isbn
          ),
          bookstalls (
            id,
            name,
            address,
            phone,
            city
          )
        `)
        .or(`id.eq.${id},book_id.eq.${id}`)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Book inventory fetch error:', error);
      } else {
        setInventory(data);
      }

      setLoading(false);
    }

    loadInventoryItem();
  }, [id]);

  async function handleReservation() {
    if (!inventory) return;
    setSubmitting(true);
    setFeedback({ type: '', text: '' });

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventory_id: inventory.id,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Reservation failed.' });
      } else {
        setFeedback({
          type: 'success',
          text: 'Book reserved successfully! You can pick it up at the bookstore.',
        });
        // Decrease inventory stock locally in UI state
        setInventory((prev) =>
          prev ? { ...prev, stock: Math.max(0, prev.stock - 1) } : prev
        );
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Something went wrong during reservation.' });
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <Layout>
        <div className="py-12 text-center text-slate-500">
          <div className="text-3xl mb-2 animate-bounce">📖</div>
          <p>Loading book inventory details...</p>
        </div>
      </Layout>
    );
  }

  if (!inventory) {
    return (
      <Layout>
        <div className="py-12 max-w-md mx-auto text-center bg-white rounded-2xl border border-slate-200 p-8">
          <div className="text-4xl mb-3">❓</div>
          <h2 className="text-xl font-bold text-slate-900">Inventory Item Not Found</h2>
          <p className="text-sm text-slate-500 mt-1">
            This book inventory record is no longer available in the store catalog.
          </p>
          <Link
            href="/search"
            className="mt-5 inline-block bg-indigo-600 text-white font-semibold text-sm px-4 py-2 rounded-lg"
          >
            Back to Search
          </Link>
        </div>
      </Layout>
    );
  }

  const book = inventory.books || {};
  const stall = inventory.bookstalls || {};
  const stock = typeof inventory.stock !== 'undefined' ? inventory.stock : 0;
  const price = typeof inventory.price !== 'undefined' ? inventory.price : (book.price || 0);
  const isAvailable = stock > 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/" className="hover:text-indigo-600">Home</Link>
          <span>/</span>
          {stall.id ? (
            <Link href={`/stall/${stall.id}`} className="hover:text-indigo-600">
              {stall.name}
            </Link>
          ) : (
            <span>Store</span>
          )}
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs">{book.title}</span>
        </div>

        {/* MAIN CONTENT CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* COVER IMAGE */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="w-full h-80 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-4">
                <img
                  src={book.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'}
                  alt={book.title}
                  className="max-h-full object-contain drop-shadow"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';
                  }}
                />
              </div>

              {book.category && (
                <span className="mt-4 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold uppercase tracking-wider">
                  Category: {book.category}
                </span>
              )}
            </div>

            {/* BOOK METADATA & RESERVATION */}
            <div className="md:col-span-7 flex flex-col justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {book.title}
                </h1>
                <p className="text-base font-medium text-slate-600 mt-1">
                  By <span className="text-indigo-600 font-semibold">{book.author || 'Unknown Author'}</span>
                </p>

                {book.isbn && (
                  <p className="text-xs text-slate-400 mt-1">
                    ISBN: {book.isbn}
                  </p>
                )}

                <div className="my-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Description
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {book.description || 'No description available for this title.'}
                  </p>
                </div>

                {/* STORE LOCATION INFO */}
                {stall.name && (
                  <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-3">
                    <div className="text-2xl">🏪</div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Store Inventory Location
                      </div>
                      <Link
                        href={`/stall/${stall.id}`}
                        className="text-base font-bold text-indigo-900 hover:underline"
                      >
                        {stall.name}
                      </Link>
                      <p className="text-xs text-indigo-700 mt-0.5">
                        📍 {stall.address || 'Silapathar'}
                      </p>
                      {stall.phone && (
                        <p className="text-xs text-indigo-700">
                          📞 Phone: {stall.phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RESERVATION PANEL */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Store Inventory Price</span>
                    <span className="text-3xl font-black text-slate-900">₹{price}</span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isAvailable
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {isAvailable ? `${stock} in stock` : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                {feedback.text && (
                  <div
                    className={`mb-4 p-3 rounded-xl text-xs font-semibold border ${
                      feedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {feedback.text}
                  </div>
                )}

                <button
                  disabled={!isAvailable || submitting}
                  onClick={handleReservation}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-md transition-all ${
                    !isAvailable
                      ? 'bg-slate-300 cursor-not-allowed shadow-none'
                      : submitting
                      ? 'bg-indigo-400 cursor-wait'
                      : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
                  }`}
                >
                  {submitting
                    ? 'Reserving Copy...'
                    : isAvailable
                    ? 'Reserve for Store Pickup (Pay at Store)'
                    : 'Currently Out of Stock at Store'}
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  🔒 Hold copy at bookstore. Pay cash or UPI upon physical store pickup.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

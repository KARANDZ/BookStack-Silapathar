import { useState } from 'react';
import Link from 'next/link';

export default function BookCard({ inventory }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!inventory) return null;

  // Extract master book and bookstore details from joined relations
  const book = inventory.books || {};
  const stall = inventory.bookstalls || {};

  const inventoryId = inventory.id;
  const stock = typeof inventory.stock !== 'undefined' ? inventory.stock : 0;
  const price = typeof inventory.price !== 'undefined' ? inventory.price : (book.price || 0);

  const title = book.title || 'Untitled Book';
  const author = book.author || 'Unknown Author';
  const imageUrl = book.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';
  const stallName = stall.name || 'Local Bookstore';
  const stallId = stall.id || inventory.bookstall_id;

  async function handleBookNow() {
    setLoading(true);
    setMessage('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventory_id: inventoryId,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Booking failed');
      } else {
        setMessage('Book reserved! Pay at store on pickup.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Something went wrong. Please try again.');
    }

    setLoading(false);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* IMAGE CONTAINER */}
        <div className="relative w-full h-48 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center p-2 mb-3 border border-slate-100">
          <img
            src={imageUrl}
            alt={title}
            className="h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';
            }}
          />
          <span
            className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              stock > 0
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}
          >
            {stock > 0 ? `${stock} available` : 'Out of stock'}
          </span>
        </div>

        {/* BOOK DETAILS */}
        <Link href={`/book/${inventoryId}`}>
          <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {title}
          </h4>
        </Link>
        <p className="text-xs text-slate-500 mt-0.5">{author}</p>

        {stallName && (
          <div className="mt-2 text-xs text-slate-600 flex items-center gap-1">
            <span>🏪</span>
            {stallId ? (
              <Link href={`/stall/${stallId}`} className="hover:underline font-medium text-indigo-600">
                {stallName}
              </Link>
            ) : (
              <span className="font-medium text-slate-700">{stallName}</span>
            )}
          </div>
        )}
      </div>

      {/* FOOTER & BUTTON */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-slate-400 font-medium">Store Price</div>
          <div className="text-lg font-extrabold text-slate-900">₹{price}</div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/book/${inventoryId}`}
            className="flex-1 py-2 px-3 text-center border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors"
          >
            Details
          </Link>
          <button
            onClick={handleBookNow}
            disabled={loading || stock <= 0}
            className={`flex-1 py-2 px-3 text-center text-xs font-semibold rounded-lg text-white transition-all shadow-sm ${
              stock <= 0
                ? 'bg-slate-300 cursor-not-allowed'
                : loading
                ? 'bg-indigo-400 cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {loading ? 'Reserving...' : 'Book Now'}
          </button>
        </div>

        {message && (
          <p className="mt-2 text-xs font-medium text-center text-emerald-700 bg-emerald-50 py-1.5 px-2 rounded border border-emerald-200">
            {message}
          </p>
        )}
        {errorMsg && (
          <p className="mt-2 text-xs font-medium text-center text-rose-700 bg-rose-50 py-1.5 px-2 rounded border border-rose-200">
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}

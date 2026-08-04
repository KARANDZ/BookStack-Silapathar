import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function BookPage() {
  const router = useRouter();
  const { id } = router.query;

  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function loadInventory() {
      const { data, error } = await supabase
        .from('bookstall_books')
        .select(`
          id,
          stock,
          books (
            id,
            title,
            author,
            description,
            image_url,
            price
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setInventory(data);
      }

      setLoading(false);
    }

    loadInventory();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="p-6">Loading...</div>
      </Layout>
    );
  }

  if (!inventory) {
    return (
      <Layout>
        <div className="p-6">Book not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* IMAGE */}
          <div>
            <img
              src={inventory.books.image_url || '/placeholder-book.png'}
              alt={inventory.books.title}
              className="w-full h-96 object-contain"
            />
          </div>

          {/* DETAILS */}
          <div>
            <h1 className="text-2xl font-bold">
              {inventory.books.title}
            </h1>
            <p className="text-gray-600">
              {inventory.books.author}
            </p>
            <p className="mt-4">
              {inventory.books.description}
            </p>
          </div>

          {/* BOOKING */}
          <div className="p-4 border rounded bg-white">
            <div className="text-2xl font-bold">
              ₹{inventory.books.price}
            </div>

            <div
              className={`mt-2 ${
                inventory.stock > 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {inventory.stock > 0 ? 'In stock' : 'Out of stock'}
            </div>

            <button
              disabled={inventory.stock <= 0}
              onClick={async () => {
                const res = await fetch('/api/order', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    bookstall_book_id: inventory.id, // 🔥 IMPORTANT
                    quantity: 1,
                  }),
                });

                const data = await res.json();

                if (!res.ok) {
                  alert(data.error || 'Booking failed');
                } else {
                  alert('Booking successful');
                }
              }}
              className="mt-4 w-full bg-indigo-600 disabled:bg-gray-400 text-white py-2 rounded"
            >
              Book Now
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}

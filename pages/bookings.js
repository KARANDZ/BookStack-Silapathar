import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          created_at,
          order_items (
            quantity,
            price_at_purchase,
            books (
              title,
              author,
              bookstalls (
                name
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (!error) {
        setBookings(data || []);
      } else {
        console.error(error);
      }

      setLoading(false);
    }

    loadBookings();
  }, []);

  return (
    <Layout>
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-4">My Bookings</h1>

        {loading && <p>Loading bookings...</p>}

        {!loading && bookings.length === 0 && (
          <p>No bookings found.</p>
        )}

        <div className="space-y-4">
          {bookings.map(order => (
            <div
              key={order.id}
              className="border rounded p-4 bg-white"
            >
              <div className="text-sm text-gray-600">
                Booking ID: {order.id}
              </div>

             <div className="text-sm flex items-center gap-2 mt-1">
  Status:
  <span
    className={`px-2 py-1 rounded text-white text-xs capitalize ${
      order.status === 'reserved'
        ? 'bg-yellow-500'
        : order.status === 'completed'
        ? 'bg-green-600'
        : 'bg-red-600'
    }`}
  >
    {order.status}
  </span>
</div>


              <div className="text-sm text-gray-500">
                Date:{' '}
                {new Date(order.created_at).toLocaleString()}
              </div>

              <div className="mt-3 space-y-2">
                {order.order_items.map((item, idx) => (
                  <div
                    key={idx}
                    className="border rounded p-2"
                  >
                    <div className="font-semibold">
                      {item.books.title}
                    </div>

                    <div className="text-sm text-gray-600">
                      Stall: {item.books.bookstalls.name}
                    </div>

                    <div className="text-sm">
                      Price: ₹{item.price_at_purchase}
                    </div>

                    <div className="text-sm">
                      Quantity: {item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

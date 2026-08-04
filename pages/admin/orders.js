import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    setLoading(true);

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
            id,
            title,
            stock,
            bookstalls (
              name
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (!error) {
      setOrders(data || []);
    }

    setLoading(false);
  }

  async function cancelOrder(orderId, item) {
    // 1️⃣ Update order status
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    // 2️⃣ Restore stock
    await supabase
      .from('books')
      .update({
        stock: item.books.stock + item.quantity,
      })
      .eq('id', item.books.id);

    // 3️⃣ Reload orders
    loadOrders();
  }
async function markCompleted(orderId) {
  await supabase
    .from('orders')
    .update({ status: 'completed' })
    .eq('id', orderId);

  loadOrders();
}


  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <Layout>
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-4">Admin Orders</h1>

        {loading && <p>Loading orders...</p>}

        {!loading && orders.length === 0 && (
          <p>No orders found.</p>
        )}

        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="border p-4 rounded bg-white">
              <div className="text-sm text-gray-500">
                Order ID: {order.id}
              </div>

              {/* STATUS */}
              <div className="text-sm flex items-center gap-2 mt-1">
                Status:
                <span
                  className={`px-2 py-1 rounded text-white text-xs capitalize ${
                    order.status === 'reserved'
                      ? 'bg-yellow-500'
                      : 'bg-red-600'
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div className="text-sm text-gray-500 mt-1">
                Date: {new Date(order.created_at).toLocaleString()}
              </div>

              <div className="mt-3 space-y-2">
                {order.order_items.map((item, idx) => (
                  <div
                    key={idx}
                    className="border rounded p-3 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold">
                        {item.books.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        Stall: {item.books.bookstalls.name}
                      </div>
                      <div className="text-sm">
                        Price: ₹{item.price_at_purchase} | Qty: {item.quantity}
                      </div>
                    </div>

                    {/* ACTION */}
                    {order.status === 'reserved' && (
  <div className="flex gap-2">
    <button
      onClick={() => markCompleted(order.id)}
      className="px-3 py-1 bg-green-600 text-white rounded"
    >
      Picked Up
    </button>

    <button
      onClick={() => cancelOrder(order.id, item)}
      className="px-3 py-1 bg-red-600 text-white rounded"
    >
      Cancel
    </button>
  </div>
)}

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

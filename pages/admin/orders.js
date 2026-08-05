import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  async function loadOrders() {
    setLoading(true);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_amount,
        bookstall_id,
        created_at,
        bookstalls (
          id,
          name
        ),
        order_items (
          id,
          quantity,
          price_at_purchase,
          books (
            id,
            title
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (!error) {
      setOrders(data || []);
    } else {
      console.error('Admin orders fetch error:', error);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function cancelOrder(order) {
    if (!confirm('Are you sure you want to cancel this order? Stock will be restored to store inventory.')) return;
    setActionLoading(order.id);

    try {
      // 1️⃣ Update order status to 'cancelled'
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);

      if (orderErr) {
        alert('Failed to cancel order: ' + orderErr.message);
        setActionLoading(null);
        return;
      }

      // 2️⃣ Restore stock in book_inventory for each item in the order
      const stallId = order.bookstall_id || order.bookstalls?.id;

      if (order.order_items && order.order_items.length > 0 && stallId) {
        for (const item of order.order_items) {
          const bookId = item?.books?.id;
          if (bookId) {
            const { data: inv } = await supabase
              .from('book_inventory')
              .select('id, stock')
              .eq('book_id', bookId)
              .eq('bookstall_id', stallId)
              .maybeSingle();

            if (inv) {
              await supabase
                .from('book_inventory')
                .update({ stock: inv.stock + (item.quantity || 1) })
                .eq('id', inv.id);
            }
          }
        }
      }

      await loadOrders();
    } catch (err) {
      console.error(err);
      alert('Error updating order status.');
    }

    setActionLoading(null);
  }

  async function markCompleted(orderId) {
    setActionLoading(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

      if (error) {
        alert('Failed to mark as completed: ' + error.message);
      } else {
        await loadOrders();
      }
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'reserved':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* HEADER & NAV */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
              <span>Admin Management</span>
              <span>•</span>
              <Link href="/admin/dashboard" className="hover:underline">Dashboard</Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Manage Store Orders
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Fulfill reservations, mark completed pick-ups, or cancel orders with stock restoration.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              📊 Stats Dashboard
            </Link>
          </div>
        </div>

        {loading && (
          <div className="py-12 text-center text-slate-500">
            <div className="text-3xl mb-2 animate-bounce">📦</div>
            <p>Loading admin order records...</p>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-md mx-auto">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-bold text-slate-900">No Orders Available</h3>
            <p className="text-sm text-slate-500 mt-1">
              There are currently no customer reservations in the database.
            </p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">ID:</span>
                      <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {order.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Received: {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>

                    {order.status === 'reserved' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => markCompleted(order.id)}
                          disabled={actionLoading === order.id}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                        >
                          {actionLoading === order.id ? 'Processing...' : 'Mark Picked Up'}
                        </button>

                        <button
                          onClick={() => cancelOrder(order)}
                          disabled={actionLoading === order.id}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ITEMS BREAKDOWN */}
                <div className="mt-4 space-y-2">
                  {order.order_items?.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {item.books?.title || 'Book Title'}
                        </h4>
                        {order.bookstalls?.name && (
                          <p className="text-xs text-slate-500">
                            Stall: {order.bookstalls.name}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-700">
                          ₹{item.price_at_purchase} × {item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* FOOTER TOTAL */}
                <div className="mt-3 pt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Store Payment: Offline</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    Total: ₹{order.total_amount || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

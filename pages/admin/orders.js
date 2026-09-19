import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AdminOrders() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || role !== 'ADMIN') {
      router.push('/login?returnUrl=/admin/orders');
      return;
    }

    loadOrders();
  }, [user, role, authLoading, router]);

  async function loadOrders() {
    setLoading(true);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_amount,
        bookstall_id,
        user_id,
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

  async function cancelOrder(order) {
    if (!confirm('Are you sure you want to cancel this order? Stock will be restored to store inventory.')) return;
    setActionLoading(order.id);

    try {
      // 1. Try atomic cancellation RPC first
      const { data: rpcOk, error: rpcErr } = await supabase.rpc('cancel_reservation_tx', {
        p_order_id: order.id,
      });

      if (!rpcErr && rpcOk) {
        await loadOrders();
        setActionLoading(null);
        return;
      }

      // 2. Fallback client query if RPC pending
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);

      if (orderErr) {
        alert('Failed to cancel order: ' + orderErr.message);
        setActionLoading(null);
        return;
      }

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
      // 1. Try atomic completion RPC first
      const { data: rpcOk, error: rpcErr } = await supabase.rpc('complete_reservation_tx', {
        p_order_id: orderId,
      });

      if (!rpcErr && rpcOk) {
        await loadOrders();
        setActionLoading(null);
        return;
      }

      // 2. Fallback client query if RPC pending
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

  if (authLoading) {
    return (
      <Layout>
        <div className="py-12 text-center text-slate-500">
          <div className="text-3xl mb-2 animate-bounce">🔐</div>
          <p>Verifying admin privileges...</p>
        </div>
      </Layout>
    );
  }

  if (!user || role !== 'ADMIN') {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* HEADER & NAV */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
              <span>Platform Admin Management</span>
              <span>•</span>
              <Link href="/admin/dashboard" className="hover:underline">Dashboard</Link>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900">
              Manage All Platform Orders
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Fulfill reservations, mark completed pick-ups, or cancel orders with stock restoration.
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Link
              href="/admin/dashboard"
              className="w-full sm:w-auto text-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              📊 Stats Dashboard
            </Link>
          </div>
        </div>

        {loading && (
          <div className="py-12 text-center text-slate-500">
            <div className="text-3xl mb-2 animate-bounce">📦</div>
            <p className="text-xs sm:text-sm">Loading admin order records...</p>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 text-center max-w-md mx-auto shadow-sm">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-bold text-slate-900">No Orders Available</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              There are currently no customer reservations in the database.
            </p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-400">ID:</span>
                      <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[180px] sm:max-w-none">
                        {order.id}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                      Received: {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span
                      className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider border ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>

                    {order.status === 'reserved' && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => markCompleted(order.id)}
                          disabled={actionLoading === order.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                        >
                          {actionLoading === order.id ? 'Processing...' : 'Mark Picked Up'}
                        </button>

                        <button
                          onClick={() => cancelOrder(order)}
                          disabled={actionLoading === order.id}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ITEMS BREAKDOWN */}
                <div className="mt-3 sm:mt-4 space-y-2">
                  {order.order_items?.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                          {item.books?.title || 'Book Title'}
                        </h4>
                        {order.bookstalls?.name && (
                          <p className="text-xs text-slate-500">
                            Stall: {order.bookstalls.name}
                          </p>
                        )}
                      </div>

                      <div className="text-left sm:text-right border-t sm:border-t-0 pt-1.5 sm:pt-0 w-full sm:w-auto border-slate-200/80">
                        <span className="text-xs font-bold text-slate-700">
                          ₹{item.price_at_purchase} × {item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* FOOTER TOTAL */}
                <div className="mt-3 pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs text-slate-500">
                  <span>Store Payment: Offline</span>
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
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


import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function StoreAdminOrders() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user || (role !== 'STORE_OWNER' && role !== 'ADMIN')) {
      router.push('/login?returnUrl=/store-admin/orders');
      return;
    }

    loadOrders();
  }, [user, role, authLoading, router]);

  async function loadOrders() {
    setLoading(true);
    setErrorMsg('');

    try {
      let ownedStallIds = [];

      // For STORE_OWNER: Fetch only bookstalls owned by this user
      if (role === 'STORE_OWNER') {
        const { data: ownedStalls, error: stallErr } = await supabase
          .from('bookstalls')
          .select('id')
          .eq('owner_id', user.id);

        if (stallErr) {
          console.error('Fetch owned stalls error:', stallErr);
          setErrorMsg('Failed to load owned stores: ' + stallErr.message);
          setLoading(false);
          return;
        }

        ownedStallIds = (ownedStalls || []).map((s) => s.id);

        // If store owner doesn't own any bookstalls yet, return empty list
        if (ownedStallIds.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }
      }

      let query = supabase
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
            name,
            owner_id
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

      // Filter orders by owned bookstalls for STORE_OWNER
      if (role === 'STORE_OWNER') {
        query = query.in('bookstall_id', ownedStallIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Store orders fetch error:', error);
        setErrorMsg('Failed to load store orders: ' + error.message);
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An error occurred while loading store orders.');
    }

    setLoading(false);
  }

  async function handleMarkCompleted(orderId) {
    setActionLoading(orderId);
    try {
      // 1. Try atomic RPC first
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
        alert('Failed to mark pick-up completed: ' + error.message);
      } else {
        await loadOrders();
      }
    } catch (err) {
      console.error(err);
      alert('Error updating order status.');
    }
    setActionLoading(null);
  }

  async function handleCancelOrder(order) {
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
          <p>Verifying store authorization...</p>
        </div>
      </Layout>
    );
  }

  if (!user || (role !== 'STORE_OWNER' && role !== 'ADMIN')) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* HEADER BANNER */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
              <span>🏪 Store Owner Management</span>
              <span>•</span>
              <span className="text-slate-400">{role} Role</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Store Pickup Reservations
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage incoming customer reservations for your bookstore, mark completed store pick-ups, or process cancellations.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/store-admin/inventory"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
            >
              📚 Manage Stock & Inventory
            </Link>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        {loading && (
          <div className="py-12 text-center text-slate-500">
            <div className="text-3xl mb-2 animate-bounce">📦</div>
            <p>Loading store reservation records...</p>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-md mx-auto">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-bold text-slate-900">No Store Orders Available</h3>
            <p className="text-sm text-slate-500 mt-1">
              There are currently no customer reservations for your bookstore.
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
                      <span className="text-xs font-mono font-bold text-slate-400">ORDER ID:</span>
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
                          onClick={() => handleMarkCompleted(order.id)}
                          disabled={actionLoading === order.id}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                        >
                          {actionLoading === order.id ? 'Processing...' : 'Mark Picked Up'}
                        </button>

                        <button
                          onClick={() => handleCancelOrder(order)}
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
                  <span>Store Payment: Pay at Store (Offline)</span>
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

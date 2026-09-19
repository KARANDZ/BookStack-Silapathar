import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Bookings() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?returnUrl=/bookings');
      return;
    }

    async function loadBookings() {
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
            name,
            address,
            phone
          ),
          order_items (
            id,
            quantity,
            price_at_purchase,
            books (
              id,
              title,
              author
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) {
        setBookings(data || []);
      } else {
        console.error('Bookings load error:', error);
      }

      setLoading(false);
    }

    loadBookings();
  }, [user, authLoading, router]);

  async function handleCancelReservation(order) {
    if (!confirm('Are you sure you want to cancel this book reservation?')) return;
    setCancellingId(order.id);

    try {
      // 1. Try atomic cancellation RPC first
      const { data: rpcOk, error: rpcErr } = await supabase.rpc('cancel_reservation_tx', {
        p_order_id: order.id,
      });

      if (!rpcErr && rpcOk) {
        await reloadBookings();
        setCancellingId(null);
        return;
      }

      // 2. Fallback client cancellation logic if RPC pending
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);

      if (orderErr) {
        alert('Failed to cancel order: ' + orderErr.message);
        setCancellingId(null);
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

      await reloadBookings();
    } catch (err) {
      console.error(err);
      alert('An error occurred while cancelling reservation.');
    }

    setCancellingId(null);
  }

  async function reloadBookings() {
    if (!user) return;
    const { data } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_amount,
        bookstall_id,
        created_at,
        bookstalls (
          id,
          name,
          address,
          phone
        ),
        order_items (
          id,
          quantity,
          price_at_purchase,
          books (
            id,
            title,
            author
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setBookings(data || []);
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
          <p>Verifying authentication state...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900">
            My Reservations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your offline store pickup orders and reservation statuses.
          </p>
        </div>

        {loading && (
          <div className="py-12 text-center text-slate-500">
            <div className="text-3xl mb-2 animate-bounce">🛍️</div>
            <p className="text-xs sm:text-sm">Loading your reservations...</p>
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 text-center max-w-md mx-auto shadow-sm">
            <div className="text-4xl mb-3">📖</div>
            <h3 className="text-lg font-bold text-slate-900">No Reservations Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              You haven't reserved any books yet. Browse bookstore inventory across Silapathar!
            </p>
            <Link
              href="/search"
              className="mt-4 inline-block px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Find Books
            </Link>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm hover:shadow transition-shadow"
              >
                {/* HEADER ROW */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-400">
                        BOOKING ID:
                      </span>
                      <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[200px] sm:max-w-none">
                        {order.id}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                      Reserved on {new Date(order.created_at).toLocaleString()}
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
                      <button
                        onClick={() => handleCancelReservation(order)}
                        disabled={cancellingId === order.id}
                        className="text-[11px] sm:text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel Reservation'}
                      </button>
                    )}
                  </div>
                </div>

                {/* ITEMS ROW */}
                <div className="mt-3 sm:mt-4 space-y-3">
                  {order.order_items?.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-slate-50 rounded-xl p-3.5 sm:p-4 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                          {item.books?.title || 'Book Title Unavailable'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Author: {item.books?.author || 'Unknown'}
                        </p>
                        {order.bookstalls && (
                          <p className="text-xs font-semibold text-indigo-600 flex flex-wrap items-center gap-1 mt-1">
                            <span>🏪 Pick up at:</span>
                            <span className="font-bold">{order.bookstalls.name}</span>
                            {order.bookstalls.address && (
                              <span className="text-slate-400 font-normal">({order.bookstalls.address})</span>
                            )}
                          </p>
                        )}
                      </div>

                      <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto border-slate-200/80">
                        <div className="text-xs sm:text-sm font-bold text-slate-900">
                          ₹{item.price_at_purchase} × {item.quantity}
                        </div>
                        <div className="text-xs font-extrabold text-indigo-600">
                          Subtotal: ₹{(Number(item.price_at_purchase) || 0) * (item.quantity || 1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* FOOTER TOTAL */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-xs text-slate-500">
                  <span>Payment Method: <strong className="text-slate-700">Offline / Pay at Store</strong></span>
                  <div className="text-left sm:text-right">
                    <span className="text-slate-500 font-medium">Total Store Payable: </span>
                    <span className="text-sm sm:text-base font-black text-slate-900 ml-1">
                      ₹{order.total_amount || 0}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}


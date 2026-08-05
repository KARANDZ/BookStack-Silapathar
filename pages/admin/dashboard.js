import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    reserved: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          status,
          total_amount,
          order_items (
            quantity,
            price_at_purchase
          )
        `);

      if (error) {
        console.error('Stats query error:', error);
        setLoading(false);
        return;
      }

      let total = orders.length;
      let reserved = 0;
      let completed = 0;
      let cancelled = 0;
      let revenue = 0;

      orders.forEach((order) => {
        if (order.status === 'reserved') reserved++;
        if (order.status === 'completed') completed++;
        if (order.status === 'cancelled') cancelled++;

        if (order.status === 'completed') {
          if (order.total_amount && Number(order.total_amount) > 0) {
            revenue += Number(order.total_amount);
          } else if (order.order_items) {
            order.order_items.forEach((item) => {
              revenue += (Number(item.quantity) || 1) * (Number(item.price_at_purchase) || 0);
            });
          }
        }
      });

      setStats({
        total,
        reserved,
        completed,
        cancelled,
        revenue,
      });

      setLoading(false);
    }

    loadStats();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
              <span>Admin Management</span>
              <span>•</span>
              <Link href="/admin/orders" className="hover:underline">Manage Orders</Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Business Analytics & Metrics
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Real-time platform statistics, reservation breakdown, and overall store revenue.
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
          >
            📋 Manage Orders
          </Link>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              icon="📊"
              label="Total Orders"
              value={stats.total}
              color="bg-indigo-50 text-indigo-600 border-indigo-100"
            />
            <StatCard
              icon="⏳"
              label="Pending Pickup"
              value={stats.reserved}
              color="bg-amber-50 text-amber-600 border-amber-100"
            />
            <StatCard
              icon="✅"
              label="Completed"
              value={stats.completed}
              color="bg-emerald-50 text-emerald-600 border-emerald-100"
            />
            <StatCard
              icon="❌"
              label="Cancelled"
              value={stats.cancelled}
              color="bg-rose-50 text-rose-600 border-rose-100"
            />
            <StatCard
              icon="💰"
              label="Completed Revenue"
              value={`₹${stats.revenue}`}
              color="bg-blue-50 text-blue-700 border-blue-100"
            />
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-2">Quick Admin Navigation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/admin/orders"
              className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors block"
            >
              <div className="font-bold text-slate-900 text-sm">📋 Fulfill & Manage Orders</div>
              <p className="text-xs text-slate-500 mt-1">
                View live customer pickup reservations, complete store pickups, or cancel orders.
              </p>
            </Link>
            <Link
              href="/search"
              className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors block"
            >
              <div className="font-bold text-slate-900 text-sm">🔍 Inspect Books & Inventory</div>
              <p className="text-xs text-slate-500 mt-1">
                Search and check current stock levels for all titles listed across Silapathar stalls.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`p-5 rounded-2xl border ${color} bg-white shadow-sm flex flex-col justify-between`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-2xl font-black text-slate-900 mt-3">{value}</div>
    </div>
  );
}

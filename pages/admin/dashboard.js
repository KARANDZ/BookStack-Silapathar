import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';

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
          order_items (
            quantity,
            price_at_purchase
          )
        `);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      let total = orders.length;
      let reserved = 0;
      let completed = 0;
      let cancelled = 0;
      let revenue = 0;

      orders.forEach(order => {
        if (order.status === 'reserved') reserved++;
        if (order.status === 'completed') completed++;
        if (order.status === 'cancelled') cancelled++;

        if (order.status === 'completed') {
          order.order_items.forEach(item => {
            revenue += item.quantity * item.price_at_purchase;
          });
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
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {loading && <p>Loading statistics...</p>}

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard label="Total Orders" value={stats.total} />
            <StatCard label="Reserved" value={stats.reserved} />
            <StatCard label="Completed" value={stats.completed} />
            <StatCard label="Cancelled" value={stats.cancelled} />
            <StatCard label="Revenue (₹)" value={stats.revenue} />
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-6 bg-white border rounded text-center">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

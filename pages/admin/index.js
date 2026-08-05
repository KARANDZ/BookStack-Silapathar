import Layout from '../../components/Layout';
import Link from 'next/link';

export default function AdminHome() {
  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto py-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-indigo-100">
            ⚙️
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            LocalBookHub Admin Panel
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Select a management module below to view live order reservations or review financial metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/orders"
            className="group p-6 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-2xl shadow-sm transition-all block"
          >
            <div className="text-2xl mb-2">📋</div>
            <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Manage Orders
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              View customer reservations, confirm pick-ups, or process cancellations with auto-stock restore.
            </p>
          </Link>

          <Link
            href="/admin/dashboard"
            className="group p-6 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-2xl shadow-sm transition-all block"
          >
            <div className="text-2xl mb-2">📊</div>
            <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Analytics Dashboard
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Check real-time order counts, status breakdowns, and total completed revenue (₹).
            </p>
          </Link>
        </div>
      </div>
    </Layout>
  );
}

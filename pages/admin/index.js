import { useEffect } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';

export default function AdminHome() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || role !== 'ADMIN') {
      router.push('/login?returnUrl=/admin');
    }
  }, [user, role, loading, router]);

  if (loading) {
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
      <div className="space-y-6 max-w-3xl mx-auto py-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-indigo-100">
            ⚙️
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Platform Admin Control Hub
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Manage global platform operations, inspect business analytics, manage user roles, or manage bookstalls across Silapathar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/orders"
            className="group p-6 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-2xl shadow-sm transition-all block"
          >
            <div className="text-2xl mb-2">📋</div>
            <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Global Orders
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              View and manage pickup reservations across all registered stores.
            </p>
          </Link>

          <Link
            href="/admin/dashboard"
            className="group p-6 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-2xl shadow-sm transition-all block"
          >
            <div className="text-2xl mb-2">📊</div>
            <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Analytics Dashboard
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Real-time platform statistics, reservation breakdowns, and revenue (₹).
            </p>
          </Link>

          <Link
            href="/admin/users"
            className="group p-6 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-2xl shadow-sm transition-all block"
          >
            <div className="text-2xl mb-2">👥</div>
            <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              User Roles & Permissions
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Manage platform user accounts, assign Store Owner roles, and assign store ownership.
            </p>
          </Link>
        </div>
      </div>
    </Layout>
  );
}

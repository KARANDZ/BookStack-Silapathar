import Layout from '../../components/Layout';
import Link from 'next/link';

export default function AdminHome() {
  return (
    <Layout>
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
          <Link
            href="/admin/orders"
            className="block p-6 border rounded bg-white hover:shadow transition"
          >
            <h2 className="text-xl font-semibold mb-2">
              Manage Orders
            </h2>
            <p className="text-sm text-gray-600">
              View, cancel, or complete book orders
            </p>
          </Link>

          <Link
  href="/admin/dashboard"
  className="block p-6 border rounded bg-white hover:shadow transition"
>
  <h2 className="text-xl font-semibold mb-2">
    Dashboard
  </h2>
  <p className="text-sm text-gray-600">
    View orders, status counts, and revenue
  </p>
</Link>

        </div>
      </div>
    </Layout>
  );
}

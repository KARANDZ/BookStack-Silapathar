import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { signIn, role } = useAuth();
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await signIn({ email, password });
      
      // Check returnUrl query parameter or redirect by role
      const returnUrl = router.query.returnUrl;
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        // Fetch role from auth context or session user metadata
        const userRole = res.user?.user_metadata?.role || role || 'USER';
        if (userRole === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (userRole === 'STORE_OWNER') {
          router.push('/store-admin/orders');
        } else {
          router.push('/bookings');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to sign in. Please check your credentials.');
    }

    setSubmitting(false);
  }

  return (
    <Layout>
      <div className="py-8 max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-md">
          
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2 border border-indigo-100">
              🔑
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Sign In to LocalBookHub</h1>
            <p className="text-xs text-slate-500 mt-1">
              Access your reservations, manage your store inventory, or inspect analytics.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-all ${
                submitting
                  ? 'bg-indigo-400 cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
              }`}
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link href="/signup" className="font-bold text-indigo-600 hover:underline">
              Create an Account
            </Link>
          </div>

        </div>
      </div>
    </Layout>
  );
}

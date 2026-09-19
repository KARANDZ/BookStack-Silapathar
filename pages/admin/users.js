import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AdminUsers() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [usersList, setUsersList] = useState([]);
  const [stallsList, setStallsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || role !== 'ADMIN') {
      router.push('/login?returnUrl=/admin/users');
      return;
    }

    loadUsersAndStalls();
  }, [user, role, authLoading, router]);

  async function loadUsersAndStalls() {
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: usersData, error: usersErr } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersErr) {
        console.error('Fetch users error:', usersErr);
        setErrorMsg('Failed to load user records: ' + usersErr.message);
      } else {
        setUsersList(usersData || []);
      }

      const { data: stallsData, error: stallsErr } = await supabase
        .from('bookstalls')
        .select('*')
        .order('name', { ascending: true });

      if (!stallsErr) {
        setStallsList(stallsData || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error loading management data.');
    }

    setLoading(false);
  }

  async function handleRoleChange(targetUserId, newRole) {
    setUpdatingId(targetUserId);
    try {
      // 1. Try atomic admin role change RPC first
      const { data: rpcOk, error: rpcErr } = await supabase.rpc('admin_change_user_role', {
        p_target_user_id: targetUserId,
        p_new_role: newRole,
      });

      if (!rpcErr && rpcOk) {
        await loadUsersAndStalls();
        setUpdatingId(null);
        return;
      }

      // 2. Fallback direct update (permitted for ADMIN role)
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', targetUserId);

      if (error) {
        alert('Failed to update role: ' + error.message);
      } else {
        await loadUsersAndStalls();
      }
    } catch (err) {
      console.error(err);
    }
    setUpdatingId(null);
  }

  async function handleStallOwnerChange(stallId, newOwnerId) {
    setUpdatingId(stallId);
    try {
      const { error } = await supabase
        .from('bookstalls')
        .update({ owner_id: newOwnerId || null })
        .eq('id', stallId);

      if (error) {
        alert('Failed to update stall owner: ' + error.message);
      } else {
        await loadUsersAndStalls();
      }
    } catch (err) {
      console.error(err);
    }
    setUpdatingId(null);
  }

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
      <div className="space-y-8">
        {/* HEADER */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
              <span>Platform Admin Control</span>
              <span>•</span>
              <Link href="/admin/dashboard" className="hover:underline">Dashboard</Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              User Roles & Store Ownership Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Assign roles (USER, STORE_OWNER, ADMIN) and link store owners to registered bookstalls.
            </p>
          </div>

          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            📊 Analytics Dashboard
          </Link>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* SECTION 1: USER ROLES MANAGEMENT */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Registered Platform Users</h2>
              <p className="text-xs text-slate-500">Total Users: {usersList.length}</p>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400">Loading user records...</div>
          ) : usersList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No registered user profiles found in database.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">User Name & Email</th>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3 text-right">Update Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{u.name || 'Unnamed User'}</div>
                        <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {u.id}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                            u.role === 'ADMIN'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : u.role === 'STORE_OWNER'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {u.role || 'USER'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <select
                          disabled={updatingId === u.id}
                          value={u.role || 'USER'}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        >
                          <option value="USER">USER (Customer)</option>
                          <option value="STORE_OWNER">STORE_OWNER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 2: BOOKSTALL OWNERSHIP MANAGEMENT */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Bookstall Ownership Assignment</h2>
              <p className="text-xs text-slate-500">Link registered bookstores to STORE_OWNER user accounts</p>
            </div>
          </div>

          {stallsList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No bookstalls found in directory.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Bookstall Name</th>
                    <th className="p-3">City & Contact</th>
                    <th className="p-3">Current Store Owner</th>
                    <th className="p-3 text-right">Assign Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stallsList.map((stall) => {
                    const currentOwner = usersList.find((u) => u.id === stall.owner_id);

                    return (
                      <tr key={stall.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{stall.name}</div>
                          <div className="text-xs text-slate-500">{stall.address || 'Silapathar'}</div>
                        </td>
                        <td className="p-3 text-xs text-slate-600">
                          <div>📍 {stall.city || 'Silapathar'}</div>
                          <div>📞 {stall.phone || 'N/A'}</div>
                        </td>
                        <td className="p-3">
                          {currentOwner ? (
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{currentOwner.name || 'Owner'}</div>
                              <div className="text-[11px] font-mono text-slate-500">{currentOwner.email}</div>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                              Unassigned Owner
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <select
                            disabled={updatingId === stall.id}
                            value={stall.owner_id || ''}
                            onChange={(e) => handleStallOwnerChange(stall.id, e.target.value)}
                            className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          >
                            <option value="">-- Select Owner --</option>
                            {usersList
                              .filter((u) => u.role === 'STORE_OWNER' || u.role === 'ADMIN')
                              .map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name || u.email} ({u.role})
                                </option>
                              ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function StoreAdminInventory() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stalls, setStalls] = useState([]);
  const [selectedStallId, setSelectedStallId] = useState('');
  const [inventory, setInventory] = useState([]);
  const [masterBooks, setMasterBooks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  // Form for adding catalog book & inventory
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState('existing'); // 'existing' or 'new'
  const [selectedBookId, setSelectedBookId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIsbn, setNewIsbn] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (role !== 'STORE_OWNER' && role !== 'ADMIN')) {
      router.push('/login?returnUrl=/store-admin/inventory');
      return;
    }

    loadInitialData();
  }, [user, role, authLoading, router]);

  async function loadInitialData() {
    setLoading(true);

    try {
      // 1. Fetch bookstalls
      let query = supabase.from('bookstalls').select('*');
      if (role === 'STORE_OWNER') {
        query = query.eq('owner_id', user.id);
      }
      const { data: stallData } = await query;
      const loadedStalls = stallData || [];
      setStalls(loadedStalls);

      if (loadedStalls.length > 0) {
        const firstStallId = loadedStalls[0].id;
        setSelectedStallId(firstStallId);
        await loadInventoryForStall(firstStallId);
      }

      // 2. Fetch master catalog books for existing book dropdown
      const { data: booksData } = await supabase
        .from('books')
        .select('id, title, author, category')
        .order('title', { ascending: true });
      setMasterBooks(booksData || []);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  async function loadInventoryForStall(stallId) {
    if (!stallId) return;
    const { data, error } = await supabase
      .from('book_inventory')
      .select(`
        id,
        stock,
        price,
        book_id,
        bookstall_id,
        books (
          id,
          title,
          author,
          category,
          image_url
        )
      `)
      .eq('bookstall_id', stallId)
      .order('created_at', { ascending: false });

    if (!error) {
      setInventory(data || []);
    }
  }

  async function handleUpdateStockPrice(invItem, newStockVal, newPriceVal) {
    setSavingId(invItem.id);
    try {
      const { error } = await supabase
        .from('book_inventory')
        .update({
          stock: Math.max(0, parseInt(newStockVal) || 0),
          price: Math.max(0, parseFloat(newPriceVal) || 0),
        })
        .eq('id', invItem.id);

      if (error) {
        alert('Failed to update inventory: ' + error.message);
      } else {
        await loadInventoryForStall(selectedStallId);
      }
    } catch (err) {
      console.error(err);
    }
    setSavingId(null);
  }

  async function handleAddInventorySubmit(e) {
    e.preventDefault();
    if (!selectedStallId) {
      alert('Please select or configure a bookstore first.');
      return;
    }

    setSubmittingAdd(true);

    try {
      if (addMode === 'existing') {
        if (!selectedBookId) {
          alert('Please select a book from the catalog.');
          setSubmittingAdd(false);
          return;
        }

        const { error } = await supabase.from('book_inventory').insert([
          {
            book_id: selectedBookId,
            bookstall_id: selectedStallId,
            price: parseFloat(newPrice) || 0,
            stock: parseInt(newStock) || 0,
          },
        ]);

        if (error) {
          alert('Error adding inventory: ' + error.message);
        } else {
          setShowAddModal(false);
          await loadInventoryForStall(selectedStallId);
        }
      } else {
        // Mode 'new': Add catalog entry safely via RPC
        const { data: rpcInvId, error: rpcErr } = await supabase.rpc(
          'add_new_catalog_book_and_inventory',
          {
            p_title: newTitle,
            p_author: newAuthor,
            p_category: newCategory,
            p_description: newDescription,
            p_isbn: newIsbn,
            p_image_url: newImageUrl,
            p_bookstall_id: selectedStallId,
            p_price: parseFloat(newPrice) || 0,
            p_stock: parseInt(newStock) || 0,
          }
        );

        if (rpcErr) {
          alert('Failed to create new catalog book: ' + rpcErr.message);
        } else {
          setShowAddModal(false);
          await loadInitialData();
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error processing request.');
    }

    setSubmittingAdd(false);
  }

  if (authLoading) {
    return (
      <Layout>
        <div className="py-12 text-center text-slate-500">
          <div className="text-3xl mb-2 animate-bounce">📚</div>
          <p>Loading store inventory catalog...</p>
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
        {/* HEADER */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <span>🏪 Store Inventory Portal</span>
              <span>•</span>
              <Link href="/store-admin/orders" className="hover:underline">Orders</Link>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900">
              Manage Book Inventory & Pricing
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Update live stock levels, adjust store pricing, or list new book titles.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>Add Title to Store</span>
          </button>
        </div>

        {/* STALL SELECTION */}
        {stalls.length > 1 && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase">Select Bookstore:</span>
            <select
              value={selectedStallId}
              onChange={(e) => {
                setSelectedStallId(e.target.value);
                loadInventoryForStall(e.target.value);
              }}
              className="w-full sm:w-auto px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              {stalls.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city || 'Silapathar'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* INVENTORY TABLE / LIST */}
        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <div className="text-3xl mb-2 animate-bounce">📦</div>
            <p className="text-xs sm:text-sm">Loading inventory data...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 text-center max-w-md mx-auto shadow-sm">
            <div className="text-4xl mb-3">📖</div>
            <h3 className="text-lg font-bold text-slate-900">No Inventory Items</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              There are no book titles listed in inventory for this store.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
            >
              Add First Title
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                <thead className="bg-slate-50 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 sm:p-4">Book Title & Details</th>
                    <th className="p-3.5 sm:p-4 hidden sm:table-cell">Category</th>
                    <th className="p-3.5 sm:p-4">Price (₹)</th>
                    <th className="p-3.5 sm:p-4">Stock</th>
                    <th className="p-3.5 sm:p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map((item) => (
                    <InventoryRow
                      key={item.id}
                      item={item}
                      saving={savingId === item.id}
                      onUpdate={handleUpdateStockPrice}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADD INVENTORY MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Add Book to Store Inventory</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAddMode('existing')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    addMode === 'existing'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  Select from Catalog
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('new')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    addMode === 'new'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  Add New Title
                </button>
              </div>

              <form onSubmit={handleAddInventorySubmit} className="space-y-3">
                {addMode === 'existing' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Master Catalog Title
                    </label>
                    <select
                      required
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="">-- Select Master Book --</option>
                      {masterBooks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} ({b.author || 'Unknown'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Book Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Higher Secondary Chemistry"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Author
                      </label>
                      <input
                        type="text"
                        value={newAuthor}
                        onChange={(e) => setNewAuthor(e.target.value)}
                        placeholder="e.g. Dr. O.P. Tandon"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Science"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          ISBN
                        </label>
                        <input
                          type="text"
                          value={newIsbn}
                          onChange={(e) => setNewIsbn(e.target.value)}
                          placeholder="978-..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Store Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="299.00"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Initial Stock *
                    </label>
                    <input
                      type="number"
                      required
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      placeholder="10"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAdd}
                    className="flex-1 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700"
                  >
                    {submittingAdd ? 'Saving...' : 'Add to Inventory'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function InventoryRow({ item, saving, onUpdate }) {
  const [stock, setStock] = useState(item.stock);
  const [price, setPrice] = useState(item.price);
  const book = item.books || {};

  return (
    <tr className="hover:bg-slate-50/80 transition-colors">
      <td className="p-3 sm:p-4">
        <div className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">{book.title || 'Untitled'}</div>
        <div className="text-[11px] sm:text-xs text-slate-500">{book.author || 'Unknown Author'}</div>
      </td>
      <td className="p-3 sm:p-4 hidden sm:table-cell">
        <span className="text-[11px] sm:text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
          {book.category || 'General'}
        </span>
      </td>
      <td className="p-3 sm:p-4">
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-16 sm:w-20 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
        />
      </td>
      <td className="p-3 sm:p-4">
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-14 sm:w-16 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
        />
      </td>
      <td className="p-3 sm:p-4 text-right">
        <button
          onClick={() => onUpdate(item, stock, price)}
          disabled={saving}
          className="px-2.5 sm:px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] sm:text-xs font-bold rounded-lg transition-colors shadow-sm"
        >
          {saving ? 'Saving...' : 'Update'}
        </button>
      </td>
    </tr>
  );
}


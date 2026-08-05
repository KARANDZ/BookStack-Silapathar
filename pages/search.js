import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import BookCard from '../components/BookCard';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchInventoryResults(searchTerm = '') {
    setLoading(true);

    try {
      // 1️⃣ Fetch inventory joined with master books and bookstalls
      const { data, error } = await supabase
        .from('book_inventory')
        .select(`
          id,
          stock,
          price,
          book_id,
          bookstall_id,
          created_at,
          books (
            id,
            title,
            author,
            category,
            image_url,
            description,
            isbn
          ),
          bookstalls (
            id,
            name,
            address,
            city,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Book inventory search query error:', error);
        setResults([]);
      } else {
        let items = data || [];
        // Filter by title, author, category, or store name if search term provided
        if (searchTerm && searchTerm.trim()) {
          const q = searchTerm.trim().toLowerCase();
          items = items.filter((inv) => {
            const title = inv.books?.title?.toLowerCase() || '';
            const author = inv.books?.author?.toLowerCase() || '';
            const category = inv.books?.category?.toLowerCase() || '';
            const stallName = inv.bookstalls?.name?.toLowerCase() || '';
            return (
              title.includes(q) ||
              author.includes(q) ||
              category.includes(q) ||
              stallName.includes(q)
            );
          });
        }
        setResults(items);
      }
    } catch (err) {
      console.error(err);
      setResults([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchInventoryResults('');
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchInventoryResults(query);
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* PAGE HEADER & SEARCH BAR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Search Local Book Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search live inventory across all bookstores in Silapathar by title, author, or store name.
          </p>

          <form onSubmit={handleSearchSubmit} className="mt-5 flex gap-2 sm:gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter title (e.g. Chemistry), author, or bookstore name..."
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm"
              />
              <span className="absolute left-3.5 top-3.5 text-slate-400 text-base">🔍</span>
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    fetchInventoryResults('');
                  }}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-sm font-bold bg-slate-100 rounded-full w-6 h-6 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* RESULTS SECTION */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              {query ? `Search Results for "${query}"` : 'All Bookstore Inventory'}
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {results.length} Store Items Found
            </span>
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-slate-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-md mx-auto">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-bold text-slate-900">No Inventory Found</h3>
              <p className="text-sm text-slate-500 mt-1">
                No store inventory matched your search criteria.
              </p>
              <button
                onClick={() => {
                  setQuery('');
                  fetchInventoryResults('');
                }}
                className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold text-xs rounded-lg hover:bg-indigo-100"
              >
                Clear Search
              </button>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((inv) => (
                <BookCard key={inv.id} inventory={inv} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

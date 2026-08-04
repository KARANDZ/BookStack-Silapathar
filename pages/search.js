import Layout from '../components/Layout';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function Search(){
  const [q,setQ] = useState('');
  const [results,setResults] = useState([]);

  async function doSearch(e){
    e.preventDefault();

    const { data } = await supabase
      .from('books')
      .select('*, bookstalls:bookstalls(id,name,address)')
      .ilike('title', `%${q}%`)
      .limit(200);

    setResults(data || []);
  }

  return (
    <Layout>
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-4">Search books</h1>

        <form onSubmit={doSearch} className="flex gap-2">
          <input 
            value={q} 
            onChange={e=>setQ(e.target.value)} 
            placeholder="Search by title or author" 
            className="flex-1 p-2 border rounded" 
          />
          <button className="px-4 bg-blue-600 text-white rounded">Search</button>
        </form>

        <div className="mt-6">
          {results.length===0 && <div>No results</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {results.map(r=> (
              <div key={r.id} className="border rounded p-3 bg-white">
                <h3 className="font-semibold">{r.title}</h3>
                <p className="text-sm text-gray-600">{r.author}</p>

                <p className="text-sm mt-2">Available at:</p>

                {r.bookstalls && (
  <div className="flex items-center justify-between mt-2">
    <div>
      <div className="font-semibold">{r.bookstalls.name}</div>
      <div className="text-sm text-gray-600">
        {r.bookstalls.address}
      </div>
    </div>

    <Link 
      href={`/stall/${r.bookstalls.id}`}
      className="text-blue-600"
    >
      View
    </Link>
  </div>
)}

              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

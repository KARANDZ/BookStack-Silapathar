import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import BookCard from '../../components/BookCard';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function StallPage() {
  const router = useRouter();
  const { id } = router.query;

  const [stall, setStall] = useState(null);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    if (!id) return;

    async function load() {
      // 1️⃣ Load stall info
      const { data: stallData } = await supabase
        .from('bookstalls')
        .select('*')
        .eq('id', id)
        .single();

      setStall(stallData);

      // 2️⃣ Load inventory for this stall
      const { data, error } = await supabase
        .from('book_inventory')
        .select(`
          id,
          stock,
          price,
          books (
            id,
            title,
            author
          )
        `)
        .eq('bookstall_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
      }

      setInventory(data || []);
    }

    load();
  }, [id]);

  if (!stall) {
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-4">
        <div className="flex gap-6 items-center">
          <img
            src={stall.logo_url || '/placeholder-book.png'}
            alt="logo"
            className="w-28 h-20 object-cover"
          />
          <div>
            <h2 className="text-2xl font-bold">{stall.name}</h2>
            <p className="text-sm text-gray-600">{stall.address}</p>
          </div>
        </div>

        <h3 className="mt-6 text-xl font-semibold">Books available</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {inventory.map(item => (
            <BookCard key={item.id} inventory={item} />
          ))}
        </div>
      </div>
    </Layout>
  );
}

import Layout from '../components/Layout';
import StallCard from '../components/StallCard';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home(){

  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    async function load(){
      console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log("SUPABASE KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      // Try direct fetch from Supabase
      const { data, error } = await supabase
        .from('bookstalls')
        .select('*');

      if(error) {
        console.error("Supabase error:", error);
      } else {
        console.log("Loaded stalls:", data);
        setStalls(data);
      }

      setLoading(false);
    }
    load();
  },[]);

  if (loading) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <div className="py-6">
        <h1 className="text-3xl font-bold">Bookstalls in Silapathar</h1>

        {stalls.length === 0 && (
          <p className="mt-4 text-gray-600">
            No bookstalls found. Check Supabase connection or add rows.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {stalls.map(s => (
            <StallCard key={s.id} stall={s} />
          ))}
        </div>
      </div>
    </Layout>
  );
}

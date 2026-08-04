import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req,res){
  const q = req.query.q || '';
  if(!q) return res.status(400).json({ error: 'missing q' });
  const { data, error } = await supabase
    .from('books')
    .select('*, bookstalls:bookstalls(id,name,address)')
    .ilike('title', `%${q}%`)
    .limit(100);
  if(error) return res.status(500).json({ error: error.message });
  res.json(data);
}

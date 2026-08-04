import { supabase } from '../../../../lib/supabaseClient';

export default async function handler(req,res){
  const { id } = req.query;
  if(req.method === 'GET'){
    const { data, error } = await supabase.from('books').select('*').eq('bookstall_id', id).order('created_at',{ascending:false});
    if(error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  return res.status(405).end();
}

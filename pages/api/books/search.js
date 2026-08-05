import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const q = req.query.q ? req.query.q.trim().toLowerCase() : '';

  try {
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
      console.error('Book inventory search API error:', error);
      return res.status(500).json({ error: error.message });
    }

    let results = data || [];

    if (q) {
      results = results.filter((inv) => {
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

    return res.status(200).json(results);
  } catch (err) {
    console.error('Search handler error:', err);
    return res.status(500).json({ error: 'Failed to search book inventory' });
  }
}

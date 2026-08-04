import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookstall_book_id, quantity = 1 } = req.body;

    if (!bookstall_book_id) {
      return res.status(400).json({ error: 'Inventory ID is required' });
    }

    // 1️⃣ Get inventory + book details
    const { data: inventory, error: inventoryError } = await supabase
      .from('bookstall_books')
      .select(`
        id,
        stock,
        bookstall_id,
        books (
          id,
          price
        )
      `)
      .eq('id', bookstall_book_id)
      .single();

    if (inventoryError || !inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // 2️⃣ Check stock
    if (inventory.stock < quantity) {
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    // 3️⃣ Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          bookstall_id: inventory.bookstall_id,
          status: 'reserved',
          payment_method: 'offline',
        },
      ])
      .select()
      .single();

    if (orderError) {
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // 4️⃣ Create order item (IMPORTANT FIX)
    const { error: itemError } = await supabase
      .from('order_items')
      .insert([
        {
          order_id: order.id,
          bookstall_book_id: inventory.id,
          quantity,
          price_at_purchase: inventory.books.price,
        },
      ]);

    if (itemError) {
      return res.status(500).json({ error: 'Failed to create order item' });
    }

    // 5️⃣ Reduce stock in inventory
    const { error: stockError } = await supabase
      .from('bookstall_books')
      .update({ stock: inventory.stock - quantity })
      .eq('id', inventory.id);

    if (stockError) {
      return res.status(500).json({ error: 'Failed to update stock' });
    }

    return res.status(200).json({
      message: 'Book reserved successfully',
      order_id: order.id,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

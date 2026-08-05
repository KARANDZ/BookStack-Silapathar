import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { inventory_id, book_id, quantity = 1 } = req.body;
    const targetInventoryId = inventory_id;

    let inventory = null;

    if (targetInventoryId) {
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
            title
          )
        `)
        .eq('id', targetInventoryId)
        .single();

      if (!error && data) {
        inventory = data;
      }
    }

    // Fallback lookup by book_id if inventory_id was not provided directly
    if (!inventory && book_id) {
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
            title
          )
        `)
        .eq('book_id', book_id)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        inventory = data;
      }
    }

    if (!inventory) {
      return res.status(404).json({ error: 'Book inventory item not found' });
    }

    // Check stock in book_inventory table
    if (inventory.stock < quantity) {
      return res.status(400).json({ error: 'Not enough stock available at this bookstore' });
    }

    const itemPrice = Number(inventory.price) || 0;
    const totalAmount = itemPrice * quantity;

    // 1️⃣ Create reservation order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          bookstall_id: inventory.bookstall_id,
          total_amount: totalAmount,
          status: 'reserved',
          payment_method: 'offline',
        },
      ])
      .select()
      .single();

    if (orderError || !order) {
      console.error('Order creation error:', orderError);
      return res.status(500).json({ error: 'Failed to create order reservation' });
    }

    // 2️⃣ Insert reservation item into order_items
    const { error: itemError } = await supabase
      .from('order_items')
      .insert([
        {
          order_id: order.id,
          book_id: inventory.book_id,
          quantity,
          price_at_purchase: itemPrice,
        },
      ]);

    if (itemError) {
      console.error('Order item insertion error:', itemError);
      return res.status(500).json({ error: 'Failed to record reservation items' });
    }

    // 3️⃣ Decrement stock in book_inventory table (the single source of truth for stock)
    const newStock = Math.max(0, inventory.stock - quantity);
    const { error: stockError } = await supabase
      .from('book_inventory')
      .update({ stock: newStock })
      .eq('id', inventory.id);

    if (stockError) {
      console.error('Book inventory stock update error:', stockError);
      return res.status(500).json({ error: 'Failed to update store inventory stock' });
    }

    return res.status(200).json({
      success: true,
      message: 'Book reserved successfully for store pickup!',
      order_id: order.id,
    });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

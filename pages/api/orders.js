import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rtpxzmdmvnswtakbvdhx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0cHh6bWRtdm5zd3Rha2J2ZGh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4MDYsImV4cCI6MjA4MTAzMDgwNn0.4T4ydEFz24D80KBCFxlbmUDmAwdDb6C20Yefa5x7Em8';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required. Please sign in to reserve books.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    }

    const { inventory_id, book_id, quantity = 1 } = req.body;
    let targetInventoryId = inventory_id;

    // Resolve inventory_id if book_id was passed instead
    if (!targetInventoryId && book_id) {
      const { data: inv } = await supabase
        .from('book_inventory')
        .select('id')
        .eq('book_id', book_id)
        .limit(1)
        .maybeSingle();

      if (inv) targetInventoryId = inv.id;
    }

    if (!targetInventoryId) {
      return res.status(404).json({ error: 'Store inventory item not found.' });
    }

    // Attempt RPC transaction call first
    const { data: rpcOrderId, error: rpcError } = await supabase.rpc('create_reservation_tx', {
      p_inventory_id: targetInventoryId,
      p_quantity: quantity,
    });

    if (!rpcError && rpcOrderId) {
      return res.status(200).json({
        success: true,
        message: 'Book reserved successfully for store pickup!',
        order_id: rpcOrderId,
      });
    }

    // Fallback transaction if RPC is not deployed yet on Supabase
    const { data: inventory, error: invErr } = await supabase
      .from('book_inventory')
      .select('id, stock, price, book_id, bookstall_id')
      .eq('id', targetInventoryId)
      .single();

    if (invErr || !inventory) {
      return res.status(404).json({ error: 'Store inventory item not found.' });
    }

    if (inventory.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock available at this bookstore.' });
    }

    const itemPrice = Number(inventory.price) || 0;
    const totalAmount = itemPrice * quantity;

    // Create Order linked to authenticated user
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert([
        {
          user_id: user.id,
          bookstall_id: inventory.bookstall_id,
          total_amount: totalAmount,
          status: 'reserved',
          payment_method: 'offline',
        },
      ])
      .select()
      .single();

    if (orderErr || !order) {
      console.error('Order creation error:', orderErr);
      return res.status(500).json({ error: orderErr?.message || 'Failed to create reservation order.' });
    }

    // Insert Order Item
    await supabase.from('order_items').insert([
      {
        order_id: order.id,
        book_id: inventory.book_id,
        quantity,
        price_at_purchase: itemPrice,
      },
    ]);

    // Decrement stock
    await supabase
      .from('book_inventory')
      .update({ stock: Math.max(0, inventory.stock - quantity) })
      .eq('id', inventory.id);

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

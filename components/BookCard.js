import { useState } from 'react';

export default function BookCard({ inventory }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { id: inventory_id, stock, price, books } = inventory;

  async function handleBookNow() {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventory_id: inventory_id,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Booking failed');
      } else {
        setMessage('Book reserved successfully');
      }
    } catch (err) {
      setMessage('Something went wrong');
    }

    setLoading(false);
  }

  return (
    <div className="border rounded p-3 bg-white flex flex-col">
      <img
        src={books.image_url || '/placeholder-book.png'}
        alt="book"
        className="w-full h-48 object-contain"
      />

      <h4 className="mt-2 font-semibold">{books.title}</h4>
      <p className="text-sm text-gray-600">{books.author}</p>

      <div className="mt-auto">
        <div className="text-lg font-bold">₹{price}</div>

        <div
          className={`text-sm ${
            stock > 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {stock > 0 ? 'In stock' : 'Out of stock'}
        </div>

        <button
          onClick={handleBookNow}
          disabled={loading || stock === 0}
          className={`mt-3 w-full py-2 rounded text-white ${
            stock === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? 'Booking...' : 'Book Now'}
        </button>

        {message && (
          <p className="mt-2 text-sm text-center text-blue-600">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

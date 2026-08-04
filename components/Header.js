import Link from 'next/link';

export default function Header(){ 
  return (
    <header className="bg-white shadow">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
        
        <Link href="/" className="text-2xl font-bold">
          Local Book Hub
        </Link>

        <div className="flex gap-4 items-center">
  <Link href="/search" className="px-3 py-2 border rounded">
    Search
  </Link>

  <Link href="/bookings" className="px-3 py-2 border rounded">
    My Bookings
  </Link>

  <Link
    href="/admin"
    className="px-3 py-2 border rounded bg-gray-100 font-semibold"
  >
    Admin Panel
  </Link>
</div>


      </div>
    </header>
  );
}

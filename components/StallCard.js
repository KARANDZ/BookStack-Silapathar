import Link from 'next/link';

export default function StallCard({stall}){
  return (
    <div className="border rounded p-4 bg-white">
      <img 
        src={stall.logo_url || '/placeholder-book.png'} 
        alt="logo" 
        className="w-32 h-20 object-cover"
      />

      <h3 className="text-lg font-semibold mt-2">{stall.name}</h3>
      <p className="text-sm text-gray-600">{stall.address}</p>

      <Link 
        href={`/stall/${stall.id}`}
        className="mt-3 inline-block bg-blue-600 text-white px-3 py-1 rounded"
      >
        View Books
      </Link>
    </div>
  );
}

import Link from 'next/link';

export default function StallCard({ stall }) {
  if (!stall) return null;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-3.5 mb-3">
          {stall.logo_url ? (
            <img 
              src={stall.logo_url} 
              alt={stall.name} 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-100 bg-slate-50 flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-sm flex-shrink-0">
              {stall.name?.charAt(0) || '🏪'}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <span className="inline-block text-[10px] font-extrabold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase border border-indigo-100">
              {stall.city || 'Silapathar'}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mt-0.5 truncate">
              {stall.name}
            </h3>
          </div>
        </div>

        {stall.address && (
          <p className="text-xs sm:text-sm text-slate-600 flex items-start gap-1.5 mt-2">
            <span className="text-slate-400 mt-0.5 flex-shrink-0">📍</span>
            <span className="line-clamp-2">{stall.address}</span>
          </p>
        )}

        {stall.phone && (
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5 truncate">
            <span className="text-slate-400 flex-shrink-0">📞</span>
            <span className="truncate">{stall.phone}</span>
          </p>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400 font-medium">Local Store</span>
        <Link 
          href={`/stall/${stall.id}`}
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl transition-colors shadow-sm"
        >
          <span>Explore Books</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}


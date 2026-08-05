import Link from 'next/link';

export default function StallCard({ stall }) {
  if (!stall) return null;

  return (
    <div className="group bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between hover:border-indigo-200">
      <div>
        <div className="flex items-center gap-4 mb-3">
          {stall.logo_url ? (
            <img 
              src={stall.logo_url} 
              alt={stall.name} 
              className="w-16 h-16 rounded-lg object-cover border border-slate-100 bg-slate-50"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-inner">
              {stall.name?.charAt(0) || '🏪'}
            </div>
          )}

          <div>
            <span className="text-[11px] font-semibold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
              {stall.city || 'Silapathar'}
            </span>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mt-0.5">
              {stall.name}
            </h3>
          </div>
        </div>

        {stall.address && (
          <p className="text-sm text-slate-600 flex items-start gap-1.5 mt-2">
            <span className="text-slate-400 mt-0.5">📍</span>
            <span>{stall.address}</span>
          </p>
        )}

        {stall.phone && (
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
            <span className="text-slate-400">📞</span>
            <span>{stall.phone}</span>
          </p>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">Local Stall</span>
        <Link 
          href={`/stall/${stall.id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <span>Explore Books</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}

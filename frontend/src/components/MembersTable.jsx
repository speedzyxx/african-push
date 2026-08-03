import { useMemo, useState } from 'react';
import { ArrowDownUp, Search } from 'lucide-react';
import { formatNumber } from '../utils/api';

const SORT_OPTIONS = [
  { id: 'name', label: 'Nombre' },
  { id: 'killFame', label: 'Fama PvP' },
  { id: 'pveFame', label: 'Fama PvE' },
];

export default function MembersTable({ members = [] }) {
  const [sortBy, setSortBy] = useState('killFame');
  const [asc, setAsc] = useState(false);
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = members.filter((m) => !q || m.name?.toLowerCase().includes(q));

    list = [...list].sort((a, b) => {
      const av = a[sortBy] ?? '';
      const bv = b[sortBy] ?? '';
      if (typeof av === 'string') {
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return asc ? av - bv : bv - av;
    });

    return list;
  }, [members, sortBy, asc, query]);

  function toggleSort(id) {
    if (sortBy === id) setAsc((v) => !v);
    else {
      setSortBy(id);
      setAsc(id === 'name');
    }
  }

  return (
    <section className="panel rounded-lg overflow-hidden animate-fade-up delay-2">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-[#2e2e36]">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[#d4af37]">
            Miembros · African Push
          </h2>
          <p className="text-sm text-[#9ca3af]">{rows.length} jugadores visibles</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar jugador…"
              className="pl-9 pr-3 py-2 rounded bg-[#0d0d0f] border border-[#2e2e36] text-sm outline-none focus:border-[#d4af37]/60 w-48"
            />
          </label>
          <div className="flex gap-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleSort(opt.id)}
                className={`px-3 py-2 text-xs uppercase tracking-wider rounded border transition ${
                  sortBy === opt.id
                    ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10'
                    : 'border-[#2e2e36] text-[#9ca3af] hover:border-[#4b5563]'
                }`}
              >
                {opt.label}
                {sortBy === opt.id ? (
                  <ArrowDownUp className="inline w-3 h-3 ml-1 opacity-70" />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#1a1a1f] z-10">
            <tr className="text-[11px] uppercase tracking-[0.15em] text-[#9ca3af]">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Jugador</th>
              <th className="px-4 py-3 font-medium text-right">Fama PvP</th>
              <th className="px-4 py-3 font-medium text-right">Fama PvE</th>
              <th className="px-4 py-3 font-medium text-right">Deaths Fame</th>
              <th className="px-4 py-3 font-medium text-right">Crafting</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr
                key={m.id || m.name}
                className="border-t border-[#2e2e36]/80 hover:bg-[#d4af37]/05 transition-colors"
              >
                <td className="px-4 py-2.5 text-[#6b7280]">{i + 1}</td>
                <td className="px-4 py-2.5 font-semibold text-[#f3f4f6]">{m.name}</td>
                <td className="px-4 py-2.5 text-right text-[#d4af37] font-semibold">
                  {formatNumber(m.killFame)}
                </td>
                <td className="px-4 py-2.5 text-right text-[#e5e7eb]">
                  {formatNumber(m.pveFame)}
                </td>
                <td className="px-4 py-2.5 text-right text-[#f87171]">
                  {formatNumber(m.deathFame)}
                </td>
                <td className="px-4 py-2.5 text-right text-[#9ca3af]">
                  {formatNumber(m.craftingFame)}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[#6b7280]">
                  No hay miembros para mostrar.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

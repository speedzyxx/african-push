import { useState } from 'react';
import { ChevronDown, Swords } from 'lucide-react';
import Equipment from './Equipment';
import { formatDate, formatNumber } from '../utils/api';

export default function Killboard({ events = [], source = 'events' }) {
  const [openId, setOpenId] = useState(null);

  return (
    <section className="panel rounded-lg overflow-hidden animate-fade-up delay-3">
      <header className="flex items-center gap-3 p-4 border-b border-[#2e2e36]">
        <Swords className="w-5 h-5 text-[#22c55e]" />
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[#d4af37]">
            Killboard · African Push
          </h2>
          <p className="text-sm text-[#9ca3af]">Últimas 25 bajas · clic para ver set</p>
        </div>
      </header>

      {source === 'battles-fallback' ? (
        <div className="px-4 py-2 text-xs text-[#fbbf24] border-b border-[#2e2e36] bg-[#d4af37]/05">
          Mostrando batallas como feed temporal (events no disponible).
        </div>
      ) : null}
      <ul className="divide-y divide-[#2e2e36]/80 max-h-[640px] overflow-y-auto">
        {events.map((ev) => {
          const open = openId === ev.eventId;
          return (
            <li key={ev.eventId}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : ev.eventId)}
                className="w-full text-left px-4 py-3 hover:bg-white/[0.03] transition flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
              >
                <div className="flex-1 min-w-0 grid sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 items-center">
                  <div className="truncate">
                    <span className="text-[10px] uppercase tracking-wider text-[#22c55e]">
                      Killer
                    </span>
                    <p className="font-semibold text-[#86efac] truncate">
                      {ev.killer?.name ?? '—'}
                    </p>
                    <p className="text-xs text-[#9ca3af]">
                      IP {ev.killer?.averageItemPower ?? '—'}
                      {ev.killer?.guildName ? ` · ${ev.killer.guildName}` : ''}
                    </p>
                  </div>

                  <div className="text-center shrink-0">
                    <p className="text-[10px] uppercase tracking-wider text-[#9ca3af]">Fame</p>
                    <p className="font-[family-name:var(--font-display)] text-[#d4af37] font-bold">
                      {formatNumber(ev.totalFame)}
                    </p>
                    <p className="text-[11px] text-[#6b7280]">{formatDate(ev.timestamp)}</p>
                  </div>

                  <div className="truncate sm:text-right">
                    <span className="text-[10px] uppercase tracking-wider text-[#f87171]">
                      Victim
                    </span>
                    <p className="font-semibold text-[#fca5a5] truncate">
                      {ev.victim?.name ?? '—'}
                    </p>
                    <p className="text-xs text-[#9ca3af]">
                      IP {ev.victim?.averageItemPower ?? '—'}
                      {ev.victim?.guildName ? ` · ${ev.victim.guildName}` : ''}
                    </p>
                  </div>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-[#6b7280] shrink-0 transition-transform ${
                    open ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {open ? (
                <div className="px-4 pb-4 grid md:grid-cols-2 gap-3 bg-[#0d0d0f]/50">
                  <Equipment player={ev.killer} side="killer" />
                  <Equipment player={ev.victim} side="victim" />
                </div>
              ) : null}
            </li>
          );
        })}

        {events.length === 0 ? (
          <li className="px-4 py-10 text-center text-[#6b7280]">Sin eventos recientes.</li>
        ) : null}
      </ul>
    </section>
  );
}

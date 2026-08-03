import { formatCompact, formatDate, formatNumber } from '../utils/api';

function RankList({ title, rows, valueKey, valueColor = 'text-[#d4af37]' }) {
  return (
    <div className="panel rounded-lg p-4 h-full animate-fade-up">
      <h3 className="font-[family-name:var(--font-display)] text-[#d4af37] mb-3">{title}</h3>
      <ol className="space-y-2">
        {rows.map((m, i) => (
          <li
            key={m.id || m.name}
            className="flex items-center gap-3 text-sm border-b border-[#2e2e36]/70 pb-2 last:border-0"
          >
            <span className="w-5 text-[#6b7280] tabular-nums">{i + 1}</span>
            <span className="flex-1 truncate font-semibold">{m.name}</span>
            <span className={`font-semibold ${valueColor}`}>{formatCompact(m[valueKey])}</span>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="text-[#6b7280] text-sm py-4 text-center">Sin datos</li>
        ) : null}
      </ol>
    </div>
  );
}

export function TopRankings({ members = [] }) {
  const topPvp = [...members].sort((a, b) => (b.killFame || 0) - (a.killFame || 0)).slice(0, 5);
  const topPve = [...members].sort((a, b) => (b.pveFame || 0) - (a.pveFame || 0)).slice(0, 5);
  const topCraft = [...members]
    .sort((a, b) => (b.craftingFame || 0) - (a.craftingFame || 0))
    .slice(0, 5);

  return (
    <section className="grid md:grid-cols-3 gap-4">
      <RankList title="Top PvP" rows={topPvp} valueKey="killFame" />
      <RankList title="Top PvE" rows={topPve} valueKey="pveFame" valueColor="text-[#e5e7eb]" />
      <RankList
        title="Top Crafting"
        rows={topCraft}
        valueKey="craftingFame"
        valueColor="text-[#93c5fd]"
      />
    </section>
  );
}

export function RecentKillsPreview({ events = [], onOpenKillboard }) {
  const rows = events.slice(0, 8);

  return (
    <section className="panel rounded-lg overflow-hidden animate-fade-up">
      <header className="p-4 border-b border-[#2e2e36] flex items-center justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-[#d4af37]">
            Actividad reciente
          </h3>
          <p className="text-sm text-[#9ca3af]">Últimas peleas del gremio</p>
        </div>
        {onOpenKillboard ? (
          <button
            type="button"
            onClick={onOpenKillboard}
            className="text-xs uppercase tracking-wider text-[#d4af37] hover:underline"
          >
            Ver killboard →
          </button>
        ) : null}
      </header>
      <ul className="divide-y divide-[#2e2e36]/80">
        {rows.map((ev) => (
          <li key={ev.eventId} className="px-4 py-2.5 text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <span className="text-[#86efac] font-semibold truncate sm:w-36">{ev.killer?.name}</span>
            <span className="text-[#6b7280] hidden sm:inline">→</span>
            <span className="text-[#fca5a5] font-semibold truncate sm:w-36">{ev.victim?.name}</span>
            <span className="text-[#d4af37] sm:ml-auto tabular-nums">
              +{formatNumber(ev.totalFame)}
            </span>
            <span className="text-[11px] text-[#6b7280] sm:w-28 sm:text-right">
              {formatDate(ev.timestamp)}
            </span>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="px-4 py-8 text-center text-[#6b7280]">Sin actividad reciente</li>
        ) : null}
      </ul>
    </section>
  );
}

export function BattlesPreview({ battles = [], onOpenBattles }) {
  const rows = battles.slice(0, 5);

  return (
    <section className="panel rounded-lg overflow-hidden animate-fade-up">
      <header className="p-4 border-b border-[#2e2e36] flex items-center justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-[#d4af37]">ZvZ reciente</h3>
          <p className="text-sm text-[#9ca3af]">Últimas batallas</p>
        </div>
        {onOpenBattles ? (
          <button
            type="button"
            onClick={onOpenBattles}
            className="text-xs uppercase tracking-wider text-[#d4af37] hover:underline"
          >
            Ver batallas →
          </button>
        ) : null}
      </header>
      <ul className="divide-y divide-[#2e2e36]/80">
        {rows.map((b) => (
          <li key={b.id} className="px-4 py-2.5 text-sm flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[#e5e7eb] w-full sm:w-auto">{formatDate(b.startTime)}</span>
            <span className="text-[#d4af37] font-semibold">{formatCompact(b.totalFame)} fame</span>
            <span className="text-[#22c55e]">{formatNumber(b.totalKills)} kills</span>
            <span className="text-[#9ca3af] sm:ml-auto">
              Nosotros{' '}
              <span className="text-[#22c55e]">{b.ourGuild?.kills ?? 0}K</span>
              {' / '}
              <span className="text-[#f87171]">{b.ourGuild?.deaths ?? 0}D</span>
            </span>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="px-4 py-8 text-center text-[#6b7280]">Sin batallas</li>
        ) : null}
      </ul>
    </section>
  );
}

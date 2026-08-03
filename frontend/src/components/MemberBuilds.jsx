import Equipment from './Equipment';
import { formatCompact, formatDate, formatNumber } from '../utils/api';

/**
 * Builds vistas en PvP recientes (la API de miembros no envía set offline).
 */
export default function MemberBuilds({ members = [], eventsScanned = 0 }) {
  const withBuild = members.filter((m) => m.build);
  const without = members.filter((m) => !m.build);

  return (
    <section className="panel rounded-lg overflow-hidden animate-fade-up">
      <header className="p-4 border-b border-[#2e2e36] flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl neon-text">
            Últimas builds · PvP
          </h2>
          <p className="text-sm text-[#8b9bb8]">
            Sets solo con ítems reales · Off oculto en armas 2H
            {eventsScanned ? ` · ${eventsScanned} eventos` : ''} · {withBuild.length} visibles
          </p>
        </div>
      </header>

      {withBuild.length === 0 ? (
        <p className="px-4 py-10 text-center text-[#6b7280] text-sm">
          No hay builds recientes en el killboard. Entra a pelear para que aparezcan aquí.
        </p>
      ) : (
        <div className="p-4 grid md:grid-cols-2 gap-4">
          {withBuild.map((m) => (
            <div key={m.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2 px-1">
                <div>
                  <p className="font-semibold text-[#f3f4f6]">{m.name}</p>
                  <p className="text-[11px] text-[#9ca3af]">
                    Vista como {m.build.role} · {formatDate(m.build.seenAt)}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="text-[#d4af37] font-semibold">
                    {formatCompact(m.killFame)} PvP
                  </p>
                  <p className="text-[#9ca3af]">IP {m.build.averageItemPower}</p>
                </div>
              </div>
              <Equipment
                player={{
                  name: m.name,
                  averageItemPower: m.build.averageItemPower,
                  equipment: m.build.equipment,
                }}
                side={m.build.role === 'victim' ? 'victim' : 'killer'}
              />
            </div>
          ))}
        </div>
      )}

      {without.length > 0 ? (
        <div className="border-t border-[#2e2e36] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-[#6b7280] mb-2">
            Sin build reciente en killboard
          </p>
          <div className="flex flex-wrap gap-2">
            {without.map((m) => (
              <span
                key={m.id}
                className="text-xs px-2 py-1 rounded border border-[#2e2e36] text-[#9ca3af]"
                title={`PvP ${formatNumber(m.killFame)}`}
              >
                {m.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

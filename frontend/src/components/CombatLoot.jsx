import { itemImageUrl, formatCompact, formatDate, formatNumber } from '../utils/api';

/**
 * Loot de combates = inventario de la víctima en eventos del killboard.
 * La API pública no da un "loot board" aparte; esto es lo más cercano.
 */
export default function CombatLoot({ events = [] }) {
  const rows = events
    .map((ev) => {
      const loot = (ev.loot || ev.victimInventory || []).filter((i) => i?.uniqueName);
      return {
        eventId: ev.eventId,
        timestamp: ev.timestamp,
        fame: ev.totalFame,
        killer: ev.killer?.name,
        victim: ev.victim?.name,
        loot,
      };
    })
    .filter((r) => r.loot.length > 0);

  return (
    <section className="panel rounded-lg overflow-hidden animate-fade-up">
      <header className="p-4 border-b border-[#3d3426]">
        <h2 className="font-[family-name:var(--font-display)] text-xl gold-text">
          Combat Loot
        </h2>
        <p className="text-sm text-[#a89b84]">
          Ítems en inventario de la víctima (API killboard). No es un drop tracker oficial.
        </p>
      </header>

      <ul className="divide-y divide-[#3d3426]/80 max-h-[720px] overflow-y-auto">
        {rows.map((r) => (
          <li key={r.eventId} className="px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
              <p className="text-sm">
                <span className="text-[#3ecf6e] font-semibold">{r.killer}</span>
                <span className="text-[#6b5d4a]"> → </span>
                <span className="text-[#c23b4a] font-semibold">{r.victim}</span>
              </p>
              <p className="text-xs text-[#a89b84]">
                {formatDate(r.timestamp)} · <span className="text-[#d4af37]">+{formatNumber(r.fame)}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.loot.slice(0, 16).map((item, idx) => (
                <div
                  key={`${r.eventId}-${item.uniqueName}-${idx}`}
                  className="slot-frame w-12 h-12 rounded flex items-center justify-center"
                  title={`${item.uniqueName}${item.count > 1 ? ` x${item.count}` : ''}`}
                >
                  <img
                    src={itemImageUrl(item.uniqueName, item.quality)}
                    alt={item.uniqueName}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
              ))}
              {r.loot.length > 16 ? (
                <span className="text-xs text-[#a89b84] self-center">
                  +{r.loot.length - 16} más · {formatCompact(r.loot.length)} ítems
                </span>
              ) : null}
            </div>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="px-4 py-10 text-center text-[#6b5d4a]">
            Sin loot de inventario en los eventos cargados.
          </li>
        ) : null}
      </ul>
    </section>
  );
}

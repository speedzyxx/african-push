import { useMemo, useState } from 'react';
import { ChevronDown, Package, Swords, Users } from 'lucide-react';
import Equipment from './Equipment';
import { formatCompact, formatDate, formatNumber, itemImageUrl } from '../utils/api';

function ItemGrid({ items = [], emptyText = 'Sin ítems' }) {
  if (!items.length) {
    return <p className="text-xs text-[#6b5d4a]">{emptyText}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, idx) => (
        <div
          key={`${item.uniqueName}-${idx}`}
          className="slot-frame w-12 h-12 rounded flex items-center justify-center relative"
          title={`${item.uniqueName}${item.count > 1 ? ` x${item.count}` : ''}${item.slot ? ` (${item.slot})` : ''}${item.fromVictim ? ` ← ${item.fromVictim}` : ''}`}
        >
          <img
            src={itemImageUrl(item.uniqueName, item.quality)}
            alt={item.uniqueName}
            className="w-full h-full object-contain"
            loading="lazy"
          />
          {item.count > 1 ? (
            <span className="absolute bottom-0 right-0 text-[9px] bg-black/80 text-[#ffd700] px-0.5">
              x{item.count}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * Agrupa kills por BattleId (pelea grande) y lista quién looteó qué
 * (Killer = loot rights por cada víctima).
 */
export default function CombatLoot({ events = [] }) {
  const fights = useMemo(() => {
    const groups = new Map();

    for (const ev of events) {
      const key = ev.battleId ? `b-${ev.battleId}` : `e-${ev.eventId}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          battleId: ev.battleId,
          kills: [],
          partyById: new Map(),
          lootersById: new Map(),
        });
      }
      const g = groups.get(key);
      g.kills.push(ev);

      for (const p of ev.party || []) {
        if (!p?.id) continue;
        const prev = g.partyById.get(p.id);
        if (!prev || (p.damageDone || 0) > (prev.damageDone || 0)) {
          g.partyById.set(p.id, p);
        }
      }

      const looter = ev.looter || ev.killer;
      if (!looter?.id) continue;

      if (!g.lootersById.has(looter.id)) {
        g.lootersById.set(looter.id, {
          id: looter.id,
          name: looter.name,
          guildName: looter.guildName,
          killCount: 0,
          fame: 0,
          bags: [], // { victim, inventory, gear }
          allInventory: [],
          allGear: [],
        });
      }
      const entry = g.lootersById.get(looter.id);
      entry.killCount += 1;
      entry.fame += ev.totalFame || 0;

      const inv = (ev.loot || []).map((i) => ({
        ...i,
        fromVictim: ev.victim?.name,
      }));
      const gear = (ev.victimGear || []).map((i) => ({
        ...i,
        fromVictim: ev.victim?.name,
      }));

      entry.bags.push({
        victimName: ev.victim?.name,
        victimGuild: ev.victim?.guildName,
        eventId: ev.eventId,
        fame: ev.totalFame,
        inventory: inv,
        gear,
      });
      entry.allInventory.push(...inv);
      entry.allGear.push(...gear);
    }

    return [...groups.values()]
      .map((g) => {
        const kills = [...g.kills].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        const looters = [...g.lootersById.values()].sort(
          (a, b) => b.killCount - a.killCount || b.fame - a.fame
        );
        const party = [...g.partyById.values()].sort(
          (a, b) => (b.damageDone || 0) - (a.damageDone || 0)
        );
        const totalLootItems = looters.reduce(
          (s, l) => s + l.allInventory.length + l.allGear.length,
          0
        );
        return {
          key: g.key,
          battleId: g.battleId,
          kills,
          killCount: kills.length,
          looters,
          party,
          partySize: Math.max(
            party.length,
            ...kills.map((k) => k.partySize || 0),
            1
          ),
          totalFame: kills.reduce((s, k) => s + (k.totalFame || 0), 0),
          totalLootItems,
          startTime: kills[kills.length - 1]?.timestamp,
          endTime: kills[0]?.timestamp,
        };
      })
      .sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
  }, [events]);

  const [openId, setOpenId] = useState(fights[0]?.key ?? null);

  return (
    <section className="panel rounded-lg overflow-hidden animate-fade-up">
      <header className="p-4 border-b border-[#3d3426]">
        <h2 className="font-[family-name:var(--font-display)] text-xl gold-text">
          Combat · Party & Loot
        </h2>
        <p className="text-sm text-[#a89b84]">
          Peleas agrupadas (BattleId). Cada Killer con loot rights y el detalle de qué lootó de cada víctima.
        </p>
      </header>

      <ul className="divide-y divide-[#3d3426]/80 max-h-[960px] overflow-y-auto">
        {fights.map((fight) => {
          const open = openId === fight.key;
          return (
            <li key={fight.key}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : fight.key)}
                className={`w-full text-left px-4 py-3 transition ${
                  open ? 'bg-[#d4af37]/08' : 'hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 text-[#d4af37] border border-[#d4af37]/35 rounded px-2 py-0.5">
                        <Users className="w-3 h-3" />
                        Party ~{fight.partySize}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#3ecf6e] border border-[#3ecf6e]/30 rounded px-2 py-0.5">
                        <Swords className="w-3 h-3" />
                        {fight.killCount} kills
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#ffd700] border border-[#d4af37]/30 rounded px-2 py-0.5">
                        <Package className="w-3 h-3" />
                        {fight.looters.length} looters · {fight.totalLootItems} ítems
                      </span>
                      <span className="text-[#a89b84]">{formatDate(fight.endTime)}</span>
                      <span className="text-[#ffd700]">
                        +{formatCompact(fight.totalFame)} fame
                      </span>
                    </div>
                    <p className="text-sm text-[#e8dcc3] truncate">
                      Looters:{' '}
                      {fight.looters.map((l) => `${l.name}(${l.killCount})`).join(' · ') || '—'}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#a89b84] shrink-0 transition-transform ${
                      open ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {open ? (
                <div className="px-4 pb-4 space-y-5 bg-[#0c0a08]/50">
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-sm gold-text mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Quién looteó y qué (por Killer / loot rights)
                    </h3>
                    <div className="space-y-4">
                      {fight.looters.map((looter) => (
                        <div
                          key={looter.id}
                          className="rounded-lg border border-[#d4af37]/35 bg-[#d4af37]/05 p-4 space-y-3"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div>
                              <p className="font-[family-name:var(--font-display)] text-lg gold-text">
                                {looter.name}
                              </p>
                              <p className="text-xs text-[#a89b84]">
                                {looter.guildName || 'Sin gremio'} · {looter.killCount} kill
                                {looter.killCount === 1 ? '' : 's'} ·{' '}
                                {formatCompact(looter.fame)} fame
                              </p>
                            </div>
                            <p className="text-xs text-[#ffd700]">
                              {looter.allInventory.length} bag · {looter.allGear.length} gear
                            </p>
                          </div>

                          {looter.bags.map((bag) => (
                            <div
                              key={`${looter.id}-${bag.eventId}`}
                              className="rounded border border-[#3d3426] p-3 space-y-2"
                            >
                              <p className="text-sm">
                                Looteó a{' '}
                                <span className="text-[#c23b4a] font-semibold">
                                  {bag.victimName}
                                </span>
                                {bag.victimGuild ? (
                                  <span className="text-[#6b5d4a]"> ({bag.victimGuild})</span>
                                ) : null}
                                <span className="text-[#a89b84]">
                                  {' '}
                                  · +{formatNumber(bag.fame)} fame
                                </span>
                              </p>
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-[#d4af37] mb-1">
                                  Inventario / bag
                                </p>
                                <ItemGrid
                                  items={bag.inventory}
                                  emptyText="Bag vacío en la API"
                                />
                              </div>
                              {bag.gear.length > 0 ? (
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-[#a89b84] mb-1">
                                    Equipo de la víctima
                                  </p>
                                  <ItemGrid items={bag.gear} />
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ))}
                      {fight.looters.length === 0 ? (
                        <p className="text-sm text-[#6b5d4a]">Sin looters en esta pelea.</p>
                      ) : null}
                    </div>
                  </div>

                  {fight.party.length > 0 ? (
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-sm text-[#d4af37] mb-2 flex items-center gap-2">
                        <Swords className="w-4 h-4" />
                        Party vista en la pelea ({fight.party.length})
                      </h3>
                      <div className="overflow-x-auto rounded-lg border border-[#3d3426] mb-3">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-[10px] uppercase tracking-wider text-[#6b5d4a] border-b border-[#3d3426]">
                              <th className="px-3 py-2 text-left">Jugador</th>
                              <th className="px-3 py-2 text-right">Daño</th>
                              <th className="px-3 py-2 text-right">Heal</th>
                              <th className="px-3 py-2 text-left">Gremio</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fight.party.map((p) => {
                              const isLooter = fight.looters.some((l) => l.id === p.id);
                              return (
                                <tr key={p.id || p.name} className="border-t border-[#3d3426]/70">
                                  <td className="px-3 py-1.5 font-semibold">
                                    {p.name}
                                    {isLooter ? (
                                      <span className="ml-2 text-[10px] text-[#ffd700]">LOOT</span>
                                    ) : null}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-[#c23b4a]">
                                    {formatCompact(p.damageDone || 0)}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-[#3ecf6e]">
                                    {formatCompact(p.supportHealingDone || 0)}
                                  </td>
                                  <td className="px-3 py-1.5 text-[#a89b84]">
                                    {p.guildName || '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        {fight.party.slice(0, 12).map((player) => (
                          <Equipment
                            key={player.id || player.name}
                            player={player}
                            side="killer"
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}

        {fights.length === 0 ? (
          <li className="px-4 py-10 text-center text-[#6b5d4a]">
            Sin combates cargados.
          </li>
        ) : null}
      </ul>
    </section>
  );
}

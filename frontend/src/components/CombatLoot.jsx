import { useMemo, useState } from 'react';
import { ChevronDown, Package, Swords, Users } from 'lucide-react';
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
 * Pelea + participantes (nombres) + loot de víctimas / looters.
 * Sin grids de builds aliadas.
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
          lootersById: new Map(),
          participantsById: new Map(),
        });
      }
      const g = groups.get(key);
      g.kills.push(ev);

      // Participantes de party (nombres; sin builds)
      const partyList = Array.isArray(ev.party) && ev.party.length
        ? ev.party
        : [
            ...(ev.groupMembers || []),
            ev.killer,
            ...(ev.participants || []),
          ].filter(Boolean);

      for (const p of partyList) {
        if (!p?.id && !p?.name) continue;
        const id = p.id || p.name;
        const prev = g.participantsById.get(id);
        if (!prev) {
          g.participantsById.set(id, {
            id,
            name: p.name,
            guildName: p.guildName,
            allianceName: p.allianceName,
            averageItemPower: p.averageItemPower || 0,
            damageDone: p.damageDone || 0,
            supportHealingDone: p.supportHealingDone || 0,
            isKiller: false,
            killCount: 0,
          });
        } else {
          prev.averageItemPower = Math.max(
            prev.averageItemPower || 0,
            p.averageItemPower || 0
          );
          prev.damageDone = Math.max(prev.damageDone || 0, p.damageDone || 0);
          prev.supportHealingDone = Math.max(
            prev.supportHealingDone || 0,
            p.supportHealingDone || 0
          );
        }
      }

      const looter = ev.looter || ev.killer;
      if (looter?.id) {
        const part = g.participantsById.get(looter.id);
        if (part) {
          part.isKiller = true;
          part.killCount += 1;
        }

        if (!g.lootersById.has(looter.id)) {
          g.lootersById.set(looter.id, {
            id: looter.id,
            name: looter.name,
            guildName: looter.guildName,
            killCount: 0,
            fame: 0,
            bags: [],
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
    }

    return [...groups.values()]
      .map((g) => {
        const kills = [...g.kills].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        const looters = [...g.lootersById.values()].sort(
          (a, b) => b.killCount - a.killCount || b.fame - a.fame
        );
        const participants = [...g.participantsById.values()].sort((a, b) => {
          if (a.isKiller !== b.isKiller) return a.isKiller ? -1 : 1;
          return (b.damageDone || 0) - (a.damageDone || 0);
        });
        const totalLootItems = looters.reduce(
          (s, l) => s + l.allInventory.length + l.allGear.length,
          0
        );
        const victims = kills
          .map((k) => k.victim?.name)
          .filter(Boolean)
          .filter((name, i, arr) => arr.indexOf(name) === i);

        return {
          key: g.key,
          battleId: g.battleId,
          kills,
          killCount: kills.length,
          looters,
          participants,
          partySize: Math.max(
            participants.length,
            ...kills.map((k) => k.partySize || 1),
            1
          ),
          victims,
          totalFame: kills.reduce((s, k) => s + (k.totalFame || 0), 0),
          totalLootItems,
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
          Combat · Loot
        </h2>
        <p className="text-sm text-[#a89b84]">
          Pelea, participantes y loot. Sin builds de aliados.
        </p>
      </header>

      <ul className="divide-y divide-[#3d3426]/80 max-h-[960px] overflow-y-auto">
        {fights.map((fight) => {
          const open = openId === fight.key;
          const fightLabel = fight.battleId
            ? `Battle #${fight.battleId}`
            : `Kill #${fight.kills[0]?.eventId ?? '—'}`;

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
                      <span className="font-[family-name:var(--font-display)] text-sm gold-text">
                        {fightLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#d4af37] border border-[#d4af37]/35 rounded px-2 py-0.5">
                        <Users className="w-3 h-3" />
                        {fight.partySize} en party
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#3ecf6e] border border-[#3ecf6e]/30 rounded px-2 py-0.5">
                        <Swords className="w-3 h-3" />
                        {fight.killCount} kills
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#ffd700] border border-[#d4af37]/30 rounded px-2 py-0.5">
                        <Package className="w-3 h-3" />
                        {fight.totalLootItems} ítems
                      </span>
                      <span className="text-[#a89b84]">{formatDate(fight.endTime)}</span>
                      <span className="text-[#ffd700]">
                        +{formatCompact(fight.totalFame)} fame
                      </span>
                    </div>
                    <p className="text-sm text-[#e8dcc3] truncate">
                      Party:{' '}
                      {fight.participants.map((p) => p.name).join(' · ') || '—'}
                    </p>
                    {fight.victims.length > 0 ? (
                      <p className="text-xs text-[#a89b84] truncate">
                        Víctimas:{' '}
                        <span className="text-[#c23b4a]">
                          {fight.victims.join(' · ')}
                        </span>
                      </p>
                    ) : null}
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
                  {/* Participantes — solo nombres, sin builds */}
                  <div className="space-y-2">
                    <h3 className="font-[family-name:var(--font-display)] text-sm gold-text flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Participantes ({fight.participants.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {fight.participants.map((p) => (
                        <div
                          key={p.id}
                          className={`rounded border px-3 py-1.5 text-sm ${
                            p.isKiller
                              ? 'border-[#d4af37]/50 bg-[#d4af37]/10'
                              : 'border-[#3d3426] bg-[#14110c]'
                          }`}
                          title={[
                            p.guildName,
                            p.allianceName,
                            p.averageItemPower
                              ? `IP ${p.averageItemPower}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        >
                          <span className="text-[#e8dcc3] font-medium">{p.name}</span>
                          {p.isKiller ? (
                            <span className="ml-1.5 text-[10px] uppercase tracking-wider text-[#ffd700]">
                              loot{p.killCount > 1 ? `×${p.killCount}` : ''}
                            </span>
                          ) : null}
                          {p.guildName ? (
                            <span className="block text-[10px] text-[#6b5d4a]">
                              {p.guildName}
                            </span>
                          ) : null}
                        </div>
                      ))}
                      {fight.participants.length === 0 ? (
                        <p className="text-sm text-[#6b5d4a]">Sin party en la API.</p>
                      ) : null}
                    </div>
                  </div>

                  {/* Loot por víctima / looter */}
                  <div className="space-y-3">
                    <h3 className="font-[family-name:var(--font-display)] text-sm gold-text flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Loot del muerto · quién looteó
                    </h3>

                    {fight.kills.map((kill) => {
                      const looter = kill.looter || kill.killer;
                      const inv = kill.loot || [];
                      const gear = kill.victimGear || [];
                      return (
                        <div
                          key={kill.eventId}
                          className="rounded-lg border border-[#3d3426] p-4 space-y-3"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-sm">
                              <span className="text-[#c23b4a] font-semibold">
                                {kill.victim?.name || 'Víctima'}
                              </span>
                              {kill.victim?.guildName ? (
                                <span className="text-[#6b5d4a]">
                                  {' '}
                                  ({kill.victim.guildName})
                                </span>
                              ) : null}
                              <span className="text-[#a89b84]"> murió · </span>
                              <span className="text-[#ffd700]">
                                {looter?.name || '—'}
                              </span>
                              <span className="text-[#a89b84]"> looteó</span>
                            </p>
                            <span className="text-xs text-[#a89b84]">
                              +{formatNumber(kill.totalFame)} fame
                            </span>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-[#d4af37] mb-1">
                              Inventario / bag de la víctima
                            </p>
                            <ItemGrid items={inv} emptyText="Bag vacío en la API" />
                          </div>
                          {gear.length > 0 ? (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-[#a89b84] mb-1">
                                Equipo de la víctima
                              </p>
                              <ItemGrid items={gear} />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {/* Resumen por looter */}
                  {fight.looters.length > 1 ? (
                    <div className="space-y-2">
                      <h3 className="font-[family-name:var(--font-display)] text-sm gold-text">
                        Resumen por looter
                      </h3>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {fight.looters.map((l) => (
                          <span
                            key={l.id}
                            className="rounded border border-[#d4af37]/30 px-2 py-1 text-[#e8dcc3]"
                          >
                            {l.name}: {l.killCount} kill
                            {l.killCount === 1 ? '' : 's'} ·{' '}
                            {l.allInventory.length + l.allGear.length} ítems
                          </span>
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
          <li className="px-4 py-10 text-center text-[#6b5d4a]">Sin combates cargados.</li>
        ) : null}
      </ul>
    </section>
  );
}

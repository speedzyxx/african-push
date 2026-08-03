import { useState } from 'react';
import { ChevronDown, Package, Swords, Users } from 'lucide-react';
import Equipment from './Equipment';
import { formatCompact, formatDate, formatNumber, itemImageUrl } from '../utils/api';

/**
 * Combat de party completa + quién tiene loot rights (Killer).
 * La API pública no envía un campo "LootedBy" aparte.
 */
export default function CombatLoot({ events = [] }) {
  const [openId, setOpenId] = useState(events[0]?.eventId ?? null);

  const fights = events.filter((ev) => (ev.party?.length || 0) > 0 || ev.killer);

  return (
    <section className="panel rounded-lg overflow-hidden animate-fade-up">
      <header className="p-4 border-b border-[#3d3426]">
        <h2 className="font-[family-name:var(--font-display)] text-xl gold-text">
          Combat · Party
        </h2>
        <p className="text-sm text-[#a89b84]">
          Sets de toda la party · daño/heal · loot rights del Killer (golpe final)
        </p>
      </header>

      <ul className="divide-y divide-[#3d3426]/80 max-h-[900px] overflow-y-auto">
        {fights.map((ev) => {
          const open = openId === ev.eventId;
          const party = ev.party?.length
            ? ev.party
            : [ev.killer, ...(ev.groupMembers || [])].filter(Boolean);
          const loot = (ev.loot || []).filter((i) => i?.uniqueName);
          const looter = ev.looter || ev.killer;

          return (
            <li key={ev.eventId}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : ev.eventId)}
                className={`w-full text-left px-4 py-3 transition ${
                  open ? 'bg-[#d4af37]/08' : 'hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#a89b84]">
                      <span className="inline-flex items-center gap-1 text-[#d4af37] border border-[#d4af37]/35 rounded px-2 py-0.5">
                        <Users className="w-3 h-3" />
                        Party {ev.partySize || party.length}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#ffd700] border border-[#d4af37]/30 rounded px-2 py-0.5">
                        <Package className="w-3 h-3" />
                        Loot: {looter?.name || '—'}
                      </span>
                      <span>{formatDate(ev.timestamp)}</span>
                      <span className="text-[#ffd700]">+{formatNumber(ev.totalFame)} fame</span>
                    </div>
                    <p className="text-sm">
                      <span className="text-[#3ecf6e] font-semibold">{ev.killer?.name}</span>
                      <span className="text-[#6b5d4a]"> y party → </span>
                      <span className="text-[#c23b4a] font-semibold">{ev.victim?.name}</span>
                      {ev.victim?.guildName ? (
                        <span className="text-[#6b5d4a]"> ({ev.victim.guildName})</span>
                      ) : null}
                    </p>
                    <p className="text-[11px] text-[#6b5d4a] truncate">
                      {party.map((p) => p.name).join(' · ')}
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
                <div className="px-4 pb-4 space-y-4 bg-[#0c0a08]/50">
                  <div className="rounded-lg border border-[#d4af37]/45 bg-[#d4af37]/10 p-4 flex flex-wrap items-center gap-3">
                    <Package className="w-6 h-6 text-[#ffd700]" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">
                        Looteado por (loot rights)
                      </p>
                      <p className="font-[family-name:var(--font-display)] text-lg gold-text">
                        {looter?.name || 'Desconocido'}
                      </p>
                      <p className="text-xs text-[#a89b84]">
                        En Albion el golpe final (Killer) obtiene los derechos de loot.
                        La API no envía otro jugador “looter” aparte.
                        {looter?.guildName ? ` · ${looter.guildName}` : ''}
                      </p>
                    </div>
                    {loot.length ? (
                      <p className="ml-auto text-sm text-[#ffd700]">
                        {loot.length} ítems en inventario víctima
                      </p>
                    ) : null}
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-[#3d3426]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wider text-[#6b5d4a] border-b border-[#3d3426]">
                          <th className="px-3 py-2 text-left">Jugador (party)</th>
                          <th className="px-3 py-2 text-right">Daño</th>
                          <th className="px-3 py-2 text-right">Heal</th>
                          <th className="px-3 py-2 text-right">IP</th>
                          <th className="px-3 py-2 text-left">Gremio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {party.map((p) => (
                          <tr key={p.id || p.name} className="border-t border-[#3d3426]/70">
                            <td className="px-3 py-1.5 font-semibold">
                              {p.name}
                              {p.role === 'killer' || p.id === looter?.id ? (
                                <span className="ml-2 text-[10px] text-[#ffd700]">LOOT</span>
                              ) : null}
                            </td>
                            <td className="px-3 py-1.5 text-right text-[#c23b4a]">
                              {formatCompact(p.damageDone || 0)}
                            </td>
                            <td className="px-3 py-1.5 text-right text-[#3ecf6e]">
                              {formatCompact(p.supportHealingDone || 0)}
                            </td>
                            <td className="px-3 py-1.5 text-right text-[#a89b84]">
                              {formatNumber(p.averageItemPower || 0)}
                            </td>
                            <td className="px-3 py-1.5 text-[#a89b84] truncate max-w-[140px]">
                              {p.guildName || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center gap-2 text-[#d4af37]">
                    <Swords className="w-4 h-4" />
                    <h3 className="font-[family-name:var(--font-display)] text-sm">
                      Sets de la party ({party.length})
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    {party.map((player) => (
                      <Equipment
                        key={player.id || player.name}
                        player={{
                          ...player,
                          guildName: player.guildName || (player.role === 'killer' ? 'Killer' : 'Party'),
                        }}
                        side="killer"
                      />
                    ))}
                  </div>

                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-sm text-[#c23b4a] mb-2">
                      Víctima
                    </h3>
                    <Equipment player={ev.victim} side="victim" />
                  </div>

                  {loot.length > 0 ? (
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-sm text-[#d4af37] mb-2">
                        Loot disponible → {looter?.name} ({loot.length} ítems)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {loot.map((item, idx) => (
                          <div
                            key={`${ev.eventId}-loot-${idx}`}
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
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#6b5d4a]">Sin ítems de inventario en la víctima.</p>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}

        {fights.length === 0 ? (
          <li className="px-4 py-10 text-center text-[#6b5d4a]">
            Sin combates con party en los eventos cargados.
          </li>
        ) : null}
      </ul>
    </section>
  );
}

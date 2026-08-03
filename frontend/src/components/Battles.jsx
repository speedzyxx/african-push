import { useMemo, useState } from 'react';
import { ChevronDown, Crown, MapPin, Shield, Swords } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompact, formatDate, formatNumber } from '../utils/api';

const GOLD_PALETTE = ['#ffd700', '#d4af37', '#c9a227', '#8a6d1d', '#3ecf6e', '#c23b4a', '#e8dcc3', '#a89b84'];

function MiniTable({ title, rows, accent = 'gold' }) {
  const titleColor =
    accent === 'kill' ? 'text-[#3ecf6e]' : accent === 'death' ? 'text-[#c23b4a]' : 'text-[#d4af37]';

  return (
    <div className="rounded-lg border border-[#3d3426] bg-[#0c0a08]/70 overflow-hidden">
      <div className={`px-3 py-2 text-xs uppercase tracking-[0.15em] ${titleColor} border-b border-[#3d3426]`}>
        {title}
      </div>
      <div className="max-h-56 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-[#6b5d4a]">
              <th className="px-3 py-2 text-left font-medium">Nombre</th>
              <th className="px-3 py-2 text-right font-medium">K</th>
              <th className="px-3 py-2 text-right font-medium">D</th>
              <th className="px-3 py-2 text-right font-medium">Fame</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id || row.name} className="border-t border-[#3d3426]/70">
                <td className="px-3 py-1.5">
                  <p className="font-semibold text-[#f5efe3] truncate max-w-[160px]">{row.name}</p>
                  {row.alliance || row.guildName || row.allianceName ? (
                    <p className="text-[11px] text-[#6b5d4a] truncate">
                      {row.alliance || row.allianceName || row.guildName}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-1.5 text-right text-[#3ecf6e]">{formatNumber(row.kills)}</td>
                <td className="px-3 py-1.5 text-right text-[#c23b4a]">{formatNumber(row.deaths)}</td>
                <td className="px-3 py-1.5 text-right text-[#d4af37]">{formatCompact(row.killFame)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[#6b5d4a]">
                  Sin datos
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultBadge({ result }) {
  const styles = {
    victoria: 'bg-[#3ecf6e]/15 text-[#3ecf6e] border-[#3ecf6e]/40',
    derrota: 'bg-[#c23b4a]/15 text-[#c23b4a] border-[#c23b4a]/40',
    empate: 'bg-[#d4af37]/15 text-[#d4af37] border-[#d4af37]/40',
  };
  const labels = { victoria: 'Victoria', derrota: 'Derrota', empate: 'Empate' };
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded border text-[11px] uppercase tracking-wider font-semibold ${
        styles[result] || styles.empate
      }`}
    >
      {labels[result] || 'Empate'}
    </span>
  );
}

function tooltipStyle() {
  return {
    backgroundColor: '#16120e',
    border: '1px solid #d4af3755',
    borderRadius: 8,
    color: '#f5efe3',
  };
}

export default function Battles({ battles = [] }) {
  const [openId, setOpenId] = useState(battles[0]?.id ?? null);
  const [board, setBoard] = useState('ours'); // ours | overall
  const openBattle = battles.find((b) => b.id === openId) || battles[0];

  const guildPie = useMemo(() => {
    if (!openBattle?.topGuilds?.length) return [];
    return openBattle.topGuilds.map((g) => ({
      name: g.name,
      value: g.killFame || 0,
    }));
  }, [openBattle]);

  const guildBars = useMemo(() => {
    if (!openBattle?.topGuilds?.length) return [];
    return openBattle.topGuilds.map((g) => ({
      name: g.name.length > 12 ? `${g.name.slice(0, 12)}…` : g.name,
      kills: g.kills || 0,
      deaths: g.deaths || 0,
    }));
  }, [openBattle]);

  const allianceBars = useMemo(() => {
    const list = openBattle?.topAlliances || [];
    return list.map((a) => ({
      name: a.name?.length > 12 ? `${a.name.slice(0, 12)}…` : a.name,
      kills: a.kills || 0,
      deaths: a.deaths || 0,
    }));
  }, [openBattle]);

  return (
    <div className="space-y-4 animate-fade-up delay-4">
      <section className="panel rounded-lg overflow-hidden">
        <header className="flex items-center gap-3 p-4 border-b border-[#3d3426]">
          <Shield className="w-5 h-5 text-[#d4af37]" />
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl gold-text">
              Batallas ZvZ · African Push
            </h2>
            <p className="text-sm text-[#a89b84]">
              MVP, top kills / fame · alianza vs alianza · gráficas por pelea
            </p>
          </div>
        </header>
        <div className="gold-line" />

        <ul className="divide-y divide-[#3d3426]/80">
          {battles.map((b) => {
            const open = openId === b.id;
            const our = b.ourGuild;
            const mvp = b.ourMvp;

            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(open ? null : b.id);
                    setBoard('ours');
                  }}
                  className={`w-full text-left px-4 py-3 transition ${
                    open ? 'bg-[#d4af37]/08' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <ResultBadge result={b.result || 'empate'} />
                        <span className="text-xs text-[#a89b84]">{formatDate(b.startTime)}</span>
                        {b.clusterName ? (
                          <span className="text-xs text-[#6b5d4a] inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {b.clusterName}
                          </span>
                        ) : null}
                        {mvp ? (
                          <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-[#ffd700] border border-[#d4af37]/40 rounded px-2 py-0.5">
                            <Crown className="w-3 h-3" />
                            MVP {mvp.name}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Swords className="w-4 h-4 text-[#d4af37] shrink-0" />
                        <p className="font-[family-name:var(--font-display)] text-sm sm:text-base">
                          <span className="text-[#ffd700]">
                            {b.matchup?.allianceVsAlliance?.split(' vs ')[0] ||
                              b.matchup?.usLabel ||
                              'NULLE'}
                          </span>
                          <span className="text-[#6b5d4a] mx-2">vs</span>
                          <span className="text-[#c23b4a]">
                            {b.matchup?.allianceVsAlliance?.split(' vs ')[1] ||
                              b.matchup?.themLabel ||
                              'Enemigos'}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#a89b84]">
                        <span>
                          Alianzas:{' '}
                          <span className="text-[#d4af37]">
                            {b.matchup?.allianceVsAlliance || '—'}
                          </span>
                        </span>
                        <span>
                          Gremios:{' '}
                          <span className="text-[#e8dcc3]">
                            {b.matchup?.guildVsGuild || '—'}
                          </span>
                        </span>
                        {b.matchup?.alliesNote ? (
                          <span className="text-[#3ecf6e]">{b.matchup.alliesNote}</span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-[#ffd700] font-semibold">
                          {formatCompact(b.totalFame)} fame batalla
                        </span>
                        <span className="text-[#3ecf6e]">
                          {formatNumber(b.totalKills)} kills totales
                        </span>
                        <span>
                          Nosotros{' '}
                          <span className="text-[#3ecf6e]">
                            {formatNumber(b.ourTotals?.kills ?? our?.kills ?? 0)}K
                          </span>
                          {' / '}
                          <span className="text-[#c23b4a]">
                            {formatNumber(b.ourTotals?.deaths ?? our?.deaths ?? 0)}D
                          </span>
                          {' · '}
                          <span className="text-[#d4af37]">
                            {formatCompact(b.ourTotals?.killFame ?? our?.killFame ?? 0)} fame
                          </span>
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#a89b84] shrink-0 mt-1 transition-transform ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {open ? (
                  <div className="px-4 pb-4 space-y-4 bg-[#0c0a08]/50">
                    {mvp ? (
                      <div className="rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/08 p-4 flex flex-wrap items-center gap-4">
                        <Crown className="w-8 h-8 text-[#ffd700]" />
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">
                            MVP African Push
                          </p>
                          <p className="font-[family-name:var(--font-display)] text-xl gold-text">
                            {mvp.name}
                          </p>
                          <p className="text-sm text-[#a89b84]">
                            {formatNumber(mvp.kills)} kills · {formatNumber(mvp.deaths)} deaths ·{' '}
                            <span className="text-[#ffd700]">{formatCompact(mvp.killFame)} fame</span>
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setBoard('ours')}
                        className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded border ${
                          board === 'ours'
                            ? 'border-[#d4af37] text-[#ffd700] bg-[#d4af37]/10'
                            : 'border-[#3d3426] text-[#a89b84]'
                        }`}
                      >
                        Tops nuestros
                      </button>
                      <button
                        type="button"
                        onClick={() => setBoard('overall')}
                        className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded border ${
                          board === 'overall'
                            ? 'border-[#d4af37] text-[#ffd700] bg-[#d4af37]/10'
                            : 'border-[#3d3426] text-[#a89b84]'
                        }`}
                      >
                        Tops batalla
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <MiniTable
                        title={board === 'ours' ? 'Top kills (AP)' : 'Top kills (batalla)'}
                        rows={
                          board === 'ours'
                            ? b.ourTopKillers ?? []
                            : b.topKillersOverall ?? []
                        }
                        accent="kill"
                      />
                      <MiniTable
                        title={
                          board === 'ours'
                            ? 'Top fame / “daño” (AP)'
                            : 'Top fame / “daño” (batalla)'
                        }
                        rows={
                          board === 'ours'
                            ? (b.ourPlayers ?? []).slice(0, 5)
                            : b.topFameOverall ?? []
                        }
                      />
                    </div>
                    <p className="text-[11px] text-[#6b5d4a]">
                      Nota: la API de batallas no envía daño numérico de skills; usamos{' '}
                      <span className="text-[#d4af37]">Kill Fame</span> como métrica de contribución.
                    </p>

                    <div className="grid lg:grid-cols-3 gap-4">
                      <div className="h-64 rounded-lg border border-[#3d3426] p-2">
                        <p className="text-[11px] uppercase tracking-wider text-[#d4af37] px-2 mb-1">
                          Fame por gremio
                        </p>
                        <ResponsiveContainer width="100%" height="90%">
                          <PieChart>
                            <Pie
                              data={guildPie}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={75}
                              label={({ name }) => name}
                            >
                              {guildPie.map((_, i) => (
                                <Cell key={i} fill={GOLD_PALETTE[i % GOLD_PALETTE.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={tooltipStyle()}
                              formatter={(v) => formatCompact(v)}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="h-64 rounded-lg border border-[#3d3426] p-2">
                        <p className="text-[11px] uppercase tracking-wider text-[#d4af37] px-2 mb-1">
                          K/D por gremio
                        </p>
                        <ResponsiveContainer width="100%" height="90%">
                          <BarChart data={guildBars}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#3d3426" />
                            <XAxis
                              dataKey="name"
                              stroke="#a89b84"
                              tick={{ fill: '#a89b84', fontSize: 10 }}
                            />
                            <YAxis stroke="#a89b84" tick={{ fill: '#a89b84', fontSize: 11 }} />
                            <Tooltip contentStyle={tooltipStyle()} />
                            <Legend />
                            <Bar dataKey="kills" name="Kills" fill="#3ecf6e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="deaths" name="Deaths" fill="#c23b4a" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="h-64 rounded-lg border border-[#3d3426] p-2">
                        <p className="text-[11px] uppercase tracking-wider text-[#d4af37] px-2 mb-1">
                          K/D por alianza
                        </p>
                        <ResponsiveContainer width="100%" height="90%">
                          <BarChart data={allianceBars}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#3d3426" />
                            <XAxis
                              dataKey="name"
                              stroke="#a89b84"
                              tick={{ fill: '#a89b84', fontSize: 10 }}
                            />
                            <YAxis stroke="#a89b84" tick={{ fill: '#a89b84', fontSize: 11 }} />
                            <Tooltip contentStyle={tooltipStyle()} />
                            <Legend />
                            <Bar dataKey="kills" name="Kills" fill="#ffd700" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="deaths" name="Deaths" fill="#8a6d1d" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-3">
                      <MiniTable
                        title="Nuestros jugadores"
                        rows={b.ourPlayers ?? []}
                        accent="kill"
                      />
                      <MiniTable title="Top gremios (fame)" rows={b.topGuilds ?? []} />
                      <MiniTable title="Top players (fame)" rows={b.topPlayers ?? []} />
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}

          {battles.length === 0 ? (
            <li className="px-4 py-10 text-center text-[#6b5d4a]">Sin batallas recientes.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

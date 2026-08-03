import { useMemo, useState } from 'react';
import { ChevronDown, MapPin, Shield, Swords } from 'lucide-react';
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

const NEON = ['#00f0ff', '#ff2bd6', '#b6ff2e', '#ffd44d', '#39ff14', '#ff3b6b', '#7c5cff', '#2ee6a6'];

function MiniTable({ title, rows, accent = 'cyan' }) {
  const titleColor =
    accent === 'kill' ? 'text-[#39ff14]' : accent === 'magenta' ? 'text-[#ff2bd6]' : 'text-[#00f0ff]';

  return (
    <div className="rounded-lg border border-[#1f2a44] bg-[#05060a]/70 overflow-hidden">
      <div className={`px-3 py-2 text-xs uppercase tracking-[0.15em] ${titleColor} border-b border-[#1f2a44]`}>
        {title}
      </div>
      <div className="max-h-56 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-[#5b6b88]">
              <th className="px-3 py-2 text-left font-medium">Nombre</th>
              <th className="px-3 py-2 text-right font-medium">K</th>
              <th className="px-3 py-2 text-right font-medium">D</th>
              <th className="px-3 py-2 text-right font-medium">Fame</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id || row.name} className="border-t border-[#1f2a44]/70">
                <td className="px-3 py-1.5">
                  <p className="font-semibold text-[#f4f7ff] truncate max-w-[160px]">{row.name}</p>
                  {row.alliance || row.guildName || row.allianceName ? (
                    <p className="text-[11px] text-[#5b6b88] truncate">
                      {row.alliance || row.allianceName || row.guildName}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-1.5 text-right text-[#39ff14]">{formatNumber(row.kills)}</td>
                <td className="px-3 py-1.5 text-right text-[#ff3b6b]">{formatNumber(row.deaths)}</td>
                <td className="px-3 py-1.5 text-right text-[#ffd44d]">{formatCompact(row.killFame)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[#5b6b88]">
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
    victoria: 'bg-[#39ff14]/15 text-[#39ff14] border-[#39ff14]/40',
    derrota: 'bg-[#ff3b6b]/15 text-[#ff3b6b] border-[#ff3b6b]/40',
    empate: 'bg-[#ffd44d]/15 text-[#ffd44d] border-[#ffd44d]/40',
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
    backgroundColor: '#0b0f1a',
    border: '1px solid #00f0ff55',
    borderRadius: 8,
    color: '#f4f7ff',
  };
}

export default function Battles({ battles = [] }) {
  const [openId, setOpenId] = useState(battles[0]?.id ?? null);
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
    const list = openBattle?.topAlliances || openBattle?.enemyAlliances || [];
    if (!list.length && openBattle?.ourAlliance) {
      return [
        {
          name: openBattle.ourAlliance.name,
          kills: openBattle.ourAlliance.kills,
          deaths: openBattle.ourAlliance.deaths,
        },
        ...(openBattle.enemyAlliances || []).map((a) => ({
          name: a.name,
          kills: a.kills,
          deaths: a.deaths,
        })),
      ];
    }
    return list.map((a) => ({
      name: a.name?.length > 12 ? `${a.name.slice(0, 12)}…` : a.name,
      kills: a.kills || 0,
      deaths: a.deaths || 0,
    }));
  }, [openBattle]);

  return (
    <div className="space-y-4 animate-fade-up delay-4">
      <section className="panel rounded-lg overflow-hidden">
        <header className="flex items-center gap-3 p-4 border-b border-[#1f2a44]">
          <Shield className="w-5 h-5 text-[#00f0ff]" />
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl neon-text">
              Batallas ZvZ · African Push
            </h2>
            <p className="text-sm text-[#8b9bb8]">
              Enfrentamientos gremio/alianza · resultado por K/D · gráficas solo de la pelea
            </p>
          </div>
        </header>
        <div className="rgb-line" />

        <ul className="divide-y divide-[#1f2a44]/80">
          {battles.map((b) => {
            const open = openId === b.id;
            const our = b.ourGuild;

            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : b.id)}
                  className={`w-full text-left px-4 py-3 transition ${
                    open ? 'bg-[#00f0ff]/08' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <ResultBadge result={b.result || 'empate'} />
                        <span className="text-xs text-[#8b9bb8]">{formatDate(b.startTime)}</span>
                        {b.clusterName ? (
                          <span className="text-xs text-[#5b6b88] inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {b.clusterName}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Swords className="w-4 h-4 text-[#ff2bd6] shrink-0" />
                        <p className="font-[family-name:var(--font-display)] text-sm sm:text-base text-[#f4f7ff]">
                          <span className="text-[#00f0ff]">
                            {b.matchup?.allianceVsAlliance
                              ? b.matchup.allianceVsAlliance.split(' vs ')[0]
                              : b.matchup?.usLabel || 'NULLE'}
                          </span>
                          <span className="text-[#8b9bb8] mx-2">vs</span>
                          <span className="text-[#ff3b6b]">
                            {b.matchup?.allianceVsAlliance
                              ? b.matchup.allianceVsAlliance.split(' vs ')[1]
                              : b.matchup?.themLabel || 'Enemigos'}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8b9bb8]">
                        <span>
                          Alianzas:{' '}
                          <span className="text-[#ffd44d]">
                            {b.matchup?.allianceVsAlliance || '—'}
                          </span>
                        </span>
                        <span>
                          Gremios:{' '}
                          <span className="text-[#e5e7eb]">
                            {b.matchup?.guildVsGuild || '—'}
                          </span>
                        </span>
                        {b.matchup?.alliesNote ? (
                          <span className="text-[#39ff14]">{b.matchup.alliesNote}</span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-[#ffd44d] font-semibold">
                          {formatCompact(b.totalFame)} fame
                        </span>
                        <span className="text-[#39ff14]">
                          {formatNumber(b.totalKills)} kills batalla
                        </span>
                        <span>
                          Nosotros{' '}
                          <span className="text-[#39ff14]">{formatNumber(our?.kills ?? 0)}K</span>
                          {' / '}
                          <span className="text-[#ff3b6b]">{formatNumber(our?.deaths ?? 0)}D</span>
                        </span>
                        <span className="text-[#8b9bb8]">
                          {formatNumber(b.playerCount)}p · {formatNumber(b.guildCount)}g
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8b9bb8] shrink-0 mt-1 transition-transform ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {open ? (
                  <div className="px-4 pb-4 space-y-4 bg-[#05060a]/50">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                      <div className="rounded border border-[#1f2a44] px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-[#8b9bb8]">Resultado</p>
                        <ResultBadge result={b.result || 'empate'} />
                        <p className="text-xs text-[#8b9bb8] mt-1">
                          K/D {our?.kills ?? 0}/{our?.deaths ?? 0}
                        </p>
                      </div>
                      <div className="rounded border border-[#1f2a44] px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-[#8b9bb8]">Nuestra alianza</p>
                        <p className="text-[#00f0ff] font-semibold">
                          {b.matchup?.allianceVsAlliance?.split(' vs ')[0] || b.matchup?.usLabel}
                        </p>
                        <p className="text-xs text-[#8b9bb8]">{b.ourGuild?.name}</p>
                      </div>
                      <div className="rounded border border-[#1f2a44] px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-[#8b9bb8]">Alianza rival</p>
                        <p className="text-[#ff3b6b] font-semibold">
                          {b.matchup?.allianceVsAlliance?.split(' vs ')[1] || b.matchup?.themLabel}
                        </p>
                        <p className="text-xs text-[#8b9bb8]">{b.mainEnemyGuild?.name || '—'}</p>
                      </div>
                      <div className="rounded border border-[#1f2a44] px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-[#8b9bb8]">Fin</p>
                        <p>{formatDate(b.endTime)}</p>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-4">
                      <div className="h-64 rounded-lg border border-[#1f2a44] p-2">
                        <p className="text-[11px] uppercase tracking-wider text-[#00f0ff] px-2 mb-1">
                          Fame por gremio (esta batalla)
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
                                <Cell key={i} fill={NEON[i % NEON.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={tooltipStyle()}
                              formatter={(v) => formatCompact(v)}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="h-64 rounded-lg border border-[#1f2a44] p-2">
                        <p className="text-[11px] uppercase tracking-wider text-[#ff2bd6] px-2 mb-1">
                          K/D por gremio
                        </p>
                        <ResponsiveContainer width="100%" height="90%">
                          <BarChart data={guildBars}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2a44" />
                            <XAxis
                              dataKey="name"
                              stroke="#8b9bb8"
                              tick={{ fill: '#8b9bb8', fontSize: 10 }}
                            />
                            <YAxis stroke="#8b9bb8" tick={{ fill: '#8b9bb8', fontSize: 11 }} />
                            <Tooltip contentStyle={tooltipStyle()} />
                            <Legend />
                            <Bar dataKey="kills" name="Kills" fill="#39ff14" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="deaths" name="Deaths" fill="#ff3b6b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="h-64 rounded-lg border border-[#1f2a44] p-2">
                        <p className="text-[11px] uppercase tracking-wider text-[#b6ff2e] px-2 mb-1">
                          K/D por alianza
                        </p>
                        <ResponsiveContainer width="100%" height="90%">
                          <BarChart data={allianceBars}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2a44" />
                            <XAxis
                              dataKey="name"
                              stroke="#8b9bb8"
                              tick={{ fill: '#8b9bb8', fontSize: 10 }}
                            />
                            <YAxis stroke="#8b9bb8" tick={{ fill: '#8b9bb8', fontSize: 11 }} />
                            <Tooltip contentStyle={tooltipStyle()} />
                            <Legend />
                            <Bar dataKey="kills" name="Kills" fill="#00f0ff" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="deaths" name="Deaths" fill="#ff2bd6" radius={[4, 4, 0, 0]} />
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
                      <MiniTable
                        title="Top players (fame)"
                        rows={b.topPlayers ?? []}
                        accent="magenta"
                      />
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}

          {battles.length === 0 ? (
            <li className="px-4 py-10 text-center text-[#5b6b88]">Sin batallas recientes.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

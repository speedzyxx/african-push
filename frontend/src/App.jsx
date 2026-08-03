import { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Skull, Users } from 'lucide-react';
import { api, formatCompact, formatNumber } from './utils/api';
import StatCard from './components/StatCard';
import MembersTable from './components/MembersTable';
import Killboard from './components/Killboard';
import Battles from './components/Battles';
import MemberBuilds from './components/MemberBuilds';
import CombatLoot from './components/CombatLoot';
import RecruitHero from './components/RecruitHero';
import {
  BattlesPreview,
  RecentKillsPreview,
  TopRankings,
} from './components/DashboardExtras';

const GUILD_NAME = 'African Push';
const DISCORD_URL = 'https://discord.gg/HKWb7PPsXD';

const TABS = [
  { id: 'overview', label: 'Dashboard' },
  { id: 'members', label: 'Miembros' },
  { id: 'kills', label: 'Killboard' },
  { id: 'battles', label: 'Batallas' },
  { id: 'loot', label: 'Combat Loot' },
];

export default function App() {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [killsSource, setKillsSource] = useState('events');
  const [battles, setBattles] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [eventsScanned, setEventsScanned] = useState(0);

  async function loadAll() {
    setLoading(true);
    setError(null);

    const results = await Promise.allSettled([
      api.guildStats(),
      api.guildMembers(),
      api.guildKills(),
      api.guildBattles(),
      api.guildBuilds(),
    ]);

    const [s, m, k, b, buildsRes] = results;
    const failures = [];

    if (s.status === 'fulfilled') setStats(s.value);
    else failures.push(`stats: ${s.reason?.message || s.reason}`);

    if (m.status === 'fulfilled') setMembers(m.value.members ?? []);
    else failures.push(`members: ${m.reason?.message || m.reason}`);

    if (k.status === 'fulfilled') {
      setEvents(k.value.events ?? []);
      setKillsSource(k.value.source ?? 'events');
    } else failures.push(`kills: ${k.reason?.message || k.reason}`);

    if (b.status === 'fulfilled') setBattles(b.value.battles ?? []);
    else failures.push(`battles: ${b.reason?.message || b.reason}`);

    if (buildsRes.status === 'fulfilled') {
      setBuilds(buildsRes.value.members ?? []);
      setEventsScanned(buildsRes.value.eventsScanned ?? 0);
    } else failures.push(`builds: ${buildsRes.reason?.message || buildsRes.reason}`);

    if (failures.length === results.length) {
      setError(failures[0] || 'Error cargando datos');
    } else if (failures.length) {
      setError(`Algunos datos fallaron — ${failures.join(' | ')}`);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const totalPve = useMemo(
    () => members.reduce((acc, m) => acc + (m.pveFame || 0), 0),
    [members]
  );
  const totalCraft = useMemo(
    () => members.reduce((acc, m) => acc + (m.craftingFame || 0), 0),
    [members]
  );
  const avgMemberPvp = members.length
    ? Math.round(members.reduce((a, m) => a + (m.killFame || 0), 0) / members.length)
    : 0;

  const guildName = stats?.name || GUILD_NAME;
  const memberCount = stats?.memberCount || members.length;
  const buildsWithSet = builds.filter((m) => m.build).length;

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#3d3426] bg-[#0c0a08]/92 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.35em] uppercase text-[#d4af37] mb-1">
              Albion Online · América West
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl gold-text">
              {guildName}
            </h1>
            <p className="text-sm text-[#a89b84]">
              {stats?.alliance ? `Alianza: ${stats.alliance} · ` : ''}
              {formatNumber(memberCount)} miembros
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 text-xs uppercase tracking-wider rounded-md bg-[#d4af37]/15 text-[#ffd700] border border-[#d4af37]/40 hover:bg-[#d4af37]/25"
            >
              Discord
            </a>
            <nav className="flex flex-wrap gap-1 p-1 rounded-lg bg-[#0c0a08] border border-[#3d3426]">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition ${
                    tab === t.id
                      ? 'bg-[#d4af37]/15 text-[#ffd700]'
                      : 'text-[#a89b84] hover:text-[#ffd700]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            <button
              type="button"
              onClick={loadAll}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#d4af37]/40 text-sm text-[#ffd700] hover:bg-[#d4af37]/10 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Actualizar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <RecruitHero guildName={guildName} memberCount={memberCount} />

        {error ? (
          <div className="panel rounded-lg border border-[#c23b4a]/50 p-4 text-[#f5a8b0]">
            <p className="font-semibold">Error al cargar la API</p>
            <p className="text-sm mt-1 opacity-90">{error}</p>
          </div>
        ) : null}

        {loading && !stats && members.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-[#a89b84] gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
            Cargando datos de {GUILD_NAME}…
          </div>
        ) : null}

        {tab === 'overview' && (stats || !loading) ? (
          <>
            <section className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
              <StatCard
                title="Fama PvP"
                value={stats?.killFame ?? 0}
                subtitle={`Kill Fame · ${GUILD_NAME}`}
                accent="gold"
                compact
                delay="delay-1"
              />
              <StatCard
                title="Fama PvE (suma)"
                value={totalPve}
                subtitle="Agregado de miembros"
                accent="mute"
                compact
                delay="delay-2"
              />
              <StatCard
                title="Crafting (suma)"
                value={totalCraft}
                subtitle="Agregado de miembros"
                accent="mute"
                compact
                delay="delay-2"
              />
              <StatCard
                title="Ratio K/D Fame"
                value={stats?.fameRatio ?? 0}
                subtitle={`${formatNumber(stats?.killFame ?? 0)} / ${formatNumber(stats?.deathFame ?? 0)}`}
                accent="kill"
                delay="delay-3"
              />
              <StatCard
                title="Miembros"
                value={memberCount}
                subtitle="Roster activo"
                accent="mute"
                delay="delay-4"
              />
              <StatCard
                title="Builds vistas"
                value={buildsWithSet}
                subtitle={`De ${eventsScanned} eventos PvP`}
                accent="gold"
                delay="delay-4"
              />
            </section>

            <section className="grid lg:grid-cols-3 gap-4">
              <div className="panel rounded-lg p-5 animate-fade-up">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-[#3ecf6e]" />
                  <h3 className="font-[family-name:var(--font-display)] text-[#d4af37]">
                    Resumen de {GUILD_NAME}
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-[#e8dcc3]">
                  <li className="flex justify-between border-b border-[#3d3426] pb-2">
                    <span className="text-[#a89b84]">Death Fame</span>
                    <span className="text-[#c23b4a]">{formatNumber(stats?.deathFame ?? 0)}</span>
                  </li>
                  <li className="flex justify-between border-b border-[#3d3426] pb-2">
                    <span className="text-[#a89b84]">PvP medio / miembro</span>
                    <span className="text-[#d4af37]">{formatCompact(avgMemberPvp)}</span>
                  </li>
                  <li className="flex justify-between border-b border-[#3d3426] pb-2">
                    <span className="text-[#a89b84]">GvG Fame</span>
                    <span>{formatNumber(stats?.gvgFame ?? 0)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-[#a89b84]">Eventos en killboard</span>
                    <span className="text-[#3ecf6e]">{events.length}</span>
                  </li>
                </ul>
              </div>

              <div className="panel rounded-lg p-5 animate-fade-up delay-1 lg:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Skull className="w-4 h-4 text-[#c23b4a]" />
                  <h3 className="font-[family-name:var(--font-display)] text-[#d4af37]">
                    Última pelea
                  </h3>
                </div>
                {events[0] ? (
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#3ecf6e]">Killer</p>
                      <p className="text-[#3ecf6e] font-semibold text-lg">{events[0].killer?.name}</p>
                      <p className="text-[#a89b84]">IP {events[0].killer?.averageItemPower}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-[#a89b84]">Fame</p>
                      <p className="font-[family-name:var(--font-display)] text-2xl gold-text">
                        +{formatNumber(events[0].totalFame)}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[10px] uppercase tracking-wider text-[#c23b4a]">Victim</p>
                      <p className="text-[#c23b4a] font-semibold text-lg">{events[0].victim?.name}</p>
                      <p className="text-[#a89b84]">IP {events[0].victim?.averageItemPower}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#6b5d4a]">Sin pelea reciente.</p>
                )}
              </div>
            </section>

            <TopRankings members={members} />
            <MemberBuilds members={builds} eventsScanned={eventsScanned} />
            <div className="grid lg:grid-cols-2 gap-4">
              <RecentKillsPreview events={events} onOpenKillboard={() => setTab('kills')} />
              <BattlesPreview battles={battles} onOpenBattles={() => setTab('battles')} />
            </div>
          </>
        ) : null}

        {tab === 'members' ? <MembersTable members={members} /> : null}
        {tab === 'kills' ? <Killboard events={events} source={killsSource} /> : null}
        {tab === 'battles' ? <Battles battles={battles} /> : null}
        {tab === 'loot' ? <CombatLoot events={events} /> : null}
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-8 text-center text-xs text-[#6b5d4a]">
        {GUILD_NAME} · América West ·{' '}
        <a href={DISCORD_URL} className="text-[#d4af37] hover:underline" target="_blank" rel="noreferrer">
          Discord reclutamiento
        </a>
      </footer>
    </div>
  );
}

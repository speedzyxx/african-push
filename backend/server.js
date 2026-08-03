const express = require('express');
const cors = require('cors');
const path = require('path');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 3001;

const ALBION_API = 'https://gameinfo.albiononline.com/api/gameinfo';
const GUILD_ID = 'ePXF6hJYSkajVrQofuxNYg';
/** América West — requerido por killboard / region lock de la API */
const ALBION_SERVER = 'live_us';
const CACHE_TTL = 300; // 5 minutos

const cache = new NodeCache({ stdTTL: CACHE_TTL, checkperiod: 60 });

app.use(cors());
app.use(express.json());

/**
 * Construye una URL de Albion siempre con ?server=live_us (América West).
 * Acepta path con o sin query: "/guilds/ID" | "/events?guildId=...&limit=25"
 */
function buildAlbionUrl(path) {
  const url = new URL(`${ALBION_API}${path.startsWith('/') ? path : `/${path}`}`);
  url.searchParams.set('server', ALBION_SERVER);
  return url.toString();
}

async function fetchAlbion(path, cacheKey, options = {}) {
  const { includeServer = true, ttl } = options;
  const regionKey = `${cacheKey}:${includeServer ? ALBION_SERVER : 'default'}`;
  const cached = cache.get(regionKey);
  if (cached) {
    return { data: cached, fromCache: true, url: '(cache)' };
  }

  const url = includeServer ? buildAlbionUrl(path) : `${ALBION_API}${path}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'AlbionGuildDashboard/1.0',
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const err = new Error(
      `Albion API ${response.status}${includeServer ? ` (${ALBION_SERVER})` : ''}: ${text || response.statusText}`
    );
    err.status = response.status;
    err.url = url;
    throw err;
  }

  const data = await response.json();
  if (typeof ttl === 'number') {
    cache.set(regionKey, data, ttl);
  } else {
    cache.set(regionKey, data);
  }
  return { data, fromCache: false, url };
}

/**
 * Intenta varias URLs hasta que una responda OK.
 */
async function fetchAlbionFirst(attempts, cacheKey) {
  const errors = [];
  for (const attempt of attempts) {
    try {
      const result = await fetchAlbion(attempt.path, `${cacheKey}:${attempt.id}`, {
        includeServer: attempt.includeServer !== false,
      });
      return { ...result, attempt: attempt.id };
    } catch (error) {
      console.warn(`[fetchAlbionFirst] ${attempt.id} falló:`, error.message, error.url || '');
      errors.push(error);
    }
  }
  const last = errors[errors.length - 1] || new Error('Todas las URLs fallaron');
  last.attempts = errors.map((e) => e.url || e.message);
  throw last;
}

function sendError(res, error) {
  console.error(error);
  res.status(502).json({
    error: 'No se pudo obtener datos de Albion Online',
    detail: error.message,
  });
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    server: ALBION_SERVER,
    guildId: GUILD_ID,
    apiBase: ALBION_API,
    cacheKeys: cache.keys(),
  });
});

/**
 * GET /api/guild-stats
 * Stats del gremio: fama, miembros, ratios
 */
app.get('/api/guild-stats', async (_req, res) => {
  try {
    const { data, fromCache } = await fetchAlbion(
      `/guilds/${GUILD_ID}`,
      'guild-stats'
    );

    const killFame = data.killFame ?? 0;
    const deathFame = data.DeathFame ?? data.deathFame ?? 0;
    const memberCount = data.MemberCount ?? data.memberCount ?? 0;
    const kdRatio =
      deathFame > 0 ? Number((killFame / deathFame).toFixed(2)) : killFame;

    res.json({
      fromCache,
      id: data.Id ?? GUILD_ID,
      name: data.Name ?? 'Unknown',
      alliance: data.AllianceName ?? data.AllianceTag ?? null,
      founded: data.Founded ?? null,
      memberCount,
      killFame,
      deathFame,
      fameRatio: kdRatio,
      gvgFame: data.gvgFame ?? data.gvg_fame ?? 0,
      craftingFame: data.CraftingFame ?? data.craftingFame ?? 0,
      raw: data,
    });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * GET /api/guild-members
 * Lista de jugadores y famas
 */
app.get('/api/guild-members', async (_req, res) => {
  try {
    const { data, fromCache } = await fetchAlbion(
      `/guilds/${GUILD_ID}/members`,
      'guild-members'
    );

    const members = (Array.isArray(data) ? data : []).map((m) => {
      const life = m.LifetimeStatistics ?? {};
      return {
        id: m.Id,
        name: m.Name,
        allianceId: m.AllianceId ?? null,
        allianceName: m.AllianceName ?? null,
        killFame: m.KillFame ?? 0,
        deathFame: m.DeathFame ?? 0,
        fameRatio: m.FameRatio ?? 0,
        pveFame: life.PvE?.Total ?? m.LifetimeFame?.All ?? m.LifetimeFame ?? 0,
        craftingFame: life.Crafting?.Total ?? m.CraftingFame ?? 0,
        farmingFame: life.FarmingFame ?? m.FarmingFame ?? 0,
        gatheringFame: life.Gathering?.All?.Total ?? 0,
        averageItemPower: m.AverageItemPower ?? 0,
      };
    });

    res.json({ fromCache, count: members.length, members });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * Carga eventos crudos del gremio (con reintentos).
 */
async function loadGuildEventsRaw(limit = 50) {
  return fetchAlbionFirst(
    [
      {
        id: 'events-live_us',
        path: `/events?guildId=${GUILD_ID}&limit=${limit}`,
        includeServer: true,
      },
      {
        id: 'events-plain',
        path: `/events?guildId=${GUILD_ID}&limit=${limit}`,
        includeServer: false,
      },
    ],
    `guild-events-${limit}`
  );
}

function mapEvent(event) {
  return {
    eventId: event.EventId,
    timestamp: event.TimeStamp,
    totalFame: event.TotalVictimKillFame ?? 0,
    killer: normalizeCombatant(event.Killer),
    victim: normalizeCombatant(event.Victim),
    participants: (event.Participants ?? []).map(normalizeCombatant),
    groupMemberCount: event.groupMemberCount ?? event.numberOfParticipants ?? 1,
    source: 'events',
  };
}

/**
 * GET /api/guild-builds
 * Última build vista en PvP por miembro (desde eventos recientes).
 * El endpoint /members no trae set equipado cuando están offline.
 */
app.get('/api/guild-builds', async (_req, res) => {
  try {
    const [{ data: membersRaw, fromCache: membersCache }, eventsResult] =
      await Promise.all([
        fetchAlbion(`/guilds/${GUILD_ID}/members`, 'guild-members'),
        loadGuildEventsRaw(50),
      ]);

    const buildsById = new Map();
    const ROLE_WEIGHT = { killer: 4, victim: 4, participant: 3, group: 1 };

    const gearSlots = (equipment) =>
      Object.values(equipment || {}).filter((s) => s?.uniqueName).length;

    const consider = (player, timestamp, role, eventId) => {
      if (!player?.Id || player.GuildId !== GUILD_ID) return;
      const combatant = normalizeCombatant(player);
      const slots = gearSlots(combatant.equipment);
      // GroupMembers suelen traer 1 arma; ignoramos sets incompletos (<4 piezas)
      if (slots < 4) return;

      // Prioriza sets completos (Killer/Victim/Participants) sobre GroupMembers
      const score = slots * 10 + (ROLE_WEIGHT[role] || 0);
      const ts = new Date(timestamp).getTime();
      const prev = buildsById.get(player.Id);

      if (prev) {
        if (prev._score > score) return;
        if (prev._score === score && prev._ts >= ts) return;
      }

      buildsById.set(player.Id, {
        id: combatant.id,
        name: combatant.name,
        averageItemPower: combatant.averageItemPower,
        equipment: combatant.equipment,
        role,
        seenAt: timestamp,
        eventId,
        slots,
        _score: score,
        _ts: ts,
      });
    };

    for (const event of Array.isArray(eventsResult.data) ? eventsResult.data : []) {
      consider(event.Killer, event.TimeStamp, 'killer', event.EventId);
      consider(event.Victim, event.TimeStamp, 'victim', event.EventId);
      for (const p of event.Participants ?? []) {
        consider(p, event.TimeStamp, 'participant', event.EventId);
      }
      // GroupMembers al final y solo rellenan si no hay set mejor
      for (const p of event.GroupMembers ?? []) {
        consider(p, event.TimeStamp, 'group', event.EventId);
      }
    }

    const members = (Array.isArray(membersRaw) ? membersRaw : []).map((m) => {
      const build = buildsById.get(m.Id);
      const life = m.LifetimeStatistics ?? {};
      return {
        id: m.Id,
        name: m.Name,
        killFame: m.KillFame ?? 0,
        deathFame: m.DeathFame ?? 0,
        pveFame: life.PvE?.Total ?? 0,
        craftingFame: life.Crafting?.Total ?? 0,
        averageItemPower: build?.averageItemPower ?? m.AverageItemPower ?? 0,
        build: build
          ? {
              equipment: build.equipment,
              role: build.role,
              seenAt: build.seenAt,
              eventId: build.eventId,
              averageItemPower: build.averageItemPower,
              slots: build.slots,
            }
          : null,
      };
    });

    // Builds de jugadores del gremio vistos en eventos pero no en roster (por si acaso)
    for (const [id, build] of buildsById) {
      if (!members.some((m) => m.id === id)) {
        members.push({
          id: build.id,
          name: build.name,
          killFame: 0,
          deathFame: 0,
          pveFame: 0,
          craftingFame: 0,
          averageItemPower: build.averageItemPower,
          build: {
            equipment: build.equipment,
            role: build.role,
            seenAt: build.seenAt,
            eventId: build.eventId,
            averageItemPower: build.averageItemPower,
            slots: build.slots,
          },
        });
      }
    }

    members.sort((a, b) => {
      if (Boolean(b.build) !== Boolean(a.build)) return Boolean(b.build) - Boolean(a.build);
      const bts = b.build?.seenAt ? new Date(b.build.seenAt).getTime() : 0;
      const ats = a.build?.seenAt ? new Date(a.build.seenAt).getTime() : 0;
      if (bts !== ats) return bts - ats;
      return (b.killFame || 0) - (a.killFame || 0);
    });

    const withBuild = members.filter((m) => m.build).length;

    res.json({
      fromCache: membersCache && eventsResult.fromCache,
      eventsScanned: Array.isArray(eventsResult.data) ? eventsResult.data.length : 0,
      withBuild,
      count: members.length,
      members,
    });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * GET /api/guild-kills
 * Peleas recientes del gremio (events). América West.
 * Fallback: si /events falla, usa /battles como feed temporal.
 */
app.get('/api/guild-kills', async (_req, res) => {
  try {
    let source = 'events';
    let fromCache = false;
    let raw;

    try {
      const result = await loadGuildEventsRaw(50);
      raw = result.data;
      fromCache = result.fromCache;
      console.log(`[guild-kills] OK via ${result.attempt} url=${result.url}`);
    } catch (eventsError) {
      console.warn('[guild-kills] /events falló, usando /battles como fallback:', eventsError.message);
      source = 'battles-fallback';
      const fallback = await fetchAlbion(
        `/battles?range=week&offset=0&limit=10&guildId=${GUILD_ID}`,
        'guild-kills-battles-fallback-week'
      );
      raw = fallback.data;
      fromCache = fallback.fromCache;
    }

    let events;

    if (source === 'events') {
      events = (Array.isArray(raw) ? raw : []).map(mapEvent);
    } else {
      // Feed temporal desde batallas (sin set de equipo individual)
      events = (Array.isArray(raw) ? raw : []).map((b) => {
        const our = b.guilds?.[GUILD_ID];
        return {
          eventId: b.id,
          timestamp: b.startTime,
          totalFame: our?.killFame ?? b.totalFame ?? 0,
          killer: {
            id: GUILD_ID,
            name: our?.name ?? 'African Push',
            guildName: our?.name ?? 'African Push',
            guildId: GUILD_ID,
            allianceName: our?.alliance ?? null,
            averageItemPower: 0,
            killFame: our?.killFame ?? 0,
            deathFame: 0,
            equipment: emptyEquipment(),
          },
          victim: {
            id: 'battle',
            name: b.clusterName ? `Batalla · ${b.clusterName}` : 'Batalla ZvZ',
            guildName: null,
            guildId: null,
            allianceName: null,
            averageItemPower: 0,
            killFame: 0,
            deathFame: 0,
            equipment: emptyEquipment(),
          },
          participants: [],
          groupMemberCount: Object.keys(b.players ?? {}).length,
          source: 'battles-fallback',
          battleSummary: {
            totalKills: b.totalKills ?? 0,
            ourKills: our?.kills ?? 0,
            ourDeaths: our?.deaths ?? 0,
          },
        };
      });
    }

    res.json({
      fromCache,
      source,
      count: events.length,
      events,
    });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * GET /api/guild-battles
 * ZvZ recientes (casi tiempo real): range=day&sort=recent, caché 60s.
 * Fallback a week si el día viene vacío.
 */
app.get('/api/guild-battles', async (_req, res) => {
  try {
    let raw;
    let fromCache = false;
    let rangeUsed = 'day';

    try {
      const day = await fetchAlbion(
        `/battles?range=day&offset=0&limit=20&sort=recent&guildId=${GUILD_ID}`,
        'guild-battles-day-recent-v1',
        { ttl: 60 }
      );
      raw = day.data;
      fromCache = day.fromCache;
      if (!Array.isArray(raw) || raw.length === 0) {
        throw new Error('day empty');
      }
    } catch {
      rangeUsed = 'week';
      const week = await fetchAlbion(
        `/battles?range=week&offset=0&limit=20&sort=recent&guildId=${GUILD_ID}`,
        'guild-battles-week-recent-v1',
        { ttl: 60 }
      );
      raw = week.data;
      fromCache = week.fromCache;
    }

    const battles = (Array.isArray(raw) ? raw : [])
      .map((b) => {
        const guildList = Object.values(b.guilds ?? {})
          .map((g) => ({
            id: g.id,
            name: g.name,
            alliance: g.alliance || null,
            allianceId: g.allianceId ?? null,
            kills: g.kills ?? 0,
            deaths: g.deaths ?? 0,
            killFame: g.killFame ?? 0,
          }))
          .sort((a, c) => c.killFame - a.killFame);

        const playerList = Object.values(b.players ?? {}).map((p) => ({
          id: p.id,
          name: p.name,
          guildId: p.guildId ?? null,
          guildName: p.guildName ?? null,
          allianceName: p.allianceName ?? null,
          kills: p.kills ?? 0,
          deaths: p.deaths ?? 0,
          killFame: p.killFame ?? 0,
        }));

        const ourPlayers = playerList
          .filter((p) => p.guildId === GUILD_ID)
          .sort((a, c) => c.killFame - a.killFame);

        const topPlayers = [...playerList]
          .sort((a, c) => c.killFame - a.killFame)
          .slice(0, 10);

        const ourGuildRaw = b.guilds?.[GUILD_ID] ?? null;
        const ourGuild = ourGuildRaw
          ? {
              id: GUILD_ID,
              name: ourGuildRaw.name,
              alliance: ourGuildRaw.alliance || null,
              allianceId: ourGuildRaw.allianceId ?? null,
              kills: ourGuildRaw.kills ?? 0,
              deaths: ourGuildRaw.deaths ?? 0,
              killFame: ourGuildRaw.killFame ?? 0,
            }
          : null;

        const allianceList = Object.values(b.alliances ?? {})
          .map((a) => ({
            id: a.id,
            name: a.name,
            kills: a.kills ?? 0,
            deaths: a.deaths ?? 0,
            killFame: a.killFame ?? 0,
          }))
          .sort((x, y) => y.killFame - x.killFame);

        const ourAllianceName = ourGuild?.alliance || null;
        const ourAllianceId = ourGuild?.allianceId || null;

        const ourAlliance =
          allianceList.find(
            (a) => a.name === ourAllianceName || a.id === ourAllianceId
          ) ||
          (ourAllianceName
            ? {
                id: ourAllianceId,
                name: ourAllianceName,
                kills: 0,
                deaths: 0,
                killFame: 0,
              }
            : null);

        // Aliados de NULLE (ej. SlNGULARlTY) NO cuentan como enemigos
        const sameAlliance = (g) => {
          if (!ourAllianceName && !ourAllianceId) return false;
          return (
            (ourAllianceName && g.alliance === ourAllianceName) ||
            (ourAllianceId && g.allianceId === ourAllianceId)
          );
        };

        const enemyGuilds = guildList
          .filter((g) => g.id !== GUILD_ID && !sameAlliance(g))
          .slice(0, 5);
        const mainEnemyGuild = enemyGuilds[0] || null;

        const enemyAlliances = allianceList
          .filter(
            (a) =>
              a.name !== ourAllianceName &&
              a.id !== ourAllianceId &&
              a.name
          )
          .slice(0, 5);
        const mainEnemyAlliance = enemyAlliances[0] || null;

        const alliedGuilds = guildList
          .filter((g) => g.id !== GUILD_ID && sameAlliance(g))
          .slice(0, 5);

        const ourK = ourGuild?.kills ?? 0;
        const ourD = ourGuild?.deaths ?? 0;
        let result = 'empate';
        if (ourK > ourD) result = 'victoria';
        else if (ourK < ourD) result = 'derrota';

        // Título principal: Alianza vs Alianza
        const matchup = {
          usLabel: ourAllianceName || ourGuild?.name || 'African Push',
          themLabel: mainEnemyAlliance?.name || mainEnemyGuild?.name || 'Enemigos',
          guildVsGuild: mainEnemyGuild
            ? `${ourGuild?.name || 'African Push'} vs ${mainEnemyGuild.name}`
            : `${ourGuild?.name || 'African Push'} vs varios`,
          allianceVsAlliance:
            ourAllianceName && mainEnemyAlliance
              ? `${ourAllianceName} vs ${mainEnemyAlliance.name}`
              : ourAllianceName
                ? `${ourAllianceName} vs varias`
                : null,
          alliesNote: alliedGuilds.length
            ? `Aliados en pelea: ${alliedGuilds.map((g) => g.name).join(', ')}`
            : null,
        };

        return {
          id: b.id ?? b.BattleId,
          startTime: b.startTime ?? b.StartTime,
          endTime: b.endTime ?? b.EndTime,
          clusterName: b.clusterName ?? null,
          totalFame: b.totalFame ?? b.TotalFame ?? 0,
          totalKills: b.totalKills ?? b.TotalKills ?? 0,
          playerCount: playerList.length,
          guildCount: guildList.length,
          allianceCount: allianceList.length,
          ourGuild,
          ourAlliance,
          mainEnemyGuild,
          mainEnemyAlliance,
          enemyGuilds,
          enemyAlliances,
          alliedGuilds,
          topAlliances: allianceList.slice(0, 8),
          matchup,
          result,
          topGuilds: guildList.slice(0, 8),
          ourPlayers,
          topPlayers,
        };
      })
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    res.json({
      fromCache,
      range: rangeUsed,
      sort: 'recent',
      cacheTtlSec: 60,
      count: battles.length,
      battles,
    });
  } catch (error) {
    sendError(res, error);
  }
});

function emptyEquipment() {
  return {
    MainHand: null,
    OffHand: null,
    Head: null,
    Armor: null,
    Shoes: null,
    Cape: null,
    Mount: null,
  };
}

function normalizeCombatant(player) {
  if (!player) return null;

  const equipment = player.Equipment ?? {};
  const slots = ['MainHand', 'OffHand', 'Head', 'Armor', 'Shoes', 'Cape', 'Mount'];

  const gear = emptyEquipment();
  for (const slot of slots) {
    const item = equipment[slot];
    gear[slot] = item
      ? {
          uniqueName: item.Type ?? item.UniqueName ?? null,
          quality: item.Quality ?? 0,
          count: item.Count ?? 1,
        }
      : null;
  }

  return {
    id: player.Id,
    name: player.Name,
    guildName: player.GuildName ?? null,
    guildId: player.GuildId ?? null,
    allianceName: player.AllianceName ?? null,
    averageItemPower: Math.round(player.AverageItemPower ?? 0),
    killFame: player.KillFame ?? 0,
    deathFame: player.DeathFame ?? 0,
    equipment: gear,
  };
}

// Producción: servir el frontend compilado (Vite -> frontend/dist)
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get(/^(?!\/api).*/, (req, res, next) => {
  if (req.method !== 'GET') return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`Albion Guild API listening on http://localhost:${PORT}`);
  console.log(`Guild ID: ${GUILD_ID}`);
  console.log(`Region server: ${ALBION_SERVER} (América West)`);
  console.log(`Cache TTL: ${CACHE_TTL}s`);
  console.log(`Frontend dist: ${frontendDist}`);
  console.log(`Example: ${buildAlbionUrl(`/guilds/${GUILD_ID}`)}`);
});

const API_BASE = '';

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  guildStats: () => request('/api/guild-stats'),
  guildMembers: () => request('/api/guild-members'),
  guildKills: () => request('/api/guild-kills'),
  guildBattles: () => request('/api/guild-battles'),
  guildBuilds: () => request('/api/guild-builds'),
};

export function itemImageUrl(uniqueName, quality = 0) {
  if (!uniqueName) return null;
  // URL oficial: no encodear @ del enchant (T6_2H_SWORD@3)
  const q = quality > 0 ? `?quality=${quality}` : '';
  return `https://render.albiononline.com/v1/item/${uniqueName}.png${q}`;
}

export function formatNumber(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-ES').format(Math.round(n));
}

export function formatCompact(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-ES', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}

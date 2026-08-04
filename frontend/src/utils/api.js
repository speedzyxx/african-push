const API_BASE = '';

function friendlyError(status, body = {}) {
  const detail = body.detail || body.error || '';
  if (
    status === 504 ||
    /504|timeout|gateway time-?out/i.test(detail)
  ) {
    return 'Albion está lento o caído (timeout). Espera 1–2 min y pulsa Actualizar.';
  }
  if (status === 429 || /rate.?limit/i.test(detail)) {
    return 'Demasiadas peticiones a Albion. Espera un momento y reintenta.';
  }
  if (status === 502 || /no se pudo obtener/i.test(detail)) {
    return detail.length < 200
      ? detail
      : 'Albion no responde ahora. Reintenta en unos minutos.';
  }
  // Evita pegar HTML de Cloudflare en la UI
  if (/<html|cloudflare|origin_gateway/i.test(detail)) {
    return 'Albion API no disponible temporalmente. Reintenta en 1–2 min.';
  }
  return detail || `HTTP ${status}`;
}

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(friendlyError(res.status, body));
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
  const abs = Math.abs(Number(n));
  const sign = n < 0 ? '-' : '';
  const fmt = (v) =>
    v.toLocaleString('es-ES', { maximumFractionDigits: 1, minimumFractionDigits: 0 });
  // Evita el "MIL M" raro del Intl compact en español
  if (abs >= 1e12) return `${sign}${fmt(abs / 1e12)} T`;
  if (abs >= 1e9) return `${sign}${fmt(abs / 1e9)} B`;
  if (abs >= 1e6) return `${sign}${fmt(abs / 1e6)} M`;
  if (abs >= 1e3) return `${sign}${fmt(abs / 1e3)} K`;
  return formatNumber(n);
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}

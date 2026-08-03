import { formatCompact, formatNumber } from '../utils/api';

const accents = {
  gold: 'border-l-[#ffd44d] shadow-[inset_4px_0_12px_rgba(255,212,77,0.08)]',
  kill: 'border-l-[#39ff14] shadow-[inset_4px_0_12px_rgba(57,255,20,0.08)]',
  death: 'border-l-[#ff3b6b]',
  mute: 'border-l-[#00f0ff] shadow-[inset_4px_0_12px_rgba(0,240,255,0.08)]',
  magenta: 'border-l-[#ff2bd6] shadow-[inset_4px_0_12px_rgba(255,43,214,0.1)]',
};

const valueColors = {
  gold: '#ffd44d',
  kill: '#39ff14',
  death: '#ff3b6b',
  mute: '#00f0ff',
  magenta: '#ff2bd6',
};

export default function StatCard({
  title,
  value,
  subtitle,
  accent = 'gold',
  delay = '',
  compact = false,
}) {
  return (
    <article
      className={`panel panel-glow rounded-lg border-l-4 ${accents[accent] || accents.mute} p-5 animate-fade-up ${delay}`}
    >
      <p className="text-xs tracking-[0.2em] uppercase text-[#8b9bb8] font-medium mb-2">
        {title}
      </p>
      <p
        className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold"
        style={{ color: valueColors[accent] || '#f4f7ff' }}
      >
        {compact ? formatCompact(value) : formatNumber(value)}
      </p>
      {subtitle ? <p className="mt-2 text-sm text-[#8b9bb8]">{subtitle}</p> : null}
    </article>
  );
}

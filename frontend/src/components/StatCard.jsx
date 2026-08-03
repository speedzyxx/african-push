import { formatCompact, formatNumber } from '../utils/api';

const accents = {
  gold: 'border-l-[#d4af37] shadow-[inset_4px_0_12px_rgba(212,175,55,0.12)]',
  kill: 'border-l-[#3ecf6e] shadow-[inset_4px_0_12px_rgba(62,207,110,0.1)]',
  death: 'border-l-[#c23b4a]',
  mute: 'border-l-[#a89b84]',
};

const valueColors = {
  gold: '#ffd700',
  kill: '#3ecf6e',
  death: '#c23b4a',
  mute: '#e8dcc3',
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
      className={`panel panel-glow rounded-lg border-l-4 ${accents[accent] || accents.gold} p-5 animate-fade-up ${delay}`}
    >
      <p className="text-xs tracking-[0.2em] uppercase text-[#a89b84] font-medium mb-2">
        {title}
      </p>
      <p
        className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold"
        style={{ color: valueColors[accent] || '#ffd700' }}
      >
        {compact ? formatCompact(value) : formatNumber(value)}
      </p>
      {subtitle ? <p className="mt-2 text-sm text-[#a89b84]">{subtitle}</p> : null}
    </article>
  );
}

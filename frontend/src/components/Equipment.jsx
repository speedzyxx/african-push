import { itemImageUrl } from '../utils/api';

const ALL_SLOTS = [
  { key: 'Head', label: 'Head' },
  { key: 'Cape', label: 'Cape' },
  { key: 'MainHand', label: 'Main' },
  { key: 'Armor', label: 'Armor' },
  { key: 'OffHand', label: 'Off' },
  { key: 'Shoes', label: 'Shoes' },
  { key: 'Mount', label: 'Mount' },
];

function isTwoHanded(uniqueName) {
  return typeof uniqueName === 'string' && uniqueName.includes('_2H_');
}

function Slot({ item, label }) {
  const url = item?.uniqueName ? itemImageUrl(item.uniqueName, item.quality) : null;
  if (!url) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="slot-frame w-14 h-14 md:w-16 md:h-16 rounded flex items-center justify-center overflow-hidden shadow-[0_0_12px_rgba(0,240,255,0.15)]">
        <img
          src={url}
          alt={item.uniqueName}
          title={item.uniqueName}
          className="w-full h-full object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
      <span className="text-[10px] uppercase tracking-wider text-[#a89b84]">{label}</span>
    </div>
  );
}

export default function Equipment({ player, side = 'killer' }) {
  if (!player) return null;

  const border =
    side === 'killer'
      ? 'border-[#3ecf6e]/40 shadow-[0_0_20px_rgba(62,207,110,0.1)]'
      : 'border-[#c23b4a]/40 shadow-[0_0_20px_rgba(194,59,74,0.1)]';
  const titleColor = side === 'killer' ? 'text-[#3ecf6e]' : 'text-[#c23b4a]';

  const twoHandedMain = isTwoHanded(player.equipment?.MainHand?.uniqueName);
  const slots = ALL_SLOTS.filter(({ key }) => {
    if (key === 'OffHand' && twoHandedMain) return false;
    return Boolean(player.equipment?.[key]?.uniqueName);
  });

  const filled = slots.length;

  return (
    <div className={`rounded-lg border ${border} bg-[#05060a]/80 p-4`}>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h4 className={`font-[family-name:var(--font-display)] text-sm ${titleColor}`}>
          {player.name}
        </h4>
        <span className="text-xs text-[#a89b84]">
          IP {player.averageItemPower} · {filled} ítems
          {twoHandedMain ? ' · 2H' : ''}
          {player.guildName ? ` · ${player.guildName}` : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
        {slots.map(({ key, label }) => (
          <Slot key={key} item={player.equipment?.[key]} label={label} />
        ))}
        {slots.length === 0 ? (
          <p className="text-sm text-[#5b6b88]">Sin equipo capturado en esta pelea</p>
        ) : null}
      </div>
    </div>
  );
}

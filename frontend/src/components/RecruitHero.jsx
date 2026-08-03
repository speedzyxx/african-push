import { MessageCircle, Swords, Users } from 'lucide-react';

const DISCORD_URL = 'https://discord.gg/HKWb7PPsXD';

export default function RecruitHero({ guildName = 'African Push', memberCount = 0 }) {
  return (
    <section className="panel panel-glow rounded-lg overflow-hidden animate-fade-up relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,215,0,0.18),transparent_55%)] pointer-events-none" />
      <div className="gold-line" />
      <div className="relative px-5 py-8 md:px-8 md:py-10 grid md:grid-cols-[1.4fr_auto] gap-6 items-center">
        <div>
          <p className="text-[11px] tracking-[0.35em] uppercase text-[#d4af37] mb-2">
            Reclutamiento abierto · América West
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl gold-text mb-3">
            Únete a {guildName}
          </h2>
          <p className="text-[#a89b84] max-w-xl text-base md:text-lg leading-relaxed">
            ZvZ, content y push constante. Si buscas gremio activo en América West,
            entra al Discord y habla con oficiales.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#c9b896]">
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#d4af37]" />
              {memberCount || '—'} miembros
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Swords className="w-4 h-4 text-[#d4af37]" />
              Alianza NULLE
            </span>
          </div>
        </div>

        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noreferrer"
          className="justify-self-start md:justify-self-end inline-flex items-center gap-3 px-6 py-3.5 rounded-lg
            bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#1a1408] font-bold uppercase tracking-wider
            shadow-[0_0_28px_rgba(255,215,0,0.35)] hover:brightness-110 transition"
        >
          <MessageCircle className="w-5 h-5" />
          Unirme por Discord
        </a>
      </div>
      <div className="gold-line" />
    </section>
  );
}

// src/components/auth/AuthBrandPanel.tsx

import { Logo } from './Logo';
import { StatsRow } from './StatsRow';
import { TrustLine } from './TrustLine';

export function AuthBrandPanel() {
  return (
    <aside className="hidden lg:flex flex-col relative z-10 w-[52%] xl:w-[55%] overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f1118] to-[#080a0f]" />

      {/* Decorative grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Diagonal separator on right edge */}
      <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-[#080a0f] to-transparent z-10" />

      {/* Decorative circles */}
      <DecorativeCircles />

      {/* Large background text */}
      <div className="absolute bottom-8 right-16 text-[220px] font-black text-white/[0.02] leading-none select-none tracking-tighter">
        ATS
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-14 xl:p-16">
        {/* Top - Logo */}
        <Logo />

        {/* Middle - Headline */}
        <BrandHeadline />

        {/* Bottom - Social proof */}
        <div className="space-y-6">
          <StatsRow />
          <TrustLine />
        </div>
      </div>
    </aside>
  );
}

// Sub-components
function DecorativeCircles() {
  return (
    <>
      <div className="absolute top-[15%] right-[12%] w-72 h-72 rounded-full border border-white/5" />
      <div className="absolute top-[15%] right-[12%] w-52 h-52 translate-x-10 translate-y-10 rounded-full border border-white/5" />
      <div className="absolute top-[15%] right-[12%] w-36 h-36 translate-x-20 translate-y-20 rounded-full border border-amber-400/10" />
      <div className="absolute top-[15%] right-[12%] w-16 h-16 translate-x-28 translate-y-28 rounded-full bg-amber-400/10 border border-amber-400/20" />
    </>
  );
}

function BrandHeadline() {
  return (
    <div className="my-auto pt-16">
      {/* Tag */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-6 h-px bg-amber-400" />
        <span className="text-amber-400 text-xs font-semibold tracking-[0.2em] uppercase">
          Recruitment Intelligence
        </span>
      </div>

      {/* Main headline */}
      <h1 className="text-[56px] xl:text-[68px] font-black leading-[0.95] tracking-[-0.03em] text-white mb-8">
        The hiring<br />
        platform that<br />
        <span className="relative inline-block">
          <span className="relative z-10 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            thinks ahead.
          </span>
          <span className="absolute bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400/60 to-transparent rounded-full" />
        </span>
      </h1>

      {/* Description */}
      <p className="text-slate-400 text-base leading-relaxed max-w-sm font-light">
        From first contact to signed offer — KGF HireX gives your team 
        the clarity and speed to hire the people who matter.
      </p>
    </div>
  );
}

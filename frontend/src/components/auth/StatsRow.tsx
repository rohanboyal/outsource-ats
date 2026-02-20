// src/components/auth/StatsRow.tsx

interface Stat {
  num: string;
  label: string;
}

const STATS: Stat[] = [
  { num: '12k+', label: 'Candidates tracked' },
  { num: '98%', label: 'Placement rate' },
  { num: '3×', label: 'Faster to hire' },
];

export function StatsRow() {
  return (
    <div className="flex items-stretch gap-0 rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.03]">
      {STATS.map((stat, index) => (
        <div
          key={stat.label}
          className={`flex-1 px-5 py-4 ${
            index < STATS.length - 1 ? 'border-r border-white/[0.06]' : ''
          }`}
        >
          <p className="text-2xl font-black text-amber-400 leading-none tracking-tight">
            {stat.num}
          </p>
          <p className="text-slate-500 text-[11px] mt-1 leading-tight">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}

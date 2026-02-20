// src/components/auth/TrustLine.tsx

const AVATAR_COLORS = ['bg-violet-500', 'bg-pink-500', 'bg-sky-500', 'bg-emerald-500'];

export function TrustLine() {
  return (
    <div className="flex items-center gap-3">
      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {AVATAR_COLORS.map((color, index) => (
          <div
            key={index}
            className={`w-8 h-8 rounded-full ${color} border-2 border-[#0f1118] flex items-center justify-center text-white text-[10px] font-bold`}
          >
            {String.fromCharCode(65 + index * 3)}
          </div>
        ))}
      </div>

      {/* Trust text */}
      <p className="text-slate-400 text-xs">
        Trusted by <span className="text-white font-semibold">500+ recruiters</span> worldwide
      </p>
    </div>
  );
}

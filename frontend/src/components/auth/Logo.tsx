// src/components/auth/Logo.tsx

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
}

export function Logo({ size = 'md', showSubtext = true }: LogoProps) {
  const sizes = {
    sm: { box: 'w-9 h-9', icon: 'w-4 h-4', text: 'text-xl' },
    md: { box: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-lg' },
    lg: { box: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-2xl' },
  };

  const { box, icon, text } = sizes[size];

  return (
    <div className="flex items-center gap-3">
      {/* Logo icon */}
      <div className={`relative ${box}`}>
        <div className="absolute inset-0 bg-amber-400 rounded-lg rotate-12 opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-300 to-amber-600 rounded-lg flex items-center justify-center">
          <svg className={`${icon} text-slate-900`} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        </div>
      </div>

      {/* Logo text */}
      <div>
        <p className={`text-white font-bold ${text} tracking-tight leading-none`}>
          KGF HireX
        </p>
        {showSubtext && (
          <p className="text-slate-500 text-[10px] tracking-widest uppercase mt-0.5">
            by Khuriwalgroup
          </p>
        )}
      </div>
    </div>
  );
}

// src/components/auth/FormHeader.tsx

interface FormHeaderProps {
  title?: string;
  subtitle?: string;
}

export function FormHeader({ title = 'Welcome back', subtitle = 'Recruiter Portal' }: FormHeaderProps) {
  return (
    <div className="mb-8">
      {/* Tag */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px w-8 bg-amber-400/60" />
        <span className="text-amber-400 text-[11px] font-semibold tracking-[0.18em] uppercase">
          {subtitle}
        </span>
      </div>

      {/* Title */}
      <h2 className="text-[32px] font-black text-white tracking-tight leading-none">
        {title}<span className="text-amber-400">.</span>
      </h2>

      {/* Decorative lines */}
      <div className="mt-3 flex items-center gap-2">
        <div className="h-[2px] w-10 rounded-full bg-amber-400" />
        <div className="h-[2px] w-4 rounded-full bg-amber-400/30" />
        <div className="h-[2px] w-2 rounded-full bg-amber-400/10" />
      </div>
    </div>
  );
}

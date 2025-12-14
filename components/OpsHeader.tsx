'use client';

type OpsHeaderProps = {
  title?: string;
  subtitle?: string;
};

export default function OpsHeader({
  title = 'Operations Center',
  subtitle = "Control room for today’s XPOT",
}: OpsHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Title block */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-1 text-base text-slate-400">
            {subtitle}
          </p>
        </div>

        {/* Right: Premium slogan */}
        <div className="xpot-ops-slogan">
          One protocol. One identity. One daily XPOT draw.
        </div>
      </div>
    </div>
  );
}

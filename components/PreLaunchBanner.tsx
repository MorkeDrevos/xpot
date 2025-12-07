export default function PreLaunchBanner() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center text-[11px] uppercase tracking-[0.3em] font-semibold select-none"
      style={{
        height: '36px',
        background: 'linear-gradient(90deg, #4c1d95, #7e22ce, #be185d)',
        color: '#ffffff',
        boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
        backdropFilter: 'blur(12px)'
      }}
    >
      PRE-LAUNCH MODE · XPOT TOKEN NOT DEPLOYED · BUILD v0.9.3
    </div>
  );
}

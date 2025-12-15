function OpsThemeSwitcher() {
  const [active, setActive] = useState<'nebula' | 'icy' | 'royal'>('nebula');

  useEffect(() => {
    const saved =
      typeof window !== 'undefined'
        ? (localStorage.getItem(THEME_KEY) as any)
        : null;

    const initial =
      saved === 'icy' || saved === 'royal' ? saved : 'nebula';

    setActive(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function select(theme: 'nebula' | 'icy' | 'royal') {
    setActive(theme);
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }

  return (
    <div className="hidden sm:flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
        Theme
      </span>

      <div className="inline-flex overflow-hidden rounded-full border border-white/10 bg-white/[0.03] backdrop-blur">
        {(['nebula', 'icy', 'royal'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => select(t)}
            className={[
              'h-8 px-3 text-[11px] font-semibold transition',
              active === t
                ? 'bg-white/[0.10] text-slate-50'
                : 'text-slate-300 hover:bg-white/[0.06]',
            ].join(' ')}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

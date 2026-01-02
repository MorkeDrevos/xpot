export type JackpotPanelProps = {
  isLocked?: boolean;
  onJackpotUsdChange?: (value: number | null) => void;

  // Visual variants
  variant?: 'standalone' | 'embedded';

  // Badge in header (eg "10+ year runway")
  badgeLabel?: string;
  badgeTooltip?: string;

  // Layout
  layout?: 'auto' | 'wide';
};

export type PriceSource = 'DexScreener';

export type PriceSample = { t: number; p: number };

export type DexMetrics = {
  priceUsd: number | null;
  changeH1: number | null;
};

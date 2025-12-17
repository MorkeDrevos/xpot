// app/components/MobileMenu.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Menu,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';

type MobileMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  external?: boolean;
};

type MobileMenuSection = {
  title?: string;
  links: MobileMenuLink[];
  collapsible?: boolean;
  defaultOpen?: boolean;
};

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;

  // Optional brand slot at top
  brand?: React.ReactNode;

  // Menu content
  sections: MobileMenuSection[];

  // Optional footer slot
  footer?: React.ReactNode;

  // Optional CA chip (mobile-only)
  officialCa?: string;
  priceUsd?: number | null;

  // Visual tweaks
  maxWidthClassName?: string;
};

function lockBodyScroll(locked: boolean) {
  if (typeof document === 'undefined') return;
  const body = document.body;
  if (locked) body.style.overflow = 'hidden';
  else body.style.overflow = '';
}

function shortenAddress(addr: string, left = 8, right = 6) {
  if (!addr) return '';
  if (addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

function formatUsd(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return '—';
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(6)}`;
}

export default function MobileMenu({
  open,
  onClose,
  brand,
  sections,
  footer,
  officialCa,
  priceUsd,
  maxWidthClassName = 'max-w-[520px]',
}: MobileMenuProps) {
  const pathname = usePathname() || '';
  const [copied, setCopied] = useState(false);

  // Close on route change
  useEffect(() => {
    if (!open) return;
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock scroll
  useEffect(() => {
    lockBodyScroll(open);
    return () => lockBodyScroll(false);
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const caShort = useMemo(() => (officialCa ? shortenAddress(officialCa, 10, 8) : ''), [officialCa]);

  async function handleCopyCa() {
    if (!officialCa) return;
    try {
      await navigator.clipboard.writeText(officialCa);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            className={`absolute right-0 top-0 h-full w-full ${maxWidthClassName} border-l border-white/10 bg-[linear-gradient(180deg,rgba(2,2,10,0.96),rgba(2,2,10,0.90))] shadow-[0_40px_120px_rgba(0,0,0,0.75)]`}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            role="dialog"
            aria-modal="true"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
              <div className="min-w-0">
                {brand ? (
                  brand
                ) : (
                  <div className="flex flex-col leading-none">
                    <span className="text-xs font-semibold text-white/90">XPOT</span>
                    <span className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/50">
                      Navigation
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-white/90" />
              </button>
            </div>

            {/* Optional CA chip (mobile only spot) */}
            {officialCa && (
              <div className="px-5 pt-4">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="pointer-events-none absolute -inset-10 opacity-50 blur-3xl bg-[radial-gradient(circle_at_18%_10%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(circle_at_86%_70%,rgba(56,189,248,0.12),transparent_60%)]" />
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30">
                          <ShieldCheck className="h-4 w-4 text-emerald-200" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-emerald-200/90">
                            Verified CA
                          </p>
                          <p className="mt-1 font-mono text-[12px] text-white/90 truncate">{caShort}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-white/55">
                        XPOT price: <span className="font-mono text-white/80">{formatUsd(priceUsd)}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCa}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                      aria-label="Copy CA"
                      title="Copy official contract address"
                    >
                      {copied ? (
                        <Check className="h-5 w-5 text-emerald-200" />
                      ) : (
                        <Copy className="h-5 w-5 text-white/90" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="h-[calc(100%-72px)] overflow-y-auto px-5 py-5">
              <div className="space-y-4">
                {sections.map((section, idx) => (
                  <SectionBlock key={idx} section={section} onNavigate={onClose} />
                ))}
              </div>

              {footer ? <div className="mt-6">{footer}</div> : null}
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SectionBlock({
  section,
  onNavigate,
}: {
  section: MobileMenuSection;
  onNavigate: () => void;
}) {
  const { title, links, collapsible = false, defaultOpen = true } = section;
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
        {title ? (
          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
              {title}
            </p>
          </div>
        ) : null}

        <div className="px-2 pb-2">
          {links.map((l) => (
            <MenuLink key={l.href + l.label} link={l} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
          {title || 'Menu'}
        </p>
        <ChevronDown className={`h-4 w-4 text-white/70 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2">
              {links.map((l) => (
                <MenuLink key={l.href + l.label} link={l} onNavigate={onNavigate} />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  link,
  onNavigate,
}: {
  link: MobileMenuLink;
  onNavigate: () => void;
}) {
  const base =
    'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm text-white/85 hover:bg-white/[0.06] transition';

  const left = (
    <span className="inline-flex items-center gap-3 min-w-0">
      {link.icon ? (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/25">
          {link.icon}
        </span>
      ) : null}
      <span className="truncate">{link.label}</span>
    </span>
  );

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noreferrer"
        className={base}
        onClick={onNavigate}
      >
        {left}
        <ExternalLink className="h-4 w-4 text-white/60" />
      </a>
    );
  }

  return (
    <Link href={link.href} className={base} onClick={onNavigate}>
      {left}
    </Link>
  );
}

// Optional helper button you can use in TopBar
export function MobileMenuButton({
  onClick,
  label = 'Menu',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.06]"
      aria-label={label}
    >
      <Menu className="h-5 w-5" />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

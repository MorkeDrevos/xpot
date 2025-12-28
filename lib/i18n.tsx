'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'en' | 'sv';

type Dict = Record<string, string>;

const DICTS: Record<Lang, Dict> = {
  en: {
    // Topbar
    'nav.hub': 'Hub',
    'nav.live': 'Live',
    'nav.learn': 'Learn',
    'nav.finalDraw': 'Final Draw',
    'nav.tokenomics': 'Tokenomics',
    'nav.roadmap': 'Roadmap',
    'nav.winners': 'Winners',
    'nav.mechanism': 'Mechanism',
    'nav.officialX': 'Official X',
    'nav.x': 'X',

    // Public right
    'cta.enterToday': "Enter today's XPOT →",

    // CA / status chip
    'status.title': 'Status',
    'status.verified': 'VERIFIED',
    'status.officialContract': 'OFFICIAL CONTRACT',
    'status.copy': 'Copy',
    'status.copied': 'Copied',
    'status.health': 'Health',
    'status.helper': 'Verified contract and protocol status live in one place.',

    // Wallet button
    'wallet.select': 'Select wallet',
    'wallet.linked': 'Wallet linked',
    'wallet.change': 'Change wallet',
    'wallet.ticket': 'TICKET',
    'wallet.winner': 'WINNER',

    // Wallet modal
    'walletModal.title': 'CONNECT WALLET',
    'walletModal.headline': 'Select a wallet to enter XPOT',
    'walletModal.sub': 'Fast, simple, and clean. You can change it anytime.',
    'walletModal.connected': 'Wallet connected',
    'walletModal.none': 'No wallet connected',
    'walletModal.chooseBelow': 'Choose a wallet below',
    'walletModal.disconnect': 'Disconnect',
    'walletModal.active': 'Active',
    'walletModal.installed': 'Installed',
    'walletModal.available': 'Available',
    'walletModal.connect': 'Connect',
    'walletModal.connecting': 'Connecting',
    'walletModal.eligibility': 'Wallet connection is required for eligibility verification.',
    'walletModal.waiting': 'Waiting for wallet approval...',
    'walletModal.errDefault': 'Could not connect wallet. Please try again.',

    // Mobile
    'mobile.menu': 'Menu',
    'mobile.guest': 'Guest',
    'auth.logout': 'Log out',

    // Lang
    'lang.label': 'Language',
    'lang.en': 'English',
    'lang.sv': 'Swedish',
  },

  sv: {
    // Topbar
    'nav.hub': 'Hub',
    'nav.live': 'Live',
    'nav.learn': 'Lär dig',
    'nav.finalDraw': 'Sista dragningen',
    'nav.tokenomics': 'Tokenomics',
    'nav.roadmap': 'Roadmap',
    'nav.winners': 'Vinnare',
    'nav.mechanism': 'Mekanism',
    'nav.officialX': 'Officiell X',
    'nav.x': 'X',

    // Public right
    'cta.enterToday': 'Gå med i dagens XPOT →',

    // CA / status chip
    'status.title': 'Status',
    'status.verified': 'VERIFIERAD',
    'status.officialContract': 'OFFICIELLT KONTRAKT',
    'status.copy': 'Kopiera',
    'status.copied': 'Kopierat',
    'status.health': 'Hälsa',
    'status.helper': 'Verifierat kontrakt och protokollstatus på ett ställe.',

    // Wallet button
    'wallet.select': 'Välj plånbok',
    'wallet.linked': 'Plånbok länkad',
    'wallet.change': 'Byt plånbok',
    'wallet.ticket': 'BILJETT',
    'wallet.winner': 'VINNARE',

    // Wallet modal
    'walletModal.title': 'ANSLUT PLÅNBOK',
    'walletModal.headline': 'Välj en plånbok för att gå med i XPOT',
    'walletModal.sub': 'Snabbt, enkelt och rent. Du kan byta när som helst.',
    'walletModal.connected': 'Plånbok ansluten',
    'walletModal.none': 'Ingen plånbok ansluten',
    'walletModal.chooseBelow': 'Välj en plånbok nedan',
    'walletModal.disconnect': 'Koppla från',
    'walletModal.active': 'Aktiv',
    'walletModal.installed': 'Installerad',
    'walletModal.available': 'Tillgänglig',
    'walletModal.connect': 'Anslut',
    'walletModal.connecting': 'Ansluter',
    'walletModal.eligibility': 'Plånboksanslutning krävs för behörighetskontroll.',
    'walletModal.waiting': 'Väntar på godkännande i plånboken...',
    'walletModal.errDefault': 'Kunde inte ansluta plånboken. Försök igen.',

    // Mobile
    'mobile.menu': 'Meny',
    'mobile.guest': 'Gäst',
    'auth.logout': 'Logga ut',

    // Lang
    'lang.label': 'Språk',
    'lang.en': 'Engelska',
    'lang.sv': 'Svenska',
  },
};

const STORAGE_KEY = 'xpot_lang_v1';

function guessInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('sv')) return 'sv';
  return 'en';
}

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === 'en' || stored === 'sv') setLangState(stored);
      else setLangState(guessInitialLang());
    } catch {
      setLangState(guessInitialLang());
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  }, []);

  const t = useCallback(
    (key: string) => {
      const dict = DICTS[lang] || DICTS.en;
      return dict[key] ?? DICTS.en[key] ?? key;
    },
    [lang],
  );

  const value = useMemo<I18nCtx>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fail-safe: avoid runtime crash if provider missing.
    return {
      lang: 'en' as Lang,
      setLang: (_l: Lang) => {},
      t: (k: string) => DICTS.en[k] ?? k,
    };
  }
  return ctx;
}

/**
 * Small premium switcher chip (safe to use in topbar).
 * You can restyle later without touching logic.
 */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="
          inline-flex items-center gap-2 rounded-full
          border border-white/10 bg-white/[0.03]
          px-4 py-2 text-[12px] font-semibold text-slate-100
          hover:bg-white/[0.06]
        "
        aria-haspopup="menu"
        aria-expanded={open}
        title={t('lang.label')}
      >
        <span className="opacity-80">{lang.toUpperCase()}</span>
        <span className="h-1 w-1 rounded-full bg-white/30" />
        <span className="opacity-70">{t(lang === 'en' ? 'lang.en' : 'lang.sv')}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[90] cursor-default"
            aria-label="Close language menu"
            onMouseDown={() => setOpen(false)}
          />

          <div className="absolute right-0 z-[91] mt-3 w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
            <div className="p-2">
              <button
                type="button"
                onClick={() => {
                  setLang('en');
                  setOpen(false);
                }}
                className={`w-full rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-white/[0.06] ${
                  lang === 'en' ? 'text-white' : 'text-slate-200'
                }`}
              >
                {t('lang.en')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLang('sv');
                  setOpen(false);
                }}
                className={`w-full rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-white/[0.06] ${
                  lang === 'sv' ? 'text-white' : 'text-slate-200'
                }`}
              >
                {t('lang.sv')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

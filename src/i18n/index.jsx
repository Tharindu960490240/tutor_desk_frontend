import { createContext, useContext, useMemo } from "react";
import base from "./base.json";
import extra from "./extra.js";

export const LANGS = ["en", "si", "ta"];
export const LANG_NAMES = base.LANG_NAMES;
export const DEFAULT_TPL = base.DEFAULT_TPL;
const L = { ...base.L, ...extra };

export function tl(lg, k, v) {
  const row = v && v.n === 1 && L[k + "_1"] ? L[k + "_1"] : L[k];
  if (!row) return k;
  const s = row[LANGS.indexOf(lg)] || row[0];
  return v ? s.replace(/\{(\w+)\}/g, (m, x) => (x in v ? v[x] : m)) : s;
}

export const monthName = (m, lg) => base.MONTHS_L[lg][m];
export const monthLabel = (ym, lg) => `${monthName(+ym.slice(5) - 1, lg)} ${ym.slice(0, 4)}`;
export const dayLong = (i, lg) => base.DAYS_LONG_L[lg][i];
export const dayShort = (i, lg) => base.DAYS_SHORT_L[lg][i];
export const dayLetter = (i, lg) => base.DAYS_1_L[lg][i];
export const longDateIn = (s, lg) => { const [y, m, d] = s.split("-").map(Number); return `${d} ${monthName(m - 1, lg)} ${y}`; };

export function guessLang() {
  try { const saved = localStorage.getItem("td-lang"); if (LANGS.includes(saved)) return saved; } catch { /* ignore */ }
  const n = (navigator.language || "").toLowerCase();
  return n.startsWith("si") ? "si" : n.startsWith("ta") ? "ta" : "en";
}

const Ctx = createContext(null);

export function I18nProvider({ lang, children }) {
  const value = useMemo(() => {
    const lg = LANGS.includes(lang) ? lang : "en";
    const parseD = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
    return {
      lang: lg,
      t: (k, v) => tl(lg, k, v),
      monthLabel: ym => monthLabel(ym, lg),
      monthOnly: ym => monthName(+ym.slice(5) - 1, lg),
      dayLong: i => dayLong(i, lg),
      dayShort: i => dayShort(i, lg),
      dayLetter: i => dayLetter(i, lg),
      shortDate: s => { const d = parseD(s); const mn = monthName(d.getMonth(), lg); return `${dayShort(d.getDay(), lg)} ${d.getDate()} ${lg === "en" ? mn.slice(0, 3) : mn}`; },
      longDate: s => { const d = parseD(s); return `${d.getDate()} ${monthName(d.getMonth(), lg)} ${d.getFullYear()}`; },
    };
  }, [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);

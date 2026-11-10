// Same rules as the AFC portal (utils/validation): 8+ chars, upper, lower, number, one of @$!%*?&
export const PASSWORD_RULES = [
  { key: "pr_length", test: v => v.length >= 8 },
  { key: "pr_upper", test: v => /[A-Z]/.test(v) },
  { key: "pr_lower", test: v => /[a-z]/.test(v) },
  { key: "pr_number", test: v => /\d/.test(v) },
  { key: "pr_special", test: v => /[@$!%*?&]/.test(v) },
];
export const isStrongPassword = v => PASSWORD_RULES.every(r => r.test(v || ""));
export const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || "").trim());
export const isName = v => (v || "").trim().length >= 2;

/* ---------- password strength (guidance only; the 5 rules above are what the server enforces) ---------- */
const COMMON = ["password", "passw0rd", "123456", "12345678", "qwerty", "abc123", "111111", "letmein", "welcome", "admin", "tutor", "tutordesk", "iloveyou", "sri lanka", "srilanka", "colombo"];

/**
 * Returns { level: 0–5, met, common }.
 * 0 empty · 1 very weak · 2 weak · 3 fair · 4 good (all rules) · 5 strong (all rules + 12 or more characters).
 * hints = words the password shouldn't contain, e.g. the person's name and email.
 */
export function passwordStrength(v, hints = []) {
  v = v || "";
  if (!v) return { level: 0, met: 0, common: false };
  const met = PASSWORD_RULES.filter(r => r.test(v)).length;
  const low = v.toLowerCase();
  const words = hints.flatMap(h => String(h || "").toLowerCase().split(/[\s@._-]+/)).filter(w => w.length >= 3);
  const common = COMMON.some(w => low.includes(w)) || words.some(w => low.includes(w));
  const repeats = /(.)\1\1/.test(v) || /(?:0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/i.test(v);
  let level = met === 5 ? (v.length >= 12 ? 5 : 4) : met >= 4 ? 3 : met >= 2 ? 2 : 1;
  if (repeats) level -= 1;
  if (common) level = Math.min(level, 2);
  return { level: Math.max(1, level), met, common, repeats };
}

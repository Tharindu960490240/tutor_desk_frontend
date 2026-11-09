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

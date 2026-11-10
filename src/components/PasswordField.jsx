import { useState } from "react";
import { Box, IconButton, InputAdornment, TextField, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useI18n } from "../i18n/index.jsx";
import { PASSWORD_RULES, passwordStrength } from "../lib/validation.js";
import { tones } from "./common.jsx";
import { CheckCircleRounded, LockRounded, RadioButtonUncheckedRounded, VisibilityOffRounded, VisibilityRounded } from "../icons.jsx";

/** Password input with a lock icon and a show/hide toggle (AFC PasswordField) */
export default function PasswordField({ showToggle = true, slotProps, ...props }) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <TextField type={show ? "text" : "password"} {...props}
      slotProps={{
        ...slotProps,
        input: {
          startAdornment: <InputAdornment position="start"><LockRounded fontSize="small" /></InputAdornment>,
          endAdornment: showToggle ? (
            <InputAdornment position="end">
              <Tooltip title={show ? t("hide_pw") : t("show_pw")}>
                <IconButton edge="end" onClick={() => setShow(s => !s)} onMouseDown={e => e.preventDefault()} aria-label={show ? t("hide_pw") : t("show_pw")}>
                  {show ? <VisibilityOffRounded /> : <VisibilityRounded />}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ) : undefined,
        },
      }} />
  );
}

const LEVELS = [null, "pw_s1", "pw_s2", "pw_s3", "pw_s4", "pw_s5"];

/** Strength bar + live checklist so people see how strong the password is and which rule is missing. */
export function PasswordRules({ value, hints = [] }) {
  const { t } = useI18n();
  const theme = useTheme(), k = tones(theme);
  const v = value || "";
  const s = passwordStrength(v, hints);
  const colors = [k.outline, k.bad, k.bad, k.warn, k.good, k.good];
  const color = colors[s.level];
  const tip = !v ? null : s.common ? "pw_tip_common" : s.repeats ? "pw_tip_pattern" : s.level === 4 ? "pw_tip_longer" : null;
  return (
    <Box sx={{ bgcolor: k.surface2, border: `1px solid ${k.outlineVariant}`, borderRadius: 3, px: 2, py: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1, mb: 1 }}>
        <Box sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary" }}>{t("pw_rules_title")}</Box>
        {s.level > 0 && (
          <Box aria-live="polite" sx={{ fontSize: 12.5, fontWeight: 700, color, whiteSpace: "nowrap" }}>
            {t("pw_strength")}: {t(LEVELS[s.level])}
          </Box>
        )}
      </Box>
      <Box role="meter" aria-label={t("pw_strength")} aria-valuemin={0} aria-valuemax={5} aria-valuenow={s.level}
        aria-valuetext={s.level ? t(LEVELS[s.level]) : ""} sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0.5, mb: 1.25 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Box key={i} sx={{ height: 5, borderRadius: 3, bgcolor: i <= s.level ? color : k.surface3, transition: "background-color .25s" }} />
        ))}
      </Box>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 2, rowGap: 0.5 }}>
        {PASSWORD_RULES.map(r => {
          const ok = r.test(v);
          return (
            <Box key={r.key} component="li" className={`password-rule ${ok ? "ok" : ""}`}
              sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 13, color: ok ? k.good : "text.secondary", fontWeight: ok ? 600 : 400, transition: "color .2s",
                ...(r.key === "pr_special" ? { gridColumn: { sm: "1 / -1" } } : {}) }}>
              {ok ? <CheckCircleRounded sx={{ fontSize: 17 }} /> : <RadioButtonUncheckedRounded sx={{ fontSize: 17 }} />}
              {t(r.key)}
              <Box component="span" sx={{ position: "absolute", width: "1px", height: "1px", m: "-1px", p: 0, border: 0, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{ok ? " ✓" : ""}</Box>
            </Box>
          );
        })}
      </Box>
      {tip && <Box sx={{ mt: 1, fontSize: 12.5, color: s.common || s.repeats ? k.warn : "text.secondary" }}>{t(tip)}</Box>}
    </Box>
  );
}

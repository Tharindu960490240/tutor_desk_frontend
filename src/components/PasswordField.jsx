import { useState } from "react";
import { Box, IconButton, InputAdornment, TextField, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useI18n } from "../i18n/index.jsx";
import { PASSWORD_RULES } from "../lib/validation.js";
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

/** Live checklist so people see which password rule is missing (AFC PasswordRules) */
export function PasswordRules({ value }) {
  const { t } = useI18n();
  const theme = useTheme(), k = tones(theme);
  return (
    <Box aria-live="polite" sx={{ bgcolor: k.surface2, borderRadius: 3, px: 1.75, py: 1.25 }}>
      <Box sx={{ fontSize: 12.5, fontWeight: 600, color: "text.secondary", mb: 0.75 }}>{t("pw_rules_title")}</Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {PASSWORD_RULES.map(r => {
          const ok = r.test(value || "");
          return (
            <Box key={r.key} component="span" className={`password-rule ${ok ? "ok" : ""}`}
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: 12.5, fontWeight: 500, px: 1, py: 0.4, borderRadius: 2,
                bgcolor: ok ? k.goodBg : "transparent", color: ok ? k.good : "text.secondary", border: `1px solid ${ok ? "transparent" : k.outlineVariant}`, transition: "all .2s" }}>
              {ok ? <CheckCircleRounded sx={{ fontSize: 15 }} /> : <RadioButtonUncheckedRounded sx={{ fontSize: 15 }} />}
              {t(r.key)}
              <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{ok ? " ✓" : ""}</Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

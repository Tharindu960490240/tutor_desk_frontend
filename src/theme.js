import { createTheme, alpha } from "@mui/material/styles";

// Logo / brand word only.
export const display = '"Outfit","Inter","Noto Sans Sinhala","Noto Sans Tamil",system-ui,sans-serif';
// Everything else: Inter, like the AFC portal, with Sinhala / Tamil fallbacks.
const body = '"Inter","Noto Sans Sinhala","Noto Sans Tamil",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif';

/*
 * Same design language as the AFC agent portal:
 * light grey page, white header + side menu, white cards with a hairline border and soft shadow,
 * gradient primary buttons, outlined secondary buttons, rounded badges.
 * TutorDesk keeps its own blue, with the logo's amber as the accent bar on the active menu item.
 */
const tokens = {
  light: {
    primary: "#0277bd", primary2: "#1e9be6", onPrimary: "#ffffff", primaryContainer: "#e1effa", onPrimaryContainer: "#01579b",
    accent: "#f5a623",
    bg: "#f4f7fb", surface: "#ffffff", surface2: "#f6f9fc", surface3: "#eef4fa",
    outline: "#d3dce6", outlineVariant: "rgba(0,0,0,.07)", text: "#1a202c", text2: "#5b6474",
    good: "#15803d", goodBg: "rgba(22,163,74,.14)", warn: "#b45309", warnBg: "rgba(217,119,6,.16)", bad: "#c4161b", badBg: "rgba(237,31,36,.12)",
    shadow: "0 4px 15px rgba(0,0,0,.06)",
  },
  dark: {
    primary: "#6cbcf5", primary2: "#8fd0ff", onPrimary: "#04223a", primaryContainer: "#1e2b3a", onPrimaryContainer: "#9fd3ff",
    accent: "#f5b84a",
    bg: "#020617", surface: "#111827", surface2: "#151d2b", surface3: "#1d2635",
    outline: "#334155", outlineVariant: "rgba(255,255,255,.08)", text: "#e5e7eb", text2: "#a3acba",
    good: "#4ade80", goodBg: "rgba(74,222,128,.14)", warn: "#fbbf24", warnBg: "rgba(251,191,36,.14)", bad: "#f87171", badBg: "rgba(248,113,113,.14)",
    shadow: "0 4px 15px rgba(0,0,0,.35)",
  },
};

export function makeTheme(mode) {
  const k = tokens[mode];
  const grad = `linear-gradient(135deg, ${k.primary} 0%, ${k.primary2} 100%)`;
  return createTheme({
    palette: {
      mode,
      primary: { main: k.primary, contrastText: k.onPrimary },
      secondary: { main: k.primaryContainer, contrastText: k.onPrimaryContainer },
      success: { main: k.good }, warning: { main: k.warn }, error: { main: k.bad },
      background: { default: k.bg, paper: k.surface },
      text: { primary: k.text, secondary: k.text2 },
      divider: k.outlineVariant,
      tones: k,
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: body,
      h1: { fontWeight: 700 }, h2: { fontWeight: 700 }, h3: { fontWeight: 700 },
      h4: { fontWeight: 700, fontSize: 28, letterSpacing: "-.015em" },
      h5: { fontWeight: 700, fontSize: 20, letterSpacing: "-.01em" },
      h6: { fontWeight: 700, fontSize: 17, lineHeight: 1.35 },
      subtitle2: { fontWeight: 600 },
      body1: { fontSize: 14.5 },
      body2: { fontSize: 13.5, lineHeight: 1.5 },
      button: { textTransform: "none", fontWeight: 700, letterSpacing: 0 },
    },
    components: {
      MuiCssBaseline: { styleOverrides: { body: { WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }, ".num": { fontVariantNumeric: "tabular-nums" } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { borderRadius: 14, border: `1px solid ${k.outlineVariant}`, boxShadow: k.shadow } },
      },
      MuiCardContent: { styleOverrides: { root: { padding: 16, "&:last-child": { paddingBottom: 16 }, "@media (min-width:600px)": { padding: 20, "&:last-child": { paddingBottom: 20 } } } } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 8, paddingInline: 18, minHeight: 40, fontSize: 14 },
          sizeSmall: { minHeight: 34, paddingInline: 14, fontSize: 13.5 },
          containedPrimary: {
            background: grad, color: k.onPrimary, boxShadow: `0 2px 6px ${alpha(k.primary, 0.28)}`,
            "&:hover": { background: grad, filter: "brightness(1.08)", boxShadow: `0 3px 10px ${alpha(k.primary, 0.35)}` },
          },
          outlined: { borderWidth: 1.5, backgroundColor: k.surface, "&:hover": { borderWidth: 1.5 } },
          outlinedPrimary: { borderColor: k.primary, "&:hover": { backgroundColor: k.primary, color: k.onPrimary } },
          outlinedError: { "&:hover": { backgroundColor: k.bad, color: "#fff" } },
        },
        variants: [{ props: { variant: "tonal" }, style: { background: k.primaryContainer, color: k.onPrimaryContainer, "&:hover": { background: alpha(k.primary, 0.18) } } }],
      },
      MuiIconButton: { styleOverrides: { root: { "&:hover": { backgroundColor: k.surface3 } } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 999, fontWeight: 600 } } },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 14, backgroundColor: k.surface, border: `1px solid ${k.outlineVariant}`, boxShadow: "0 20px 50px rgba(0,0,0,.18)",
            "@media (max-width:599.95px)": { margin: 12, width: "calc(100% - 24px)", maxWidth: "calc(100% - 24px) !important", maxHeight: "calc(100% - 24px)" },
          },
        },
      },
      MuiDialogTitle: { styleOverrides: { root: { fontWeight: 700, fontSize: 18, padding: "16px 24px", "@media (max-width:599.95px)": { padding: "14px 16px" } } } },
      MuiDialogContent: { styleOverrides: { root: { padding: "20px 24px !important", "@media (max-width:599.95px)": { padding: "16px !important" }, borderTop: `1px solid ${k.outlineVariant}`, borderBottom: `1px solid ${k.outlineVariant}` } } },
      MuiDialogActions: { styleOverrides: { root: { padding: "14px 24px 18px", gap: 6, flexWrap: "wrap", "@media (max-width:599.95px)": { padding: "12px 16px 14px" } } } },
      // Compact form fields everywhere: text fields, dropdowns, date/time pickers
      MuiTextField: { defaultProps: { size: "small" } },
      MuiSelect: { defaultProps: { size: "small" } },
      MuiFormControl: { defaultProps: { size: "small" } },
      MuiInputBase: { styleOverrides: { input: { fontSize: 14 } } },
      MuiInputLabel: { styleOverrides: { root: { fontSize: 14, color: k.text2 } } },
      MuiFormHelperText: { styleOverrides: { root: { marginTop: 3, marginLeft: 4, fontSize: 12 } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 8, backgroundColor: k.surface, "&:hover:not(.Mui-focused):not(.Mui-error) .MuiOutlinedInput-notchedOutline": { borderColor: k.primary } },
          notchedOutline: { borderColor: k.outline },
        },
      },
      MuiFab: { styleOverrides: { root: { borderRadius: 12, textTransform: "none", fontWeight: 700, background: grad, color: k.onPrimary, boxShadow: `0 6px 16px ${alpha(k.primary, 0.3)}`, "&:hover": { background: grad, filter: "brightness(1.08)" } } } },
      MuiToggleButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, "&.Mui-selected": { backgroundColor: k.primaryContainer, color: k.onPrimaryContainer } } } },
      MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: "3px 3px 0 0" } } },
      MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, minHeight: 46, fontSize: 14 } } },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: `1px solid ${k.outlineVariant}`, padding: "12px 14px", fontSize: 14 },
          head: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: k.text2, backgroundColor: k.surface3, whiteSpace: "nowrap" },
        },
      },
      MuiTableRow: { styleOverrides: { root: { "&.MuiTableRow-hover:hover": { backgroundColor: k.surface2 } } } },
      MuiTooltip: { styleOverrides: { tooltip: { fontSize: 12, borderRadius: 6 } } },
      MuiMenu: { styleOverrides: { paper: { borderRadius: 12, border: `1px solid ${k.outlineVariant}`, boxShadow: "0 4px 12px rgba(0,0,0,.15)" } } },
      MuiMenuItem: { styleOverrides: { root: { fontSize: 14, minHeight: 42, "&:hover": { backgroundColor: k.surface3, color: k.onPrimaryContainer } } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4 } } },
      MuiBottomNavigationAction: { styleOverrides: { root: { minWidth: 0, paddingInline: 2 } } },
      MuiListItemButton: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiAvatar: { styleOverrides: { root: { fontWeight: 600 } } },
    },
  });
}

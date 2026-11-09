import { createTheme, alpha } from "@mui/material/styles";

export const display = '"Outfit","Noto Sans Sinhala","Noto Sans Tamil",system-ui,sans-serif';
const body = '"Roboto","Noto Sans Sinhala","Noto Sans Tamil",system-ui,sans-serif';

// Material 3 inspired tonal palette (light-blue seed), tuned for both schemes.
const tokens = {
  light: {
    primary: "#0277bd", onPrimary: "#ffffff", primaryContainer: "#d4ecfd", onPrimaryContainer: "#00344f",
    bg: "#f5f9fc", surface: "#ffffff", surface2: "#edf4f9", surface3: "#e1ecf4",
    outline: "#b9c8d3", outlineVariant: "#dce6ed", text: "#15212b", text2: "#4b5c6a",
    good: "#17784a", goodBg: "#d9f2e4", warn: "#8f5b00", warnBg: "#fcecc9", bad: "#b3261e", badBg: "#fbe0dc",
  },
  dark: {
    primary: "#8dcfff", onPrimary: "#00344f", primaryContainer: "#00496c", onPrimaryContainer: "#cbe7ff",
    bg: "#0e1418", surface: "#151c21", surface2: "#1b242b", surface3: "#22303a",
    outline: "#43525d", outlineVariant: "#2a3640", text: "#e0e8ee", text2: "#a3b3bf",
    good: "#7ad6a2", goodBg: "#16382a", warn: "#f3c368", warnBg: "#3a2c10", bad: "#ffb4ab", badBg: "#45201c",
  },
};

export function makeTheme(mode) {
  const k = tokens[mode];
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
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: body,
      h1: { fontFamily: display, fontWeight: 600 }, h2: { fontFamily: display, fontWeight: 600 },
      h3: { fontFamily: display, fontWeight: 600 }, h4: { fontFamily: display, fontWeight: 600, fontSize: 28 },
      h5: { fontFamily: display, fontWeight: 600, fontSize: 22 }, h6: { fontFamily: display, fontWeight: 600, fontSize: 18 },
      button: { textTransform: "none", fontWeight: 500 },
    },
    components: {
      MuiCssBaseline: { styleOverrides: { body: { WebkitFontSmoothing: "antialiased" }, ".num": { fontVariantNumeric: "tabular-nums" } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { borderRadius: 20, border: `1px solid ${k.outlineVariant}`, boxShadow: mode === "light" ? "0 1px 2px rgba(10,40,60,.06),0 2px 8px rgba(10,40,60,.05)" : "none" } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 20, paddingInline: 18, minHeight: 40 }, sizeSmall: { minHeight: 34, paddingInline: 14 } },
        variants: [{ props: { variant: "tonal" }, style: { background: k.primaryContainer, color: k.onPrimaryContainer, "&:hover": { background: alpha(k.primaryContainer, 0.85) } } }],
      },
      MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 28, backgroundColor: k.surface } } },
      MuiDialogTitle: { styleOverrides: { root: { fontFamily: display, fontWeight: 600, fontSize: 22 } } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiFab: { styleOverrides: { root: { borderRadius: 16, textTransform: "none", fontWeight: 600, boxShadow: "0 3px 10px rgba(2,80,130,.3)" } } },
      MuiToggleButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 500 } } },
      MuiSnackbarContent: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiBottomNavigationAction: { styleOverrides: { root: { minWidth: 0, paddingInline: 2 } } },
      MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 500, minHeight: 48 } } },
      MuiListItemButton: { styleOverrides: { root: { borderRadius: 14 } } },
    },
  });
}

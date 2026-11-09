import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { makeTheme } from "./theme.js";
import { ModeProvider } from "./state/ui.jsx";
import { AuthProvider } from "./state/data.jsx";
import App from "./App.jsx";

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } } });

function Themed({ mode, children }) {
  const theme = useMemo(() => makeTheme(mode), [mode]);
  return <ThemeProvider theme={theme}><CssBaseline enableColorScheme />{children}</ThemeProvider>;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <ModeProvider render={(mode, children) => <Themed mode={mode}>{children}</Themed>}>
        <AuthProvider><App /></AuthProvider>
      </ModeProvider>
    </QueryClientProvider>
  </StrictMode>
);

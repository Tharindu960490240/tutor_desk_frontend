import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import { I18nProvider, guessLang, tl } from "./i18n/index.jsx";
import { useAuth, useBoot } from "./state/data.jsx";
import { DialogHost, SnackProvider, LoadingProvider } from "./state/ui.jsx";
import { InlineLoader } from "./components/LoadingSpinner.jsx";
import Layout from "./components/Layout.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Home from "./pages/Home.jsx";
import Students from "./pages/Students.jsx";
import Classes from "./pages/Classes.jsx";
import Attendance from "./pages/Attendance.jsx";
import Fees from "./pages/Fees.jsx";
import Reminders from "./pages/Reminders.jsx";
import Settings from "./pages/Settings.jsx";
import Privacy from "./pages/Privacy.jsx";
import Admin from "./pages/Admin.jsx";
import Auth, { ResetPassword } from "./pages/Auth.jsx";
import { CloudOffRounded } from "./icons.jsx";

export default function App() {
  const { token } = useAuth();
  const boot = useBoot();
  const [preLang, setPreLang] = useState(guessLang);
  const lang = boot.data?.settings?.lang || preLang;
  const setLang = l => { setPreLang(l); try { localStorage.setItem("td-lang", l); } catch { /* ignore */ } };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  let app;
  if (!token) app = <Auth setLang={setLang} />;
  else if (boot.isPending) app = <InlineLoader />;
  else if (boot.isError) app = (
    <Box sx={{ textAlign: "center", py: 10, px: 2 }}>
      <CloudOffRounded sx={{ fontSize: 48, color: "primary.main" }} />
      <Typography variant="h6" sx={{ mt: 1 }}>{tl(lang, "err_title")}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{tl(lang, "err_p")}</Typography>
      <Button variant="contained" onClick={() => boot.refetch()}>{tl(lang, "try_again")}</Button>
    </Box>
  );
  else app = (
    <DialogHost>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="students" element={<Students />} />
          <Route path="classes" element={<Classes />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="fees" element={<Fees />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={boot.data?.user?.isAdmin ? <Admin /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </DialogHost>
  );
  return (
    <I18nProvider lang={lang}>
      <ErrorBoundary lang={lang}>
       <SnackProvider>
        <LoadingProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/reset-password" element={<ResetPassword setLang={setLang} />} />
            <Route path="*" element={app} />
          </Routes>
        </BrowserRouter>
        </LoadingProvider>
       </SnackProvider>
      </ErrorBoundary>
    </I18nProvider>
  );
}

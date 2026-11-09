import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { LogoMark } from "../components/Logo.jsx";
import { useI18n } from "../i18n/index.jsx";
import { useAuthConfig } from "../state/data.jsx";
import { ArrowBackRounded } from "../icons.jsx";

export default function Privacy() {
  const { t, longDate } = useI18n(); const nav = useNavigate();
  const cfg = useAuthConfig().data;
  const c = cfg?.contactEmail || t("the_organiser");
  return (
    <Box sx={{ minHeight: "100dvh", py: { xs: 2, sm: 5 }, px: 2, bgcolor: "background.default" }}>
      <Card sx={{ maxWidth: 720, mx: "auto" }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Button startIcon={<ArrowBackRounded />} onClick={() => (window.history.length > 1 ? nav(-1) : nav("/"))} sx={{ ml: -1, mb: 1 }}>{t("back")}</Button>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 0.5 }}>
            <LogoMark size={40} />
            <Typography variant="h4" component="h1">{t("privacy_title")}</Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ mb: 3 }}>{t("privacy_updated", { d: longDate("2026-11-09") })}</Typography>
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <Box key={i} sx={{ mb: 2.5 }}>
              <Typography variant="h6" component="h2" sx={{ mb: 0.5 }}>{t("pv_h" + i)}</Typography>
              <Typography sx={{ lineHeight: 1.65 }}>{t("pv_p" + i, { c })}</Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}

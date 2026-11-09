import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, Select, MenuItem, Tooltip, Fab, BottomNavigation, BottomNavigationAction, Paper, Menu, ListItemIcon, ListItemText, Divider, Avatar, Chip, useMediaQuery } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { useIsMutating } from "@tanstack/react-query";
import { LogoMark } from "./Logo.jsx";
import { useDialogs } from "../state/ui.jsx";
import { FeedbackDialog } from "./Feedback.jsx";
import { useI18n, LANGS, LANG_NAMES } from "../i18n/index.jsx";
import { useMode } from "../state/ui.jsx";
import { useAuth, useActions, useDomain } from "../state/data.jsx";
import { useOpeners } from "../dialogs/index.jsx";
import { tones } from "./common.jsx";
import { initials } from "../lib/domain.js";
import { AddCardRounded, AddRounded, AdminPanelSettingsRounded, CloudDoneRounded, CloudSyncRounded, CoPresentRounded, DarkModeRounded, FactCheckRounded, FeedbackRounded, GroupRounded, LightModeRounded, LogoutRounded, NotificationsRounded, PaymentsRounded, PersonAddRounded, SettingsRounded, ShieldRounded, SpaceDashboardRounded } from "../icons.jsx";

const NAV = [
  { to: "/", key: "home", Icon: SpaceDashboardRounded },
  { to: "/students", key: "students", Icon: GroupRounded },
  { to: "/classes", key: "classes", Icon: CoPresentRounded },
  { to: "/attendance", key: "attendance", Icon: FactCheckRounded },
  { to: "/fees", key: "fees", Icon: PaymentsRounded },
  { to: "/reminders", key: "reminders", Icon: NotificationsRounded },
  { to: "/settings", key: "settings", Icon: SettingsRounded },
];

function RailLink({ item, label }) {
  const theme = useTheme(), k = tones(theme);
  const { Icon } = item;
  return (
    <Box component={NavLink} to={item.to} end={item.to === "/"}
      sx={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, width: 80, py: 0.5, textDecoration: "none",
        color: "text.secondary", fontSize: 12, fontWeight: 500, textAlign: "center", lineHeight: 1.25,
        "& .pill": { width: 56, height: 32, borderRadius: 4, display: "grid", placeItems: "center", transition: "background .2s" },
        "&:hover .pill": { bgcolor: k.surface3 },
        "&.active": { color: "text.primary" },
        "&.active .pill": { bgcolor: k.primaryContainer, color: k.onPrimaryContainer },
        "&:focus-visible": { outline: `3px solid ${theme.palette.primary.main}`, borderRadius: 2 },
      }}>
      <span className="pill"><Icon /></span>{label}
    </Box>
  );
}

export default function Layout() {
  const theme = useTheme(), k = tones(theme);
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const { t, lang } = useI18n();
  const { mode, toggle } = useMode();
  const { signOut } = useAuth();
  const actions = useActions();
  const D = useDomain();
  const open = useOpeners();
  const loc = useLocation();
  const nav = useNavigate();
  const saving = useIsMutating() > 0;
  const [menu, setMenu] = useState(null);
  const dlg = useDialogs();
  const feedback = () => dlg.open(close => <FeedbackDialog onClose={close} />);

  const isAdmin = !!D?.user?.isAdmin;
  const nav_ = isAdmin ? [...NAV, { to: "/admin", key: "admin", Icon: AdminPanelSettingsRounded }] : NAV;
  const current = nav_.find(n => (n.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(n.to))) || NAV[0];
  const title = current.key === "admin" ? t("admin") : t("nav_" + current.key);
  const fabs = {
    home: [PersonAddRounded, "add_student", () => open.studentForm()],
    students: [PersonAddRounded, "add_student", () => open.studentForm()],
    classes: [AddRounded, "add_class", () => open.classForm()],
    fees: [AddCardRounded, "record_payment", () => open.payForm(null, new URLSearchParams(loc.search).get("m"))],
  };
  const fab = fabs[current.key];
  const bottom = NAV.slice(0, 5);
  const bottomIdx = bottom.indexOf(current);

  const changeLang = lg => { try { localStorage.setItem("td-lang", lg); } catch { /* ignore */ } actions.saveSettings({ lang: lg }).catch(() => {}); };

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "88px 1fr" }, height: "100dvh" }}>
      {desktop && (
        <Box component="nav" aria-label="Main" sx={{ bgcolor: k.surface2, borderRight: `1px solid ${k.outlineVariant}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75, py: 1.75, overflowY: "auto" }}>
          <Box component={NavLink} to="/" aria-label="TutorDesk" sx={{ mb: 1.25, borderRadius: 3.5, "&:focus-visible": { outline: `3px solid ${theme.palette.primary.main}` } }}><LogoMark size={48} /></Box>
          {nav_.map(n => <RailLink key={n.key} item={n} label={n.key === "admin" ? t("admin") : t("nav_" + n.key)} />)}
          <Box sx={{ flex: 1 }} />
          <Tooltip title={t("feedback")} placement="right"><IconButton onClick={feedback} aria-label={t("feedback")}><FeedbackRounded /></IconButton></Tooltip>
        </Box>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0, height: "100%", overflow: "hidden" }}>
        <Box component="header" sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 }, px: { xs: 2, md: 3 }, minHeight: { xs: 56, md: 64 } }}>
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 1.25 }}>
            <Typography variant="h5" component="h1" noWrap sx={{ minWidth: 0, fontSize: { xs: 22, md: 24 } }}>{title}</Typography>
            {desktop && <Chip size="small" label={t("beta")} onClick={feedback} icon={<FeedbackRounded />} variant="outlined" />}
          </Box>
          <Tooltip title={saving ? t("s_saving") : t("s_saved")}>
            <Box role="status" sx={{ display: { xs: saving ? "inline-flex" : "none", sm: "inline-flex" }, alignItems: "center", gap: 0.75, fontSize: 12.5, color: "text.secondary", bgcolor: k.surface2, borderRadius: 999, px: 1.25, py: 0.6, "& svg": { fontSize: 18 } }}>
              {saving ? <CloudSyncRounded /> : <CloudDoneRounded />}
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>{saving ? t("s_saving") : t("s_saved")}</Box>
            </Box>
          </Tooltip>
          <Select size="small" value={lang} onChange={e => changeLang(e.target.value)} aria-label={t("language")}
            renderValue={v => (desktop ? LANG_NAMES[v] : { en: "EN", si: "සිං", ta: "தமி" }[v])}
            sx={{ borderRadius: 5, height: 36, fontSize: 13.5, fontWeight: 500, "& .MuiSelect-select": { py: 0.5 } }}>
            {LANGS.map(l => <MenuItem key={l} value={l}>{LANG_NAMES[l]}</MenuItem>)}
          </Select>
          <Tooltip title={mode === "dark" ? t("theme_light") : t("theme_dark")}>
            <IconButton onClick={toggle} aria-label={mode === "dark" ? t("theme_light") : t("theme_dark")}>{mode === "dark" ? <LightModeRounded /> : <DarkModeRounded />}</IconButton>
          </Tooltip>
          {!desktop && <Tooltip title={t("nav_reminders")}><IconButton component={NavLink} to="/reminders" aria-label={t("nav_reminders")}><NotificationsRounded /></IconButton></Tooltip>}
          <Tooltip title={t("account")}>
            <IconButton onClick={e => setMenu(e.currentTarget)} aria-label={t("account")} sx={{ p: 0.5 }}>
              <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: k.primaryContainer, color: k.onPrimaryContainer, fontWeight: 600 }}>{initials(D?.user?.name || D?.user?.email)}</Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
            <Box sx={{ px: 2, py: 1 }}><Typography sx={{ fontWeight: 600 }}>{D?.user?.name}</Typography><Typography variant="body2" color="text.secondary">{D?.user?.email}</Typography></Box>
            <Divider />
            <MenuItem onClick={() => { setMenu(null); nav("/settings"); }}><ListItemIcon><SettingsRounded fontSize="small" /></ListItemIcon><ListItemText>{t("nav_settings")}</ListItemText></MenuItem>
            {isAdmin && <MenuItem onClick={() => { setMenu(null); nav("/admin"); }}><ListItemIcon><AdminPanelSettingsRounded fontSize="small" /></ListItemIcon><ListItemText>{t("admin")}</ListItemText></MenuItem>}
            <MenuItem onClick={() => { setMenu(null); feedback(); }}><ListItemIcon><FeedbackRounded fontSize="small" /></ListItemIcon><ListItemText>{t("feedback")}</ListItemText></MenuItem>
            <MenuItem onClick={() => { setMenu(null); nav("/privacy"); }}><ListItemIcon><ShieldRounded fontSize="small" /></ListItemIcon><ListItemText>{t("privacy_title")}</ListItemText></MenuItem>
            <Divider />
            <MenuItem onClick={() => { setMenu(null); signOut(); }}><ListItemIcon><LogoutRounded fontSize="small" /></ListItemIcon><ListItemText>{t("logout")}</ListItemText></MenuItem>
          </Menu>
        </Box>
        <Box component="main" id="content" sx={{ flex: 1, overflowY: "auto", px: { xs: 2, md: 3 }, pt: 0.5, pb: { xs: 20, md: 15 } }}>
          <Box sx={{ maxWidth: 1120, mx: "auto", display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>

      {fab && (
        <Fab variant="extended" onClick={fab[2]} sx={{ position: "fixed", right: { xs: 16, md: 24 }, bottom: { xs: 88, md: 24 }, bgcolor: k.primaryContainer, color: k.onPrimaryContainer, "&:hover": { bgcolor: alpha(k.primaryContainer, 0.85) }, gap: 1 }}>
          {(() => { const I = fab[0]; return <I />; })()}{t(fab[1])}
        </Fab>
      )}

      {!desktop && (
        <Paper square elevation={0} sx={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 30, bgcolor: k.surface2, borderTop: `1px solid ${k.outlineVariant}`, pb: "env(safe-area-inset-bottom)" }}>
          <BottomNavigation component="nav" aria-label="Main" showLabels value={bottomIdx} sx={{ bgcolor: "transparent", height: 72 }}>
            {bottom.map(n => {
              const active = n === current;
              return (
                <BottomNavigationAction key={n.key} component={NavLink} to={n.to} end={n.to === "/"} label={t("nav_" + n.key)}
                  icon={<Box sx={{ width: 56, height: 30, borderRadius: 3.75, display: "grid", placeItems: "center", bgcolor: active ? k.primaryContainer : "transparent", color: active ? k.onPrimaryContainer : "inherit" }}><n.Icon /></Box>}
                  sx={{ color: "text.secondary", "&.Mui-selected": { color: "text.primary" }, "& .MuiBottomNavigationAction-label": { fontSize: 11.5, fontWeight: 500, mt: 0.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }, "& .MuiBottomNavigationAction-label.Mui-selected": { fontSize: 11.5 } }} />
              );
            })}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}

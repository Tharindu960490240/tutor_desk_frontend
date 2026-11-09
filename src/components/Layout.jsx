import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, Select, MenuItem, Tooltip, Fab, BottomNavigation, BottomNavigationAction, Paper, Menu, ListItemIcon, ListItemText, Divider, Avatar, Chip, Drawer, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useIsMutating } from "@tanstack/react-query";
import Logo from "./Logo.jsx";
import { useDialogs, useMode } from "../state/ui.jsx";
import { FeedbackDialog } from "./Feedback.jsx";
import { useI18n, LANGS, LANG_NAMES } from "../i18n/index.jsx";
import { useAuth, useActions, useDomain } from "../state/data.jsx";
import { useOpeners } from "../dialogs/index.jsx";
import { tones } from "./common.jsx";
import { initials } from "../lib/domain.js";
import { AddCardRounded, AddRounded, AdminPanelSettingsRounded, CloseRounded, CloudDoneRounded, CloudSyncRounded, CoPresentRounded, DarkModeRounded, FactCheckRounded, FeedbackRounded, GroupRounded, LightModeRounded, LogoutRounded, MenuRounded, NotificationsRounded, PaymentsRounded, PersonAddRounded, SettingsRounded, ShieldRounded, SpaceDashboardRounded } from "../icons.jsx";

const HEADER = 65;
const SIDE = 248;

const MAIN = [
  { to: "/", key: "home", Icon: SpaceDashboardRounded },
  { to: "/students", key: "students", Icon: GroupRounded },
  { to: "/classes", key: "classes", Icon: CoPresentRounded },
  { to: "/attendance", key: "attendance", Icon: FactCheckRounded },
  { to: "/fees", key: "fees", Icon: PaymentsRounded },
];
const MORE = [
  { to: "/reminders", key: "reminders", Icon: NotificationsRounded },
  { to: "/settings", key: "settings", Icon: SettingsRounded },
];
const ADMIN = { to: "/admin", key: "admin", Icon: AdminPanelSettingsRounded };

const labelOf = (t, n) => (n.key === "admin" ? t("admin") : t("nav_" + n.key));

/** Side-menu item, AFC style: bold label, tinted when active, accent bar on the left edge. */
function SideItem({ item, label, onClick }) {
  const theme = useTheme(), k = tones(theme);
  const { Icon } = item;
  const base = {
    position: "relative", display: "flex", alignItems: "center", gap: 1.5, width: "100%", boxSizing: "border-box",
    px: 1.5, py: 1.25, borderRadius: 2.5, border: 0, bgcolor: "transparent", color: "text.primary",
    fontFamily: "inherit", fontSize: 14, fontWeight: 600, textAlign: "left", textDecoration: "none", cursor: "pointer",
    whiteSpace: "nowrap", transition: "background .15s, color .15s",
    "& svg": { fontSize: 22, flex: "none", color: "text.secondary" },
    "&:hover": { bgcolor: k.surface3 },
    "&:focus-visible": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 },
  };
  const active = {
    "&.active": { bgcolor: k.primaryContainer, color: k.onPrimaryContainer },
    "&.active svg": { color: theme.palette.primary.main },
    "&.active::before": { content: '""', position: "absolute", left: -12, top: 8, bottom: 8, width: 4, borderRadius: "0 4px 4px 0", bgcolor: k.accent },
  };
  const inner = <><Icon /><Box component="span" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{label}</Box></>;
  if (!item.to) return <Box component="button" type="button" onClick={onClick} sx={base}>{inner}</Box>;
  return <Box component={NavLink} to={item.to} end={item.to === "/"} onClick={onClick} sx={{ ...base, ...active }}>{inner}</Box>;
}

function Group({ children }) {
  return <Typography component="div" sx={{ mx: 1.5, mt: 1.75, mb: 0.75, fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "text.secondary", "&:first-of-type": { mt: 0.5 } }}>{children}</Typography>;
}

function SideMenu({ isAdmin, onNavigate, onFeedback, onSignOut, phone }) {
  const theme = useTheme(), k = tones(theme);
  const { t } = useI18n();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Box component="nav" aria-label="Main" sx={{ flex: 1, overflowY: "auto", px: 1.5, pt: 1.75, pb: 1, display: "flex", flexDirection: "column", gap: 0.25 }}>
        <Group>{t("menu_main")}</Group>
        {MAIN.map(n => <SideItem key={n.key} item={n} label={labelOf(t, n)} onClick={onNavigate} />)}
        <Group>{t("menu_more")}</Group>
        {MORE.map(n => <SideItem key={n.key} item={n} label={labelOf(t, n)} onClick={onNavigate} />)}
        {isAdmin && <SideItem item={ADMIN} label={t("admin")} onClick={onNavigate} />}
      </Box>
      <Box sx={{ px: 1.5, pt: 1, pb: 1.75, borderTop: `1px solid ${k.outlineVariant}`, display: "flex", flexDirection: "column", gap: 0.25 }}>
        <SideItem item={{ Icon: FeedbackRounded }} label={t("feedback")} onClick={onFeedback} />
        {phone && <SideItem item={{ Icon: LogoutRounded }} label={t("logout")} onClick={onSignOut} />}
      </Box>
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
  const [drawer, setDrawer] = useState(false);
  const dlg = useDialogs();
  const feedback = () => { setDrawer(false); dlg.open(close => <FeedbackDialog onClose={close} />); };

  useEffect(() => { if (desktop) setDrawer(false); }, [desktop]);

  const isAdmin = !!D?.user?.isAdmin;
  const all = [...MAIN, ...MORE, ADMIN];
  const current = all.find(n => (n.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(n.to))) || null;
  const fabs = {
    home: [PersonAddRounded, "add_student", () => open.studentForm()],
    students: [PersonAddRounded, "add_student", () => open.studentForm()],
    classes: [AddRounded, "add_class", () => open.classForm()],
    fees: [AddCardRounded, "record_payment", () => open.payForm(null, new URLSearchParams(loc.search).get("m"))],
  };
  const fab = current && fabs[current.key];
  const bottomIdx = MAIN.indexOf(current);
  const name = D?.user?.name || D?.user?.email || "";

  const changeLang = lg => { try { localStorage.setItem("td-lang", lg); } catch { /* ignore */ } actions.saveSettings({ lang: lg }).catch(() => {}); };

  return (
    <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      {/* ───────── Header (full width, like the AFC portal) ───────── */}
      <Box component="header" sx={{ flex: "none", height: { xs: 58, md: HEADER }, display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1.25 }, px: { xs: 1, md: 3 }, bgcolor: k.surface, borderBottom: `1px solid ${k.outlineVariant}`, zIndex: 20, position: "relative" }}>
        {!desktop && <IconButton onClick={() => setDrawer(true)} aria-label={t("menu")}><MenuRounded /></IconButton>}
        <Box component={NavLink} to="/" aria-label="TutorDesk" sx={{ display: "inline-flex", textDecoration: "none", color: "text.primary", borderRadius: 2, "&:focus-visible": { outline: `2px solid ${theme.palette.primary.main}` } }}>
          <Logo size={desktop ? 34 : 30} />
        </Box>
        {desktop && <Chip size="small" label={t("beta")} onClick={feedback} sx={{ ml: 0.5, height: 24, fontSize: 11.5, bgcolor: k.primaryContainer, color: k.onPrimaryContainer }} />}
        <Box sx={{ flex: 1 }} />
        <Tooltip title={saving ? t("s_saving") : t("s_saved")}>
          <Box role="status" sx={{ display: { xs: saving ? "inline-flex" : "none", sm: "inline-flex" }, alignItems: "center", gap: 0.75, fontSize: 12.5, fontWeight: 500, color: "text.secondary", px: 1, "& svg": { fontSize: 18, color: saving ? "text.secondary" : k.good } }}>
            {saving ? <CloudSyncRounded /> : <CloudDoneRounded />}
            <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>{saving ? t("s_saving") : t("s_saved")}</Box>
          </Box>
        </Tooltip>
        <Select size="small" value={lang} onChange={e => changeLang(e.target.value)} aria-label={t("language")}
          renderValue={v => (desktop ? LANG_NAMES[v] : { en: "EN", si: "සිං", ta: "தமி" }[v])}
          sx={{ height: 36, fontSize: 13.5, fontWeight: 600, borderRadius: 999, "& .MuiSelect-select": { py: 0.5, pl: 1.75 } }}>
          {LANGS.map(l => <MenuItem key={l} value={l}>{LANG_NAMES[l]}</MenuItem>)}
        </Select>
        <Tooltip title={mode === "dark" ? t("theme_light") : t("theme_dark")}>
          <IconButton onClick={toggle} aria-label={mode === "dark" ? t("theme_light") : t("theme_dark")}>{mode === "dark" ? <LightModeRounded /> : <DarkModeRounded />}</IconButton>
        </Tooltip>
        {!desktop && <Tooltip title={t("nav_reminders")}><IconButton component={NavLink} to="/reminders" aria-label={t("nav_reminders")}><NotificationsRounded /></IconButton></Tooltip>}
        <Box component="button" type="button" onClick={e => setMenu(e.currentTarget)} aria-label={t("account")}
          sx={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 1, borderRadius: 999, p: 0.5, pr: { xs: 0.5, md: 1.25 }, "&:hover": { bgcolor: k.surface3 }, "&:focus-visible": { outline: `2px solid ${theme.palette.primary.main}` } }}>
          <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: "primary.main", color: k.onPrimary }}>{initials(name)}</Avatar>
          {desktop && <Typography noWrap sx={{ fontSize: 14, fontWeight: 600, maxWidth: 140 }}>{D?.user?.name}</Typography>}
        </Box>
        <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} slotProps={{ paper: { sx: { width: 240, mt: 1 } } }}>
          <Box sx={{ px: 1.75, py: 1.25 }}><Typography sx={{ fontWeight: 700, fontSize: 14 }}>{D?.user?.name}</Typography><Typography sx={{ fontSize: 12, color: "text.secondary", overflowWrap: "anywhere" }}>{D?.user?.email}</Typography></Box>
          <Divider />
          <MenuItem onClick={() => { setMenu(null); nav("/settings"); }}><ListItemIcon><SettingsRounded fontSize="small" /></ListItemIcon><ListItemText>{t("nav_settings")}</ListItemText></MenuItem>
          {isAdmin && <MenuItem onClick={() => { setMenu(null); nav("/admin"); }}><ListItemIcon><AdminPanelSettingsRounded fontSize="small" /></ListItemIcon><ListItemText>{t("admin")}</ListItemText></MenuItem>}
          <MenuItem onClick={() => { setMenu(null); feedback(); }}><ListItemIcon><FeedbackRounded fontSize="small" /></ListItemIcon><ListItemText>{t("feedback")}</ListItemText></MenuItem>
          <MenuItem onClick={() => { setMenu(null); nav("/privacy"); }}><ListItemIcon><ShieldRounded fontSize="small" /></ListItemIcon><ListItemText>{t("privacy_title")}</ListItemText></MenuItem>
          <Divider />
          <MenuItem onClick={() => { setMenu(null); signOut(); }} sx={{ "&:hover": { color: k.bad } }}><ListItemIcon><LogoutRounded fontSize="small" /></ListItemIcon><ListItemText>{t("logout")}</ListItemText></MenuItem>
        </Menu>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
        {/* ───────── Side menu (desktop) ───────── */}
        {desktop && (
          <Box sx={{ flex: `0 0 ${SIDE}px`, width: SIDE, bgcolor: k.surface, borderRight: `1px solid ${k.outlineVariant}`, boxShadow: "2px 0 12px rgba(0,0,0,.04)", zIndex: 10 }}>
            <SideMenu isAdmin={isAdmin} onFeedback={feedback} />
          </Box>
        )}

        {/* ───────── Page ───────── */}
        <Box component="main" id="content" sx={{ flex: 1, minWidth: 0, overflowY: "auto", px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 2.5, md: 3.5 }, pb: { xs: 20, md: 14 } }}>
          <Box sx={{ maxWidth: 1180, mx: "auto", display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
            {current && current.key !== "home" && (
              <Box component="header" sx={{ mb: { xs: 0, md: 0.5 } }}>
                <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 23, md: 28 }, mb: 0.5 }}>{labelOf(t, current)}</Typography>
                <Typography sx={{ fontSize: 15, color: "text.secondary" }}>{t("sub_" + current.key)}</Typography>
              </Box>
            )}
            <Outlet />
          </Box>
        </Box>
      </Box>

      {/* ───────── Phone: drawer menu + bottom bar ───────── */}
      {!desktop && (
        <Drawer open={drawer} onClose={() => setDrawer(false)} slotProps={{ paper: { sx: { width: 280, bgcolor: k.surface, backgroundImage: "none" } } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, borderBottom: `1px solid ${k.outlineVariant}` }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontWeight: 700, fontSize: 15 }}>{D?.user?.name}</Typography>
              <Typography noWrap sx={{ fontSize: 12, color: "text.secondary" }}>{D?.user?.email}</Typography>
            </Box>
            <IconButton onClick={() => setDrawer(false)} aria-label="Close"><CloseRounded /></IconButton>
          </Box>
          <SideMenu phone isAdmin={isAdmin} onNavigate={() => setDrawer(false)} onFeedback={feedback} onSignOut={() => { setDrawer(false); signOut(); }} />
        </Drawer>
      )}

      {fab && (
        <Fab variant="extended" onClick={fab[2]} sx={{ position: "fixed", right: { xs: 16, md: 28 }, bottom: { xs: 86, md: 28 }, gap: 1 }}>
          {(() => { const I = fab[0]; return <I />; })()}{t(fab[1])}
        </Fab>
      )}

      {!desktop && (
        <Paper square elevation={0} sx={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 30, bgcolor: k.surface, borderTop: `1px solid ${k.outlineVariant}`, boxShadow: "0 -2px 12px rgba(0,0,0,.05)", pb: "env(safe-area-inset-bottom)" }}>
          <BottomNavigation component="nav" aria-label="Main" showLabels value={bottomIdx} sx={{ bgcolor: "transparent", height: 68 }}>
            {MAIN.map(n => {
              const active = n === current;
              return (
                <BottomNavigationAction key={n.key} component={NavLink} to={n.to} end={n.to === "/"} label={t("nav_" + n.key)}
                  icon={<Box sx={{ width: 52, height: 28, borderRadius: 999, display: "grid", placeItems: "center", bgcolor: active ? k.primaryContainer : "transparent", color: active ? "primary.main" : "inherit" }}><n.Icon /></Box>}
                  sx={{ color: "text.secondary", "&.Mui-selected": { color: k.onPrimaryContainer }, "& .MuiBottomNavigationAction-label": { fontSize: 11.5, fontWeight: 600, mt: 0.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }, "& .MuiBottomNavigationAction-label.Mui-selected": { fontSize: 11.5 } }} />
              );
            })}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}

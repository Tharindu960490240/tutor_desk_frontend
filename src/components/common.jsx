import { Avatar, Box, Card, CardContent, Chip, IconButton, LinearProgress, Stack, Typography, Button, Tooltip } from "@mui/material";
import { styled, alpha, useTheme } from "@mui/material/styles";
import { avColor, initials } from "../lib/domain.js";
import { useI18n } from "../i18n/index.jsx";
import { useActions } from "../state/data.jsx";
import { useCopy } from "../state/ui.jsx";
import { CheckCircleRounded, ContentCopyRounded, RemoveRounded, ScheduleRounded, SmsRounded, TimelapseRounded, WhatsApp } from "../icons.jsx";

export const tones = theme => theme.palette.tones;

export function StudentAvatar({ name, size = 40 }) {
  return <Avatar aria-hidden sx={{ width: size, height: size, fontSize: size * 0.36, fontWeight: 600, bgcolor: avColor(name), color: "#fff" }}>{initials(name)}</Avatar>;
}

/** Coloured status pill. tone: good | warn | bad | none | info */
export function Pill({ tone = "none", icon, children, sx }) {
  const theme = useTheme(), k = tones(theme);
  const map = { good: [k.goodBg, k.good], warn: [k.warnBg, k.warn], bad: [k.badBg, k.bad], none: [k.surface2, k.text2], info: [k.primaryContainer, k.onPrimaryContainer] };
  const [bg, fg] = map[tone];
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, height: 24, px: 1.25, borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", bgcolor: bg, color: fg, "& svg": { fontSize: 16 }, ...sx }}>
      {icon}{children}
    </Box>
  );
}

const STATUS = { paid: ["good", CheckCircleRounded], partial: ["warn", TimelapseRounded], due: ["bad", ScheduleRounded], none: ["none", RemoveRounded] };
export function StatusPill({ status }) {
  const { t } = useI18n();
  const [tone, Icon] = STATUS[status];
  return <Pill tone={tone} icon={<Icon />}>{t("st_" + status)}</Pill>;
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <Box sx={{ textAlign: "center", py: 3.5, px: 2, color: "text.secondary" }}>
      {Icon && <Icon sx={{ fontSize: 44, color: "primary.main", opacity: 0.75 }} />}
      <Typography variant="h6" sx={{ color: "text.primary", mt: 1, mb: 0.5, fontSize: 17 }}>{title}</Typography>
      {text && <Typography variant="body2" sx={{ mb: 2 }}>{text}</Typography>}
      {action}
    </Box>
  );
}

/** White panel like the AFC portal: 20px padding, bold title row with an icon tile, then content. */
export function SectionCard({ icon: Icon, iconColor = "primary.main", title, action, children, sx, contentSx }) {
  const theme = useTheme(), k = tones(theme);
  return (
    <Card sx={{ minWidth: 0, ...sx }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } }, ...contentSx }}>
        {(title || action) && (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1, mb: 2 }}>
            {Icon && (
              <Box sx={{ width: 36, height: 36, borderRadius: 2.5, display: "grid", placeItems: "center", flex: "none", bgcolor: k.primaryContainer, color: iconColor, "& svg": { fontSize: 20 } }}>
                <Icon />
              </Box>
            )}
            <Typography variant="h6" component="h2" sx={{ flex: "1 0 auto", maxWidth: "100%" }}>{title}</Typography>
            {action}
          </Stack>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

/** KPI tile: label + big number on the left, coloured icon tile on the right. */
export function StatCard({ hero, icon: Icon, iconColor = "primary.main", label, value, sub, progress }) {
  const theme = useTheme(), k = tones(theme);
  const c = theme.palette.primary.main;
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } }, display: "flex", flexDirection: "column", gap: 1, height: "100%" }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: "text.secondary", mb: 0.75 }}>{label}</Typography>
            <Typography className="num" sx={{ fontSize: { xs: 19, sm: 26 }, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: hero ? "primary.main" : "text.primary", "@media (max-width:359.95px)": { fontSize: 17 } }}>{value}</Typography>
          </Box>
          {Icon && (
            <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: { xs: "none", sm: "grid" }, placeItems: "center", flex: "none", background: hero ? `linear-gradient(135deg, ${c} 0%, ${k.primary2} 100%)` : k.primaryContainer, color: hero ? k.onPrimary : iconColor, "& svg": { fontSize: 22 } }}>
              <Icon />
            </Box>
          )}
        </Stack>
        {progress != null && (
          <LinearProgress variant="determinate" value={progress} aria-hidden
            sx={{ height: 6, borderRadius: 3, bgcolor: k.surface3, "& .MuiLinearProgress-bar": { borderRadius: 3, bgcolor: "primary.main" } }} />
        )}
        {sub && <Typography variant="body2" sx={{ fontSize: 12.5, color: "text.secondary", mt: "auto" }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

export const TonalIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.12),
  color: theme.palette.primary.main,
  "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.22) },
}));

export function ColorBar({ color, h = 36 }) {
  return <Box sx={{ width: 6, height: h, borderRadius: 3, bgcolor: color, flex: "none" }} />;
}

export function MessageBox({ children, sx }) {
  const theme = useTheme();
  return <Box sx={{ bgcolor: tones(theme).surface2, border: `1px solid ${tones(theme).outlineVariant}`, borderRadius: 2, px: 1.75, py: 1.5, fontSize: 13.5, whiteSpace: "pre-wrap", mt: 1, ...sx }}>{children}</Box>;
}

export function IconTip({ title, children }) {
  return <Tooltip title={title}>{children}</Tooltip>;
}

/** WhatsApp / SMS / Copy buttons for a message to a family. Logs the reminder when used. */
export function MessageActions({ D, s, msg, type, logKey }) {
  const { t } = useI18n();
  const actions = useActions();
  const copy = useCopy(t);
  const ph = D.contactOf(s), wa = D.waLink(ph, msg), sms = D.smsLink(ph, msg);
  const log = () => actions.logReminder(s.id, type, logKey).catch(() => {});
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: "wrap", rowGap: 1, alignItems: "center" }}>
      {wa && <Button size="small" variant="contained" startIcon={<WhatsApp />} href={wa} target="_blank" rel="noopener" onClick={log}>WhatsApp</Button>}
      {sms && <Button size="small" variant="outlined" startIcon={<SmsRounded />} href={sms} onClick={log}>SMS</Button>}
      <Button size="small" startIcon={<ContentCopyRounded />} onClick={async () => { if (await copy(msg, t("msg_copied"))) log(); }}>{t("copy")}</Button>
      {!ph && <Typography variant="caption" color="text.secondary">{t("add_phone_hint")}</Typography>}
    </Stack>
  );
}

export function LangTag({ lg }) {
  const map = { en: "English", si: "සිංහල", ta: "தமிழ்" };
  return <Chip size="small" label={map[lg]} sx={{ height: 24, fontSize: 12 }} />;
}

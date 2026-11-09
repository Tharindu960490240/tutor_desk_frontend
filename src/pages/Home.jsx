import { Box, Button, Stack, Typography, List, ListItem, ListItemAvatar, ListItemText, ListItemButton } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { useDomain, useAttendance, useActions } from "../state/data.jsx";
import { useOpeners } from "../dialogs/index.jsx";
import { useSnack, useLoading } from "../state/ui.jsx";
import { InlineLoader } from "../components/LoadingSpinner.jsx";
import { StatCard, SectionCard, EmptyState, StudentAvatar, Pill, StatusPill, TonalIconButton, ColorBar, IconTip } from "../components/common.jsx";
import { attStats, indexAttendance, slotKey, pct } from "../lib/domain.js";
import { todayStr, curYm, addMonths, fmtTime, endTime } from "../lib/dates.js";
import { useState } from "react";
import { AddCardRounded, AddRounded, CampaignRounded, CelebrationRounded, DoneRounded, FactCheckRounded, GroupsRounded, HistoryRounded, HowToRegRounded, NotificationsRounded, PaymentsRounded, PendingActionsRounded, PersonAddRounded, ReceiptLongRounded, SavingsRounded, ScienceRounded, ThumbUpRounded, TodayRounded, TrendingDownRounded, WavingHandRounded, WeekendRounded } from "../icons.jsx";

export function SampleBanner() {
  const D = useDomain(); const { t } = useI18n(); const actions = useActions(); const snack = useSnack(); const withLoading = useLoading();
  const [busy, setBusy] = useState(false);
  if (!D.settings.sample) return null;
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, px: 2, py: 1.5, borderRadius: 4, bgcolor: "action.hover", flexWrap: "wrap" }}>
      <ScienceRounded color="primary" />
      <Box sx={{ flex: "1 1 240px" }}><b>{t("sample_title")}</b> <Typography component="span" color="text.secondary">{t("sample_sub")}</Typography></Box>
      <Button size="small" variant="tonal" disabled={busy} onClick={async () => { setBusy(true); try { await withLoading(actions.wipe()); snack(t("fresh")); } catch { snack(t("try_again_msg"), "error"); } setBusy(false); }}>{t("clear_sample")}</Button>
    </Stack>
  );
}

export default function Home() {
  const D = useDomain(); const { t, dayLong, longDate, monthOnly, monthLabel, shortDate } = useI18n();
  const open = useOpeners(); const nav = useNavigate(); const actions = useActions(); const snack = useSnack(); const withLoading = useLoading();
  const td = todayStr(), ym = curYm(), prev = addMonths(ym, -1), dow = new Date().getDay();
  const { rows } = useAttendance([ym, prev]);
  const [busy, setBusy] = useState(false);
  const h = new Date().getHours();
  const greet = t(h < 12 ? "morning" : h < 17 ? "afternoon" : "evening") + (D.settings.tutorName ? ", " + D.settings.tutorName : "");
  const dateLine = `${dayLong(dow)}, ${longDate(td)}`;

  if (!D.students.length && !D.classes.length) {
    return (<>
      <Box><Typography color="text.secondary">{dateLine}</Typography><Typography variant="h4">{greet}</Typography></Box>
      <SectionCard>
        <EmptyState icon={WavingHandRounded} title={t("setup_title")} text={t("setup_p")} action={
          <Stack direction="row" sx={{ justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
            <Button variant="contained" startIcon={<AddRounded />} onClick={() => open.classForm()}>{t("add_first_class")}</Button>
            <Button variant="outlined" startIcon={<PersonAddRounded />} onClick={() => open.studentForm()}>{t("add_student")}</Button>
            <Button startIcon={<ScienceRounded />} disabled={busy} onClick={async () => { setBusy(true); try { await withLoading(actions.loadSample(td)); snack(t("sample_loaded")); } catch { snack(t("try_again_msg"), "error"); } setBusy(false); }}>{t("load_sample")}</Button>
          </Stack>} />
      </SectionCard>
    </>);
  }

  const studs = D.activeStudents();
  let expected = 0, outstanding = 0; const dueList = [];
  let admDue = 0;
  D.students.forEach(s => { const f = D.feeStatus(s, ym); expected += f.due; outstanding += f.bal; admDue += D.admissionDue(s); if (f.bal > 0) dueList.push({ s, f }); });
  const collected = D.collectedFor(ym);
  const monthRows = rows.filter(r => r.date.startsWith(ym));
  const P = monthRows.filter(r => r.v !== "A").length, T = monthRows.length;
  const idx = indexAttendance(rows);
  const today = D.occurrencesOn(td);
  const low = studs.map(s => ({ s, st: attStats(rows, s.id) })).filter(x => x.st.total >= 3 && x.st.rate < 0.8).sort((a, b) => a.st.rate - b.st.rate).slice(0, 4);
  const recent = D.payments.slice(0, 5);

  return (<>
    <SampleBanner />
    <Stack direction="row" sx={{ alignItems: "flex-end", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
      <Box><Typography color="text.secondary">{dateLine}</Typography><Typography variant="h4" sx={{ fontSize: { xs: 23, sm: 28 } }}>{greet}</Typography></Box>
      <Button variant="tonal" component={RouterLink} to="/reminders" startIcon={<CampaignRounded />}>{t("send_reminders")}</Button>
    </Stack>
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" } }}>
      <StatCard hero icon={SavingsRounded} label={t("collected_m", { m: monthOnly(ym) })} value={D.money(collected)} progress={expected ? Math.min(100, (collected / expected) * 100) : 0} sub={t("of_expected", { x: D.money(expected) })} />
      <StatCard icon={PendingActionsRounded} iconColor="error.main" label={t("still_due")} value={D.money(outstanding + admDue)} sub={t("to_collect", { n: dueList.length }) + (admDue ? " " + t("plus_adm", { x: D.money(admDue) }) : "")} />
      <StatCard icon={HowToRegRounded} iconColor="success.main" label={t("att_month")} value={T ? Math.round((P / T) * 100) + "%" : "–"} sub={t("marks_present", { p: P, t: T })} />
      <StatCard icon={GroupsRounded} iconColor="primary.main" label={t("active_students")} value={studs.length} sub={t("in_classes", { n: D.classes.length })} />
    </Box>
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
      <SectionCard icon={TodayRounded} title={t("todays_classes")}>
        {today.length ? (
          <List disablePadding>
            {today.map(({ c, s, status, change, origTime }) => {
              const n = D.studentsIn(c.id).length, rec = idx.get(slotKey(c.id, td, s.time)), marked = rec ? Object.keys(rec).length : 0;
              const off = ["cancelled", "break", "movedAway"].includes(status);
              const tag = status === "cancelled" ? t("st_cancelled") : status === "break" ? t("st_break") : status === "movedAway" ? t("st_moved_away", { d: shortDate(change.newDate) })
                : status === "moved" ? t("st_moved", { t: fmtTime(origTime) }) : status === "movedIn" ? t("st_moved_in", { d: shortDate(change.date) }) : null;
              return (
                <ListItem key={c.id + s.time + status} divider disableGutters sx={{ gap: 1.5, py: 1.25, "&:last-child": { borderBottom: 0 }, opacity: off ? 0.7 : 1 }}>
                  <ColorBar color={off ? "transparent" : c.color} h={40} />
                  <ListItemText sx={{ minWidth: 0 }} primary={c.name} slotProps={{ primary: { noWrap: true, fontWeight: 500, sx: off ? { textDecoration: status === "cancelled" ? "line-through" : "none" } : undefined }, secondary: { noWrap: true, component: "div" } }}
                    secondary={<>{`${fmtTime(s.time)}–${fmtTime(endTime(s.time, s.duration))} · ${t("n_students", { n })}${c.location ? " · " + c.location : ""}`}
                      {tag && <Box sx={{ mt: 0.5 }}><Pill tone={off ? "bad" : "warn"} sx={{ height: 22, fontSize: 11.5 }}>{tag}</Pill></Box>}</>} />
                  {off ? null : marked ? <Pill tone="good" icon={<DoneRounded />}>{t("n_marked", { a: marked, b: n })}</Pill>
                    : <Button size="small" variant="tonal" startIcon={<FactCheckRounded />} sx={{ flex: "none" }} onClick={() => nav(`/attendance?cid=${c.id}&date=${td}&time=${s.time}`)}>{t("take_att")}</Button>}
                </ListItem>
              );
            })}
          </List>
        ) : <EmptyState icon={WeekendRounded} title={t("no_class_today")} text={t("no_class_today_p")} />}
      </SectionCard>
      <SectionCard icon={ReceiptLongRounded} iconColor="error.main" title={t("fees_due_m", { m: monthOnly(ym) })} action={<Button size="small" component={RouterLink} to="/fees">{t("see_all")}</Button>}>
        {dueList.length ? (
          <List disablePadding>
            {dueList.sort((a, b) => b.f.bal - a.f.bal).slice(0, 5).map(({ s, f }) => (
              <ListItem key={s.id} divider disableGutters sx={{ gap: 1, "&:last-child": { borderBottom: 0 } }}>
                <ListItemAvatar sx={{ minWidth: 52 }}><StudentAvatar name={s.name} /></ListItemAvatar>
                <ListItemText primary={s.name} secondary={f.status === "partial" ? t("left_to_pay", { x: D.money(f.bal) }) : t("x_due", { x: D.money(f.bal) })} slotProps={{ primary: { noWrap: true, fontWeight: 500 }, secondary: { className: "num" } }} />
                <IconTip title={t("remind")}><TonalIconButton aria-label={`${t("remind")}: ${s.name}`} onClick={() => open.remindFee(s.id, ym)}><NotificationsRounded /></TonalIconButton></IconTip>
                <IconTip title={t("record_payment")}><TonalIconButton aria-label={`${t("record_payment")}: ${s.name}`} onClick={() => open.payForm(s.id, ym)}><AddCardRounded /></TonalIconButton></IconTip>
              </ListItem>
            ))}
          </List>
        ) : <EmptyState icon={CelebrationRounded} title={t("all_paid")} text={t("all_paid_p", { m: monthLabel(ym) })} />}
      </SectionCard>
      <SectionCard icon={TrendingDownRounded} iconColor="warning.main" title={t("needs_att")}>
        {low.length ? (
          <List disablePadding>
            {low.map(({ s, st }) => (
              <ListItemButton key={s.id} onClick={() => open.student(s.id)} sx={{ gap: 1, px: 1 }}>
                <ListItemAvatar sx={{ minWidth: 52 }}><StudentAvatar name={s.name} /></ListItemAvatar>
                <ListItemText primary={s.name} secondary={t("missed", { a: st.a, t: st.total })} slotProps={{ primary: { noWrap: true, fontWeight: 500 } }} />
                <Pill tone={st.rate < 0.6 ? "bad" : "warn"}>{t("attended_pct", { p: pct(st.rate) })}</Pill>
              </ListItemButton>
            ))}
          </List>
        ) : <EmptyState icon={ThumbUpRounded} title={t("healthy")} text={t("healthy_p")} />}
      </SectionCard>
      <SectionCard icon={HistoryRounded} iconColor="success.main" title={t("recent_pay")}>
        {recent.length ? (
          <List disablePadding>
            {recent.map(p => { const s = D.studentById(p.sid); return (
              <ListItem key={p.id} divider disableGutters sx={{ gap: 1, "&:last-child": { borderBottom: 0 } }}>
                <ListItemAvatar sx={{ minWidth: 52 }}><StudentAvatar name={s ? s.name : "?"} /></ListItemAvatar>
                <ListItemText primary={s ? s.name : t("former")} secondary={`${shortDate(p.date)} · ${D.methodLabel(p.method)} · ${p.kind === "admission" ? D.paymentLabel(p) : t("for_m", { m: monthOnly(p.ym) })}`} slotProps={{ primary: { noWrap: true, fontWeight: 500 } }} />
                <Typography className="num" sx={{ fontWeight: 700 }}>{D.money(p.amount)}</Typography>
              </ListItem>); })}
          </List>
        ) : <EmptyState icon={PaymentsRounded} title={t("no_pay")} text={t("no_pay_p")} />}
      </SectionCard>
    </Box>
  </>);
}

export function Loading() {
  return <InlineLoader />;
}
// keep StatusPill import used by other pages via re-export
export { StatusPill };

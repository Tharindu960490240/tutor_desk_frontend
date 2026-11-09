import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Chip, IconButton, List, ListItem, ListItemAvatar, ListItemText, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useI18n } from "../i18n/index.jsx";
import { useDomain, useAttendance, useActions } from "../state/data.jsx";
import { useOpeners } from "../dialogs/index.jsx";
import { useSnack } from "../state/ui.jsx";
import { SectionCard, EmptyState, StudentAvatar, Pill, ColorBar, tones } from "../components/common.jsx";
import { attStats, pct, indexAttendance, slotKey } from "../lib/domain.js";
import { todayStr, addDays, parseD, fmtTime, endTime } from "../lib/dates.js";
import { SampleBanner } from "./Home.jsx";
import { InlineLoader } from "../components/LoadingSpinner.jsx";
import { AddRounded, CalendarViewMonthRounded, CheckRounded, ChevronLeftRounded, ChevronRightRounded, DoneAllRounded, FactCheckRounded, GroupOffRounded, PersonAddRounded, ScheduleRounded, UpcomingRounded , EventRepeatRounded , EventAvailableRounded } from "../icons.jsx";

const MK = { P: "present", L: "late", A: "absent" };

export default function Attendance() {
  const D = useDomain(); const { t, lang, dayLong, dayShort, shortDate, monthLabel } = useI18n();
  const open = useOpeners(); const actions = useActions(); const snack = useSnack();
  const theme = useTheme(), k = tones(theme);
  const [params, setParams] = useSearchParams();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.get("date") || "") ? params.get("date") : todayStr();
  const dow = parseD(date).getDay(), ym = date.slice(0, 7);
  const { rows, loading } = useAttendance([ym]);
  const idx = useMemo(() => indexAttendance(rows), [rows]);

  const occ = D.occurrencesOn(date);
  const ACTIVE = ["normal", "moved", "movedIn"];
  const scheduled = occ.filter(o => ACTIVE.includes(o.status));
  const off = occ.filter(o => !ACTIVE.includes(o.status));
  const extra = D.classes.filter(c => !scheduled.some(o => o.c.id === c.id));

  // Resolve which class meeting is selected
  let cid = params.get("cid"), time = params.get("time");
  let c = cid && D.classById(cid);
  const nothingToday = !c && !scheduled.length;
  if (!c) { const first = scheduled[0]; c = first ? first.c : D.classes[0]; time = first ? first.s.time : null; }
  if (c && !(time && /^\d\d:\d\d$/.test(time))) {
    const o = scheduled.find(x => x.c.id === c.id);
    time = o ? o.s.time : (D.scheduleAt(c, date)[0] || c.sessions[0] || { time: "16:00" }).time;
  }
  const go = patch => setParams(p => { const n = new URLSearchParams(p); Object.entries(patch).forEach(([key, v]) => (v == null ? n.delete(key) : n.set(key, v))); return n; }, { replace: true });

  if (!D.classes.length) return <SectionCard><EmptyState icon={FactCheckRounded} title={t("add_class_first")} text={t("add_class_first_p")} action={<Button variant="contained" startIcon={<AddRounded />} onClick={() => open.classForm()}>{t("add_class")}</Button>} /></SectionCard>;

  const cur = scheduled.find(o => o.c.id === c.id && o.s.time === time);
  const session = cur?.s;
  const isScheduled = !!cur;
  const studs = D.studentsIn(c.id);
  const rec = idx.get(slotKey(c.id, date, time)) || {};
  const cnt = { P: 0, L: 0, A: 0 }; studs.forEach(s => { if (rec[s.id]) cnt[rec[s.id]]++; });
  const unmarked = studs.length - cnt.P - cnt.L - cnt.A;
  const classRows = rows.filter(r => r.cid === c.id);

  // Register columns: every (date, time) this class has marks for in the month
  const slots = [...new Set(classRows.map(r => r.date + "|" + r.time))].sort();
  const sched = D.scheduleAt(c, date);
  const multiPerDay = new Set(slots.map(x => x.split("|")[0])).size !== slots.length || sched.some((s, i) => sched.findIndex(o => o.day === s.day) !== i);

  const mark = (sid, v) => actions.mark(c.id, date, time, { [sid]: rec[sid] === v ? null : v }).catch(() => snack(t("try_again_msg"), "error"));
  const markAll = () => {
    const marks = {}; studs.forEach(s => { if (!rec[s.id]) marks[s.id] = "P"; });
    if (!Object.keys(marks).length) return;
    actions.mark(c.id, date, time, marks).then(() => snack(t("marked_all"))).catch(() => snack(t("try_again_msg"), "error"));
  };

  const meetingChip = (cl, tm, key, sub) => {
    const on = !nothingToday && cl.id === c.id && tm === time;
    return (
      <Chip key={key} onClick={() => go({ cid: cl.id, time: tm })} color={on ? "secondary" : "default"} variant={on ? "filled" : "outlined"} aria-pressed={on}
        icon={<Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: cl.color, ml: "10px !important" }} />}
        label={sub ? <span>{cl.name} <Box component="span" sx={{ opacity: 0.75, fontWeight: 400 }}>· {sub}</Box></span> : cl.name} />
    );
  };

  return (<>
    <SampleBanner />
    <SectionCard>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1.75 }}>
        <IconButton aria-label={t("previous")} onClick={() => go({ date: addDays(date, -1), cid: null, time: null })}><ChevronLeftRounded /></IconButton>
        <TextField size="small" type="date" value={date} onChange={e => e.target.value && go({ date: e.target.value, cid: null, time: null })} slotProps={{ htmlInput: { "aria-label": t("date") } }} />
        <IconButton aria-label={t("next")} onClick={() => go({ date: addDays(date, 1), cid: null, time: null })}><ChevronRightRounded /></IconButton>
        {date !== todayStr() && <Button size="small" onClick={() => go({ date: todayStr(), cid: null, time: null })}>{t("today")}</Button>}
        <Typography variant="body2" color="text.secondary">{dayLong(dow)}</Typography>
      </Stack>
      {scheduled.length > 0 && (
        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
          {scheduled.map(({ c: cl, s }) => meetingChip(cl, s.time, cl.id + s.time, fmtTime(s.time)))}
        </Stack>
      )}
      {off.length > 0 && (
        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", mt: 1 }}>
          {off.map(o => (
            <Chip key={o.c.id + o.s.time} disabled variant="outlined" sx={{ textDecoration: o.status === "cancelled" ? "line-through" : "none" }}
              label={`${o.c.name} · ${fmtTime(o.s.time)} · ${o.status === "cancelled" ? t("st_cancelled") : o.status === "break" ? t("st_break") : t("st_moved_away", { d: shortDate(o.change.newDate) })}`} />
          ))}
        </Stack>
      )}
      {extra.length > 0 && (<>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: scheduled.length ? 1.5 : 0, mb: 0.75 }}>{t("other_classes")}</Typography>
        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
          {extra.map(cl => meetingChip(cl, (D.scheduleAt(cl, date)[0] || cl.sessions[0] || { time: "16:00" }).time, cl.id, null))}
        </Stack>
      </>)}
    </SectionCard>

    {nothingToday ? <SectionCard><EmptyState icon={EventAvailableRounded} title={t("no_cls_on_day")} text={t("no_cls_on_day_p")} /></SectionCard> : (<>
    <SectionCard>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
        <ColorBar color={c.color} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" component="h2">{c.name}</Typography>
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, color: "text.secondary", fontSize: 13.5 }}>
            <ScheduleRounded sx={{ fontSize: 16 }} />
            {shortDate(date)} · {isScheduled ? `${fmtTime(time)}–${fmtTime(endTime(time, session.duration))}` : `${fmtTime(time)} · ${t("extra")}`}
          </Stack>
          {cur && cur.status !== "normal" && (
            <Pill tone="warn" icon={<EventRepeatRounded />} sx={{ mt: 0.75 }}>{cur.status === "moved" ? t("st_moved", { t: fmtTime(cur.origTime) }) : t("st_moved_in", { d: `${shortDate(cur.change.date)} ${fmtTime(cur.change.time)}` })}</Pill>
          )}
        </Box>
        {isScheduled && date >= todayStr() && (
          <Button size="small" startIcon={<EventRepeatRounded />} onClick={() => cur.status === "movedIn" ? open.changeMeeting(c.id, cur.change.date, cur.change.time) : open.changeMeeting(c.id, date, cur.origTime || time)}>{t("change_this")}</Button>
        )}
        {studs.length > 0 && <Button size="small" variant="tonal" startIcon={<DoneAllRounded />} onClick={markAll} disabled={!unmarked}>{t("mark_all")}</Button>}
      </Stack>
      {date > todayStr() && <Alert severity="warning" icon={<UpcomingRounded />} sx={{ mb: 1.5 }}>{t("future")}</Alert>}
      {loading ? <InlineLoader compact /> : studs.length ? (<>
        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", mb: 1 }}>
          <Pill tone="good">{t("n_present", { n: cnt.P })}</Pill><Pill tone="warn">{t("n_late", { n: cnt.L })}</Pill><Pill tone="bad">{t("n_absent", { n: cnt.A })}</Pill>
          {unmarked > 0 && <Pill>{t("n_unmarked", { n: unmarked })}</Pill>}
        </Stack>
        <List disablePadding>
          {studs.map(s => {
            const v = rec[s.id] || null;
            return (
              <ListItem key={s.id} divider disableGutters sx={{ gap: 1, flexWrap: { xs: "wrap", sm: "nowrap" }, py: 1.25, "&:last-child": { borderBottom: 0 } }}>
                <ListItemAvatar sx={{ minWidth: 52 }}><StudentAvatar name={s.name} /></ListItemAvatar>
                <ListItemText sx={{ minWidth: 0, flex: "1 1 140px" }} primary={s.name} secondary={t("pct_month", { p: pct(attStats(classRows, s.id).rate) })} slotProps={{ primary: { noWrap: true, fontWeight: 500 } }} />
                <ToggleButtonGroup exclusive size="small" value={v} aria-label={s.name} sx={{ ml: { xs: 6.5, sm: 0 }, flex: "none" }}>
                  {["P", "L", "A"].map(key => {
                    const col = key === "P" ? [k.goodBg, k.good] : key === "L" ? [k.warnBg, k.warn] : [k.badBg, k.bad];
                    return (
                      <ToggleButton key={key} value={key} onClick={() => mark(s.id, key)} sx={{ px: { xs: 1.25, sm: 1.75 }, gap: 0.5, borderRadius: 5, "&.Mui-selected, &.Mui-selected:hover": { bgcolor: col[0], color: col[1] } }}>
                        {v === key && <CheckRounded sx={{ fontSize: 18 }} />}{t(MK[key])}
                      </ToggleButton>
                    );
                  })}
                </ToggleButtonGroup>
              </ListItem>
            );
          })}
        </List>
      </>) : <EmptyState icon={GroupOffRounded} title={t("no_studs_class")} text={t("no_studs_class_p", { c: c.name })} action={<Button variant="contained" startIcon={<PersonAddRounded />} onClick={() => open.studentForm(null, c.id)}>{t("add_student")}</Button>} />}
    </SectionCard>

    {studs.length > 0 && slots.length > 0 && (
      <SectionCard icon={CalendarViewMonthRounded} title={t("register", { m: monthLabel(ym) })}>
        <TableContainer>
          <Table size="small" sx={{ "& td, & th": { px: 0.75, textAlign: "center", whiteSpace: "nowrap", borderColor: k.outlineVariant }, "& td:first-of-type, & th:first-of-type": { textAlign: "left", position: "sticky", left: 0, bgcolor: "background.paper", pr: 1.75, zIndex: 1 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "text.secondary" }}>{t("student")}</TableCell>
                {slots.map(x => { const [d, tm] = x.split("|"); const sel = d === date && tm === time; return (
                  <TableCell key={x} sx={{ color: sel ? "primary.main" : "text.secondary", fontWeight: sel ? 700 : 500, fontSize: 12, lineHeight: 1.25, cursor: "pointer" }} onClick={() => go({ date: d, time: tm, cid: c.id })}>
                    {dayShort(parseD(d).getDay())}<br />{+d.slice(8)}{multiPerDay && <><br /><Box component="span" sx={{ fontSize: 10.5 }}>{fmtTime(tm).replace(":00", "")}</Box></>}
                  </TableCell>); })}
                <TableCell sx={{ color: "text.secondary" }}>{t("rate")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {studs.map(s => (
                <TableRow key={s.id}>
                  <TableCell sx={{ fontSize: 13 }}>{s.name}</TableCell>
                  {slots.map(x => {
                    const [d, tm] = x.split("|"); const v = (idx.get(slotKey(c.id, d, tm)) || {})[s.id];
                    const col = v === "P" ? [k.goodBg, k.good] : v === "L" ? [k.warnBg, k.warn] : v === "A" ? [k.badBg, k.bad] : ["transparent", k.outline];
                    return <TableCell key={x}><Tooltip title={v ? t(MK[v]) : t("not_marked")}><Box sx={{ width: 22, height: 22, borderRadius: 1.5, display: "inline-grid", placeItems: "center", fontWeight: 700, fontSize: 11, bgcolor: col[0], color: col[1] }}>{v ? t(MK[v]).slice(0, lang === "en" ? 1 : 2) : "·"}</Box></Tooltip></TableCell>;
                  })}
                  <TableCell className="num" sx={{ fontWeight: 700, fontSize: 13 }}>{pct(attStats(classRows, s.id).rate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>
    )}
    </>)}
  </>);
}

// Timetable changes: change/cancel one class, holiday breaks, stopping a class – and telling families.
import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useI18n } from "../i18n/index.jsx";
import { useDomain, useActions } from "../state/data.jsx";
import { useDialogs, useSnack, useLoading, useCopy } from "../state/ui.jsx";
import { StudentAvatar, MessageBox, MessageActions, LangTag, Pill, tones } from "../components/common.jsx";
import { todayStr, addDays, fmtTime } from "../lib/dates.js";
import { CloseRounded, EventBusyRounded, ScheduleRounded, EventRepeatRounded, BeachAccessRounded, StopCircleRounded, PlayCircleRounded, EditRounded, MoreVertRounded, UndoRounded, ForumRounded, CampaignRounded } from "../icons.jsx";

/* ---------- shared bits ---------- */
function Shell({ title, onClose, children, actions, onSubmit }) {
  const theme = useTheme(); const phone = useMediaQuery(theme.breakpoints.down("sm")); const { t } = useI18n();
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" fullScreen={phone}
      slotProps={{ paper: { component: onSubmit ? "form" : "div", onSubmit: onSubmit ? e => { e.preventDefault(); onSubmit(); } : undefined, noValidate: true, sx: phone ? { borderRadius: 0 } : undefined } }}>
      <DialogTitle component="div" sx={{ display: "flex", alignItems: "center", gap: 1, pr: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>{title}</Box>
        <IconButton onClick={onClose} aria-label={t("close")}><CloseRounded /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>{children}</DialogContent>
      {actions && <DialogActions sx={{ p: 2.5, pt: 1.5, gap: 1, flexWrap: "wrap" }}>{actions}</DialogActions>}
    </Dialog>
  );
}

const Title = ({ c, children }) => (
  <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
    <Box sx={{ width: 6, height: 28, borderRadius: 3, bgcolor: c.color, flex: "none" }} />
    <Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ fontWeight: 600, fontSize: 20, fontFamily: "inherit" }}>{children}</Typography><Typography noWrap variant="body2" color="text.secondary">{c.name}</Typography></Box>
  </Stack>
);

function useSave() {
  const withLoading = useLoading(); const snack = useSnack(); const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const run = async fn => {
    if (busy) return null;
    setBusy(true);
    try { return await withLoading(fn); } catch { snack(t("try_again_msg"), "error"); return null; } finally { setBusy(false); }
  };
  return [busy, run];
}

/** One-line description of a change, e.g. "Mon 16 Nov · 3:30 PM → 5:30 PM" */
export function useChangeText() {
  const { t, shortDate } = useI18n();
  return ch => {
    if (ch.kind === "cancel") return { icon: EventBusyRounded, tone: "bad", label: t("kind_cancel"), text: `${shortDate(ch.date)} · ${fmtTime(ch.time)}` };
    if (ch.kind === "move") return {
      icon: EventRepeatRounded, tone: "warn", label: t("kind_move"),
      text: ch.newDate === ch.date ? `${shortDate(ch.date)} · ${fmtTime(ch.time)} → ${fmtTime(ch.newTime)}` : `${shortDate(ch.date)} ${fmtTime(ch.time)} → ${shortDate(ch.newDate)} ${fmtTime(ch.newTime)}`,
    };
    return { icon: BeachAccessRounded, tone: "info", label: t("kind_break"), text: `${shortDate(ch.date)} – ${shortDate(ch.newDate)}` };
  };
}

/* ---------- tell families ---------- */
/** info: { kind: "cancel"|"move"|"break"|"schedule"|"stop", c, ...details }, logKey: identifies this change in the reminder log */
export function NotifyDialog({ info, logKey, onClose }) {
  const D = useDomain(); const { t, lang } = useI18n(); const copy = useCopy(t);
  const c = D.classById(info.c.id) || info.c;
  const studs = D.affectedBy(c);
  const told = studs.filter(s => D.lastReminder(s.id, "change", logKey)).length;
  const group = D.changeMsg({ ...info, c }, null, lang, true);
  const theme = useTheme(), k = tones(theme);
  return (
    <Shell title={<Title c={c}>{t("notify_title")}</Title>} onClose={onClose}
      actions={<Button variant="contained" onClick={onClose}>{t("done")}</Button>}>
      <Typography color="text.secondary">{t("notify_p")}</Typography>
      <Box sx={{ border: `1px solid ${k.outlineVariant}`, borderRadius: 4, p: 1.75 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", rowGap: 1 }}>
          <Typography sx={{ fontWeight: 600 }}>{t("copy_group")}</Typography>
          <Button size="small" variant="tonal" startIcon={<ForumRounded />} onClick={() => copy(group, t("msg_copied"))}>{t("copy")}</Button>
        </Stack>
        <MessageBox>{group}</MessageBox>
      </Box>
      {studs.length ? (<>
        <Pill tone={told === studs.length ? "good" : "none"} sx={{ alignSelf: "flex-start" }}>{t("n_notified", { a: told, b: studs.length })}</Pill>
        {studs.map(s => {
          const msg = D.changeMsg({ ...info, c }, s);
          const done = D.lastReminder(s.id, "change", logKey);
          return (
            <Box key={s.id} sx={{ borderTop: `1px solid ${k.outlineVariant}`, pt: 1.75 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <StudentAvatar name={s.name} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 500 }}>{s.parent || s.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{t("parent_of", { n: s.name })}{done && <Box component="span" sx={{ color: "success.main" }}> · ✓</Box>}</Typography>
                </Box>
                <LangTag lg={D.famLang(s)} />
              </Stack>
              <MessageBox>{msg}</MessageBox>
              <MessageActions D={D} s={s} msg={msg} type="change" logKey={logKey} />
            </Box>
          );
        })}
      </>) : <Alert severity="info">{t("no_one_notify")}</Alert>}
    </Shell>
  );
}

/* ---------- change or cancel one class ---------- */
export function ChangeMeetingDialog({ cid, date, time, onClose }) {
  const phone = useMediaQuery(useTheme().breakpoints.down("sm"));
  const D = useDomain(); const { t, shortDate } = useI18n(); const actions = useActions(); const snack = useSnack(); const dlg = useDialogs();
  const [classId, setClassId] = useState(cid || D.classes[0]?.id);
  const c = D.classById(classId);
  const upcoming = c ? D.upcomingOf(c.id, todayStr(), 56).filter(o => o.status !== "break") : [];
  // meetings are identified by their date + ORIGINAL start time
  const keyOf = o => `${o.date}|${o.origTime || o.s.time}`;
  const initial = date && time ? `${date}|${time}` : upcoming[0] ? keyOf(upcoming[0]) : "";
  const [sel, setSel] = useState(initial);
  const meeting = upcoming.find(o => keyOf(o) === sel) || (sel && { date: sel.split("|")[0], s: { time: sel.split("|")[1], duration: 60 }, status: "normal" });
  const [mDate, mTime] = sel ? sel.split("|") : [null, null];
  const existing = mDate && D.changes.find(x => x.cid === classId && x.kind !== "break" && x.date === mDate && x.time === mTime);
  const [kind, setKind] = useState("cancel");
  const [newDate, setNewDate] = useState(mDate || todayStr());
  const [newTime, setNewTime] = useState(mTime || "16:00");
  const [note, setNote] = useState("");
  const [busy, run] = useSave();
  const pick = v => { setSel(v); const [d, tm] = v.split("|"); setNewDate(d); setNewTime(tm); };

  const statusText = o => o.status === "cancelled" ? ` · ${t("st_cancelled")}` : o.status === "moved" ? ` · ${t("st_moved", { t: fmtTime(o.origTime) })}` : o.status === "movedAway" ? ` · ${t("st_moved_away", { d: shortDate(o.change.newDate) })}` : "";
  const save = async () => {
    if (!mDate) return;
    const body = { kind: kind === "cancel" ? "cancel" : "move", date: mDate, time: mTime, note,
      ...(kind !== "cancel" ? { newDate: kind === "time" ? mDate : newDate, newTime, newDuration: meeting?.s?.duration ?? null } : {}) };
    const ch = await run(() => actions.addChange(classId, body));
    if (!ch) return;
    snack(t("change_saved"));
    dlg.replace(close => <NotifyDialog info={{ ...ch, c }} logKey={ch.id} onClose={close} />);
  };
  const undo = async () => {
    const ok = await run(() => actions.deleteChange(existing.id));
    if (ok !== null) { snack(t("change_removed")); onClose(); }
  };
  if (!c) return null;
  return (
    <Shell title={<Title c={c}>{t("change_class")}</Title>} onClose={onClose} onSubmit={save}
      actions={<>
        {existing && <Button startIcon={<UndoRounded />} onClick={undo} sx={{ mr: "auto" }} disabled={busy}>{t("undo_change")}</Button>}
        <Button onClick={onClose}>{t("cancel")}</Button>
        <Button type="submit" variant="contained" startIcon={<CampaignRounded />} disabled={busy || !mDate}>{t("save_notify")}</Button>
      </>}>
      {!cid && (
        <TextField select label={t("class_lbl")} value={classId} onChange={e => { setClassId(e.target.value); setSel(""); }}>
          {D.classes.map(x => <MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>)}
        </TextField>
      )}
      {upcoming.length || sel ? (
        <TextField select label={t("which_class")} value={sel} onChange={e => pick(e.target.value)}>
          {sel && !upcoming.some(o => keyOf(o) === sel) && <MenuItem value={sel}>{shortDate(mDate)} · {fmtTime(mTime)}</MenuItem>}
          {upcoming.map(o => <MenuItem key={keyOf(o)} value={keyOf(o)}>{shortDate(o.date)} · {fmtTime(o.origTime || o.s.time)}{statusText(o)}</MenuItem>)}
        </TextField>
      ) : <Alert severity="info">{t("no_upcoming")}</Alert>}
      {existing && <Alert severity="warning">{t("kind_" + existing.kind)}: {existing.kind === "move" ? `${fmtTime(existing.time)} → ${existing.newDate !== existing.date ? shortDate(existing.newDate) + " " : ""}${fmtTime(existing.newTime)}` : `${shortDate(existing.date)} ${fmtTime(existing.time)}`}</Alert>}
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>{t("what_change")}</Typography>
        <ToggleButtonGroup exclusive color="primary" value={kind} onChange={(e, v) => v && setKind(v)} orientation={phone ? "vertical" : "horizontal"} fullWidth={phone}>
          <ToggleButton value="cancel" sx={{ gap: 0.75, px: 1.75 }}><EventBusyRounded fontSize="small" />{t("opt_cancel")}</ToggleButton>
          <ToggleButton value="time" sx={{ gap: 0.75, px: 1.75 }}><ScheduleRounded fontSize="small" />{t("opt_time")}</ToggleButton>
          <ToggleButton value="move" sx={{ gap: 0.75, px: 1.75 }}><EventRepeatRounded fontSize="small" />{t("opt_move")}</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {kind !== "cancel" && (
        <Stack direction="row" spacing={2}>
          {kind === "move" && <TextField type="date" label={t("new_date")} value={newDate} onChange={e => setNewDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }} />}
          <TextField type="time" label={t("new_time")} value={newTime} onChange={e => setNewTime(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }} />
        </Stack>
      )}
      <TextField label={t("note_opt")} value={note} onChange={e => setNote(e.target.value)} placeholder={t("note_ph")} slotProps={{ htmlInput: { maxLength: 300 } }} />
      <Typography variant="body2" color="text.secondary">{t("only_this")}</Typography>
    </Shell>
  );
}

/* ---------- holiday break ---------- */
export function BreakDialog({ cid, onClose }) {
  const D = useDomain(); const { t } = useI18n(); const actions = useActions(); const snack = useSnack(); const dlg = useDialogs();
  const c = D.classById(cid);
  const [from, setFrom] = useState(addDays(todayStr(), 7)); const [to, setTo] = useState(addDays(todayStr(), 20)); const [note, setNote] = useState("");
  const [busy, run] = useSave();
  const bad = !from || !to || to < from;
  const save = async () => {
    if (bad) return;
    const ch = await run(() => actions.addChange(cid, { kind: "break", date: from, newDate: to, note }));
    if (!ch) return;
    snack(t("change_saved"));
    dlg.replace(close => <NotifyDialog info={{ ...ch, c }} logKey={ch.id} onClose={close} />);
  };
  return (
    <Shell title={<Title c={c}>{t("pause_class")}</Title>} onClose={onClose} onSubmit={save}
      actions={<><Button onClick={onClose}>{t("cancel")}</Button><Button type="submit" variant="contained" startIcon={<CampaignRounded />} disabled={busy || bad}>{t("save_notify")}</Button></>}>
      <Typography color="text.secondary">{t("break_p")}</Typography>
      <Stack direction="row" spacing={2}>
        <TextField type="date" label={t("first_off")} value={from} onChange={e => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }} />
        <TextField type="date" label={t("last_off")} value={to} onChange={e => setTo(e.target.value)} error={!!to && to < from} slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }} />
      </Stack>
      <TextField label={t("note_opt")} value={note} onChange={e => setNote(e.target.value)} placeholder={t("note_ph")} />
    </Shell>
  );
}

/* ---------- stop / restart a class ---------- */
export function StopDialog({ cid, onClose }) {
  const D = useDomain(); const { t, longDate } = useI18n(); const actions = useActions(); const snack = useSnack(); const dlg = useDialogs();
  const c = D.classById(cid);
  const last = D.upcomingOf(cid, todayStr(), 35).filter(o => o.status === "normal").slice(-1)[0];
  const [date, setDate] = useState(c.endsOn || (last ? last.date : todayStr()));
  const [busy, run] = useSave();
  const save = async () => {
    const r = await run(() => actions.endClass(cid, date));
    if (!r) return;
    snack(t("ends_on", { d: longDate(date) }));
    dlg.replace(close => <NotifyDialog info={{ kind: "stop", c: r, date }} logKey={`stop|${cid}|${date}`} onClose={close} />);
  };
  const restart = async () => { const r = await run(() => actions.endClass(cid, null)); if (r) { snack(t("class_restarted")); onClose(); } };
  return (
    <Shell title={<Title c={c}>{t("stop_class")}</Title>} onClose={onClose} onSubmit={save}
      actions={<>
        {c.endsOn && <Button startIcon={<PlayCircleRounded />} onClick={restart} sx={{ mr: "auto" }} disabled={busy}>{t("restart_class")}</Button>}
        <Button onClick={onClose}>{t("cancel")}</Button>
        <Button type="submit" color="error" variant="contained" startIcon={<StopCircleRounded />} disabled={busy || !date}>{t("save_notify")}</Button>
      </>}>
      <Typography color="text.secondary">{t("stop_p")}</Typography>
      <TextField type="date" label={t("last_day")} value={date} onChange={e => setDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
    </Shell>
  );
}

/* ---------- list of upcoming changes for a class (or all classes) ---------- */
export function ChangeList({ cid, dense }) {
  const D = useDomain(); const { t, shortDate } = useI18n(); const dlg = useDialogs(); const actions = useActions(); const snack = useSnack();
  const describe = useChangeText();
  const today = todayStr();
  const list = D.changes.filter(x => (!cid || x.cid === cid) && (x.newDate || x.date) >= today && (x.kind === "break" || x.date >= addDays(today, -1) || x.newDate >= today));
  if (!list.length) return null;
  return (
    <Stack spacing={0.75}>
      {list.map(ch => {
        const d = describe(ch); const c = D.classById(ch.cid); const studs = D.affectedBy(c);
        const told = studs.filter(s => D.lastReminder(s.id, "change", ch.id)).length;
        return (
          <Stack key={ch.id} direction="row" spacing={1} sx={{ alignItems: "flex-start", fontSize: 13.5, minWidth: 0, "& > *": { mt: "2px" } }}>
            <Pill tone={d.tone} icon={<d.icon />} sx={{ height: 24, fontSize: 12, flex: "none" }}>{d.label}</Pill>
            <Box sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }} title={ch.note || undefined}>
              {!cid && <b>{c?.name} · </b>}{d.text}
            </Box>
            {!dense && studs.length > 0 && <Typography variant="caption" color={told === studs.length ? "success.main" : "text.secondary"} sx={{ flex: "none" }}>{told}/{studs.length}</Typography>}
            <Tooltip title={t("notify")}><IconButton size="small" aria-label={`${t("notify")}: ${d.label} ${shortDate(ch.date)}`} onClick={() => dlg.open(close => <NotifyDialog info={{ ...ch, c }} logKey={ch.id} onClose={close} />)}><CampaignRounded fontSize="small" /></IconButton></Tooltip>
            <Tooltip title={t("undo_change")}><IconButton size="small" aria-label={`${t("undo_change")}: ${d.label} ${shortDate(ch.date)}`} onClick={() => actions.deleteChange(ch.id).then(() => snack(t("change_removed"))).catch(() => snack(t("try_again_msg"), "error"))}><UndoRounded fontSize="small" /></IconButton></Tooltip>
          </Stack>
        );
      })}
    </Stack>
  );
}

/* ---------- ⋮ menu on a class card ---------- */
export function ClassMenu({ c, onEdit }) {
  const { t } = useI18n(); const dlg = useDialogs();
  const [el, setEl] = useState(null);
  const go = render => { setEl(null); dlg.open(render); };
  return (<>
    <Tooltip title={t("more_options")}><IconButton aria-label={`${t("more_options")}: ${c.name}`} onClick={e => setEl(e.currentTarget)}><MoreVertRounded /></IconButton></Tooltip>
    <Menu anchorEl={el} open={!!el} onClose={() => setEl(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
      <MenuItem onClick={() => { setEl(null); onEdit(); }}><ListItemIcon><EditRounded fontSize="small" /></ListItemIcon><ListItemText>{t("edit")}</ListItemText></MenuItem>
      <MenuItem onClick={() => go(close => <ChangeMeetingDialog cid={c.id} onClose={close} />)}><ListItemIcon><EventRepeatRounded fontSize="small" /></ListItemIcon><ListItemText>{t("change_this")}</ListItemText></MenuItem>
      <MenuItem onClick={() => go(close => <BreakDialog cid={c.id} onClose={close} />)}><ListItemIcon><BeachAccessRounded fontSize="small" /></ListItemIcon><ListItemText>{t("pause_class")}</ListItemText></MenuItem>
      <MenuItem onClick={() => go(close => <StopDialog cid={c.id} onClose={close} />)}>
        <ListItemIcon>{c.endsOn ? <PlayCircleRounded fontSize="small" /> : <StopCircleRounded fontSize="small" />}</ListItemIcon>
        <ListItemText>{c.endsOn ? t("restart_class") : t("stop_class")}</ListItemText>
      </MenuItem>
    </Menu>
  </>);
}


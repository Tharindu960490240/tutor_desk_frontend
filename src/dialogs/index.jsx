import { useMemo, useState } from "react";
import { display } from "../theme.js";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Box, IconButton, MenuItem, Typography, Chip, ToggleButton, ToggleButtonGroup, FormLabel, useMediaQuery, Tooltip, List, ListItem, ListItemIcon, ListItemText, Alert, Checkbox, FormControlLabel } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useI18n, LANGS, LANG_NAMES, longDateIn } from "../i18n/index.jsx";
import { useDomain, useActions, useAttendance } from "../state/data.jsx";
import { useDialogs, useSnack, useConfirm, useCopy, useLoading } from "../state/ui.jsx";
import { CLASS_COLORS, METHODS, attStats, pct } from "../lib/domain.js";
import { todayStr, curYm, addMonths, fmtTime } from "../lib/dates.js";
import { StudentAvatar, MessageBox, MessageActions, Pill, tones } from "../components/common.jsx";
import { NotifyDialog, ChangeMeetingDialog, BreakDialog, StopDialog } from "./schedule.jsx";
import { AddCardRounded, AddRounded, CallRounded, CheckCircleRounded, CheckRounded, CloseRounded, ContentCopyRounded, DeleteRounded, EditRounded, EventRounded, FamilyRestroomRounded, LogoutRounded, NotificationsRounded, ReceiptRounded, ScheduleRounded, SellRounded, TranslateRounded, UndoRounded, WhatsApp } from "../icons.jsx";

/* ---------- shell ---------- */
function Shell({ title, onClose, children, actions, wide, onSubmit }) {
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("sm"));
  const { t } = useI18n();
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth={wide ? "md" : "sm"} fullScreen={phone}
      slotProps={{ paper: { component: onSubmit ? "form" : "div", onSubmit: onSubmit ? e => { e.preventDefault(); onSubmit(); } : undefined, noValidate: true, sx: phone ? { borderRadius: 0 } : undefined } }}>
      <DialogTitle component="div" sx={{ display: "flex", alignItems: "center", gap: 1, pr: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>{title}</Box>
        <IconButton onClick={onClose} aria-label={t("close")}><CloseRounded /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "20px !important" }}>{children}</DialogContent>
      {actions && <DialogActions sx={{ p: 2.5, pt: 1.5, gap: 1, flexWrap: "wrap" }}>{actions}</DialogActions>}
    </Dialog>
  );
}

const Row = ({ children }) => <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>{children}</Box>;

function useSaver() {
  const snack = useSnack();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const withLoading = useLoading();
  const run = async fn => {
    if (busy) return;
    setBusy(true);
    try { return await withLoading(fn); }
    catch (e) { snack(e.code === "network" ? t("err_p") : t("try_again_msg"), "error"); throw e; }
    finally { setBusy(false); }
  };
  return [busy, run];
}

/* ---------- student form ---------- */
export function StudentForm({ sid, defaultClassId, onClose }) {
  const theme = useTheme();
  const D = useDomain(); const { t, lang } = useI18n(); const actions = useActions(); const snack = useSnack(); const confirm = useConfirm(t);
  const s0 = sid ? D.studentById(sid) : null;
  const [f, setF] = useState(() => s0 ? { ...s0, fee: s0.fee || "" } : {
    name: "", parent: "", parentPhone: "", phone: "", joined: todayStr(), notes: "", lang,
    classIds: defaultClassId ? [defaultClassId] : [], admissionWaived: [], fee: defaultClassId ? D.classById(defaultClassId)?.fee || "" : "",
  });
  const [autoFee, setAutoFee] = useState(!s0);
  const [err, setErr] = useState(false);
  const [busy, run] = useSaver();
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const toggleClass = id => setF(x => {
    const ids = x.classIds.includes(id) ? x.classIds.filter(i => i !== id) : [...x.classIds, id];
    return { ...x, classIds: ids, ...(autoFee ? { fee: ids.reduce((a, i) => a + (+D.classById(i)?.fee || 0), 0) || "" } : {}) };
  });
  const submit = () => {
    if (!f.name.trim()) { setErr(true); return; }
    run(async () => {
      const body = { name: f.name, parent: f.parent, parentPhone: f.parentPhone, phone: f.phone, joined: f.joined || undefined, notes: f.notes, lang: f.lang, classIds: f.classIds,
        admissionWaived: (f.admissionWaived || []).filter(id => f.classIds.includes(id)), fee: +f.fee || 0 };
      await actions.saveStudent(s0?.id, body);
      snack(s0 ? t("saved_changes") : t("added", { n: f.name.trim() }));
      onClose();
    }).catch(() => {});
  };
  const del = async () => {
    if (!(await confirm(t("del_student_q"), t("del_student_p", { n: s0.name }), t("delete"), true))) return;
    run(async () => { await actions.deleteStudent(s0.id); snack(t("deleted", { n: s0.name })); onClose(); }).catch(() => {});
  };
  return (
    <Shell wide title={s0 ? t("edit_student") : t("add_student")} onClose={onClose} onSubmit={submit}
      actions={<>
        {s0 && <Button color="error" startIcon={<DeleteRounded />} onClick={del} sx={{ mr: "auto" }}>{t("delete")}</Button>}
        <Button onClick={onClose}>{t("cancel")}</Button>
        <Button type="submit" variant="contained" disabled={busy}>{s0 ? t("save") : t("add_student")}</Button>
      </>}>
      <TextField label={t("f_name")} value={f.name} onChange={e => { set("name", e.target.value); setErr(false); }} autoFocus required error={err} helperText={err ? t("f_name_err") : undefined} autoComplete="off" />
      <Row>
        <TextField label={t("f_parent")} value={f.parent} onChange={e => set("parent", e.target.value)} autoComplete="off" />
        <TextField label={t("f_pphone")} type="tel" value={f.parentPhone} onChange={e => set("parentPhone", e.target.value)} placeholder="077 123 4567" />
      </Row>
      <Row>
        <TextField label={t("f_phone")} type="tel" value={f.phone} onChange={e => set("phone", e.target.value)} />
        <TextField label={t("f_joined")} type="date" value={f.joined || ""} onChange={e => set("joined", e.target.value)} helperText={t("f_joined_hint")} slotProps={{ inputLabel: { shrink: true } }} />
      </Row>
      <Box>
        <FormLabel sx={{ fontSize: 13, fontWeight: 500, display: "block", mb: 1 }}>{t("f_classes")}</FormLabel>
        {D.classes.length ? (
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            {D.classes.map(c => {
              const on = f.classIds.includes(c.id);
              return <Chip key={c.id} label={c.name} onClick={() => toggleClass(c.id)} color={on ? "secondary" : "default"} variant={on ? "filled" : "outlined"} aria-pressed={on}
                icon={on ? <CheckRounded /> : <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: c.color, ml: "10px !important" }} />} />;
            })}
          </Stack>
        ) : <Typography variant="body2" color="text.secondary">{t("f_no_classes")}</Typography>}
      </Box>
      {(() => {
        const admClasses = f.classIds.map(id => D.classById(id)).filter(c => c && +c.admissionFee > 0);
        if (!admClasses.length) return null;
        const paid = s0 ? Object.fromEntries(D.admissionsFor(s0).map(a => [a.c.id, a])) : {};
        return (
          <Box sx={{ border: `1px solid ${tones(theme).outlineVariant}`, borderRadius: 4, p: 1.75 }}>
            <Typography sx={{ fontWeight: 600 }}>{t("adm_section")}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{t("adm_section_p")}</Typography>
            {admClasses.map(c => {
              const waived = (f.admissionWaived || []).includes(c.id);
              const a = paid[c.id];
              return (
                <Stack key={c.id} direction="row" sx={{ alignItems: "center", gap: 1, py: 0.5, flexWrap: "wrap" }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: c.color }} />
                  <Typography sx={{ flex: 1, minWidth: 140 }}>{c.name} · <b className="num">{D.money(c.admissionFee)}</b></Typography>
                  {a && a.paid >= a.fee ? <Pill tone="good" icon={<CheckCircleRounded />}>{t("st_paid")}</Pill> : (
                    <FormControlLabel sx={{ mr: 0 }} control={<Checkbox size="small" checked={waived}
                      onChange={e => setF(x => ({ ...x, admissionWaived: e.target.checked ? [...(x.admissionWaived || []), c.id] : (x.admissionWaived || []).filter(v => v !== c.id) }))} />}
                      label={<Typography variant="body2">{t("adm_waive")}</Typography>} />
                  )}
                </Stack>
              );
            })}
          </Box>
        );
      })()}
      <Row>
        <TextField label={t("f_fee", { c: D.settings.currency })} type="number" value={f.fee} onChange={e => { setAutoFee(false); set("fee", e.target.value); }} helperText={t("f_fee_hint")} slotProps={{ htmlInput: { min: 0, step: "0.01" } }} />
        <Box>
          <FormLabel sx={{ fontSize: 13, fontWeight: 500, display: "block", mb: 1 }}>{t("f_lang")}</FormLabel>
          <ToggleButtonGroup exclusive size="small" value={f.lang} onChange={(e, v) => v && set("lang", v)} color="primary">
            {LANGS.map(l => <ToggleButton key={l} value={l} sx={{ px: 1.75 }}>{LANG_NAMES[l]}</ToggleButton>)}
          </ToggleButtonGroup>
        </Box>
      </Row>
      <TextField label={t("f_notes")} multiline minRows={3} value={f.notes} onChange={e => set("notes", e.target.value)} placeholder={t("f_notes_ph")} />
    </Shell>
  );
}

/* ---------- class form with weekly sessions ---------- */
export function ClassForm({ cid, onClose }) {
  const D = useDomain(); const { t, dayLong, dayShort } = useI18n(); const actions = useActions(); const snack = useSnack(); const confirm = useConfirm(t);
  const theme = useTheme(), k = tones(theme);
  const dlg = useDialogs();
  const c0 = cid ? D.classById(cid) : null;
  // edit the newest timetable: an already-planned future one, otherwise today's
  const upcoming = c0 ? D.upcomingSchedule(c0) : null;
  const baseSessions = c0 ? (upcoming ? upcoming.sessions : D.scheduleAt(c0, todayStr())).map(s => ({ day: s.day, time: s.time, duration: s.duration })) : [];
  const sig = list => list.map(s => `${s.day}|${s.time}|${+s.duration || 0}`).sort().join(",");
  const [f, setF] = useState(() => c0 ? { ...c0, fee: c0.fee || "", admissionFee: c0.admissionFee || "", sessions: baseSessions } : {
    name: "", subject: "", level: "", location: "", fee: "", admissionFee: "", color: CLASS_COLORS[D.classes.length % CLASS_COLORS.length],
    sessions: [{ day: 1, time: "16:00", duration: 60 }],
  });
  const [effFrom, setEffFrom] = useState(upcoming ? upcoming.from : todayStr());
  const [fixMistake, setFixMistake] = useState(false);
  const [q, setQ] = useState({ days: [], time: "16:00", duration: 60 });
  const schedChanged = !!c0 && sig(f.sessions) !== sig(baseSessions);
  const [err, setErr] = useState(false);
  const [busy, run] = useSaver();
  const set = (key, v) => setF(x => ({ ...x, [key]: v }));
  const setSes = (i, key, v) => setF(x => ({ ...x, sessions: x.sessions.map((s, j) => (j === i ? { ...s, [key]: v } : s)) }));
  const addSes = () => setF(x => {
    const last = x.sessions[x.sessions.length - 1];
    return { ...x, sessions: [...x.sessions, last ? { ...last, day: (last.day + 1) % 7 } : { day: 1, time: "16:00", duration: 60 }] };
  });
  const delSes = i => setF(x => ({ ...x, sessions: x.sessions.filter((s, j) => j !== i) }));
  const quickAdd = () => {
    if (!q.days.length) return;
    setF(x => ({ ...x, sessions: [...x.sessions, ...q.days.map(day => ({ day, time: q.time, duration: +q.duration || 0 }))]
      .sort((a, b) => (a.day + 6) % 7 - (b.day + 6) % 7 || a.time.localeCompare(b.time)) }));
    setQ(x => ({ ...x, days: [] }));
  };
  const perDay = useMemo(() => { const m = {}; f.sessions.forEach(s => { m[s.day] = (m[s.day] || 0) + 1; }); return m; }, [f.sessions]);

  const submit = () => {
    if (!f.name.trim()) { setErr(true); return; }
    run(async () => {
      const sessions = f.sessions.filter(s => /^\d\d:\d\d$/.test(s.time || "")).map(s => ({ day: +s.day, time: s.time, duration: +s.duration || 0 }));
      const permanent = schedChanged && !fixMistake;
      const saved = await actions.saveClass(c0?.id, {
        name: f.name, subject: f.subject, level: f.level, location: f.location, fee: +f.fee || 0, admissionFee: +f.admissionFee || 0, color: f.color, sessions,
        ...(permanent ? { effectiveFrom: effFrom || todayStr() } : {}),
      });
      snack(c0 ? t("saved_changes") : t("added", { n: f.name.trim() }));
      if (permanent && D.affectedBy(saved).length) {
        const from = effFrom || todayStr();
        dlg.replace(close => <NotifyDialog info={{ kind: "schedule", c: saved, from, sessions }} logKey={`sched|${saved.id}|${from}`} onClose={close} />);
      } else onClose();
    }).catch(() => {});
  };
  const del = async () => {
    if (!(await confirm(t("del_class_q"), t("del_class_p", { c: c0.name }), t("delete"), true))) return;
    run(async () => { await actions.deleteClass(c0.id); snack(t("class_deleted")); onClose(); }).catch(() => {});
  };

  return (
    <Shell wide title={c0 ? t("edit_class") : t("add_class")} onClose={onClose} onSubmit={submit}
      actions={<>
        {c0 && <Button color="error" startIcon={<DeleteRounded />} onClick={del} sx={{ mr: "auto" }}>{t("delete")}</Button>}
        <Button onClick={onClose}>{t("cancel")}</Button>
        <Button type="submit" variant="contained" disabled={busy}>{c0 ? t("save") : t("add_class")}</Button>
      </>}>
      <TextField label={t("c_name")} value={f.name} onChange={e => { set("name", e.target.value); setErr(false); }} placeholder={t("c_name_ph")} autoFocus required error={err} helperText={err ? t("c_name_err") : undefined} autoComplete="off" />
      <Row>
        <TextField label={t("c_subject")} value={f.subject} onChange={e => set("subject", e.target.value)} />
        <TextField label={t("c_level")} value={f.level} onChange={e => set("level", e.target.value)} />
      </Row>

      <Box sx={{ border: `1px solid ${k.outlineVariant}`, borderRadius: 4, p: { xs: 1.5, sm: 2 }, bgcolor: k.surface2 }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 0.5 }}>
          <ScheduleRounded color="primary" />
          <Typography sx={{ fontWeight: 600, flex: 1 }}>{t("schedule")}</Typography>
          <Typography variant="body2" color="text.secondary">{f.sessions.length ? t("per_week", { n: f.sessions.length }) : t("no_sessions")}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{t("schedule_hint")}</Typography>
        <Stack spacing={1.25}>
          {f.sessions.map((s, i) => (
            <Box key={i} sx={{ bgcolor: "background.paper", borderRadius: 3, p: 1 }}>
              <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: { xs: "wrap", sm: "nowrap" } }}>
                <TextField select size="small" label={t("day")} value={s.day} onChange={e => setSes(i, "day", +e.target.value)} sx={{ flex: { xs: "1 1 100%", sm: "1.3 1 0" }, minWidth: 0 }}>
                  {[1, 2, 3, 4, 5, 6, 0].map(d => <MenuItem key={d} value={d}>{dayLong(d)}</MenuItem>)}
                </TextField>
                <TextField size="small" type="time" label={t("c_time")} value={s.time} onChange={e => setSes(i, "time", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: "1 1 118px", minWidth: 112 }} />
                <TextField size="small" type="number" label={t("c_dur")} value={s.duration} onChange={e => setSes(i, "duration", e.target.value)} slotProps={{ htmlInput: { min: 0, step: 5 } }} sx={{ flex: "0.7 1 80px", minWidth: 72 }} />
                <Tooltip title={t("remove")}><span style={{ marginLeft: "auto" }}><IconButton onClick={() => delSes(i)} aria-label={`${t("remove")}: ${dayShort(s.day)} ${fmtTime(s.time)}`}><DeleteRounded /></IconButton></span></Tooltip>
              </Stack>
              {perDay[s.day] > 1 && <Box sx={{ pt: 0.75, pl: 0.5 }}><Pill tone="info" sx={{ height: 22, fontSize: 11.5 }}>{dayShort(s.day)} · {t("twice_today", { n: perDay[s.day] })}</Pill></Box>}
            </Box>
          ))}
        </Stack>
        <Button startIcon={<AddRounded />} onClick={addSes} sx={{ mt: 1.25 }}>{t("add_session")}</Button>
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px dashed ${k.outline}` }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{t("quick_add")}</Typography>
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>{t("quick_add_p")}</Typography>
          <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap", mb: 1.25 }}>
            {[1, 2, 3, 4, 5, 6, 0].map(d => {
              const on = q.days.includes(d);
              return <Chip key={d} label={dayShort(d)} onClick={() => setQ(x => ({ ...x, days: on ? x.days.filter(v => v !== d) : [...x.days, d] }))}
                color={on ? "secondary" : "default"} variant={on ? "filled" : "outlined"} aria-pressed={on} icon={on ? <CheckRounded /> : undefined} />;
            })}
          </Stack>
          <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <TextField size="small" type="time" label={t("c_time")} value={q.time} onChange={e => setQ(x => ({ ...x, time: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: "1 1 118px", minWidth: 112, maxWidth: 160 }} />
            <TextField size="small" type="number" label={t("c_dur")} value={q.duration} onChange={e => setQ(x => ({ ...x, duration: e.target.value }))} slotProps={{ htmlInput: { min: 0, step: 5 } }} sx={{ flex: "0.7 1 80px", minWidth: 72, maxWidth: 120 }} />
            <Button variant="tonal" startIcon={<AddRounded />} onClick={quickAdd} disabled={!q.days.length || !/^\d\d:\d\d$/.test(q.time)}>{q.days.length ? t("add_days", { n: q.days.length }) : t("add_days_none")}</Button>
          </Stack>
        </Box>
        {schedChanged && (
          <Alert severity="info" icon={<ScheduleRounded />} sx={{ mt: 1.5 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>{t("sched_changed_q")}</Typography>
            {!fixMistake && <TextField size="small" type="date" label={t("apply_from")} value={effFrom} onChange={e => setEffFrom(e.target.value)} helperText={t("apply_from_hint")} slotProps={{ inputLabel: { shrink: true } }} sx={{ bgcolor: "background.paper", borderRadius: 3 }} />}
            <FormControlLabel sx={{ display: "flex", mt: 0.5 }} control={<Checkbox size="small" checked={fixMistake} onChange={e => setFixMistake(e.target.checked)} />} label={<Typography variant="body2">{t("fix_mistake")}</Typography>} />
          </Alert>
        )}
      </Box>

      <Row>
        <TextField label={t("c_loc")} value={f.location} onChange={e => set("location", e.target.value)} placeholder={t("c_loc_ph")} />
        <TextField label={t("f_fee", { c: D.settings.currency })} type="number" value={f.fee} onChange={e => set("fee", e.target.value)} slotProps={{ htmlInput: { min: 0, step: "0.01" } }} />
      </Row>
      <TextField label={t("f_adm", { c: D.settings.currency })} type="number" value={f.admissionFee} onChange={e => set("admissionFee", e.target.value)} helperText={t("adm_hint")} slotProps={{ htmlInput: { min: 0, step: "0.01" } }} />
      <Box>
        <FormLabel sx={{ fontSize: 13, fontWeight: 500, display: "block", mb: 1 }}>{t("c_color")}</FormLabel>
        <Stack direction="row" spacing={1.25} role="radiogroup" aria-label={t("c_color")}>
          {CLASS_COLORS.map((col, i) => (
            <IconButton key={col} role="radio" aria-checked={f.color === col} aria-label={`${t("c_color")} ${i + 1}`} onClick={() => set("color", col)}
              sx={{ width: 34, height: 34, bgcolor: col, color: "#fff", "&:hover": { bgcolor: col, filter: "brightness(1.1)" }, outline: f.color === col ? `2px solid ${theme.palette.text.primary}` : "none", outlineOffset: 2 }}>
              {f.color === col && <CheckRounded sx={{ fontSize: 18 }} />}
            </IconButton>
          ))}
        </Stack>
      </Box>
    </Shell>
  );
}

/* ---------- payment ---------- */
export function PayForm({ sid, ym: ym0, kind: kind0, cid: cid0, onClose, onSaved }) {
  const D = useDomain(); const { t, monthLabel } = useI18n(); const actions = useActions(); const snack = useSnack();
  const studs = D.activeStudents();
  const s0 = sid ? D.studentById(sid) : null;
  const list = s0 && s0.active === false ? [s0, ...studs] : studs;
  const ym = ym0 || curYm();
  const months = []; for (let i = -6; i <= 1; i++) months.push(addMonths(curYm(), i));
  if (!months.includes(ym)) months.unshift(ym);
  const admOf = id => (id ? D.admissionsFor(D.studentById(id)) : []);
  const pickAdm = id => { const l = admOf(id); return (l.find(a => a.due > 0) || l[0])?.c.id || ""; };
  const [f, setF] = useState(() => {
    const id = (s0 || studs[0])?.id;
    const kind = kind0 === "admission" ? "admission" : "monthly";
    const cid = kind === "admission" ? cid0 || pickAdm(id) : "";
    const amount = kind === "admission" ? admOf(id).find(a => a.c.id === cid)?.due || "" : id ? D.feeStatus(D.studentById(id), ym).bal || "" : "";
    return { sid: id, kind, cid, ym, amount, date: todayStr(), method: "cash", note: "" };
  });
  const adms = admOf(f.sid);
  const adm = adms.find(a => a.c.id === f.cid);
  const [err, setErr] = useState(false);
  const [busy, run] = useSaver();
  const fs = f.sid ? D.feeStatus(D.studentById(f.sid), f.ym) : null;
  const change = (k, v) => setF(x => {
    const n = { ...x, [k]: v };
    if (k === "sid" && n.kind === "admission") n.cid = pickAdm(n.sid);
    if (k === "kind" && v === "admission" && !n.cid) n.cid = pickAdm(n.sid);
    if (n.kind === "admission") n.amount = admOf(n.sid).find(a => a.c.id === n.cid)?.due || "";
    else if (["sid", "ym", "kind"].includes(k)) n.amount = D.feeStatus(D.studentById(n.sid), n.ym).bal || "";
    return n;
  });
  const submit = () => {
    if (!(+f.amount > 0)) { setErr(true); return; }
    run(async () => {
      const isAdm = f.kind === "admission";
      if (isAdm && !f.cid) return;
      const p = await actions.addPayment({ sid: f.sid, kind: f.kind, cid: isAdm ? f.cid : undefined, ym: isAdm ? (f.date || todayStr()).slice(0, 7) : f.ym, amount: +f.amount, date: f.date || undefined, method: f.method, note: f.note });
      onClose();
      onSaved?.(p, D.money(+f.amount));
    }).catch(() => {});
  };
  if (!list.length) { setTimeout(() => { snack(t("add_student_first"), "warning"); onClose(); }); return null; }
  return (
    <Shell title={t("record_payment")} onClose={onClose} onSubmit={submit}
      actions={<><Button onClick={onClose}>{t("cancel")}</Button><Button type="submit" variant="contained" startIcon={<CheckRounded />} disabled={busy}>{t("save_payment")}</Button></>}>
      <TextField select label={t("student")} value={f.sid} onChange={e => change("sid", e.target.value)} sx={{ mt: 0.5 }}>
        {list.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
      </TextField>
      {(adms.length > 0 || f.kind === "admission") && (
        <Box>
          <FormLabel sx={{ fontSize: 13, fontWeight: 500, display: "block", mb: 1 }}>{t("pay_type")}</FormLabel>
          <ToggleButtonGroup exclusive size="small" color="primary" value={f.kind} onChange={(e, v) => v && change("kind", v)}>
            <ToggleButton value="monthly" sx={{ px: 2 }}>{t("pay_monthly")}</ToggleButton>
            <ToggleButton value="admission" sx={{ px: 2 }}>{t("adm_fee")}</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
      <Row>
        {f.kind === "admission" ? (
          adms.length ? (
            <TextField select label={t("class_lbl")} value={f.cid} onChange={e => change("cid", e.target.value)}>
              {adms.map(a => <MenuItem key={a.c.id} value={a.c.id}>{a.c.name} · {a.waived ? t("adm_waived") : a.due ? t("x_due", { x: D.money(a.due) }) : t("st_paid")}</MenuItem>)}
            </TextField>
          ) : <Alert severity="info" sx={{ alignItems: "center" }}>{t("adm_no_class")}</Alert>
        ) : (
          <TextField select label={t("p_month")} value={f.ym} onChange={e => change("ym", e.target.value)}>
            {months.map(m => <MenuItem key={m} value={m}>{monthLabel(m)}</MenuItem>)}
          </TextField>
        )}
        <TextField label={t("p_amount", { c: D.settings.currency })} type="number" value={f.amount} required autoFocus error={err}
          onChange={e => { setErr(false); setF(x => ({ ...x, amount: e.target.value })); }}
          helperText={f.kind === "admission" ? (adm ? t("p_hint", { f: D.money(adm.fee), p: D.money(adm.paid) }) : " ") : fs ? (fs.due ? t("p_hint", { f: D.money(fs.due), p: D.money(fs.paid) }) : t("p_nofee")) : " "} slotProps={{ htmlInput: { min: 0, step: "0.01" } }} />
      </Row>
      <Row>
        <TextField label={t("p_date")} type="date" value={f.date} onChange={e => setF(x => ({ ...x, date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField select label={t("p_method")} value={f.method} onChange={e => setF(x => ({ ...x, method: e.target.value }))}>
          {METHODS.map(m => <MenuItem key={m} value={m}>{D.methodLabel(m)}</MenuItem>)}
        </TextField>
      </Row>
      <TextField label={t("p_note")} value={f.note} onChange={e => setF(x => ({ ...x, note: e.target.value }))} placeholder={t("p_note_ph")} />
    </Shell>
  );
}

/* ---------- receipt ---------- */
export function ReceiptDialog({ pid, onClose }) {
  const D = useDomain(); const { t } = useI18n(); const copy = useCopy(t);
  const p = D.payments.find(x => x.id === pid);
  if (!p) return null;
  const s = D.studentById(p.sid);
  const text = D.receiptText(p, longDateIn);
  const wa = s ? D.waLink(D.contactOf(s), text) : null;
  return (
    <Shell title={t("receipt_title")} onClose={onClose}
      actions={<>
        {wa && <Button variant="outlined" startIcon={<WhatsApp />} href={wa} target="_blank" rel="noopener">{t("send_wa")}</Button>}
        <Button variant="contained" startIcon={<ContentCopyRounded />} onClick={() => copy(text, t("msg_copied"))}>{t("copy_receipt")}</Button>
      </>}>
      <MessageBox sx={{ mt: 0, fontSize: 14 }}>{text}</MessageBox>
    </Shell>
  );
}

/* ---------- fee reminder ---------- */
export function RemindFee({ sid, ym: ym0, onClose }) {
  const D = useDomain(); const { t } = useI18n();
  const s = D.studentById(sid); const ym = ym0 || curYm();
  const [lg, setLg] = useState(D.famLang(s));
  const [msg, setMsg] = useState(() => D.feeMsg(s, ym, lg));
  return (
    <Shell title={t("remind_x", { n: s.parent || s.name })} onClose={onClose}>
      <Box>
        <FormLabel sx={{ fontSize: 13, fontWeight: 500, display: "block", mb: 1 }}>{t("msg_in")}</FormLabel>
        <ToggleButtonGroup exclusive size="small" color="primary" value={lg} onChange={(e, v) => { if (v) { setLg(v); setMsg(D.feeMsg(s, ym, v)); } }}>
          {LANGS.map(l => <ToggleButton key={l} value={l} sx={{ px: 1.75 }}>{LANG_NAMES[l]}</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>
      <TextField label={t("message")} multiline minRows={5} value={msg} onChange={e => setMsg(e.target.value)} helperText={t("edit_before")} slotProps={{ htmlInput: { lang: lg } }} />
      <MessageActions D={D} s={s} msg={msg} type="fee" logKey={ym} />
    </Shell>
  );
}

/* ---------- admission fee reminder ---------- */
export function RemindAdmission({ sid, cid, onClose }) {
  const D = useDomain(); const { t } = useI18n();
  const s = D.studentById(sid), c = D.classById(cid);
  const [lg, setLg] = useState(D.famLang(s));
  const [msg, setMsg] = useState(() => D.admissionMsg(s, c, lg));
  return (
    <Shell title={t("remind_x", { n: s.parent || s.name })} onClose={onClose}>
      <Box>
        <FormLabel sx={{ fontSize: 13, fontWeight: 500, display: "block", mb: 1 }}>{t("msg_in")}</FormLabel>
        <ToggleButtonGroup exclusive size="small" color="primary" value={lg} onChange={(e, v) => { if (v) { setLg(v); setMsg(D.admissionMsg(s, c, v)); } }}>
          {LANGS.map(l => <ToggleButton key={l} value={l} sx={{ px: 1.75 }}>{LANG_NAMES[l]}</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>
      <TextField label={t("message")} multiline minRows={4} value={msg} onChange={e => setMsg(e.target.value)} helperText={t("edit_before")} slotProps={{ htmlInput: { lang: lg } }} />
      <MessageActions D={D} s={s} msg={msg} type="admission" logKey={cid} />
    </Shell>
  );
}

/* ---------- student detail ---------- */
const Mini = ({ v, l }) => <Box sx={{ bgcolor: "action.hover", borderRadius: 4, px: 1.75, py: 1.5 }}><Typography className="num" sx={{ fontFamily: display, fontSize: { xs: 18, sm: 22 }, fontWeight: 600 }}>{v}</Typography><Typography variant="caption" color="text.secondary">{l}</Typography></Box>;
const KV = ({ icon: I, children }) => <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "text.secondary", fontSize: 13.5, "& svg": { fontSize: 18 } }}><I />{children}</Stack>;

export function StudentDetail({ sid, onClose }) {
  const D = useDomain(); const { t, monthLabel, monthOnly, longDate, shortDate } = useI18n(); const actions = useActions(); const snack = useSnack();
  const open = useOpeners();
  const ym = curYm(), yms = [ym, addMonths(ym, -1), addMonths(ym, -2)];
  const { rows } = useAttendance(yms);
  const s = D.studentById(sid);
  if (!s) return null;
  const f = D.feeStatus(s, ym), ar = D.arrears(s, ym), st = attStats(rows, s.id);
  const pays = D.payments.filter(p => p.sid === s.id).slice(0, 8);
  const ph = D.contactOf(s);
  const toggle = () => actions.setActive(s.id, s.active === false).then(n => snack(n.active ? t("active_again", { n: s.name }) : t("marked_left", { n: s.name }))).catch(() => snack(t("try_again_msg"), "error"));
  return (
    <Shell wide onClose={onClose}
      title={<Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}><StudentAvatar name={s.name} size={44} /><Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ fontFamily: display, fontWeight: 600, fontSize: 21 }}>{s.name}</Typography><Typography noWrap variant="body2" color="text.secondary">{s.classIds.map(id => D.classById(id)?.name).filter(Boolean).join(", ") || t("no_class_yet")}</Typography></Box></Stack>}
      actions={<>
        <Button sx={{ mr: "auto" }} startIcon={s.active === false ? <UndoRounded /> : <LogoutRounded />} onClick={toggle}>{s.active === false ? t("mark_returned") : t("mark_left")}</Button>
        <Button variant="outlined" startIcon={<EditRounded />} onClick={() => open.studentForm(s.id)}>{t("edit")}</Button>
        {f.bal > 0 && <Button variant="outlined" startIcon={<NotificationsRounded />} onClick={() => open.remindFee(s.id)}>{t("remind")}</Button>}
        <Button variant="contained" startIcon={<AddCardRounded />} onClick={() => open.payForm(s.id, ym)}>{t("record_payment")}</Button>
      </>}>
      {s.active === false && <Alert severity="warning" icon={<LogoutRounded />}>{t("left_after", { m: monthLabel(s.endedYm || ym) })}</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.25 }}>
        <Mini v={pct(st.rate)} l={t("att_3m")} /><Mini v={D.money(f.bal)} l={t("due_for", { m: monthOnly(ym) })} /><Mini v={D.money(ar.total)} l={t("unpaid_earlier")} />
      </Box>
      <Stack direction="row" sx={{ flexWrap: "wrap", columnGap: 2.25, rowGap: 1 }}>
        {s.parent && <KV icon={FamilyRestroomRounded}>{s.parent}</KV>}
        {ph && <KV icon={CallRounded}>{ph}</KV>}
        <KV icon={SellRounded}>{t("per_month", { x: D.money(s.fee) })}</KV>
        <KV icon={EventRounded}>{t("since", { d: longDate(s.joined || todayStr()) })}</KV>
        <KV icon={TranslateRounded}>{LANG_NAMES[D.famLang(s)]}</KV>
      </Stack>
      {s.notes && <MessageBox sx={{ mt: 0 }}>{s.notes}</MessageBox>}
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>{t("recent_lessons")}</Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}><Pill tone="good">{t("n_present", { n: st.p })}</Pill><Pill tone="warn">{t("n_late", { n: st.l })}</Pill><Pill tone="bad">{t("n_absent", { n: st.a })}</Pill></Stack>
      </Box>
      {D.admissionsFor(s).length > 0 && (
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>{t("adm_section")}</Typography>
          {D.admissionsFor(s).map(a => (
            <Stack key={a.c.id} direction="row" spacing={1} sx={{ alignItems: "center", py: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: a.c.color }} />
              <Typography sx={{ flex: 1 }}>{a.c.name} · <span className="num">{D.money(a.fee)}</span></Typography>
              {a.waived ? <Pill>{t("adm_waived")}</Pill> : a.due ? (<>
                <Pill tone="bad">{t("x_due", { x: D.money(a.due) })}</Pill>
                <Button size="small" variant="tonal" onClick={() => open.payForm(s.id, null, "admission", a.c.id)}>{t("record_payment")}</Button>
              </>) : <Pill tone="good" icon={<CheckCircleRounded />}>{t("st_paid")}</Pill>}
            </Stack>
          ))}
        </Box>
      )}
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>{t("payments")}</Typography>
        {pays.length ? (
          <List dense disablePadding>
            {pays.map(p => (
              <ListItem key={p.id} disableGutters secondaryAction={<IconButton edge="end" aria-label={t("receipt")} onClick={() => open.receipt(p.id)}><ReceiptRounded /></IconButton>}>
                <ListItemIcon sx={{ minWidth: 36 }}><CheckCircleRounded sx={{ color: "success.main" }} /></ListItemIcon>
                <ListItemText primary={<><b className="num">{D.money(p.amount)}</b> <Box component="span" sx={{ color: "text.secondary" }}>{D.paymentLabel(p)}</Box></>} secondary={`${shortDate(p.date)} · ${D.methodLabel(p.method)}`} />
              </ListItem>
            ))}
          </List>
        ) : <Typography variant="body2" color="text.secondary">{t("no_pay_rec")}</Typography>}
      </Box>
    </Shell>
  );
}

/* ---------- openers ---------- */
export function useOpeners() {
  const dlg = useDialogs(); const snack = useSnack(); const { t } = useI18n();
  const o = {
    studentForm: (sid, defaultClassId) => dlg.replace(close => <StudentForm sid={sid} defaultClassId={defaultClassId} onClose={close} />),
    classForm: cid => dlg.replace(close => <ClassForm cid={cid} onClose={close} />),
    payForm: (sid, ym, kind, cid) => dlg.replace(close => <PayForm sid={sid} ym={ym} kind={kind} cid={cid} onClose={close} onSaved={(p, amt) => setTimeout(() => snack(t("recorded", { x: amt }), { label: t("receipt"), onClick: () => o.receipt(p.id) }), 50)} />),
    receipt: pid => dlg.replace(close => <ReceiptDialog pid={pid} onClose={close} />),
    remindFee: (sid, ym) => dlg.replace(close => <RemindFee sid={sid} ym={ym} onClose={close} />),
    student: sid => dlg.replace(close => <StudentDetail sid={sid} onClose={close} />),
    remindAdmission: (sid, cid) => dlg.replace(close => <RemindAdmission sid={sid} cid={cid} onClose={close} />),
    changeMeeting: (cid, date, time) => dlg.replace(close => <ChangeMeetingDialog cid={cid} date={date} time={time} onClose={close} />),
    breakFor: cid => dlg.replace(close => <BreakDialog cid={cid} onClose={close} />),
    stopFor: cid => dlg.replace(close => <StopDialog cid={cid} onClose={close} />),
    notify: (info, logKey) => dlg.replace(close => <NotifyDialog info={info} logKey={logKey} onClose={close} />),
  };
  return o;
}

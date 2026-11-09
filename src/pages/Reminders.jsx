import { useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { Box, Button, Card, Chip, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useI18n } from "../i18n/index.jsx";
import { useDomain } from "../state/data.jsx";
import { useCopy } from "../state/ui.jsx";
import { EmptyState, StudentAvatar, MessageBox, MessageActions, LangTag, ColorBar, Pill, tones } from "../components/common.jsx";
import { useOpeners } from "../dialogs/index.jsx";
import { useChangeText } from "../dialogs/schedule.jsx";
import { curYm, todayStr, addDays, fmtTime } from "../lib/dates.js";
import { SampleBanner } from "./Home.jsx";
import { CampaignRounded, CelebrationRounded, EditNoteRounded, EventAvailableRounded, EventRepeatRounded, EventRounded, ForumRounded, PaymentsRounded, StopCircleRounded } from "../icons.jsx";

function ago(t, iso) { const d = (Date.now() - new Date(iso).getTime()) / 86400000; if (d < 1) return t("ago_today"); if (d < 2) return t("ago_yday"); return t("ago_days", { n: Math.floor(d) }); }

function Who({ s, title, sub, lg }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
      <StudentAvatar name={s.name} />
      <Box sx={{ flex: 1, minWidth: 0 }}><Typography noWrap sx={{ fontWeight: 500 }}>{title}</Typography><Typography variant="body2" color="text.secondary" component="div">{sub}</Typography></Box>
      <LangTag lg={lg} />
    </Stack>
  );
}

export default function Reminders() {
  const D = useDomain(); const { t, lang, monthLabel, shortDate } = useI18n(); const copy = useCopy(t);
  const open = useOpeners(); const describe = useChangeText();
  const theme = useTheme(), k = tones(theme);
  const [params] = useSearchParams();
  const [tab, setTab] = useState(["fees", "class", "changes"].includes(params.get("tab")) ? params.get("tab") : "fees");
  const [day, setDay] = useState("tomorrow");
  const ym = curYm();
  const sep = { py: 1.75, px: 1, "& + &": { borderTop: `1px solid ${k.outlineVariant}` } };

  let body;
  if (tab === "changes") {
    const td = todayStr();
    const items = [
      ...D.changes.filter(x => (x.newDate || x.date) >= td).map(ch => ({ key: ch.id, c: D.classById(ch.cid), info: { ...ch, c: D.classById(ch.cid) }, sortDate: ch.date, ...describe(ch) })),
      ...D.classes.map(c => ({ c, up: D.upcomingSchedule(c, addDays(td, -1)) })).filter(x => x.up).map(({ c, up }) => ({
        key: `sched|${c.id}|${up.from}`, c, info: { kind: "schedule", c, from: up.from, sessions: up.sessions }, sortDate: up.from,
        icon: EventRepeatRounded, tone: "info", label: t("kind_schedule"), text: `${shortDate(up.from)} · ${D.scheduleText(up.sessions, lang)}`,
      })),
      ...D.classes.filter(c => c.endsOn && c.endsOn >= td).map(c => ({
        key: `stop|${c.id}|${c.endsOn}`, c, info: { kind: "stop", c, date: c.endsOn }, sortDate: c.endsOn,
        icon: StopCircleRounded, tone: "bad", label: t("kind_stop"), text: shortDate(c.endsOn),
      })),
    ].filter(x => x.c).sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    body = items.length ? (<Box sx={{ mt: 1 }}>
      {items.map(it => {
        const studs = D.affectedBy(it.c), told = studs.filter(s => D.lastReminder(s.id, "change", it.key)).length;
        return (
          <Stack key={it.key} direction="row" spacing={1.5} sx={{ ...sep, alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
            <ColorBar color={it.c.color} h={36} />
            <Box sx={{ flex: "1 1 200px", minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><Pill tone={it.tone} icon={<it.icon />} sx={{ height: 24, fontSize: 12 }}>{it.label}</Pill><Typography noWrap sx={{ fontWeight: 600 }}>{it.c.name}</Typography></Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{it.text}{it.info.note ? ` · ${it.info.note}` : ""}</Typography>
            </Box>
            <Pill tone={studs.length && told === studs.length ? "good" : "none"}>{t("n_notified", { a: told, b: studs.length })}</Pill>
            <Button size="small" variant="tonal" startIcon={<CampaignRounded />} onClick={() => open.notify(it.info, it.key)}>{t("open_messages")}</Button>
          </Stack>
        );
      })}
    </Box>) : <EmptyState icon={EventAvailableRounded} title={t("no_changes")} text={t("no_changes_p")} />;
  } else if (tab === "fees") {
    const due = D.activeStudents().map(s => ({ s, f: D.feeStatus(s, ym), ar: D.arrears(s, ym) })).filter(x => x.f.bal > 0);
    const adm = D.activeStudents().flatMap(s => D.admissionsFor(s).filter(a => a.due > 0).map(a => ({ s, ...a })));
    const admBlock = adm.length > 0 && (
      <Box sx={{ mt: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, px: 1 }}>{t("adm_section")}</Typography>
        {adm.map(({ s, c, due: amt }) => {
          const m = D.admissionMsg(s, c), last = D.lastReminder(s.id, "admission", c.id);
          return (
            <Box key={s.id + c.id} sx={sep}>
              <Who s={s} lg={D.famLang(s)} title={<>{s.parent || s.name} <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>· {t("parent_of", { n: s.name })}</Box></>}
                sub={<>{c.name} · {t("x_due", { x: D.money(amt) })}{last && <Box component="span" sx={{ color: "primary.main" }}> · {t("reminded", { a: ago(t, last) })}</Box>}</>} />
              <MessageBox>{m}</MessageBox>
              <MessageActions D={D} s={s} msg={m} type="admission" logKey={c.id} />
            </Box>
          );
        })}
      </Box>
    );
    body = due.length || adm.length ? (<>
      {due.length > 0 && <Typography variant="body2" color="text.secondary" sx={{ m: "12px 8px 0" }}>{t("owe_intro", { n: due.length, m: monthLabel(ym) })}</Typography>}
      {due.map(({ s, f, ar }) => {
        const last = D.lastReminder(s.id, "fee", ym), m = D.feeMsg(s, ym);
        return (
          <Box key={s.id} sx={sep}>
            <Who s={s} lg={D.famLang(s)} title={<>{s.parent || s.name} <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>· {t("parent_of", { n: s.name })}</Box></>}
              sub={<>{t("x_due", { x: D.money(f.bal) })}{ar.total ? ` · ${t("from_earlier_months", { x: D.money(ar.total) })}` : ""}{last && <Box component="span" sx={{ color: "primary.main" }}> · {t("reminded", { a: ago(t, last) })}</Box>}</>} />
            <MessageBox>{m}</MessageBox>
            <MessageActions D={D} s={s} msg={m} type="fee" logKey={ym} />
          </Box>
        );
      })}
      {admBlock}
    </>) : <EmptyState icon={CelebrationRounded} title={t("no_fee_rem")} text={t("no_fee_rem_p", { m: monthLabel(ym) })} />;
  } else {
    const date = day === "today" ? todayStr() : addDays(todayStr(), 1);
    const meetings = D.meetingsOnDate(date);
    body = (<>
      <Stack direction="row" spacing={1} sx={{ m: "14px 8px 4px" }}>
        <Chip label={t("today")} onClick={() => setDay("today")} color={day === "today" ? "secondary" : "default"} variant={day === "today" ? "filled" : "outlined"} aria-pressed={day === "today"} />
        <Chip label={`${t("tomorrow")} · ${shortDate(addDays(todayStr(), 1))}`} onClick={() => setDay("tomorrow")} color={day === "tomorrow" ? "secondary" : "default"} variant={day === "tomorrow" ? "filled" : "outlined"} aria-pressed={day === "tomorrow"} />
      </Stack>
      {meetings.length ? meetings.map(({ c, s: ses }) => {
        const studs = D.studentsIn(c.id);
        const group = D.classMsg(null, c, ses.time, date, lang, true);
        const key = `${c.id}|${date}|${ses.time}`;
        return (
          <Box key={c.id + ses.time} sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", px: 1, flexWrap: "wrap", rowGap: 1 }}>
              <ColorBar color={c.color} h={32} />
              <Box sx={{ flex: 1, minWidth: 0 }}><Typography sx={{ fontWeight: 700 }}>{c.name}</Typography><Typography variant="body2" color="text.secondary">{fmtTime(ses.time)} · {t("n_students", { n: studs.length })}</Typography></Box>
              <Button size="small" variant="tonal" startIcon={<ForumRounded />} onClick={() => copy(group, t("msg_copied"))}>{t("copy_group")}</Button>
            </Stack>
            {studs.map(s => {
              const m = D.classMsg(s, c, ses.time, date), last = D.lastReminder(s.id, "class", key);
              return (
                <Box key={s.id} sx={sep}>
                  <Who s={s} lg={D.famLang(s)} title={s.name} sub={<>{D.contactOf(s) || t("no_phone")}{last && <Box component="span" sx={{ color: "primary.main" }}> · {t("reminded", { a: ago(t, last) })}</Box>}</>} />
                  <MessageBox>{m}</MessageBox>
                  <MessageActions D={D} s={s} msg={m} type="class" logKey={key} />
                </Box>
              );
            })}
          </Box>
        );
      }) : <EmptyState icon={EventAvailableRounded} title={t(day === "today" ? "no_cls_today" : "no_cls_tomorrow")} text={t("no_cls_day_p")} />}
    </>);
  }

  return (<>
    <SampleBanner />
    <Card sx={{ px: { xs: 1.5, sm: 2.5 }, pb: 2 }}>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ borderBottom: `1px solid ${k.outlineVariant}` }}>
        <Tab value="fees" icon={<PaymentsRounded />} iconPosition="start" label={t("fee_rem")} />
        <Tab value="class" icon={<EventRounded />} iconPosition="start" label={t("class_rem")} />
        <Tab value="changes" icon={<EventRepeatRounded />} iconPosition="start" label={t("changes_tab")} />
      </Tabs>
      {body}
    </Card>
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", px: 2, py: 1.5, borderRadius: 4, bgcolor: "action.hover", flexWrap: "wrap" }}>
      <EditNoteRounded color="primary" />
      <Box sx={{ flex: "1 1 240px" }}>{t("edit_msgs_banner")}</Box>
      <Button size="small" component={RouterLink} to="/settings">{t("edit_msgs")}</Button>
    </Stack>
  </>);
}

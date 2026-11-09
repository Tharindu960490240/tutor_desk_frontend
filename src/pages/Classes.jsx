import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Stack, Typography, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useI18n } from "../i18n/index.jsx";
import { useDomain, useAttendance } from "../state/data.jsx";
import { useOpeners } from "../dialogs/index.jsx";
import { SectionCard, EmptyState, Pill, tones } from "../components/common.jsx";
import { ClassMenu, ChangeList } from "../dialogs/schedule.jsx";
import { pct } from "../lib/domain.js";
import { curYm, todayStr, fmtTime, endTime } from "../lib/dates.js";
import { SampleBanner } from "./Home.jsx";
import { AddRounded, CoPresentRounded, EventRepeatRounded, StopCircleRounded, FactCheckRounded, GroupRounded, HowToRegRounded, LocationOnRounded, ScheduleRounded, SellRounded } from "../icons.jsx";

const KV = ({ icon: I, children }) => <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", fontSize: 13.5, color: "text.secondary", "& svg": { fontSize: 18 } }}><I />{children}</Stack>;

export default function Classes() {
  const D = useDomain(); const { t, dayLetter, dayLong, dayShort, shortDate } = useI18n(); const open = useOpeners(); const nav = useNavigate();
  const theme = useTheme(), k = tones(theme);
  const ym = curYm();
  const { rows } = useAttendance([ym]);
  if (!D.classes.length) return (<><SampleBanner /><SectionCard><EmptyState icon={CoPresentRounded} title={t("no_classes")} text={t("no_classes_p")} action={<Button variant="contained" startIcon={<AddRounded />} onClick={() => open.classForm()}>{t("add_class")}</Button>} /></SectionCard></>);
  const td = todayStr();
  return (<>
    <SampleBanner />
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0,1fr))", lg: "repeat(3, minmax(0,1fr))" } }}>
      {D.classes.map(c => {
        const studs = D.studentsIn(c.id);
        const ids = new Set(studs.map(s => s.id));
        const mine = rows.filter(r => r.cid === c.id && ids.has(r.sid));
        const rate = mine.length ? mine.filter(r => r.v !== "A").length / mine.length : null;
        const ended = c.endsOn && c.endsOn < td;
        const sched = D.scheduleAt(c, td);
        const next = D.upcomingSchedule(c, td);
        const days = new Set(sched.map(s => s.day));
        const todays = D.meetingsOnDate(td).filter(o => o.c.id === c.id);
        return (
          <Card key={c.id} sx={{ position: "relative", overflow: "hidden", "&::before": { content: '""', position: "absolute", inset: "0 0 auto 0", height: 4, bgcolor: c.color } }}>
            <CardContent sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 1.5, height: "100%" }}>
              <Stack direction="row" sx={{ alignItems: "flex-start" }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" component="h2" sx={{ fontSize: 19 }}>{c.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{[c.subject, c.level].filter(Boolean).join(" · ")}</Typography>
                </Box>
                <ClassMenu c={c} onEdit={() => open.classForm(c.id)} />
              </Stack>
              <Stack direction="row" spacing={0.5}>
                {[1, 2, 3, 4, 5, 6, 0].map(i => {
                  const n = sched.filter(s => s.day === i).length;
                  return (
                    <Tooltip key={i} title={dayLong(i)}>
                      <Box sx={{ position: "relative", width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 600, bgcolor: days.has(i) ? k.primaryContainer : k.surface2, color: days.has(i) ? k.onPrimaryContainer : "text.secondary" }}>
                        {dayLetter(i)}
                        {n > 1 && <Box component="span" sx={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, bgcolor: "primary.main", color: k.onPrimary, fontSize: 10, display: "grid", placeItems: "center", px: 0.25 }}>{n}</Box>}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Stack>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {c.endsOn && <Pill tone={ended ? "bad" : "warn"} icon={<StopCircleRounded />} sx={{ alignSelf: "flex-start", mb: 0.5 }}>{ended ? t("ended_on", { d: shortDate(c.endsOn) }) : t("ends_on", { d: shortDate(c.endsOn) })}</Pill>}
                {sched.length ? sched.map((s, i) => (
                  <KV key={i} icon={ScheduleRounded}>
                    <Box component="span" sx={{ fontWeight: 500, color: "text.primary", minWidth: 40 }}>{dayShort(s.day)}</Box>
                    {fmtTime(s.time)}–{fmtTime(endTime(s.time, s.duration))}{s.duration ? ` · ${t("min", { n: s.duration })}` : ""}
                  </KV>
                )) : <KV icon={ScheduleRounded}>{t("no_time")}</KV>}
                {next && (
                  <Box sx={{ mt: 0.75, p: 1.25, borderRadius: 3, bgcolor: k.surface2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>{t("schedule_from", { d: shortDate(next.from) })}</Typography>
                    <Typography variant="body2" color="text.secondary">{next.sessions.map(s => `${dayShort(s.day)} ${fmtTime(s.time)}`).join(" · ") || t("no_time")}</Typography>
                  </Box>
                )}
              </Box>
              {D.changesFor(c.id).some(x => (x.newDate || x.date) >= td) && (
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 2 }}>{t("upcoming_changes")}</Typography>
                  <ChangeList cid={c.id} dense />
                </Box>
              )}
              <Stack direction="row" sx={{ flexWrap: "wrap", columnGap: 2, rowGap: 0.75 }}>
                {c.location && <KV icon={LocationOnRounded}>{c.location}</KV>}
                <KV icon={GroupRounded}>{t("n_students", { n: studs.length })}</KV>
                <KV icon={SellRounded}>{t("per_month", { x: D.money(c.fee) })}</KV>
                {+c.admissionFee > 0 && <KV icon={HowToRegRounded}>{t("adm_fee")}: {D.money(c.admissionFee)}</KV>}
                <KV icon={HowToRegRounded}>{t("att_rate", { p: pct(rate) })}</KV>
              </Stack>
              <Stack direction="row" sx={{ mt: "auto", pt: 1.5, gap: 1, flexWrap: "wrap", borderTop: 1, borderColor: "divider", "& .MuiButton-root": { whiteSpace: "nowrap", flex: "1 1 auto", px: 1.25 } }}>
                <Button size="small" variant="outlined" startIcon={<FactCheckRounded />} onClick={() => nav(`/attendance?cid=${c.id}&date=${td}${todays[0] ? "&time=" + todays[0].s.time : ""}`)}>{t("nav_attendance")}</Button>
                <Button size="small" variant="outlined" color="inherit" sx={{ borderColor: "divider" }} startIcon={<EventRepeatRounded />} onClick={() => open.changeMeeting(c.id)}>{t("change_this")}</Button>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  </>);
}

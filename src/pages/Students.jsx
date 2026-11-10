import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Button, Chip, InputAdornment, List, ListItemAvatar, ListItemButton, ListItemText, Stack, TextField, Tooltip } from "@mui/material";
import { useI18n } from "../i18n/index.jsx";
import { useDomain, useAttendance } from "../state/data.jsx";
import { useOpeners } from "../dialogs/index.jsx";
import { SectionCard, EmptyState, StudentAvatar, StatusPill, Pill } from "../components/common.jsx";
import { attStats, pct } from "../lib/domain.js";
import { curYm } from "../lib/dates.js";
import { GroupAddRounded, HowToRegRounded, PersonAddRounded, PersonSearchRounded, SearchRounded } from "../icons.jsx";

export default function Students() {
  const D = useDomain(); const { t } = useI18n(); const open = useOpeners();
  const [params, setParams] = useSearchParams();
  const filter = params.get("f") || "all";
  const setFilter = f => setParams(f === "all" ? {} : { f }, { replace: true });
  const [q, setQ] = useState("");
  const ym = curYm();
  const { rows } = useAttendance([ym]);

  if (!D.students.length) return (<><SectionCard><EmptyState icon={GroupAddRounded} title={t("no_students")} text={t("no_students_p")} action={<Button variant="contained" startIcon={<PersonAddRounded />} onClick={() => open.studentForm()}>{t("add_student")}</Button>} /></SectionCard></>);

  const left = D.students.filter(s => s.active === false).length;
  let list = filter === "left" ? D.students.filter(s => s.active === false) : D.activeStudents();
  if (filter.startsWith("c:")) list = list.filter(s => s.classIds.includes(filter.slice(2)));
  if (filter === "due") list = list.filter(s => D.feeStatus(s, ym).bal > 0);
  const qq = q.trim().toLowerCase();
  if (qq) list = list.filter(s => [s.name, s.parent, s.phone, s.parentPhone].join(" ").toLowerCase().includes(qq));

  const chip = (key, label, dot) => (
    <Chip key={key} label={label} onClick={() => setFilter(key)} color={filter === key ? "secondary" : "default"} variant={filter === key ? "filled" : "outlined"} aria-pressed={filter === key}
      icon={dot ? <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: dot, ml: "10px !important" }} /> : undefined} />
  );

  return (<>
    <SectionCard>
      <TextField fullWidth type="search" placeholder={t("search_ph")} value={q} onChange={e => setQ(e.target.value)} sx={{ mb: 1.5 }}
        slotProps={{ htmlInput: { "aria-label": t("search_ph") }, input: { startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> } }} />
      <Stack direction="row" sx={{ gap: 1, overflowX: "auto", pb: 0.5, mb: 1 }}>
        {chip("all", t("all_active"))}{chip("due", t("fee_due_f"))}
        {D.classes.map(c => chip("c:" + c.id, c.name, c.color))}
        {left ? chip("left", t("left_n", { n: left })) : null}
      </Stack>
      {list.length ? (
        <List disablePadding>
          {list.map(s => {
            const f = D.feeStatus(s, ym), st = attStats(rows, s.id), contact = D.contactOf(s);
            return (
              <ListItemButton key={s.id} onClick={() => open.student(s.id)} sx={{ gap: 1, px: 1, py: 1.25 }}>
                <ListItemAvatar sx={{ minWidth: 52 }}><StudentAvatar name={s.name} /></ListItemAvatar>
                <ListItemText sx={{ minWidth: 0 }} primary={s.name} slotProps={{ primary: { noWrap: true, fontWeight: 500 }, secondary: { noWrap: true } }}
                  secondary={(s.classIds.map(id => D.classById(id)?.name).filter(Boolean).join(", ") || t("no_class_yet")) + (contact ? " · " + contact : "")} />
                <Tooltip title={t("att_this_month")}><span><Pill icon={<HowToRegRounded />} sx={{ display: { xs: "none", sm: "inline-flex" } }}>{pct(st.rate)}</Pill></span></Tooltip>
                {s.active === false ? <Pill>{t("st_left")}</Pill> : <StatusPill status={f.status} />}
              </ListItemButton>
            );
          })}
        </List>
      ) : <EmptyState icon={PersonSearchRounded} title={t("no_found")} text={qq ? t("no_found_q") : t("no_found_p")} />}
    </SectionCard>
  </>);
}

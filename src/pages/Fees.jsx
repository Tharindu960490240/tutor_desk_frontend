import { useState } from "react";
import { display } from "../theme.js";
import { useSearchParams } from "react-router-dom";
import { Box, Button, Chip, IconButton, List, ListItem, ListItemIcon, ListItemText, Stack, Typography, Tooltip, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useI18n } from "../i18n/index.jsx";
import { useDomain, useActions } from "../state/data.jsx";
import { useOpeners } from "../dialogs/index.jsx";
import { useSnack } from "../state/ui.jsx";
import { SectionCard, EmptyState, StudentAvatar, StatusPill, StatCard, TonalIconButton, tones } from "../components/common.jsx";
import { curYm, addMonths } from "../lib/dates.js";
import { AccountBalanceRounded, AddCardRounded, ChevronLeftRounded, ChevronRightRounded, CreditCardRounded, DeleteRounded, FilterAltOffRounded, HistoryRounded, NotificationsRounded, PaymentsRounded, PendingActionsRounded, ReceiptLongRounded, ReceiptRounded, SavingsRounded, SmartphoneRounded , HowToRegRounded } from "../icons.jsx";

const METHOD_ICON = { cash: PaymentsRounded, bank: AccountBalanceRounded, mobile: SmartphoneRounded, card: CreditCardRounded, other: ReceiptRounded };

export default function Fees() {
  const D = useDomain(); const { t, monthLabel, monthOnly, shortDate } = useI18n(); const open = useOpeners(); const actions = useActions(); const snack = useSnack();
  const theme = useTheme(), k = tones(theme); const phone = useMediaQuery(theme.breakpoints.down("sm"));
  const [params, setParams] = useSearchParams();
  const ym = /^\d{4}-\d{2}$/.test(params.get("m") || "") ? params.get("m") : curYm();
  const setYm = m => setParams(m === curYm() ? {} : { m }, { replace: true });
  const [filter, setFilter] = useState("all");

  const rows = D.students.map(s => ({ s, f: D.feeStatus(s, ym), ar: D.arrears(s, ym) })).filter(x => x.f.due > 0 || x.f.paid > 0);
  const exp = rows.reduce((a, x) => a + x.f.due, 0), col = D.collectedFor(ym);
  const out = rows.reduce((a, x) => a + x.f.bal, 0), arr = rows.reduce((a, x) => a + x.ar.total, 0);
  const counts = { all: rows.length, due: rows.filter(x => x.f.status === "due").length, partial: rows.filter(x => x.f.status === "partial").length, paid: rows.filter(x => x.f.status === "paid").length };
  const shown = rows.filter(x => filter === "all" || x.f.status === filter).sort((a, b) => b.f.bal - a.f.bal || a.s.name.localeCompare(b.s.name));
  const pays = D.payments.filter(p => p.ym === ym);
  const admRows = D.activeStudents().flatMap(s => D.admissionsFor(s).filter(a => a.due > 0).map(a => ({ s, ...a })));
  const admTotal = admRows.reduce((a, x) => a + x.due, 0);

  const delPay = async p => {
    try {
      await actions.deletePayment(p.id);
      snack(t("pay_deleted", { x: D.money(p.amount) }), { label: t("undo"), onClick: () => actions.addPayment({ sid: p.sid, kind: p.kind, cid: p.cid || undefined, ym: p.ym, amount: p.amount, date: p.date, method: p.method, note: p.note }).catch(() => snack(t("try_again_msg"), "error")) });
    } catch { snack(t("try_again_msg"), "error"); }
  };
  const grid = { display: "grid", gridTemplateColumns: phone ? "minmax(0,1fr) auto" : "minmax(0,1.6fr) repeat(3, minmax(70px,.6fr)) 110px 96px", alignItems: "center", columnGap: 1.5, rowGap: 0.75, py: 1.5, px: 1 };

  return (<>
    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
        <IconButton aria-label={t("previous")} onClick={() => setYm(addMonths(ym, -1))}><ChevronLeftRounded /></IconButton>
        <Typography sx={{ fontFamily: display, fontWeight: 600, fontSize: { xs: 16, sm: 18 }, minWidth: { sm: 160 }, textAlign: "center" }}>{monthLabel(ym)}</Typography>
        <IconButton aria-label={t("next")} onClick={() => setYm(addMonths(ym, 1))}><ChevronRightRounded /></IconButton>
      </Stack>
      {ym !== curYm() && <Button size="small" onClick={() => setYm(curYm())}>{t("back_now")}</Button>}
    </Stack>
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" } }}>
      <StatCard hero icon={SavingsRounded} label={t("collected")} value={D.money(col)} progress={exp ? Math.min(100, (col / exp) * 100) : 0} sub={t("pct_of", { p: exp ? Math.round(Math.min(1, col / exp) * 100) : 0, x: D.money(exp) })} />
      <StatCard icon={PendingActionsRounded} iconColor="error.main" label={t("due_this_month")} value={D.money(out)} sub={t("n_students", { n: counts.due + counts.partial })} />
      <StatCard icon={HistoryRounded} iconColor="warning.main" label={t("unpaid_earlier")} value={D.money(arr)} sub={t("before_m", { m: monthOnly(ym) })} />
      <StatCard icon={ReceiptRounded} iconColor="success.main" label={admRows.length ? t("adm_due_stat") : t("pays_recorded")} value={admRows.length ? D.money(admTotal) : pays.length}
        sub={admRows.length ? t("n_students", { n: new Set(admRows.map(r => r.s.id)).size }) : t("for_m", { m: monthOnly(ym) })} />
    </Box>
    <SectionCard title={t("fee_status")} action={
      <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
        {[["all", t("all")], ["due", t("st_due")], ["partial", t("st_partial")], ["paid", t("st_paid")]].map(([key, l]) => (
          <Chip key={key} label={<>{l} <Box component="span" sx={{ opacity: 0.7 }}>{counts[key]}</Box></>} onClick={() => setFilter(key)} color={filter === key ? "secondary" : "default"} variant={filter === key ? "filled" : "outlined"} aria-pressed={filter === key} />
        ))}
      </Stack>}>
      {shown.length ? (<Box>
        {!phone && <Box sx={{ ...grid, py: 0, pb: 0.75, fontSize: 12, fontWeight: 500, color: "text.secondary", textTransform: "uppercase", letterSpacing: ".04em" }}>
          <div>{t("student")}</div><Box sx={{ textAlign: "right" }}>{t("fee")}</Box><Box sx={{ textAlign: "right" }}>{t("paid_col")}</Box><Box sx={{ textAlign: "right" }}>{t("balance")}</Box><div>{t("status")}</div><div />
        </Box>}
        {shown.map(({ s, f, ar }) => (
          <Box key={s.id} sx={{ ...grid, borderTop: `1px solid ${k.outlineVariant}` }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
              <StudentAvatar name={s.name} />
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontWeight: 500 }}>{s.name}</Typography>
                <Typography noWrap variant="body2" sx={{ color: ar.total ? "warning.main" : "text.secondary" }}>{ar.total ? t("from_earlier", { x: D.money(ar.total) }) : s.classIds.map(id => D.classById(id)?.name).filter(Boolean).join(", ")}</Typography>
              </Box>
            </Stack>
            {!phone && <><Box className="num" sx={{ textAlign: "right" }}>{D.money(f.due)}</Box><Box className="num" sx={{ textAlign: "right" }}>{D.money(f.paid)}</Box></>}
            <Box className="num" sx={{ textAlign: "right", fontWeight: 700 }}>{D.money(f.bal)}</Box>
            <Box><StatusPill status={f.status} /></Box>
            <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
              {f.bal > 0 && <Tooltip title={t("remind")}><IconButton aria-label={`${t("remind")}: ${s.name}`} onClick={() => open.remindFee(s.id, ym)}><NotificationsRounded /></IconButton></Tooltip>}
              <Tooltip title={t("record_payment")}><TonalIconButton aria-label={`${t("record_payment")}: ${s.name}`} onClick={() => open.payForm(s.id, ym)}><AddCardRounded /></TonalIconButton></Tooltip>
            </Stack>
          </Box>
        ))}
      </Box>) : rows.length ? <EmptyState icon={FilterAltOffRounded} title={t("none_filter")} text={t("none_filter_p")} /> : <EmptyState icon={ReceiptLongRounded} title={t("no_fees_m")} text={t("no_fees_m_p")} />}
    </SectionCard>
    {admRows.length > 0 && (
      <SectionCard icon={HowToRegRounded} iconColor="warning.main" title={t("adm_section")}>
        {admRows.map(({ s, c, due }) => (
          <Stack key={s.id + c.id} direction="row" spacing={1.5} sx={{ alignItems: "center", py: 1.25, px: 1, borderTop: `1px solid ${k.outlineVariant}` }}>
            <StudentAvatar name={s.name} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontWeight: 500 }}>{s.name}</Typography>
              <Typography noWrap variant="body2" color="text.secondary">{c.name}</Typography>
            </Box>
            <Typography className="num" sx={{ fontWeight: 700 }}>{D.money(due)}</Typography>
            <Tooltip title={t("remind")}><IconButton aria-label={`${t("remind")}: ${s.name}`} onClick={() => open.remindAdmission(s.id, c.id)}><NotificationsRounded /></IconButton></Tooltip>
            <Tooltip title={t("record_payment")}><TonalIconButton aria-label={`${t("record_payment")}: ${s.name} – ${t("adm_fee")}`} onClick={() => open.payForm(s.id, null, "admission", c.id)}><AddCardRounded /></TonalIconButton></Tooltip>
          </Stack>
        ))}
      </SectionCard>
    )}
    {pays.length > 0 && (
      <SectionCard title={t("pays_for", { m: monthLabel(ym) })}>
        <List disablePadding>
          {pays.map(p => { const s = D.studentById(p.sid); const I = METHOD_ICON[p.method] || ReceiptRounded; return (
            <ListItem key={p.id} divider disableGutters sx={{ gap: 0.5, "&:last-child": { borderBottom: 0 } }}>
              <ListItemIcon sx={{ minWidth: 40 }}><I sx={{ color: "success.main" }} /></ListItemIcon>
              <ListItemText primary={<>{s ? s.name : t("former")} · <span className="num">{D.money(p.amount)}</span></>} secondary={`${shortDate(p.date)} · ${D.methodLabel(p.method)}${p.kind === "admission" ? " · " + D.paymentLabel(p) : ""}${p.note ? " · " + p.note : ""}`} slotProps={{ primary: { noWrap: true, fontWeight: 500 } }} />
              <Tooltip title={t("receipt")}><IconButton aria-label={t("receipt")} onClick={() => open.receipt(p.id)}><ReceiptRounded /></IconButton></Tooltip>
              <Tooltip title={t("delete_pay")}><IconButton aria-label={t("delete_pay")} onClick={() => delPay(p)}><DeleteRounded /></IconButton></Tooltip>
            </ListItem>); })}
        </List>
      </SectionCard>
    )}
  </>);
}

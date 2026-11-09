import { useRef, useState } from "react";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormLabel, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { FeedbackDialog } from "../components/Feedback.jsx";
import PasswordField, { PasswordRules } from "../components/PasswordField.jsx";
import { isStrongPassword } from "../lib/validation.js";
import { useI18n, LANGS, LANG_NAMES, DEFAULT_TPL } from "../i18n/index.jsx";
import { useDomain, useActions, useAuth } from "../state/data.jsx";
import { useSnack, useConfirm, useDialogs, useMode, useLoading } from "../state/ui.jsx";
import { SectionCard } from "../components/common.jsx";
import { todayStr } from "../lib/dates.js";
import { AccountCircleRounded, BadgeRounded, CloudRounded, DarkModeRounded, DeleteForeverRounded, DownloadRounded, FeedbackRounded, LightModeRounded, LockResetRounded, LogoutRounded, SaveRounded, ScienceRounded, SettingsBackupRestoreRounded, ShieldRounded, SmsRounded, UploadFileRounded } from "../icons.jsx";

const Label = ({ children }) => <FormLabel sx={{ fontSize: 13, fontWeight: 500, display: "block", mb: 1 }}>{children}</FormLabel>;

function RestoreDialog({ onClose }) {
  const { t } = useI18n(); const actions = useActions(); const snack = useSnack(); const withLoading = useLoading();
  const [raw, setRaw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const file = useRef();
  const submit = async () => {
    if (!raw.trim()) { setErr(t("paste_first")); return; }
    let data; try { data = JSON.parse(raw); } catch { setErr(t("not_backup")); return; }
    setBusy(true);
    try { await withLoading(actions.importBackup(data)); snack(t("restored")); onClose(); }
    catch (e) { setErr(e.code === "not_backup" ? t("not_backup") : t("server_err")); }
    setBusy(false);
  };
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("restore")}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography color="text.secondary">{t("restore_p")} {t("restore_hint")}</Typography>
        <Box>
          <input ref={file} type="file" accept="application/json,.json,.txt" hidden onChange={async e => { const f = e.target.files[0]; if (f) { setRaw(await f.text()); setErr(""); } }} />
          <Button variant="outlined" startIcon={<UploadFileRounded />} onClick={() => file.current.click()}>{t("choose_file")}</Button>
        </Box>
        <TextField label={t("backup_text")} multiline minRows={5} maxRows={10} value={raw} onChange={e => { setRaw(e.target.value); setErr(""); }} error={!!err} helperText={err || " "} />
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 0 }}>
        <Button onClick={onClose}>{t("cancel")}</Button>
        <Button variant="contained" onClick={submit} disabled={busy}>{t("restore_go")}</Button>
      </DialogActions>
    </Dialog>
  );
}

function PasswordDialog({ onClose }) {
  const { t } = useI18n(); const actions = useActions(); const snack = useSnack(); const withLoading = useLoading();
  const [v, setV] = useState({ cur: "", next: "", again: "" });
  const [touched, setTouched] = useState({}); const [submitted, setSubmitted] = useState(false); const [err, setErr] = useState("");
  const errors = { cur: !v.cur, next: !isStrongPassword(v.next), again: !v.again || v.again !== v.next };
  const show = k => !!((submitted || touched[k]) && errors[k]);
  const bind = k => ({ value: v[k], error: show(k), onChange: e => { setV(x => ({ ...x, [k]: e.target.value })); setErr(""); }, onBlur: () => setTouched(x => ({ ...x, [k]: true })) });
  const submit = async e => {
    e.preventDefault(); setSubmitted(true);
    if (Object.values(errors).some(Boolean)) { snack(t("fix_fields"), "error"); return; }
    try { await withLoading(actions.changePassword({ current: v.cur, next: v.next })); snack(t("pw_changed_all")); onClose(); }
    catch (x) { setErr(x.code === "bad_password" ? t("bad_password") : x.code === "invalid" ? t("pw_weak") : t("server_err")); }
  };
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" slotProps={{ paper: { component: "form", onSubmit: submit, noValidate: true } }}>
      <DialogTitle>{t("change_pw")}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.75, pt: "8px !important" }}>
        <PasswordField label={t("current_pw")} autoComplete="current-password" autoFocus {...bind("cur")} helperText={show("cur") ? t("pw_required") : ""} />
        <PasswordField label={t("new_pw")} autoComplete="new-password" {...bind("next")} helperText={show("next") ? t("pw_weak") : ""} />
        <PasswordField label={t("confirm_pw")} autoComplete="new-password" showToggle={false} {...bind("again")} helperText={show("again") ? t("pw_mismatch") : ""} />
        <PasswordRules value={v.next} />
        {err && <Alert severity="error">{err}</Alert>}
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 0 }}><Button onClick={onClose}>{t("cancel")}</Button><Button type="submit" variant="contained">{t("save")}</Button></DialogActions>
    </Dialog>
  );
}

export default function Settings() {
  const D = useDomain(); const { t, lang } = useI18n(); const actions = useActions(); const snack = useSnack(); const confirm = useConfirm(t);
  const dlg = useDialogs(); const { signOut } = useAuth(); const { mode, setMode } = useMode(); const withLoading = useLoading();
  const st = D.settings;
  const [f, setF] = useState(() => ({ tutorName: st.tutorName || "", currency: st.currency || "Rs", cc: st.cc || "", lang: st.lang || lang, tpl: { fee: { ...D.tpl.fee }, cls: { ...D.tpl.cls } } }));
  const [tplLang, setTplLang] = useState(lang);
  const [busy, setBusy] = useState(false);
  const setTpl = (kind, v) => setF(x => ({ ...x, tpl: { ...x.tpl, [kind]: { ...x.tpl[kind], [tplLang]: v } } }));

  const save = async e => {
    e.preventDefault(); setBusy(true);
    const tpl = { fee: {}, cls: {} };
    for (const kind of ["fee", "cls"]) for (const l of LANGS) { const v = (f.tpl[kind][l] || "").trim(); tpl[kind][l] = v && v !== DEFAULT_TPL[kind][l] ? v : ""; }
    try {
      try { localStorage.setItem("td-lang", f.lang); } catch { /* ignore */ }
      await withLoading(actions.saveSettings({ tutorName: f.tutorName.trim(), currency: f.currency.trim() || "Rs", cc: f.cc.replace(/\D/g, ""), lang: f.lang, tpl }));
      snack(t("settings_saved"));
    } catch { snack(t("try_again_msg"), "error"); }
    setBusy(false);
  };
  const download = async () => {
    try {
      const data = await withLoading(actions.exportBackup());
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = `tutordesk-backup-${todayStr()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch { snack(t("try_again_msg"), "error"); }
  };
  const wipe = async () => { if (await confirm(t("wipe_q"), t("wipe_p"), t("wipe_go"), true)) withLoading(actions.wipe()).then(() => snack(t("wiped"))).catch(() => snack(t("try_again_msg"), "error")); };
  const sample = async () => { if (await confirm(t("load_sample"), t("restore_p"), t("load_sample"), false)) withLoading(actions.loadSample(todayStr())).then(() => snack(t("sample_loaded"))).catch(() => snack(t("try_again_msg"), "error")); };
  const delAccount = async () => { if (await confirm(t("delete_account_q"), t("delete_account_p"), t("delete_account"), true)) withLoading(actions.deleteAccount()).then(signOut).catch(() => snack(t("try_again_msg"), "error")); };

  return (<>
    <Box component="form" onSubmit={save} sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, alignItems: "start" }}>
      <SectionCard icon={BadgeRounded} title={t("your_details")}>
        <Stack spacing={2.25}>
          <Box><Label>{t("app_lang")}</Label>
            <ToggleButtonGroup exclusive size="small" color="primary" value={f.lang} onChange={(e, v) => v && setF(x => ({ ...x, lang: v }))}>
              {LANGS.map(l => <ToggleButton key={l} value={l} sx={{ px: 2 }}>{LANG_NAMES[l]}</ToggleButton>)}
            </ToggleButtonGroup></Box>
          <Box><Label>{t("theme")}</Label>
            <ToggleButtonGroup exclusive size="small" color="primary" value={mode} onChange={(e, v) => v && setMode(v)}>
              <ToggleButton value="dark" sx={{ px: 2, gap: 1 }}><DarkModeRounded fontSize="small" />{t("dark")}</ToggleButton>
              <ToggleButton value="light" sx={{ px: 2, gap: 1 }}><LightModeRounded fontSize="small" />{t("light")}</ToggleButton>
            </ToggleButtonGroup></Box>
          <TextField label={t("tutor_lbl")} value={f.tutorName} onChange={e => setF(x => ({ ...x, tutorName: e.target.value }))} placeholder={t("tutor_ph")} helperText={t("tutor_hint")} />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label={t("currency")} value={f.currency} onChange={e => setF(x => ({ ...x, currency: e.target.value }))} slotProps={{ htmlInput: { maxLength: 6 } }} />
            <TextField label={t("cc")} value={f.cc} onChange={e => setF(x => ({ ...x, cc: e.target.value }))} helperText={t("cc_hint")} slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 4 } }} />
          </Box>
        </Stack>
      </SectionCard>
      <SectionCard icon={SmsRounded} title={t("rem_msgs")}>
        <Typography variant="body2" color="text.secondary" sx={{ mt: -0.75, mb: 1.5 }}>{t("rem_msgs_p")}</Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {LANGS.map(l => <Chip key={l} label={LANG_NAMES[l]} onClick={() => setTplLang(l)} color={tplLang === l ? "secondary" : "default"} variant={tplLang === l ? "filled" : "outlined"} aria-pressed={tplLang === l} />)}
        </Stack>
        <Stack spacing={2}>
          <TextField multiline minRows={3} label={`${t("fee_tpl")} · ${LANG_NAMES[tplLang]}`} value={f.tpl.fee[tplLang]} onChange={e => setTpl("fee", e.target.value)} helperText={t("can_use", { v: "{parent}, {student}, {amount}, {month}, {tutor}" })} slotProps={{ htmlInput: { lang: tplLang } }} />
          <TextField multiline minRows={3} label={`${t("cls_tpl")} · ${LANG_NAMES[tplLang]}`} value={f.tpl.cls[tplLang]} onChange={e => setTpl("cls", e.target.value)} helperText={t("can_use", { v: "{parent}, {student}, {class}, {day}, {time}, {location}, {tutor}" })} slotProps={{ htmlInput: { lang: tplLang } }} />
        </Stack>
      </SectionCard>
      <Box sx={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
        <Button type="submit" variant="contained" startIcon={<SaveRounded />} disabled={busy}>{t("save_settings")}</Button>
      </Box>
    </Box>
    <SectionCard icon={CloudRounded} title={t("your_data")}>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{t("where_server")}</Typography>
      <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
        <Button variant="tonal" startIcon={<DownloadRounded />} onClick={download}>{t("download_backup")}</Button>
        <Button variant="outlined" startIcon={<SettingsBackupRestoreRounded />} onClick={() => dlg.open(close => <RestoreDialog onClose={close} />)}>{t("restore")}</Button>
        <Button startIcon={<ScienceRounded />} onClick={sample}>{t("load_sample")}</Button>
        <Button color="error" startIcon={<DeleteForeverRounded />} onClick={wipe}>{t("wipe")}</Button>
      </Stack>
    </SectionCard>
    <SectionCard icon={AccountCircleRounded} title={t("account")}>
      <Typography sx={{ fontWeight: 500 }}>{D.user.name}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{D.user.email}</Typography>
      <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
        <Button variant="outlined" startIcon={<LockResetRounded />} onClick={() => dlg.open(close => <PasswordDialog onClose={close} />)}>{t("change_pw")}</Button>
        <Button variant="outlined" startIcon={<FeedbackRounded />} onClick={() => dlg.open(close => <FeedbackDialog onClose={close} />)}>{t("feedback")}</Button>
        <Button startIcon={<ShieldRounded />} component={RouterLink} to="/privacy">{t("privacy_title")}</Button>
        <Button startIcon={<LogoutRounded />} onClick={signOut}>{t("logout")}</Button>
        <Button color="error" startIcon={<DeleteForeverRounded />} onClick={delAccount}>{t("delete_account")}</Button>
      </Stack>
    </SectionCard>
  </>);
}

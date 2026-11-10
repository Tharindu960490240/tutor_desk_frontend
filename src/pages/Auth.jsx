import { useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, FormControlLabel, FormHelperText, IconButton, InputAdornment, Link, MenuItem, Select, Stack, Tab, Tabs, TextField, Tooltip, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useI18n, LANGS, LANG_NAMES } from "../i18n/index.jsx";
import { useAuth, useAuthConfig } from "../state/data.jsx";
import { useMode, useSnack, useLoading } from "../state/ui.jsx";
import { api } from "../api.js";
import { tones } from "../components/common.jsx";
import Logo from "../components/Logo.jsx";
import PasswordField, { PasswordRules } from "../components/PasswordField.jsx";
import { isEmail, isName, isStrongPassword } from "../lib/validation.js";
import { DarkModeRounded, EmailRounded, LightModeRounded, MarkEmailReadRounded, MenuBookRounded, PersonRounded, VpnKeyRounded } from "../icons.jsx";
import { guideUrl, guideAllUrl } from "../lib/guide.js";

function errText(t, x, cfg) {
  const weak = x.code === "invalid" && x.issues?.some?.(i => i.path === "password" || i.path === "next");
  if (weak) return t("pw_weak");
  return ({ bad_login: t("bad_login"), email_taken: t("email_taken"), bad_invite: t("bad_invite"), bad_token: t("bad_token"), email_failed: t("email_failed"),
    email_disabled: t("email_disabled", { c: cfg?.contactEmail || t("the_organiser") }), account_disabled: t("account_disabled", { c: cfg?.contactEmail || t("the_organiser") }), signups_closed: t("signups_closed"), network: t("err_p") }[x.code])
    || (x.status === 429 ? t("too_many") : t("server_err"));
}

const icon = I => ({ input: { startAdornment: <InputAdornment position="start"><I fontSize="small" /></InputAdornment> } });

/** AFC-style form state: errors show after a field is left (blur) or after submit */
function useForm(initial, validate) {
  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const errors = validate(form);
  const show = field => !!((submitted || touched[field]) && errors[field]);
  const bind = field => ({
    value: form[field],
    onChange: e => setForm(f => ({ ...f, [field]: e.target.value })),
    onBlur: () => setTouched(tc => ({ ...tc, [field]: true })),
    error: show(field),
  });
  const reset = () => { setTouched({}); setSubmitted(false); };
  return { form, setForm, errors, show, bind, submit: () => { setSubmitted(true); return !Object.values(errors).some(Boolean); }, reset };
}

/** Shared frame for the signed-out screens */
export function AuthFrame({ setLang, children }) {
  const { t, lang } = useI18n(); const { mode, toggle } = useMode();
  const theme = useTheme(), k = tones(theme);
  return (
    <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", p: 2, pt: 8, background: `radial-gradient(1200px 600px at 10% -10%, ${k.primaryContainer}55, transparent), ${k.bg}` }}>
      <Stack direction="row" spacing={1} sx={{ position: "fixed", top: 12, right: 12, alignItems: "center", zIndex: 2 }}>
        <Select size="small" value={lang} onChange={e => setLang(e.target.value)} aria-label={t("language")} sx={{ borderRadius: 5, height: 36, fontSize: 13.5 }}>
          {LANGS.map(l => <MenuItem key={l} value={l}>{LANG_NAMES[l]}</MenuItem>)}
        </Select>
        <Tooltip title={mode === "dark" ? t("theme_light") : t("theme_dark")}><IconButton onClick={toggle} aria-label={mode === "dark" ? t("theme_light") : t("theme_dark")}>{mode === "dark" ? <LightModeRounded /> : <DarkModeRounded />}</IconButton></Tooltip>
      </Stack>
      <Stack spacing={2} sx={{ width: "min(460px, 100%)", alignItems: "center" }}>
      <Card sx={{ width: "100%" }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={1.25} sx={{ alignItems: "center", textAlign: "center", mb: 2 }}>
            <Logo size={52} />
            <Chip size="small" label={t("beta")} color="secondary" />
            <Typography color="text.secondary">{t("tagline")}</Typography>
          </Stack>
          {children}
        </CardContent>
      </Card>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: "center", rowGap: 0.5, pb: 2 }}>
        <Typography variant="body2" color="text.secondary">{t("guide_new")}</Typography>
        <Button size="small" variant="outlined" href={guideUrl(lang)} target="_blank" rel="noopener" startIcon={<MenuBookRounded />}>{t("guide_pdf")}</Button>
        <Link href={guideAllUrl} target="_blank" rel="noopener" variant="body2" sx={{ fontWeight: 600 }}>{t("guide_all")}</Link>
      </Stack>
      </Stack>
    </Box>
  );
}

function ForgotDialog({ onClose, initialEmail, cfg }) {
  const { t } = useI18n(); const withLoading = useLoading();
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [err, setErr] = useState("");
  const f = useForm({ email: initialEmail || "" }, v => ({ email: !isEmail(v.email) }));
  const submit = async e => {
    e.preventDefault();
    if (!f.submit()) return;
    setBusy(true); setErr("");
    try { await withLoading(api("/auth/forgot", { method: "POST", body: { email: f.form.email.trim() } })); setDone(true); }
    catch (x) { setErr(errText(t, x, cfg)); }
    setBusy(false);
  };
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" slotProps={{ paper: { component: "form", onSubmit: submit, noValidate: true } }}>
      <DialogTitle>{t("forgot_title")}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {done ? (
          <Alert icon={<MarkEmailReadRounded />} severity="success">{t("link_sent")}</Alert>
        ) : (<>
          <Typography color="text.secondary">{t("forgot_p")}</Typography>
          <TextField label={t("email")} type="email" autoComplete="email" autoFocus {...f.bind("email")} helperText={f.show("email") ? t("email_invalid") : " "} slotProps={icon(EmailRounded)} />
          {err && <Alert severity="error">{err}</Alert>}
        </>)}
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 0 }}>
        {done ? <Button variant="contained" onClick={onClose}>{t("done")}</Button> : <>
          <Button onClick={onClose}>{t("cancel")}</Button>
          <Button type="submit" variant="contained" disabled={busy}>{t("send_link")}</Button>
        </>}
      </DialogActions>
    </Dialog>
  );
}

export default function Auth({ setLang }) {
  const { t, lang } = useI18n(); const { signIn } = useAuth(); const notify = useSnack(); const withLoading = useLoading();
  const cfg = useAuthConfig().data;
  const theme = useTheme(), k = tones(theme);
  const [tab, setTab] = useState("login");
  const reg = tab === "register";
  // if the server settings haven't loaded, still show the invite field (optional) rather than hide it
  const showInvite = !cfg || cfg.inviteRequired;
  const [forgot, setForgot] = useState(false);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const f = useForm({ invite: "", name: "", email: "", password: "", confirmPassword: "", agree: false }, v => reg ? {
    invite: !!cfg?.inviteRequired && !v.invite.trim(),
    name: !isName(v.name),
    email: !isEmail(v.email),
    password: !isStrongPassword(v.password),
    confirmPassword: !v.confirmPassword || v.password !== v.confirmPassword,
    agree: !v.agree,
  } : { email: !isEmail(v.email), password: !v.password });

  const switchTab = v => { setTab(v); setErr(""); f.reset(); };
  const submit = async e => {
    e.preventDefault(); setErr("");
    if (!f.submit()) { notify(t("fix_fields"), "error"); return; }
    setBusy(true);
    const v = f.form;
    try {
      await withLoading(signIn(tab, reg
        ? { name: v.name.trim(), email: v.email.trim(), password: v.password, lang, invite: v.invite.trim() || undefined, acceptTerms: true }
        : { email: v.email.trim(), password: v.password }));
      notify(reg ? t("account_created") : t("welcome_back"));
    } catch (x) { setErr(errText(t, x, cfg)); setBusy(false); }
  };

  return (
    <AuthFrame setLang={setLang}>
      <Tabs value={tab} onChange={(e, v) => switchTab(v)} variant="fullWidth" sx={{ mb: 2.5, borderBottom: `1px solid ${k.outlineVariant}` }}>
        <Tab value="login" label={t("sign_in")} />
        <Tab value="register" label={t("create_account")} />
      </Tabs>
      <Stack component="form" spacing={1.75} onSubmit={submit} noValidate>
        {reg && showInvite && <TextField label={t("invite_code")} autoComplete="off" autoFocus {...f.bind("invite")} helperText={f.show("invite") ? t("invite_required") : t("invite_hint")} slotProps={icon(VpnKeyRounded)} />}
        {reg && <TextField label={t("your_name")} autoComplete="name" autoFocus={!showInvite} {...f.bind("name")} helperText={f.show("name") ? t("name_invalid") : ""} slotProps={icon(PersonRounded)} />}
        <TextField label={t("email")} type="email" autoComplete="email" autoFocus={!reg} {...f.bind("email")} helperText={f.show("email") ? t("email_invalid") : ""} slotProps={icon(EmailRounded)} />
        <PasswordField label={reg ? t("new_pw") : t("password")} autoComplete={reg ? "new-password" : "current-password"} {...f.bind("password")}
          helperText={f.show("password") ? (reg ? t("pw_weak") : t("pw_required")) : ""} />
        {reg && <>
          <PasswordField label={t("confirm_pw")} autoComplete="new-password" showToggle={false} {...f.bind("confirmPassword")} helperText={f.show("confirmPassword") ? t("pw_mismatch") : ""} />
          <PasswordRules value={f.form.password} hints={[f.form.name, f.form.email]} />
        </>}
        {!reg && cfg?.emailEnabled && (
          <Box sx={{ textAlign: "right", mt: "4px !important" }}><Link component="button" type="button" variant="body2" onClick={() => setForgot(true)}>{t("forgot_pw")}</Link></Box>
        )}
        {reg && (
          <Box>
            <FormControlLabel sx={{ alignItems: "flex-start", gap: 1, m: 0 }}
              control={<Checkbox size="small" checked={f.form.agree} onChange={e => f.setForm(x => ({ ...x, agree: e.target.checked }))}
                sx={{ p: 0, mt: "1px", color: f.show("agree") ? "error.main" : "text.secondary", "&.Mui-checked": { color: "primary.main" } }} />}
              label={<Typography variant="body2" sx={{ lineHeight: "22px" }}>{t("agree_pre")} <Link component={RouterLink} to="/privacy" sx={{ fontWeight: 600 }}>{t("privacy_notice")}</Link></Typography>} />
            {f.show("agree") && <FormHelperText error sx={{ ml: "28px", mt: 0.5 }}>{t("must_accept")}</FormHelperText>}
          </Box>
        )}
        {reg && cfg?.signupsClosed && <Alert severity="info">{t("signups_closed")}</Alert>}
        {err && <Alert severity="error">{err}</Alert>}
        <Button type="submit" variant="contained" disabled={busy || (reg && cfg?.signupsClosed)} sx={{ minHeight: 42 }}>{reg ? t("create_account") : t("sign_in")}</Button>
        {!reg && <Typography variant="body2" sx={{ textAlign: "center" }}><Link component={RouterLink} to="/privacy" color="text.secondary">{t("privacy_title")}</Link></Typography>}
      </Stack>
      {forgot && <ForgotDialog cfg={cfg} initialEmail={f.form.email} onClose={() => setForgot(false)} />}
    </AuthFrame>
  );
}

export function ResetPassword({ setLang }) {
  const { t } = useI18n(); const { adoptToken, signOut } = useAuth(); const notify = useSnack(); const withLoading = useLoading(); const nav = useNavigate();
  const [params] = useSearchParams(); const token = params.get("token") || "";
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const f = useForm({ password: "", confirmPassword: "" }, v => ({ password: !isStrongPassword(v.password), confirmPassword: !v.confirmPassword || v.password !== v.confirmPassword }));
  const submit = async e => {
    e.preventDefault(); setErr("");
    if (!f.submit()) { notify(t("fix_fields"), "error"); return; }
    setBusy(true);
    try {
      const r = await withLoading(api("/auth/reset", { method: "POST", body: { token, password: f.form.password } }));
      signOut(); adoptToken(r.token); notify(t("pw_reset_done")); nav("/", { replace: true });
    } catch (x) { setErr(errText(t, x)); setBusy(false); }
  };
  return (
    <AuthFrame setLang={setLang}>
      <Typography variant="h6" component="h2" sx={{ mb: 2, textAlign: "center" }}>{t("reset_title")}</Typography>
      {!token ? <Alert severity="error">{t("bad_token")}</Alert> : (
        <Stack component="form" spacing={1.75} onSubmit={submit} noValidate>
          <PasswordField label={t("new_pw")} autoComplete="new-password" autoFocus {...f.bind("password")} helperText={f.show("password") ? t("pw_weak") : ""} />
          <PasswordField label={t("confirm_pw")} autoComplete="new-password" showToggle={false} {...f.bind("confirmPassword")} helperText={f.show("confirmPassword") ? t("pw_mismatch") : ""} />
          <PasswordRules value={f.form.password} />
          {err && <Alert severity="error">{err}</Alert>}
          <Button type="submit" variant="contained" disabled={busy} sx={{ minHeight: 42 }}>{t("save")}</Button>
        </Stack>
      )}
      <Box sx={{ textAlign: "center", mt: 2 }}><Link component={RouterLink} to="/" variant="body2">{t("back_to_signin")}</Link></Box>
    </AuthFrame>
  );
}

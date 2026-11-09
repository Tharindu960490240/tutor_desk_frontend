import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography } from "@mui/material";
import { useI18n } from "../i18n/index.jsx";
import { useActions } from "../state/data.jsx";
import { useSnack, useLoading } from "../state/ui.jsx";
import { SendRounded } from "../icons.jsx";

export function FeedbackDialog({ onClose }) {
  const { t } = useI18n(); const actions = useActions(); const snack = useSnack(); const loc = useLocation(); const withLoading = useLoading();
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState(false);
  const submit = async e => {
    e.preventDefault();
    if (!msg.trim()) { setErr(true); return; }
    setBusy(true);
    try { await withLoading(actions.sendFeedback(msg.trim(), loc.pathname)); snack(t("feedback_sent")); onClose(); }
    catch (x) { snack(x.status === 429 ? t("too_many") : t("try_again_msg"), "error"); setBusy(false); }
  };
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { component: "form", onSubmit: submit } }}>
      <DialogTitle>{t("feedback")}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography color="text.secondary">{t("feedback_p")}</Typography>
        <TextField multiline minRows={5} autoFocus value={msg} onChange={e => { setMsg(e.target.value); setErr(false); }} placeholder={t("feedback_ph")} error={err} slotProps={{ htmlInput: { maxLength: 5000, "aria-label": t("feedback") } }} />
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 0 }}>
        <Button onClick={onClose}>{t("cancel")}</Button>
        <Button type="submit" variant="contained" startIcon={<SendRounded />} disabled={busy}>{t("send")}</Button>
      </DialogActions>
    </Dialog>
  );
}

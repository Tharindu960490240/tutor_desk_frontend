// App-wide UI helpers: theme mode, snackbar, dialog host, copy-to-clipboard.
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import CustomSnackbar from "../components/CustomSnackbar.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

/* ---------- theme mode (dark is default) ---------- */
const ModeCtx = createContext(null);
export function ModeProvider({ children, render }) {
  const [mode, setMode] = useState(() => { try { return localStorage.getItem("td-theme") === "dark" ? "dark" : "light"; } catch { return "light"; } });
  const value = useMemo(() => {
    const set = m => { setMode(m); try { localStorage.setItem("td-theme", m); } catch { /* ignore */ } };
    return { mode, setMode: set, toggle: () => set(mode === "dark" ? "light" : "dark") };
  }, [mode]);
  return <ModeCtx.Provider value={value}>{render ? render(mode, children) : children}</ModeCtx.Provider>;
}
export const useMode = () => useContext(ModeCtx);

/* ---------- snackbar (AFC style) ----------
   const notify = useSnack();
   notify("Saved")                                   -> success
   notify("Could not save", "error")                 -> error | warning | info | success
   notify("Payment deleted", { severity: "success", action: { label: "Undo", onClick } })
   notify("Payment deleted", { label: "Undo", onClick })   (older call style still works) */
const SnackCtx = createContext(() => {});
export function SnackProvider({ children }) {
  const [s, setS] = useState(null);
  const { mode } = useMode();
  const show = useCallback((message, opts) => {
    let severity = "success", action;
    if (typeof opts === "string") severity = opts;
    else if (opts && opts.label) action = opts;
    else if (opts) { severity = opts.severity || severity; action = opts.action; }
    setS({ message, severity, action, key: Date.now() + Math.random() });
  }, []);
  return (
    <SnackCtx.Provider value={show}>
      {children}
      <CustomSnackbar key={s?.key} open={!!s} severity={s?.severity} message={s?.message} action={s?.action} dark={mode === "dark"} onClose={() => setS(null)} />
    </SnackCtx.Provider>
  );
}
export const useSnack = () => useContext(SnackCtx);

/* ---------- global loading overlay (AFC LoadingSpinner) ----------
   const withLoading = useLoading();
   await withLoading(api(...))      // shows the spinner while the promise runs */
const LoadCtx = createContext(p => p);
export function LoadingProvider({ children }) {
  const [open, setOpen] = useState(false);
  const pending = useRef(0);
  const timer = useRef();
  const run = useCallback(async work => {
    // wait a moment before showing, so very quick saves don't flash the overlay
    if (pending.current++ === 0) timer.current = setTimeout(() => setOpen(true), 180);
    try { return await (typeof work === "function" ? work() : work); }
    finally {
      if (--pending.current === 0) { clearTimeout(timer.current); setOpen(false); }
    }
  }, []);
  return <LoadCtx.Provider value={run}>{children}<LoadingSpinner open={open} /></LoadCtx.Provider>;
}
export const useLoading = () => useContext(LoadCtx);

/* ---------- dialog host: open(close => <MyDialog onClose={close} />) ---------- */
const DlgCtx = createContext(null);
export function DialogHost({ children }) {
  const [stack, setStack] = useState([]);
  const idRef = useRef(0);
  const api = useMemo(() => ({
    open(render) {
      const id = ++idRef.current;
      const close = () => setStack(st => st.filter(d => d.id !== id));
      setStack(st => [...st, { id, render, close }]);
      return close;
    },
    /** Replace all open dialogs with a new one */
    replace(render) { setStack([]); return api.open(render); },
    closeAll: () => setStack([]),
  }), []);
  return (
    <DlgCtx.Provider value={api}>
      {children}
      {stack.map(d => <DlgItem key={d.id} d={d} />)}
    </DlgCtx.Provider>
  );
}
function DlgItem({ d }) { return d.render(d.close); }
export const useDialogs = () => useContext(DlgCtx);

/** Promise-based confirm dialog */
export function useConfirm(t) {
  const dlg = useDialogs();
  return (title, text, okLabel, danger) => new Promise(res => {
    dlg.open(close => (
      <Dialog open onClose={() => { close(); res(false); }} maxWidth="xs" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent sx={{ color: "text.secondary" }}>{text}</DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => { close(); res(false); }}>{t("cancel")}</Button>
          <Button variant="contained" color={danger ? "error" : "primary"} onClick={() => { close(); res(true); }}>{okLabel}</Button>
        </DialogActions>
      </Dialog>
    ));
  });
}

/** Copy to clipboard, falling back to a dialog with selectable text */
export function useCopy(t) {
  const snack = useSnack();
  const dlg = useDialogs();
  return async (text, okMsg) => {
    try { await navigator.clipboard.writeText(text); snack(okMsg || t("copied")); return true; } catch { /* fall through */ }
    dlg.open(close => (
      <Dialog open onClose={close} fullWidth maxWidth="sm">
        <DialogTitle>{t("copy_this")}</DialogTitle>
        <DialogContent>
          <TextField multiline minRows={6} fullWidth value={text} helperText={t("copy_manual")} slotProps={{ htmlInput: { readOnly: true, onFocus: e => e.target.select() } }} autoFocus />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}><Button variant="contained" onClick={close}>{t("done")}</Button></DialogActions>
      </Dialog>
    ));
    return false;
  };
}

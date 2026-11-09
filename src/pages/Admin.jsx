// Admin panel (English only – it's just for you, the app owner).
// Manages accounts, feedback and sign-ups. It never shows tutors' students, payments or attendance.
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, ListItemIcon, ListItemText, Menu, MenuItem, Radio, Stack, Tab, Tabs, TextField, Tooltip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useI18n } from "../i18n/index.jsx";
import { useAdmin, useAdminActions } from "../state/data.jsx";
import { useSnack, useLoading, useConfirm, useCopy, useDialogs } from "../state/ui.jsx";
import { SectionCard, StatCard, EmptyState, StudentAvatar, Pill, tones } from "../components/common.jsx";
import { InlineLoader } from "../components/LoadingSpinner.jsx";
import { BlockRounded, BoltRounded, BugReportRounded, CasinoRounded, CheckCircleRounded, ContentCopyRounded, DeleteForeverRounded, DeleteRounded, DoneRounded, FeedbackRounded, GroupRounded, HowToRegRounded, InboxRounded, InsightsRounded, LockRounded, MailRounded, MarkEmailUnreadRounded, MoreVertRounded, PasswordRounded, PersonAddRounded, PublicRounded, ReplyRounded, SaveRounded, SearchRounded, ShieldRounded, StorageRounded, UndoRounded, VpnKeyRounded } from "../icons.jsx";

/* ---------- small helpers ---------- */
const ago = iso => {
  if (!iso) return "never";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  const d = Math.round(s / 86400);
  return d === 1 ? "yesterday" : d < 30 ? `${d} days ago` : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const dateTime = iso => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const device = ua => {
  if (!ua) return "";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "";
  const br = /Edg\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
  return [br, os].filter(Boolean).join(" on ");
};
const LANG = { en: "English", si: "සිංහල", ta: "தமிழ்" };
const errMsg = e => ({ not_yourself: "You can't do that to your own account.", email_disabled: "Email isn't set up (GMAIL_USER / GMAIL_APP_PASSWORD).", email_failed: "The email couldn't be sent. Check the Gmail settings.", code_too_short: "The invite code needs at least 4 characters." }[e?.code] || "Something went wrong. Please try again.");

function useRun() {
  const snack = useSnack(); const withLoading = useLoading();
  return async (work, ok) => {
    try { const r = await withLoading(work); if (ok) snack(ok); return r; }
    catch (e) { snack(errMsg(e), "error"); throw e; }
  };
}

/* ---------- Overview ---------- */
function MiniChart({ days }) {
  const theme = useTheme(), k = tones(theme);
  const max = Math.max(1, ...days.map(d => Math.max(d.active, d.signups)));
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: { xs: 0.5, sm: 1 }, height: 140, pt: 1 }} role="img"
        aria-label={`Last 14 days. Active tutors per day: ${days.map(d => d.active).join(", ")}. New sign-ups: ${days.map(d => d.signups).join(", ")}.`}>
        {days.map(d => (
          <Tooltip key={d.day} title={`${new Date(d.day).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}: ${d.active} active, ${d.signups} new`}>
            <Box sx={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end", gap: "2px", cursor: "default" }}>
              <Box sx={{ flex: 1, height: `${(d.active / max) * 100}%`, minHeight: d.active ? 3 : 0, bgcolor: "primary.main", borderRadius: "4px 4px 0 0" }} />
              <Box sx={{ flex: 1, height: `${(d.signups / max) * 100}%`, minHeight: d.signups ? 3 : 0, bgcolor: "#ffc94a", borderRadius: "4px 4px 0 0" }} />
            </Box>
          </Tooltip>
        ))}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "text.secondary", mt: 0.75, borderTop: `1px solid ${k.outlineVariant}`, pt: 0.5 }}>
        <span>{new Date(days[0].day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span><span>Today</span>
      </Box>
      <Stack direction="row" spacing={2} sx={{ mt: 1, fontSize: 12.5, color: "text.secondary" }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}><Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: "primary.main" }} /><span>Active tutors</span></Stack>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}><Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: "#ffc94a" }} /><span>New sign-ups</span></Stack>
      </Stack>
    </Box>
  );
}

function Overview({ go }) {
  const { data: o, isPending, isError, refetch } = useAdmin("/overview");
  if (isPending) return <InlineLoader compact />;
  if (isError) return <SectionCard><EmptyState icon={InsightsRounded} title="Couldn't load the overview" action={<Button variant="contained" onClick={() => refetch()}>Try again</Button>} /></SectionCard>;
  const mode = { invite: "Invite code needed", open: "Open to everyone", closed: "Closed" }[o.signup.mode];
  return (<>
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" } }}>
      <StatCard hero icon={GroupRounded} label="Tutors" value={o.users.total} sub={o.users.suspended ? `${o.users.suspended} suspended` : "All accounts"} />
      <StatCard icon={BoltRounded} iconColor="success.main" label="Active this week" value={o.users.active7} sub={`${o.users.active1} today`} />
      <StatCard icon={PersonAddRounded} iconColor="primary.main" label="New this week" value={o.users.new7} sub="Sign-ups in the last 7 days" />
      <StatCard icon={FeedbackRounded} iconColor={o.feedback.open ? "warning.main" : "success.main"} label="Open feedback" value={o.feedback.open} sub={o.feedback.crashes ? `${o.feedback.crashes} crash report${o.feedback.crashes === 1 ? "" : "s"}` : "No crash reports"} />
    </Box>
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr" } }}>
      <SectionCard icon={InsightsRounded} title="Last 14 days"><MiniChart days={o.days} /></SectionCard>
      <Stack spacing={2}>
        <SectionCard icon={HowToRegRounded} title="Sign-ups" action={<Button size="small" onClick={() => go("signups")}>Change</Button>}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
            <Pill tone={o.signup.mode === "closed" ? "bad" : o.signup.mode === "open" ? "good" : "info"}>{mode}</Pill>
            {o.signup.mode === "invite" && <Typography sx={{ fontFamily: "monospace", fontWeight: 700 }}>{o.signup.code}</Typography>}
          </Stack>
        </SectionCard>
        <SectionCard icon={MailRounded} title="Email">
          {o.emailEnabled ? <Pill tone="good" icon={<CheckCircleRounded />}>Gmail connected</Pill>
            : <Alert severity="warning" sx={{ py: 0 }}>Not set up – add GMAIL_USER and GMAIL_APP_PASSWORD in Vercel.</Alert>}
        </SectionCard>
        <SectionCard icon={StorageRounded} title="Records in the app">
          <Typography variant="body2" color="text.secondary">
            {o.data.students} students · {o.data.classes} classes · {o.data.payments} payments · {o.data.marks} attendance marks
          </Typography>
        </SectionCard>
      </Stack>
    </Box>
  </>);
}

/* ---------- Tutors ---------- */
function TempPasswordDialog({ user, password, onClose }) {
  const { t } = useI18n(); const copy = useCopy(t);
  const msg = `Hi ${user.name}, your TutorDesk password has been reset.\nTemporary password: ${password}\nPlease sign in and change it in Settings → Change password.`;
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Temporary password</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography color="text.secondary">Send this to {user.name}. They've been signed out everywhere and can sign in with it now. It's only shown once.</Typography>
        <Box sx={{ fontFamily: "monospace", fontSize: 26, fontWeight: 700, letterSpacing: ".08em", textAlign: "center", py: 1.5, borderRadius: 3, bgcolor: "action.hover", userSelect: "all" }}>{password}</Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 0, flexWrap: "wrap", gap: 1 }}>
        <Button startIcon={<ContentCopyRounded />} onClick={() => copy(password, "Password copied")}>Copy password</Button>
        <Button variant="contained" startIcon={<ContentCopyRounded />} onClick={() => copy(msg, "Message copied")}>Copy message</Button>
      </DialogActions>
    </Dialog>
  );
}

function UserMenu({ u, emailEnabled }) {
  const [el, setEl] = useState(null);
  const A = useAdminActions(); const run = useRun(); const dlg = useDialogs();
  const { t } = useI18n(); const confirm = useConfirm(t);
  const close = () => setEl(null);
  const act = async fn => { close(); try { await fn(); } catch { /* already shown */ } };
  return (<>
    <Tooltip title="Actions"><span><IconButton aria-label={`Actions for ${u.name}`} onClick={e => setEl(e.currentTarget)} disabled={u.you}><MoreVertRounded /></IconButton></span></Tooltip>
    <Menu anchorEl={el} open={!!el} onClose={close} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
      {emailEnabled && <MenuItem onClick={() => act(() => run(A.sendReset(u.id), `Reset link emailed to ${u.email}`))}><ListItemIcon><MarkEmailUnreadRounded fontSize="small" /></ListItemIcon><ListItemText>Email a reset link</ListItemText></MenuItem>}
      <MenuItem onClick={() => act(async () => {
        if (!(await confirm("Create a temporary password?", `${u.name}'s current password will stop working and they'll be signed out on every device.`, "Create password"))) return;
        const r = await run(A.tempPassword(u.id));
        dlg.open(c => <TempPasswordDialog user={u} password={r.password} onClose={c} />);
      })}><ListItemIcon><PasswordRounded fontSize="small" /></ListItemIcon><ListItemText>Create temporary password</ListItemText></MenuItem>
      {u.disabled
        ? <MenuItem onClick={() => act(() => run(A.setDisabled(u.id, false), `${u.name} can sign in again`))}><ListItemIcon><CheckCircleRounded fontSize="small" /></ListItemIcon><ListItemText>Unsuspend</ListItemText></MenuItem>
        : <MenuItem onClick={() => act(async () => {
            if (await confirm(`Suspend ${u.name}?`, "They'll be signed out and can't sign in until you unsuspend them. Their data is kept.", "Suspend", true)) await run(A.setDisabled(u.id, true), `${u.name} suspended`);
          })}><ListItemIcon><BlockRounded fontSize="small" /></ListItemIcon><ListItemText>Suspend</ListItemText></MenuItem>}
      <MenuItem sx={{ color: "error.main" }} onClick={() => act(async () => {
        if (await confirm(`Delete ${u.name}'s account?`, `This permanently deletes ${u.email} and all of their students, classes, payments and attendance. It can't be undone.`, "Delete forever", true)) await run(A.deleteUser(u.id), "Account deleted");
      })}><ListItemIcon><DeleteForeverRounded fontSize="small" sx={{ color: "error.main" }} /></ListItemIcon><ListItemText>Delete account</ListItemText></MenuItem>
    </Menu>
  </>);
}

function Tutors() {
  const theme = useTheme(), k = tones(theme);
  const { data, isPending, isError, refetch } = useAdmin("/users");
  const ov = useAdmin("/overview").data;
  const [q, setQ] = useState(""); const [filter, setFilter] = useState("all");
  const list = useMemo(() => {
    let l = data || [];
    const qq = q.trim().toLowerCase();
    if (qq) l = l.filter(u => (u.name + " " + u.email).toLowerCase().includes(qq));
    if (filter === "active") l = l.filter(u => u.last_seen_at && Date.now() - new Date(u.last_seen_at) < 7 * 864e5);
    if (filter === "inactive") l = l.filter(u => !u.last_seen_at || Date.now() - new Date(u.last_seen_at) >= 7 * 864e5);
    if (filter === "suspended") l = l.filter(u => u.disabled);
    return l;
  }, [data, q, filter]);
  if (isPending) return <InlineLoader compact />;
  if (isError) return <SectionCard><EmptyState icon={GroupRounded} title="Couldn't load tutors" action={<Button variant="contained" onClick={() => refetch()}>Try again</Button>} /></SectionCard>;
  return (
    <SectionCard>
      <TextField fullWidth type="search" placeholder="Search by name or email" value={q} onChange={e => setQ(e.target.value)} sx={{ mb: 1.5 }}
        slotProps={{ htmlInput: { "aria-label": "Search tutors" }, input: { startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> } }} />
      <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", mb: 1 }}>
        {[["all", `All ${data.length}`], ["active", "Active this week"], ["inactive", "Not active"], ["suspended", "Suspended"]].map(([key, l]) => (
          <Chip key={key} label={l} onClick={() => setFilter(key)} color={filter === key ? "secondary" : "default"} variant={filter === key ? "filled" : "outlined"} aria-pressed={filter === key} />
        ))}
      </Stack>
      {list.length ? list.map(u => (
        <Stack key={u.id} direction="row" spacing={1.5} sx={{ alignItems: "center", py: 1.5, px: 0.5, borderTop: `1px solid ${k.outlineVariant}`, opacity: u.disabled ? 0.65 : 1 }}>
          <StudentAvatar name={u.name} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
              <Typography noWrap sx={{ fontWeight: 600, maxWidth: "100%" }}>{u.name}</Typography>
              {u.you && <Pill tone="info" sx={{ height: 22, fontSize: 11.5 }}>You</Pill>}
              {u.isAdmin && <Pill tone="info" icon={<ShieldRounded />} sx={{ height: 22, fontSize: 11.5 }}>Admin</Pill>}
              {u.disabled && <Pill tone="bad" icon={<BlockRounded />} sx={{ height: 22, fontSize: 11.5 }}>Suspended</Pill>}
              {u.sample && <Pill sx={{ height: 22, fontSize: 11.5 }}>Sample data</Pill>}
            </Stack>
            <Typography noWrap variant="body2" color="text.secondary">{u.email}</Typography>
            <Typography variant="caption" color="text.secondary" component="div">
              Joined {ago(u.created_at)} · Last active {ago(u.last_seen_at)} · {u.students} students · {u.classes} classes · {LANG[u.lang] || "English"}{u.feedback ? ` · ${u.feedback} feedback` : ""}
            </Typography>
          </Box>
          <UserMenu u={u} emailEnabled={ov?.emailEnabled} />
        </Stack>
      )) : <EmptyState icon={SearchRounded} title="No tutors match" />}
    </SectionCard>
  );
}

/* ---------- Feedback ---------- */
function FeedbackItem({ f }) {
  const theme = useTheme(), k = tones(theme);
  const A = useAdminActions(); const run = useRun();
  const [open, setOpen] = useState(!f.crash);
  const subject = encodeURIComponent("Re: your TutorDesk feedback");
  const body = encodeURIComponent(`Hi ${f.user_name || ""},\n\nThanks for your feedback:\n> ${f.message.split("\n").join("\n> ")}\n\n`);
  return (
    <Card sx={{ borderLeft: `4px solid ${f.crash ? theme.palette.error.main : f.resolved ? k.outline : theme.palette.primary.main}` }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <StudentAvatar name={f.user_name || f.email || "?"} size={36} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
              <Typography sx={{ fontWeight: 600 }}>{f.user_name || "Deleted account"}</Typography>
              {f.crash && <Pill tone="bad" icon={<BugReportRounded />} sx={{ height: 22, fontSize: 11.5 }}>Crash report</Pill>}
              {f.resolved && <Pill tone="good" icon={<DoneRounded />} sx={{ height: 22, fontSize: 11.5 }}>Done</Pill>}
            </Stack>
            <Typography variant="caption" color="text.secondary" component="div">
              {f.email} · {dateTime(f.created_at)}{f.page ? ` · on ${f.page}` : ""}{device(f.user_agent) ? ` · ${device(f.user_agent)}` : ""}
            </Typography>
          </Box>
        </Stack>
        {open ? (
          <Box sx={{ mt: 1.25, bgcolor: k.surface2, borderRadius: 3, px: 1.75, py: 1.25, fontSize: 14, whiteSpace: "pre-wrap", overflowWrap: "anywhere", ...(f.crash ? { fontFamily: "monospace", fontSize: 12, maxHeight: 260, overflow: "auto" } : {}) }}>{f.message}</Box>
        ) : (
          <Button size="small" sx={{ mt: 1 }} onClick={() => setOpen(true)}>Show details</Button>
        )}
        <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: "wrap", rowGap: 1 }}>
          {f.email && !f.crash && <Button size="small" variant="tonal" startIcon={<ReplyRounded />} href={`mailto:${f.email}?subject=${subject}&body=${body}`}>Reply</Button>}
          {f.resolved
            ? <Button size="small" startIcon={<UndoRounded />} onClick={() => run(A.resolveFeedback(f.id, false), "Moved back to open").catch(() => {})}>Reopen</Button>
            : <Button size="small" variant="outlined" startIcon={<DoneRounded />} onClick={() => run(A.resolveFeedback(f.id, true), "Marked as done").catch(() => {})}>Mark done</Button>}
          <Button size="small" color="error" startIcon={<DeleteRounded />} onClick={() => run(A.deleteFeedback(f.id), "Feedback deleted").catch(() => {})}>Delete</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function FeedbackInbox() {
  const [status, setStatus] = useState("open");
  const { data, isPending, isError, refetch } = useAdmin(`/feedback?status=${status}`);
  return (<>
    <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
      {[["open", "Open"], ["resolved", "Done"], ["all", "All"]].map(([key, l]) => (
        <Chip key={key} label={l} onClick={() => setStatus(key)} color={status === key ? "secondary" : "default"} variant={status === key ? "filled" : "outlined"} aria-pressed={status === key} />
      ))}
    </Stack>
    {isPending ? <InlineLoader compact /> : isError ? <SectionCard><EmptyState icon={InboxRounded} title="Couldn't load feedback" action={<Button variant="contained" onClick={() => refetch()}>Try again</Button>} /></SectionCard>
      : data.length ? <Stack spacing={1.5}>{data.map(f => <FeedbackItem key={f.id} f={f} />)}</Stack>
      : <SectionCard><EmptyState icon={InboxRounded} title={status === "open" ? "Inbox zero" : "Nothing here"} text={status === "open" ? "No open feedback. New messages and crash reports will appear here." : undefined} /></SectionCard>}
  </>);
}

/* ---------- Sign-ups ---------- */
function SignupOption({ selected, onSelect, icon: I, title, text, children }) {
  const theme = useTheme(), k = tones(theme);
  return (
    <Box onClick={onSelect} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", p: 1.75, borderRadius: 4, cursor: "pointer", border: `2px solid ${selected ? theme.palette.primary.main : k.outlineVariant}`, bgcolor: selected ? k.surface2 : "transparent" }}>
      <Radio checked={selected} onChange={onSelect} slotProps={{ input: { "aria-label": title } }} sx={{ p: 0.5, mt: -0.25 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><I color="primary" fontSize="small" /><Typography sx={{ fontWeight: 600 }}>{title}</Typography></Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{text}</Typography>
        {children}
      </Box>
    </Box>
  );
}

function Signups() {
  const { data, isPending } = useAdmin("/signup");
  const A = useAdminActions(); const run = useRun();
  const { t } = useI18n(); const copy = useCopy(t);
  const [draft, setDraft] = useState(null);
  if (isPending) return <InlineLoader compact />;
  const v = draft || data;
  const set = patch => setDraft({ ...v, ...patch });
  const random = () => { const w = ["TUTOR", "CLASS", "LEARN", "STUDY", "DESK"]; set({ code: w[Math.floor(Math.random() * w.length)] + (1000 + Math.floor(Math.random() * 9000)) }); };
  const save = () => run(A.saveSignup({ mode: v.mode, code: (v.code || "").trim() }), "Sign-up settings saved").then(() => setDraft(null)).catch(() => {});
  const site = window.location.origin;
  const invite = `Hi! You're invited to test TutorDesk – an app for tutors to manage classes, attendance and fees.\n\n1. Open ${site}\n2. Tap "Create account"\n3. Invite code: ${v.code}\n\nPlease send feedback from inside the app (tap "Test version"). Thank you!`;
  return (
    <SectionCard icon={HowToRegRounded} title="Who can create an account">
      <Stack spacing={1.5}>
        <SignupOption selected={v.mode === "invite"} onSelect={() => set({ mode: "invite" })} icon={VpnKeyRounded} title="Invite code" text="Only people with the code can sign up. Best while testing.">
          {v.mode === "invite" && (
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: "center", flexWrap: "wrap", rowGap: 1 }} onClick={e => e.stopPropagation()}>
              <TextField size="small" label="Invite code" value={v.code || ""} onChange={e => set({ code: e.target.value.toUpperCase().replace(/\s/g, "") })} slotProps={{ htmlInput: { maxLength: 60, style: { fontFamily: "monospace", fontWeight: 700, letterSpacing: ".06em" } } }} />
              <Tooltip title="Make a new code"><IconButton onClick={random} aria-label="Make a new code"><CasinoRounded /></IconButton></Tooltip>
              <Button size="small" startIcon={<ContentCopyRounded />} onClick={() => copy(invite, "Invite message copied")}>Copy invite message</Button>
            </Stack>
          )}
        </SignupOption>
        <SignupOption selected={v.mode === "open"} onSelect={() => set({ mode: "open" })} icon={PublicRounded} title="Open to everyone" text="Anyone with the link can create an account." />
        <SignupOption selected={v.mode === "closed"} onSelect={() => set({ mode: "closed" })} icon={LockRounded} title="Closed" text="No new accounts. Existing tutors can still sign in." />
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          {draft && <Button onClick={() => setDraft(null)}>Cancel</Button>}
          <Button variant="contained" startIcon={<SaveRounded />} disabled={!draft} onClick={save}>Save</Button>
        </Stack>
        <Typography variant="caption" color="text.secondary">Changing the invite code doesn't affect people who already have an account.</Typography>
      </Stack>
    </SectionCard>
  );
}

/* ---------- page ---------- */
export default function Admin() {
  const theme = useTheme(), k = tones(theme);
  const [params, setParams] = useSearchParams();
  const tab = ["overview", "tutors", "feedback", "signups"].includes(params.get("tab")) ? params.get("tab") : "overview";
  const go = v => setParams(v === "overview" ? {} : { tab: v }, { replace: true });
  const ov = useAdmin("/overview").data;
  return (<>
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary", fontSize: 13.5 }}>
      <ShieldRounded fontSize="small" />
      <span>Only you can see this page. It shows accounts and feedback – never tutors' students, payments or attendance.</span>
    </Stack>
    <Box sx={{ borderBottom: `1px solid ${k.outlineVariant}`, mx: -0.5 }}>
      <Tabs value={tab} onChange={(e, v) => go(v)} variant="scrollable" allowScrollButtonsMobile>
        <Tab value="overview" icon={<InsightsRounded />} iconPosition="start" label="Overview" />
        <Tab value="tutors" icon={<GroupRounded />} iconPosition="start" label="Tutors" />
        <Tab value="feedback" icon={<FeedbackRounded />} iconPosition="start" label={ov?.feedback.open ? `Feedback (${ov.feedback.open})` : "Feedback"} />
        <Tab value="signups" icon={<HowToRegRounded />} iconPosition="start" label="Sign-ups" />
      </Tabs>
    </Box>
    {tab === "overview" && <Overview go={go} />}
    {tab === "tutors" && <Tutors />}
    {tab === "feedback" && <FeedbackInbox />}
    {tab === "signups" && <Signups />}
  </>);
}

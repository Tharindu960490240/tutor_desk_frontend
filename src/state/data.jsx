// Server data: auth session, bootstrap payload, attendance by month, and mutations.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueries, useQueryClient, useMutation } from "@tanstack/react-query";
import { api, auth, setUnauthorizedHandler } from "../api.js";
import { makeDomain } from "../lib/domain.js";
import { monthEnd } from "../lib/dates.js";
import { guessLang } from "../i18n/index.jsx";

const AuthCtx = createContext(null);
export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [token, setToken] = useState(auth.token);
  const signOut = useCallback(() => { auth.set(null); setToken(null); qc.clear(); }, [qc]);
  useEffect(() => { setUnauthorizedHandler(signOut); }, [signOut]);
  const value = useMemo(() => ({
    token, signOut,
    adoptToken(t) { auth.set(t); setToken(t); },
    async signIn(path, body) {
      const r = await api("/auth/" + path, { method: "POST", body });
      auth.set(r.token); setToken(r.token);
      return r;
    },
  }), [token, signOut]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);

export const BOOT = ["boot"];
/** Public server config: is an invite code needed, is email set up, contact address */
export function useAuthConfig() {
  return useQuery({ queryKey: ["auth-config"], queryFn: () => api("/auth/config"), staleTime: 5 * 60_000, retry: 2 });
}

export function useBoot() {
  const { token } = useAuth();
  return useQuery({ queryKey: BOOT, queryFn: () => api("/bootstrap"), enabled: !!token, staleTime: 60_000 });
}

/** Domain helpers over the bootstrap data. Must be used under a loaded boot. */
export function useDomain() {
  const { data } = useBoot();
  const lang = data?.settings?.lang || guessLang();
  return useMemo(() => (data ? makeDomain(data, lang) : null), [data, lang]);
}

/** Attendance rows for one or more months ("YYYY-MM"). */
export function useAttendance(yms) {
  const res = useQueries({
    queries: yms.map(ym => ({ queryKey: ["att", ym], queryFn: () => api(`/attendance?from=${ym}-01&to=${monthEnd(ym)}`), staleTime: 60_000 })),
  });
  const loading = res.some(r => r.isPending);
  const error = res.find(r => r.isError)?.error;
  const dataKey = res.map(r => r.dataUpdatedAt).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rows = useMemo(() => res.flatMap(r => r.data || []), [dataKey]);
  return { rows, loading, error };
}

/** Admin panel data */
export function useAdmin(path, opts) {
  return useQuery({ queryKey: ["admin", path], queryFn: () => api("/admin" + path), staleTime: 15_000, ...opts });
}
export function useAdminActions() {
  const qc = useQueryClient();
  const m = useMutation({ mutationFn: ({ path, method, body }) => api("/admin" + path, { method, body }) });
  const call = async (path, method, body) => { const r = await m.mutateAsync({ path, method, body }); qc.invalidateQueries({ queryKey: ["admin"] }); return r; };
  return {
    tempPassword: id => call(`/users/${id}/temp-password`, "POST"),
    sendReset: id => call(`/users/${id}/send-reset`, "POST"),
    setDisabled: (id, disabled) => call(`/users/${id}/disabled`, "PUT", { disabled }),
    deleteUser: id => call(`/users/${id}`, "DELETE"),
    resolveFeedback: (id, resolved) => call(`/feedback/${id}`, "PUT", { resolved }),
    deleteFeedback: id => call(`/feedback/${id}`, "DELETE"),
    saveSignup: body => call("/signup", "PUT", body),
  };
}

/** Mutations that keep the bootstrap cache in sync without refetching everything. */
export function useActions() {
  const qc = useQueryClient();
  const { adoptToken } = useAuth();
  const patch = fn => qc.setQueryData(BOOT, d => (d ? fn(d) : d));
  const upsert = (list, item) => (list.some(x => x.id === item.id) ? list.map(x => (x.id === item.id ? item : x)) : [...list, item]);
  const m = useMutation({ mutationFn: ({ path, method, body }) => api(path, { method, body }) });
  const call = (path, method, body) => m.mutateAsync({ path, method, body });
  const resetAll = data => { qc.setQueryData(BOOT, data); qc.removeQueries({ queryKey: ["att"] }); };

  return {
    async saveSettings(body) { const s = await call("/settings", "PUT", body); patch(d => ({ ...d, settings: s })); return s; },
    async saveClass(id, body) {
      const c = await call(id ? `/classes/${id}` : "/classes", id ? "PUT" : "POST", body);
      patch(d => ({ ...d, classes: upsert(d.classes, c) }));
      return c;
    },
    async deleteClass(id) {
      await call(`/classes/${id}`, "DELETE");
      patch(d => ({ ...d, classes: d.classes.filter(c => c.id !== id), changes: (d.changes || []).filter(x => x.cid !== id), students: d.students.map(s => ({ ...s, classIds: s.classIds.filter(x => x !== id) })) }));
      qc.invalidateQueries({ queryKey: ["att"] });
    },
    async endClass(id, endsOn) {
      const c = await call(`/classes/${id}/end`, "PUT", { endsOn });
      patch(d => ({ ...d, classes: upsert(d.classes, c) }));
      return c;
    },
    async addChange(cid, body) {
      const ch = await call(`/classes/${cid}/changes`, "POST", body);
      patch(d => ({
        ...d,
        changes: [...(d.changes || []).filter(x => !(ch.kind !== "break" && x.cid === cid && x.kind !== "break" && x.date === ch.date && x.time === ch.time)), ch]
          .sort((a, b) => a.date.localeCompare(b.date)),
      }));
      return ch;
    },
    async deleteChange(id) {
      await call(`/changes/${id}`, "DELETE");
      patch(d => ({ ...d, changes: (d.changes || []).filter(x => x.id !== id) }));
    },
    async saveStudent(id, body) {
      const s = await call(id ? `/students/${id}` : "/students", id ? "PUT" : "POST", body);
      patch(d => ({ ...d, students: upsert(d.students, s) }));
      return s;
    },
    async setActive(id, active) {
      const s = await call(`/students/${id}/active`, "PUT", { active });
      patch(d => ({ ...d, students: upsert(d.students, s) }));
      return s;
    },
    async deleteStudent(id) {
      await call(`/students/${id}`, "DELETE");
      patch(d => ({ ...d, students: d.students.filter(s => s.id !== id), payments: d.payments.map(p => (p.sid === id ? { ...p, sid: null } : p)), reminders: d.reminders.filter(r => r.sid !== id) }));
      qc.invalidateQueries({ queryKey: ["att"] });
    },
    async addPayment(body) {
      const p = await call("/payments", "POST", body);
      patch(d => ({ ...d, payments: [p, ...d.payments] }));
      return p;
    },
    async deletePayment(id) {
      await call(`/payments/${id}`, "DELETE");
      patch(d => ({ ...d, payments: d.payments.filter(p => p.id !== id) }));
    },
    /** Optimistic attendance update. marks = {sid: "P"|"L"|"A"|null} */
    async mark(cid, date, time, marks) {
      const key = ["att", date.slice(0, 7)];
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, rows => {
        let out = (rows || []).filter(r => !(r.cid === cid && r.date === date && r.time === time && r.sid in marks));
        for (const [sid, v] of Object.entries(marks)) if (v) out.push({ cid, date, time, sid, v });
        return out;
      });
      try { await call("/attendance/bulk", "PUT", { cid, date, time, marks }); }
      catch (e) { qc.setQueryData(key, prev); throw e; }
    },
    async logReminder(sid, type, key) {
      const r = await call("/reminders", "POST", { sid, type, key });
      patch(d => ({ ...d, reminders: [r, ...d.reminders] }));
    },
    async importBackup(data) { resetAll(await call("/data/import", "POST", data)); },
    async wipe() { resetAll(await call("/data", "DELETE")); },
    exportBackup: () => api("/data/export"),
    async changePassword(body) { const r = await call("/auth/password", "PUT", body); if (r.token) adoptToken(r.token); return r; },
    sendFeedback: (message, page) => call("/feedback", "POST", { message, page }),
    deleteAccount: () => call("/auth/account", "DELETE"),
  };
}

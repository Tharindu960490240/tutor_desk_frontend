// Pure business logic shared by every screen (fees, attendance, messages).
import { tl, LANGS, monthLabel, dayLong, longDateIn, DEFAULT_TPL } from "../i18n/index.jsx";
import { addMonths, addDays, todayStr, parseD, fmtTime } from "./dates.js";

export const CLASS_COLORS = ["#0288d1", "#00897b", "#5c6bc0", "#f4511e", "#8e24aa", "#43a047", "#c2185b", "#6d4c41"];
export const METHODS = ["cash", "bank", "mobile", "card", "other"];

/** Build a "domain" object around the raw bootstrap data so screens can ask questions cheaply. */
export function makeDomain(boot, uiLang) {
  const { settings, classes, students, payments, reminders, user } = boot;
  const changes = boot.changes || [];
  const lang = uiLang;
  const paidIdx = new Map();
  let firstPayYm = null;
  const admIdx = new Map(); // "sid|cid" -> admission paid
  for (const p of payments) {
    if (p.kind === "admission") { const ak = p.sid + "|" + p.cid; admIdx.set(ak, (admIdx.get(ak) || 0) + (+p.amount || 0)); continue; }
    const k = p.sid + "|" + p.ym;
    paidIdx.set(k, (paidIdx.get(k) || 0) + (+p.amount || 0));
    if (!firstPayYm || p.ym < firstPayYm) firstPayYm = p.ym;
  }
  const trackFrom = [user?.since, firstPayYm].filter(Boolean).sort()[0] || todayStr().slice(0, 7);
  const classMap = new Map(classes.map(c => [c.id, c]));
  const studentMap = new Map(students.map(s => [s.id, s]));
  const tpl = {
    fee: { ...DEFAULT_TPL.fee, ...Object.fromEntries(Object.entries(settings.tpl?.fee || {}).filter(([, v]) => v)) },
    cls: { ...DEFAULT_TPL.cls, ...Object.fromEntries(Object.entries(settings.tpl?.cls || {}).filter(([, v]) => v)) },
  };

  const D = {
    ...boot, tpl, lang,
    money(n) {
      const c = settings.currency || "Rs";
      const v = (Math.round((+n || 0) * 100) / 100).toLocaleString("en-LK", { maximumFractionDigits: 2 });
      return /^[A-Za-z]/.test(c) ? `${c} ${v}` : c + v;
    },
    classById: id => classMap.get(id),
    studentById: id => studentMap.get(id),
    activeStudents: () => students.filter(s => s.active !== false).sort((a, b) => a.name.localeCompare(b.name)),
    studentsIn: cid => D.activeStudents().filter(s => (s.classIds || []).includes(cid)),
    /** Every class meeting on a weekday, sorted by start time: [{c, s}] */
    meetingsOn: dow => classes.flatMap(c => (c.sessions || []).filter(s => s.day === dow).map(s => ({ c, s })))
      .sort((a, b) => a.s.time.localeCompare(b.s.time) || a.c.name.localeCompare(b.c.name)),
    contactOf: s => s.parentPhone || s.phone || "",
    famLang: s => (LANGS.includes(s.lang) ? s.lang : lang),

    dueFor(s, ym) {
      const j = (s.joined || "1970-01-01").slice(0, 7);
      if (ym < j) return 0;
      if (s.active === false && (!s.endedYm || ym > s.endedYm)) return 0;
      return +s.fee || 0;
    },
    paidFor: (sid, ym) => paidIdx.get(sid + "|" + ym) || 0,
    feeStatus(s, ym) {
      const due = D.dueFor(s, ym), paid = D.paidFor(s.id, ym), bal = Math.max(0, due - paid);
      const status = due === 0 ? (paid > 0 ? "paid" : "none") : paid >= due ? "paid" : paid > 0 ? "partial" : "due";
      return { due, paid, bal, status };
    },
    /** Unpaid balance from months before `beforeYm` (since the student joined / tracking began). */
    arrears(s, beforeYm) {
      let total = 0, months = 0;
      let ym = [(s.joined || "1970-01-01").slice(0, 7), trackFrom].sort()[1];
      for (let i = 0; ym < beforeYm && i < 240; i++, ym = addMonths(ym, 1)) {
        const f = D.feeStatus(s, ym);
        if (f.bal > 0) { total += f.bal; months++; }
      }
      return { total, months };
    },
    collectedFor: ym => payments.filter(p => p.ym === ym && p.kind !== "admission").reduce((a, p) => a + (+p.amount || 0), 0),
    admissionCollectedFor: ym => payments.filter(p => p.ym === ym && p.kind === "admission").reduce((a, p) => a + (+p.amount || 0), 0),

    /* ---------- admission fees (one time per student per class) ---------- */
    /** [{c, fee, paid, waived, due}] for each of the student's classes that has an admission fee */
    admissionsFor(s) {
      return (s.classIds || []).map(id => classMap.get(id)).filter(c => c && +c.admissionFee > 0).map(c => {
        const paid = admIdx.get(s.id + "|" + c.id) || 0, waived = (s.admissionWaived || []).includes(c.id);
        return { c, fee: +c.admissionFee, paid, waived, due: waived || s.active === false ? 0 : Math.max(0, +c.admissionFee - paid) };
      });
    },
    admissionDue: s => D.admissionsFor(s).reduce((a, x) => a + x.due, 0),
    admissionMsg(s, c, lg) {
      lg = lg || D.famLang(s);
      const a = D.admissionsFor(s).find(x => x.c.id === c.id);
      return fill(tl(lg, "adm_tpl"), { parent: s.parent || s.name, student: s.name, class: c.name, amount: D.money(a ? a.due : c.admissionFee), tutor: D.tutorName(lg) });
    },
    paymentLabel(p, lg) {
      lg = lg || lang;
      return p.kind === "admission" ? tl(lg, "adm_for", { c: classMap.get(p.cid)?.name || "" }) : tl(lg, "for_m", { m: monthLabel(p.ym, lg) });
    },

    /* ---------- timetable: weekly sessions + one-off changes ---------- */
    /** weekly sessions in force on a date (permanent changes use validFrom/validUntil) */
    sessionsOn(c, date) {
      const dow = parseD(date).getDay();
      if (c.endsOn && date > c.endsOn) return [];
      return (c.sessions || []).filter(s => s.day === dow && (!s.validFrom || s.validFrom <= date) && (!s.validUntil || s.validUntil >= date));
    },
    /** the weekly timetable as it is on a date (all days) */
    scheduleAt(c, date) {
      return (c.sessions || []).filter(s => (!s.validFrom || s.validFrom <= date) && (!s.validUntil || s.validUntil >= date))
        .sort((a, b) => (a.day + 6) % 7 - (b.day + 6) % 7 || a.time.localeCompare(b.time));
    },
    /** a permanent timetable change that starts after `date`, if any: {from, sessions} */
    upcomingSchedule(c, date = todayStr()) {
      const from = (c.sessions || []).map(s => s.validFrom).filter(v => v && v > date).sort()[0];
      return from ? { from, sessions: D.scheduleAt(c, from) } : null;
    },
    breakOn: (cid, date) => changes.find(x => x.cid === cid && x.kind === "break" && x.date <= date && date <= x.newDate),
    changesFor: cid => changes.filter(x => x.cid === cid),
    /**
     * Everything that happens on a date, sorted by time:
     *  status "normal" | "moved" (same day, new time) | "movedIn" (moved here from another day)  → class happens
     *  status "cancelled" | "movedAway" | "break"                                              → class doesn't happen
     * Each: { c, s: {time, duration, day}, status, change, origTime }
     */
    occurrencesOn(date) {
      const out = [];
      for (const c of classes) {
        const br = D.breakOn(c.id, date);
        for (const s of D.sessionsOn(c, date)) {
          const ch = changes.find(x => x.cid === c.id && x.kind !== "break" && x.date === date && x.time === s.time);
          if (br) out.push({ c, s, status: "break", change: br });
          else if (!ch) out.push({ c, s, status: "normal" });
          else if (ch.kind === "cancel") out.push({ c, s, status: "cancelled", change: ch });
          else if (ch.newDate === date) out.push({ c, s: { ...s, time: ch.newTime, duration: ch.newDuration ?? s.duration }, status: "moved", change: ch, origTime: s.time });
          else out.push({ c, s, status: "movedAway", change: ch });
        }
        for (const ch of changes) {
          if (ch.cid === c.id && ch.kind === "move" && ch.newDate === date && ch.date !== date) {
            const orig = (c.sessions || []).find(s => s.time === ch.time) || {};
            out.push({ c, s: { day: parseD(date).getDay(), time: ch.newTime, duration: ch.newDuration ?? orig.duration ?? 60 }, status: "movedIn", change: ch, origTime: ch.time });
          }
        }
      }
      return out.sort((a, b) => a.s.time.localeCompare(b.s.time) || a.c.name.localeCompare(b.c.name));
    },
    /** only meetings that actually take place */
    meetingsOnDate: date => D.occurrencesOn(date).filter(o => ["normal", "moved", "movedIn"].includes(o.status)),
    /** upcoming regular meetings of one class (for choosing which one to change) */
    upcomingOf(cid, from = todayStr(), days = 56) {
      const out = [];
      for (let i = 0; i < days; i++) {
        const d = addDays(from, i);
        D.occurrencesOn(d).filter(o => o.c.id === cid && o.status !== "movedIn").forEach(o => out.push({ ...o, date: d }));
      }
      return out;
    },
    scheduleText(list, lg) {
      return list.map(s => `${dayLong(s.day, lg)} ${fmtTime(s.time)}`).join(", ");
    },

    /** Message to a family (or the class group) about a timetable change. info = {kind, c, ...} */
    changeMsg(info, s, lg, group) {
      lg = lg || (s ? D.famLang(s) : lang);
      const c = info.c, ld = d => longDateIn(d, lg);
      const v = {
        parent: group ? tl(lg, "group_parent") : s.parent || s.name,
        student: group ? tl(lg, "group_student") : s.name,
        class: c.name, tutor: D.tutorName(lg),
        note: info.note && info.note.trim() ? " " + tl(lg, "chg_note", { n: info.note.trim().replace(/[.!?。]*$/, "") + "." }) : "",
      };
      if (info.kind === "cancel") return fill(tl(lg, "chg_cancel"), { ...v, date: ld(info.date), time: fmtTime(info.time) });
      if (info.kind === "move") {
        const target = info.newDate === info.date ? tl(lg, "chg_same_day", { t: fmtTime(info.newTime) }) : tl(lg, "chg_on_at", { d: ld(info.newDate), t: fmtTime(info.newTime) });
        return fill(tl(lg, "chg_move"), { ...v, date: ld(info.date), time: fmtTime(info.time), new: target });
      }
      if (info.kind === "break") {
        const next = D.upcomingOf(c.id, addDays(info.newDate, 1), 21).find(o => ["normal", "moved"].includes(o.status));
        const back = next ? " " + tl(lg, "chg_back_on", { d: ld(next.date), t: fmtTime(next.s.time) }) : "";
        return fill(tl(lg, "chg_break"), { ...v, from: ld(info.date), to: ld(info.newDate), back });
      }
      if (info.kind === "schedule") return fill(tl(lg, "chg_schedule"), { ...v, date: ld(info.from), schedule: D.scheduleText(info.sessions, lg) });
      if (info.kind === "stop") return fill(tl(lg, "chg_stop"), { ...v, date: ld(info.date) });
      return "";
    },
    /** students to tell about a change to class c */
    affectedBy: c => D.studentsIn(c.id),

    lastReminder(sid, type, key) {
      const hit = reminders.find(r => r.sid === sid && r.type === type && (!key || r.key === key));
      return hit ? hit.at : null;
    },

    tutorName: lg => settings.tutorName || tl(lg, "your_tutor"),
    methodLabel: (m, lg) => (METHODS.includes(m) ? tl(lg || lang, "m_" + m) : m || ""),
    feeMsg(s, ym, lg) {
      lg = lg || D.famLang(s);
      const f = D.feeStatus(s, ym);
      return fill(tpl.fee[lg], { parent: s.parent || s.name, student: s.name, amount: D.money(f.bal || f.due), month: monthLabel(ym, lg), tutor: D.tutorName(lg) });
    },
    dayWord(date, lg) {
      const td = todayStr();
      return date === td ? tl(lg, "today").toLowerCase() : date === addDays(td, 1) ? tl(lg, "tomorrow").toLowerCase() : (lg === "en" ? "on " : "") + dayLong(parseD(date).getDay(), lg);
    },
    classMsg(s, c, time, date, lg, group) {
      lg = lg || (s ? D.famLang(s) : lang);
      return fill(tpl.cls[lg], {
        parent: group ? tl(lg, "group_parent") : s.parent || s.name,
        student: group ? tl(lg, "group_student") : s.name,
        class: c.name, day: D.dayWord(date, lg), time: fmtTime(time),
        location: c.location ? (lg === "en" ? " at " : " – ") + c.location : "", tutor: D.tutorName(lg),
      });
    },
    receiptText(p, longDate) {
      const s = studentMap.get(p.sid), lg = s ? D.famLang(s) : lang;
      const adm = p.kind === "admission";
      const bal = !s ? null : adm ? (D.admissionsFor(s).find(x => x.c.id === p.cid)?.due ?? 0) : D.feeStatus(s, p.ym).bal;
      return [tl(lg, "r_head", { t: D.tutorName(lg) }), tl(lg, "r_student", { n: s ? s.name : tl(lg, "former") }),
        adm ? tl(lg, "r_for_adm", { c: classMap.get(p.cid)?.name || "" }) : tl(lg, "r_for", { m: monthLabel(p.ym, lg) }), tl(lg, "r_amt", { x: D.money(p.amount) }),
        tl(lg, "r_method", { x: D.methodLabel(p.method, lg) }), tl(lg, "r_date", { x: longDate(p.date, lg) }),
        bal != null ? tl(lg, adm ? "r_bal_adm" : "r_bal", { x: D.money(bal) }) : "", tl(lg, "r_no", { x: p.id.slice(-6).toUpperCase() }), tl(lg, "r_thanks")]
        .filter(Boolean).join("\n");
    },
    waLink(phone, msg) {
      let p = (phone || "").replace(/[^\d+]/g, "");
      if (!p) return null;
      if (p.startsWith("+")) p = p.slice(1);
      else if (p.startsWith("00")) p = p.slice(2);
      else if (p.startsWith("0") && settings.cc) p = settings.cc.replace(/\D/g, "") + p.slice(1);
      return "https://wa.me/" + p + "?text=" + encodeURIComponent(msg);
    },
    smsLink(phone, msg) { const p = (phone || "").replace(/[^\d+]/g, ""); return p ? "sms:" + p + "?&body=" + encodeURIComponent(msg) : null; },
  };
  return D;
}

export function fill(tpl, vars) { return (tpl || "").replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)); }

/* ---------- attendance (rows: {cid, date, time, sid, v}) ---------- */
export const slotKey = (cid, date, time) => `${cid}|${date}|${time}`;

export function indexAttendance(rows) {
  const bySlot = new Map();
  for (const r of rows) {
    const k = slotKey(r.cid, r.date, r.time);
    if (!bySlot.has(k)) bySlot.set(k, {});
    bySlot.get(k)[r.sid] = r.v;
  }
  return bySlot;
}

export function attStats(rows, sid, cid) {
  let p = 0, l = 0, a = 0;
  for (const r of rows) {
    if (r.sid !== sid || (cid && r.cid !== cid)) continue;
    if (r.v === "P") p++; else if (r.v === "L") l++; else if (r.v === "A") a++;
  }
  const total = p + l + a;
  return { p, l, a, total, rate: total ? (p + l) / total : null };
}

export const pct = r => (r == null ? "–" : Math.round(r * 100) + "%");

export function initials(n) { return (n || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase(); }
const AV = ["#0288d1", "#00897b", "#5c6bc0", "#039be5", "#7cb342", "#f4511e", "#8e24aa", "#00acc1"];
export function avColor(n) { let h = 0; for (const c of n || "") h = (h * 31 + c.charCodeAt(0)) >>> 0; return AV[h % AV.length]; }

/**
 * HRAttendancePage.jsx
 * HR-only page: attendance for all employees on one date, client-side paginated.
 *
 * Wiring (use your existing patterns):
 *
 *   // routes
 *   <Route element={<ProtectedRoute allowedRoles={["hr"]} />}>
 *     <Route path="/hr/attendance" element={<HRAttendancePage />} />
 *   </Route>
 *
 *   // sidebar: show "Attendance Management" only when user.role === "hr"
 *
 * Includes the HR Admin sidebar (HRSidebar). If your app layout already renders a sidebar,
 * delete <HRSidebar/> and the scrim from the page and keep only <main>.
 *
 * No router dependency: ?date&page&limit are kept in the URL via the History API.
 *
 * Uses the PeoplePulse GET /attendance endpoint with the application's
 * peoplepulse_token bearer token. Set VITE_API_URL to override the API base.
 * VITE_USE_MOCK="true" opts into mock data for local development.
 *
 * The service function lives at the top so it can be moved to
 * src/services/attendanceService.js unchanged. Swap `fetch` for your
 * axios/api client if the project already has one (auth headers etc.).
 */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "../services/api";

/* ------------------------------------------------------------------ */
/* Service layer                                                       */
/* ------------------------------------------------------------------ */

const USE_MOCK = import.meta.env?.VITE_USE_MOCK === "true";

const MAX_LIMIT = 50;
const API_MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;
const PAGE_SIZES = [10, 20, 50];

function getAttendanceRows(body) {
  const payload = body?.data ?? body;
  const rows = Array.isArray(payload)
    ? payload
    : payload?.records ??
      payload?.attendance ??
      payload?.attendances ??
      payload?.items ??
      payload?.results;

  if (!Array.isArray(rows)) {
    throw new Error("The attendance API returned an unexpected response format.");
  }

  return rows.map((row) => {
    const employee =
      row.employee ??
      row.user ??
      row.profile ??
      (typeof row.employeeId === "object" ? row.employeeId : null) ??
      (typeof row.userId === "object" ? row.userId : {});
    const rawCheckIn =
      row.checkIn ?? row.clockIn ?? row.checkInAt ?? row.clockInAt ?? row.checkInTime;
    const rawCheckOut =
      row.checkOut ?? row.clockOut ?? row.checkOutAt ?? row.clockOutAt ?? row.checkOutTime;
    const name =
      row.name ??
      row.employeeName ??
      employee.name ??
      employee.fullName ??
      employee.email ??
      "Unknown employee";

    return {
      employeeId:
        (typeof row.employeeId === "string" ? row.employeeId : null) ??
        employee.employeeId ??
        employee._id ??
        (typeof row.userId === "string" ? row.userId : null) ??
        row._id ??
        row.id ??
        name,
      name,
      department:
        row.department?.name ??
        row.department ??
        employee.department?.name ??
        employee.department ??
        "",
      checkIn: formatAttendanceTime(rawCheckIn),
      checkOut: formatAttendanceTime(rawCheckOut),
      status: row.status ?? row.attendanceStatus ?? "unknown",
    };
  });
}

function formatAttendanceTime(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string" && /^\d{1,2}:\d{2}/.test(value)) return value;

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export async function getAttendance({ date, signal }) {
  if (USE_MOCK) return mockGetAttendance({ date, signal });

  const params = new URLSearchParams({ limit: String(API_MAX_LIMIT) });
  if (date) {
    params.set("from", date);
    params.set("to", date);
  }

  const result = await apiRequest(`/attendance?${params}`, { method: "GET" });
  if (!result.success) {
    const fallback =
      result.status === 401
        ? "Your session is missing or has expired. Please log in again."
        : result.status === 403
        ? "You don't have permission to view attendance."
        : "Could not load attendance.";
    const err = new Error(result.error || fallback);
    err.status = result.status;
    throw err;
  }

  const records = getAttendanceRows(result.data);
  return { date, records };
}

/* ------------------------------------------------------------------ */
/* Date helpers (local calendar dates only, no UTC conversion)         */
/* ------------------------------------------------------------------ */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function isValidDateString(value) {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function formatLongDate(value) {
  if (!isValidDateString(value)) return "";
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/* URL state (no router dependency; keeps ?date&page&limit in the URL) */
/* ------------------------------------------------------------------ */

function readQuery() {
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return new URLSearchParams();
  }
}

function useQueryParams() {
  const [params, setParams] = useState(readQuery);
  const ref = useRef(params);

  useEffect(() => {
    const onPop = () => {
      const p = readQuery();
      ref.current = p;
      setParams(p);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const update = useCallback((next) => {
    const p = new URLSearchParams(ref.current);
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === undefined) p.delete(k);
      else p.set(k, String(v));
    });
    ref.current = p;
    setParams(p);
    try {
      const qs = p.toString();
      window.history.pushState({}, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    } catch {
      /* sandboxed frames may block history; state still works in memory */
    }
  }, []);

  return [params, update];
}

/* ------------------------------------------------------------------ */
/* Status badge                                                        */
/* ------------------------------------------------------------------ */

const STATUS = {
  present: { label: "On time", tone: "green" },
  late: { label: "Late", tone: "amber" },
  absent: { label: "Absent", tone: "red" },
  wfh: { label: "Remote", tone: "teal" },
  on_leave: { label: "On leave", tone: "slate" },
};

function StatusBadge({ status }) {
  const s = STATUS[status] ?? { label: status || "Unknown", tone: "slate" };
  return <span className={`att-badge att-badge--${s.tone}`}>{s.label}</span>;
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

function Pagination({ page, totalPages, onChange, disabled }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="att-pager" aria-label="Attendance pages">
      <button
        type="button"
        className="att-pager__btn"
        onClick={() => onChange(page - 1)}
        disabled={disabled || page <= 1}
      >
        Previous
      </button>
      <ul className="att-pager__list">
        {pageWindow(page, totalPages).map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} className="att-pager__gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className={`att-pager__num${p === page ? " is-current" : ""}`}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
                onClick={() => p !== page && onChange(p)}
                disabled={disabled}
              >
                {p}
              </button>
            </li>
          )
        )}
      </ul>
      <button
        type="button"
        className="att-pager__btn"
        onClick={() => onChange(page + 1)}
        disabled={disabled || page >= totalPages}
      >
        Next
      </button>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar (HR Admin)                                                  */
/* ------------------------------------------------------------------ */

const ICONS = {
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M12 6v6l4 2",
  calendar: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  dollar: "M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  briefcase: "M4 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
  clipboard: "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
  award: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M8.2 13.9 7 23l5-3 5 3-1.2-9.1",
  megaphone: "M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z M15 9a4 4 0 0 1 0 6 M18 6a8 8 0 0 1 0 12",
  chart: "M12 20V10 M18 20V4 M6 20v-4",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  menu: "M4 6h16 M4 12h16 M4 18h16",
};

function Icon({ name, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

// Swap each `href` for your real route paths (or replace <a> with your router's NavLink).
const HR_NAV = [
  { key: "employees", label: "Employee Directory", icon: "users", href: "/hr/employees" },
  { key: "attendance", label: "Attendance Management", icon: "clock", href: "/hr/attendance" },
  { key: "leave", label: "Leave Management", icon: "calendar", href: "/hr/leave" },
  { key: "payroll", label: "Payroll Processing", icon: "dollar", href: "/hr/payroll" },
  { key: "recruitment", label: "Recruitment", icon: "briefcase", href: "/hr/recruitment" },
  { key: "onboarding", label: "Onboarding", icon: "clipboard", href: "/hr/onboarding" },
  { key: "performance", label: "Performance Cycles", icon: "award", href: "/hr/performance" },
  { key: "announcements", label: "Announcements", icon: "megaphone", href: "/hr/announcements" },
  { key: "reports", label: "Reports & Analytics", icon: "chart", href: "/hr/reports" },
];

export function HRSidebar({ activeKey = "attendance", open = false, onNavigate, onLogout }) {
  return (
    <aside className={`att-side${open ? " is-open" : ""}`} aria-label="HR navigation">
      <div className="att-brand">
        <span className="att-logo" aria-hidden="true">P</span>
        <span className="att-brand__name">PeoplePulse</span>
        <span className="att-role">HR<br />Admin</span>
      </div>

      <nav className="att-nav">
        <ul>
          {HR_NAV.map((item) => (
            <li key={item.key}>
              <a
                href={item.href}
                aria-current={item.key === activeKey ? "page" : undefined}
                onClick={(e) => {
                  // In the real app let the router/link handle navigation; in a preview just stay put.
                  if (item.key === activeKey) e.preventDefault();
                  onNavigate?.(item, e);
                }}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <button type="button" className="att-logout" onClick={onLogout}>
        <Icon name="logout" />
        <span>Log out</span>
      </button>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function HRAttendancePage({ onLogout }) {
  const navigate = useNavigate();
  const [searchParams, updateParams] = useQueryParams();
  const today = useMemo(todayString, []);

  // Read + sanitise URL state so a refresh or shared link restores the view.
  const rawDate = searchParams.get("date");
  const dateParam = rawDate && isValidDateString(rawDate) && rawDate <= today ? rawDate : today;
  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
  const rawLimit = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
  const limit =
    Number.isInteger(rawLimit) && rawLimit >= 1 && rawLimit <= MAX_LIMIT ? rawLimit : DEFAULT_LIMIT;

  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [retryKey, setRetryKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // The API has no page parameter, so fetch a date once and paginate locally.
  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, status: "loading", error: null }));

    let active = true;
    getAttendance({ date: dateParam, signal: controller.signal })
      .then((data) => {
        if (active) setState({ status: "success", data, error: null });
      })
      .catch((err) => {
        if (!active || err.name === "AbortError") return;
        setState({ status: "error", data: null, error: err.message || "Something went wrong." });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [dateParam, retryKey]);

  useEffect(() => {
    if (state.status !== "success" || !state.data) return;
    const totalPages = Math.ceil(state.data.records.length / limit);
    if (totalPages > 0 && page > totalPages) updateParams({ page: totalPages });
  }, [state.status, state.data, page, limit, updateParams]);

  const handleDateChange = (e) => {
    const value = e.target.value;
    if (!value || !isValidDateString(value) || value > today) return;
    updateParams({ date: value, page: 1 }); // reset rule: new date -> page 1
  };

  const handlePageChange = (p) => updateParams({ page: p });
  const handleLimitChange = (e) => updateParams({ limit: Number(e.target.value), page: 1 });
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    logoutUser();
    navigate("/login");
  };

  const { status, data, error } = state;
  const isLoading = status === "loading";
  const allRecords = data?.records ?? [];
  const totalRecords = allRecords.length;
  const totalPages = Math.ceil(totalRecords / limit);
  const records = allRecords.slice((page - 1) * limit, page * limit);
  const pagination = data ? { page, limit, totalRecords, totalPages } : null;
  const shownDate = data?.date ?? dateParam ?? "";
  const pickerValue = dateParam ?? data?.date ?? "";

  const rangeStart = pagination && records.length ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const rangeEnd = pagination && records.length ? rangeStart + records.length - 1 : 0;

  return (
    <div className="att">
      <style>{CSS}</style>

      <HRSidebar activeKey="attendance" open={menuOpen} onNavigate={() => setMenuOpen(false)} onLogout={handleLogout} />
      {menuOpen && <div className="att-scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <main className="att-main">
      <header className="att-head">
        <button
          type="button"
          className="att-menu"
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Icon name="menu" size={20} />
        </button>
        <div>
          <h1 className="att-title">Attendance Management</h1>
          <p className="att-crumb">HR / Attendance Management</p>
        </div>
      </header>

      <section className="att-card" aria-labelledby="att-card-title">
        <div className="att-card__top">
          <div>
            <h2 id="att-card-title" className="att-card__title">
              Daily attendance
            </h2>
            <p className="att-card__date" aria-live="polite">
              {shownDate ? formatLongDate(shownDate) : isLoading ? "Finding latest date…" : ""}
            </p>
          </div>

          <div className="att-controls">
            <label className="att-field">
              <span>Date</span>
              <input
                type="date"
                value={pickerValue}
                max={today}
                onChange={handleDateChange}
                disabled={!pickerValue && isLoading}
              />
            </label>
            <label className="att-field">
              <span>Rows per page</span>
              <select value={limit} onChange={handleLimitChange}>
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {status === "error" ? (
          <div className="att-state att-state--error" role="alert">
            <p className="att-state__title">Couldn’t load attendance</p>
            <p className="att-state__text">{error}</p>
            <button type="button" className="att-btn" onClick={() => setRetryKey((k) => k + 1)}>
              Retry
            </button>
          </div>
        ) : !isLoading && records.length === 0 ? (
          <div className="att-state">
            <p className="att-state__title">No attendance records for this date</p>
            <p className="att-state__text">Pick another date to see who was in.</p>
          </div>
        ) : (
          <>
            <div className="att-tablewrap" aria-busy={isLoading}>
              <table className="att-table">
                <thead>
                  <tr>
                    <th scope="col">Employee</th>
                    <th scope="col">Department</th>
                    <th scope="col">Check-in</th>
                    <th scope="col">Check-out</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: Math.min(limit, 10) }, (_, i) => (
                        <tr key={`sk-${i}`} className="att-skel" aria-hidden="true">
                          {["Employee", "Department", "Check-in", "Check-out", "Status"].map((l) => (
                            <td key={l} data-label={l}>
                              <span className="att-skel__bar" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : records.map((r) => (
                        <tr key={r.employeeId}>
                          <td data-label="Employee" className="att-name">
                            {r.name}
                          </td>
                          <td data-label="Department">{r.department || "—"}</td>
                          <td data-label="Check-in" className="att-time">
                            {r.checkIn || "—"}
                          </td>
                          <td data-label="Check-out" className="att-time">
                            {r.checkOut || "—"}
                          </td>
                          <td data-label="Status">
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            <div className="att-foot">
              <p className="att-count">
                {pagination && records.length
                  ? `Showing ${rangeStart}–${rangeEnd} of ${pagination.totalRecords} employees`
                  : "\u00A0"}
              </p>
              {pagination && (
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onChange={handlePageChange}
                  disabled={isLoading}
                />
              )}
            </div>
          </>
        )}
      </section>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Styles (scoped with the att- prefix; responsive to mobile)          */
/* ------------------------------------------------------------------ */

const CSS = `
.att{--teal:#2b6f7d;--teal-soft:#e0f0f2;--ink:#14202b;--muted:#667585;--line:#e6eaee;--bg:#f4f6f8;
  font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--bg);
  min-height:100vh;display:flex}
.att-main{flex:1;min-width:0;padding:20px clamp(14px,3vw,28px) 40px}

.att-side{width:232px;flex:none;background:#fff;border-right:1px solid var(--line);display:flex;flex-direction:column;
  padding:14px 10px;position:sticky;top:0;height:100vh;z-index:30}
.att-brand{display:flex;align-items:center;gap:8px;padding:4px 6px 18px}
.att-logo{width:24px;height:24px;border-radius:6px;background:var(--teal);color:#fff;font-weight:700;font-size:13px;
  display:grid;place-items:center}
.att-brand__name{font-weight:600;font-size:14px}
.att-role{margin-left:auto;font-size:10px;font-weight:600;line-height:1.15;color:#1f6577;background:var(--teal-soft);
  padding:3px 8px;border-radius:4px}
.att-nav{flex:1;overflow-y:auto}
.att-nav ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
.att-nav a{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:6px;font-size:13px;color:#46566a;
  text-decoration:none;line-height:1.25}
.att-nav a:hover{background:#f1f5f7}
.att-nav a[aria-current="page"]{background:var(--teal-soft);color:var(--teal);font-weight:500}
.att-nav svg,.att-logout svg{flex:none}
.att-logout{font:inherit;font-size:13px;display:flex;align-items:center;gap:10px;width:100%;padding:12px 10px 8px;
  color:#46566a;background:none;border:0;border-top:1px solid var(--line);cursor:pointer;text-align:left}
.att-logout:hover{color:var(--ink)}
.att-menu{display:none;font:inherit;color:var(--ink);background:#fff;border:1px solid #cfd7de;border-radius:6px;
  width:36px;height:36px;align-items:center;justify-content:center;cursor:pointer}
.att-scrim{position:fixed;inset:0;background:rgba(20,32,43,.4);z-index:20}
.att *{box-sizing:border-box}
.att-title{font-size:18px;font-weight:600;margin:0}
.att-crumb{font-size:12px;color:var(--muted);margin:2px 0 0}
.att-head{margin-bottom:18px;display:flex;align-items:center;gap:12px}
.att-card{background:#fff;border:1px solid var(--line);border-radius:8px;padding:18px clamp(12px,2vw,20px)}
.att-card__top{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:14px}
.att-card__title{font-size:15px;font-weight:600;margin:0}
.att-card__date{font-size:13px;color:var(--muted);margin:3px 0 0;min-height:18px}
.att-controls{display:flex;gap:12px;flex-wrap:wrap}
.att-field{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--muted)}
.att-field input,.att-field select{font:inherit;font-size:13px;color:var(--ink);background:#fff;border:1px solid #cfd7de;
  border-radius:6px;padding:7px 10px;min-height:36px}
.att-field input:disabled{opacity:.6}
.att :is(button,input,select):focus-visible{outline:2px solid var(--teal);outline-offset:2px}

.att-tablewrap{overflow-x:auto}
.att-table{width:100%;border-collapse:collapse;font-size:13px}
.att-table th{text-align:left;font-weight:600;font-size:12px;color:var(--muted);background:#f8fafb;
  padding:10px 12px;border-bottom:1px solid var(--line);white-space:nowrap}
.att-table td{padding:13px 12px;border-bottom:1px solid var(--line);vertical-align:middle}
.att-table tbody tr:last-child td{border-bottom:0}
.att-name{font-weight:500}
.att-time{font-variant-numeric:tabular-nums}

.att-badge{display:inline-block;font-size:11px;font-weight:600;padding:3px 9px;border-radius:4px;white-space:nowrap}
.att-badge--green{background:#d9f5e6;color:#0f7a45}
.att-badge--amber{background:#fdf0c4;color:#8a5a00}
.att-badge--red{background:#fde0e0;color:#b42318}
.att-badge--teal{background:var(--teal-soft);color:#1f6577}
.att-badge--slate{background:#e8edf1;color:#46566a}

.att-skel__bar{display:block;height:12px;width:70%;border-radius:4px;background:linear-gradient(90deg,#edf0f3 25%,#f7f9fa 50%,#edf0f3 75%);
  background-size:200% 100%;animation:att-shimmer 1.3s linear infinite}
@keyframes att-shimmer{to{background-position:-200% 0}}

.att-state{text-align:center;padding:48px 16px}
.att-state__title{font-size:15px;font-weight:600;margin:0 0 4px}
.att-state__text{font-size:13px;color:var(--muted);margin:0 0 14px}
.att-state--error .att-state__title{color:#b42318}
.att-btn{font:inherit;font-size:13px;font-weight:500;color:var(--teal);background:#fff;border:1px solid var(--teal);
  border-radius:6px;padding:7px 16px;cursor:pointer}
.att-btn:hover{background:var(--teal-soft)}

.att-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px}
.att-count{font-size:12px;color:var(--muted);margin:0}
.att-pager{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.att-pager__list{display:flex;gap:4px;list-style:none;margin:0;padding:0;flex-wrap:wrap}
.att-pager__gap{display:flex;align-items:center;padding:0 4px;color:var(--muted)}
.att-pager__btn,.att-pager__num{font:inherit;font-size:13px;min-width:34px;min-height:34px;padding:0 10px;color:var(--ink);
  background:#fff;border:1px solid #cfd7de;border-radius:6px;cursor:pointer}
.att-pager__btn:hover:not(:disabled),.att-pager__num:hover:not(:disabled):not(.is-current){background:var(--teal-soft)}
.att-pager__btn:disabled,.att-pager__num:disabled{opacity:.5;cursor:not-allowed}
.att-pager__num.is-current{background:var(--teal);border-color:var(--teal);color:#fff;font-weight:600}

@media (max-width:860px){
  .att-side{position:fixed;left:0;top:0;transform:translateX(-100%);transition:transform .2s ease;box-shadow:0 0 24px rgba(0,0,0,.12)}
  .att-side.is-open{transform:none}
  .att-menu{display:inline-flex}
}
@media (max-width:640px){
  .att-controls{width:100%}
  .att-field{flex:1}
  .att-table thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
  .att-table,.att-table tbody,.att-table tr,.att-table td{display:block;width:100%}
  .att-table tr{border:1px solid var(--line);border-radius:8px;padding:6px 12px;margin-bottom:10px}
  .att-table td{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--line)}
  .att-table td:last-child{border-bottom:0}
  .att-table td::before{content:attr(data-label);color:var(--muted);font-size:12px}
  .att-foot{flex-direction:column;align-items:stretch}
  .att-pager{justify-content:center}
}
@media (prefers-reduced-motion:reduce){.att-skel__bar{animation:none}.att-side{transition:none}}
`;

/* ------------------------------------------------------------------ */
/* Mock backend (only used when VITE_USE_MOCK="true")                  */
/* ------------------------------------------------------------------ */

const MOCK_NAMES = [
  "Ayesha Khan","Bilal Ahmed","Usman Tariq","Sara Malik","Hamza Raza","Zainab Ali","Omar Farooq",
  "Hina Shah","Daniyal Sheikh","Maryam Noor","Talha Iqbal","Noor Fatima","Ali Hassan","Iqra Javed",
];
const MOCK_DEPTS = ["Engineering", "Finance", "Sales", "Operations", "Design"];
const MOCK_STATUS = ["present", "present", "present", "late", "wfh", "absent", "on_leave"];

function mockGetAttendance({ date, signal }) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      const latest = "2026-10-22";
      if (date && (!isValidDateString(date) || date > todayString())) {
        const err = new Error("Date must be a valid, non-future YYYY-MM-DD value.");
        err.status = 400;
        return reject(err);
      }
      const resolved = date || latest;
      const hasData = resolved <= latest && new Date(resolved + "T00:00").getDay() % 6 !== 0;
      const all = hasData
        ? Array.from({ length: 85 }, (_, i) => {
            const status = MOCK_STATUS[(i * 7 + resolved.length + Number(resolved.slice(-2))) % MOCK_STATUS.length];
            const absent = status === "absent" || status === "on_leave";
            return {
              employeeId: `emp-${i + 1}`,
              name: `${MOCK_NAMES[i % MOCK_NAMES.length]} ${i >= MOCK_NAMES.length ? i + 1 : ""}`.trim(),
              department: MOCK_DEPTS[i % MOCK_DEPTS.length],
              checkIn: absent ? null : status === "late" ? "09:41" : "09:02",
              checkOut: absent ? null : "17:30",
              status,
            };
          }).sort((a, b) => a.name.localeCompare(b.name))
        : [];
      resolve({
        date: resolved,
        records: all,
      });
    }, 500);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
    });
  });
}

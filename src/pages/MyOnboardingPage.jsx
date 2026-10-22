import React, { useEffect, useState } from "react";
import { getMyOnboardingChecklist, getStoredUser, updateMyOnboardingTask } from "../services/api";

// Re-renders when a CSS media query starts/stops matching.
function useMediaQuery(query) {
  const get = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

// ---- Design tokens ----
const C = {
  pageBg: "#F1F2F4",
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: "#0F172A",
  nav: "#374151",
  muted: "#6B7280",
  track: "#E5E7EB",
  teal: "#1F6B7A",
  tealSoft: "#DCEFF2",
  green: "#10B981",
  red: "#EF4444",
};

// ---- Icons (inline, outline style) ----
const Icon = ({ children, size = 13 }) => (
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
    style={{ flexShrink: 0 }}
  >
    {children}
  </svg>
);

const icons = {
  dashboard: (<Icon><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></Icon>),
  attendance: (<Icon><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>),
  leave: (<Icon><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Icon>),
  wfh: (<Icon><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></Icon>),
  payslips: (<Icon><path d="M12 2v20" /><path d="M17 6.5C16 5 14.3 4.5 12 4.5c-2.8 0-4.5 1.2-4.5 3s1.7 2.7 4.5 3.2 4.5 1.4 4.5 3.3-1.8 3-4.5 3c-2.4 0-4.2-.7-5.2-2.2" /></Icon>),
  performance: (<Icon><circle cx="12" cy="9" r="6" /><path d="M8.5 14L7 22l5-3 5 3-1.5-8" /></Icon>),
  documents: (<Icon><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></Icon>),
  onboarding: (<Icon><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9z" /></Icon>),
  announcements: (<Icon><path d="M3 11v3a1 1 0 001 1h3l8 4V6L7 10H4a1 1 0 00-1 1z" /><path d="M19 9a4 4 0 010 6" /></Icon>),
  notifications: (<Icon><path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 20a2 2 0 004 0" /></Icon>),
  profile: (<Icon><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></Icon>),
  menu: (<Icon size={16}><path d="M4 6h16M4 12h16M4 18h16" /></Icon>),
  close: (<Icon size={14}><path d="M6 6l12 12M18 6L6 18" /></Icon>),
  search: (<Icon size={11}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Icon>),
};

const NAV_MAIN = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "attendance", label: "My Attendance", href: "/attendance" },
  { key: "leave", label: "My Leave", href: "/leave" },
  { key: "wfh", label: "My WFH", href: "/wfh" },
  { key: "payslips", label: "My Payslips", href: "/payslips" },
  { key: "performance", label: "My Performance", href: "/performance" },
  { key: "documents", label: "My Documents", href: "/documents" },
  { key: "onboarding", label: "Onboarding", href: "/onboarding" },
];

const NAV_BOTTOM = [
  { key: "announcements", label: "Announcements", href: "/announcements" },
  { key: "notifications", label: "Notifications", href: "/notifications" },
  { key: "profile", label: "Profile", href: "/profile" },
];

const s = {
  shell: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: C.pageBg,
    color: C.text,
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  // Sidebar
  sidebar: {
    width: 148,
    flexShrink: 0,
    background: C.card,
    borderRight: `1px solid ${C.border}`,
    display: "flex",
    flexDirection: "column",
    padding: "12px 6px",
    boxSizing: "border-box",
  },
  brand: { display: "flex", alignItems: "center", gap: 6, padding: "0 6px", marginBottom: 14 },
  logo: {
    width: 18, height: 18, borderRadius: 4, background: C.teal, color: "#fff",
    fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
  },
  brandName: { fontSize: 10, fontWeight: 700 },
  roleBadge: {
    fontSize: 7, fontWeight: 600, color: C.teal, background: C.tealSoft,
    borderRadius: 3, padding: "2px 5px",
  },
  navList: { display: "flex", flexDirection: "column", gap: 2, flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" },
  navLink: {
    display: "flex", alignItems: "center", gap: 8, height: 23, padding: "0 8px",
    borderRadius: 6, fontSize: 9.5, fontWeight: 500, color: C.nav, textDecoration: "none",
  },
  navLinkActive: { background: C.tealSoft, color: C.text, fontWeight: 600 },
  bottomNav: { flexShrink: 0, borderTop: `1px solid ${C.border}`, paddingTop: 8, display: "flex", flexDirection: "column", gap: 2 },
  // Mobile drawer
  drawer: { position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 30, width: 200, transition: "transform .2s ease", boxShadow: "0 0 24px rgba(15,23,42,.15)" },
  backdrop: { position: "fixed", inset: 0, background: "rgba(15,23,42,.35)", zIndex: 20, border: "none", padding: 0 },
  menuBtn: {
    width: 26, height: 26, border: "none", background: "transparent", color: C.text,
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, borderRadius: 6, flexShrink: 0,
  },
  closeBtn: {
    position: "absolute", top: 8, right: 8, width: 22, height: 22, border: "none", background: "transparent",
    color: C.muted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
  },
  // Main column
  main: { flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" },
  topbar: {
    height: 37, background: C.card, borderBottom: `1px solid ${C.border}`,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 18px 0 17px", boxSizing: "border-box", flexShrink: 0,
  },
  title: { margin: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.1 },
  breadcrumb: { margin: "1px 0 0", fontSize: 8, color: C.muted },
  topRight: { display: "flex", alignItems: "center", gap: 10 },
  search: {
    display: "flex", alignItems: "center", gap: 6, width: 138, height: 22,
    background: C.pageBg, borderRadius: 6, padding: "0 8px", boxSizing: "border-box", color: C.muted,
  },
  searchInput: {
    border: "none", outline: "none", background: "transparent", fontSize: 9,
    color: C.text, width: "100%", fontFamily: "inherit",
  },
  bellBtn: {
    position: "relative", width: 22, height: 22, border: "none", background: "transparent",
    color: C.nav, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
  },
  bellDot: { position: "absolute", top: 3, right: 4, width: 4, height: 4, borderRadius: "50%", background: C.red },
  avatar: {
    width: 20, height: 20, borderRadius: "50%", background: C.tealSoft, color: C.teal,
    fontSize: 7, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  // Content
  content: { padding: "17px 19px", flex: 1, minHeight: 0, overflowY: "auto", overflowX: "auto" },
  layout: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 12, alignItems: "start" },
  card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "11px 12px 6px" },
  welcome: { margin: 0, fontSize: 10, fontWeight: 700 },
  subtitle: { margin: "2px 0 7px", fontSize: 8, color: C.muted },
  track: { height: 3, background: C.track, borderRadius: 999, overflow: "hidden" },
  progressLabel: { margin: "6px 0 8px", fontSize: 8, color: C.muted },
  list: { listStyle: "none", margin: 0, padding: 0 },
  row: { display: "flex", alignItems: "center", gap: 8, padding: "8px 0" },
  taskTitle: { display: "block", margin: 0, fontSize: 9, fontWeight: 600, lineHeight: 1.3 },
  taskMeta: { display: "block", margin: 0, fontSize: 7.5, color: C.muted, lineHeight: 1.3 },
};

function NavItem({ item, active, onNavigate }) {
  return (
    <a
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      style={{ ...s.navLink, ...(active ? s.navLinkActive : null) }}
    >
      {icons[item.key]}
      <span>{item.label}</span>
    </a>
  );
}

function Sidebar({ activeKey, isMobile, open, onClose }) {
  const style = isMobile
    ? { ...s.sidebar, ...s.drawer, transform: open ? "translateX(0)" : "translateX(-105%)", visibility: open ? "visible" : "hidden" }
    : s.sidebar;
  return (
    <aside style={style} id="app-sidebar" aria-label="Sidebar">
      {isMobile && (
        <button type="button" style={s.closeBtn} onClick={onClose} aria-label="Close menu">
          {icons.close}
        </button>
      )}
      <div style={s.brand}>
        <span style={s.logo}>P</span>
        <span style={s.brandName}>PeoplePulse</span>
        <span style={s.roleBadge}>Employee</span>
      </div>

      <nav aria-label="Main" style={s.navList}>
        {NAV_MAIN.map((item) => (
          <NavItem key={item.key} item={item} active={item.key === activeKey} onNavigate={onClose} />
        ))}
      </nav>

      <nav aria-label="Secondary" style={s.bottomNav}>
        {NAV_BOTTOM.map((item) => (
          <NavItem key={item.key} item={item} active={item.key === activeKey} onNavigate={onClose} />
        ))}
      </nav>
    </aside>
  );
}

function Topbar({ initials, hasUnread = true, isMobile, isTiny, menuOpen, onMenu }) {
  return (
    <header style={s.topbar}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {isMobile && (
          <button
            type="button"
            style={s.menuBtn}
            onClick={onMenu}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="app-sidebar"
          >
            {icons.menu}
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...s.title, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Onboarding Checklist</h1>
          <p style={s.breadcrumb}>Home / Onboarding</p>
        </div>
      </div>
      <div style={s.topRight}>
        {!isTiny && (
          <label style={{ ...s.search, width: isMobile ? 110 : 138 }}>
            {icons.search}
            <input type="search" placeholder="Search..." aria-label="Search" style={s.searchInput} />
          </label>
        )}
        <button type="button" style={s.bellBtn} aria-label="Notifications">
          {icons.notifications}
          {hasUnread && <span style={s.bellDot} />}
        </button>
        <span style={s.avatar}>{initials}</span>
      </div>
    </header>
  );
}

function CheckBox({ checked }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 12, height: 12, borderRadius: 3, flexShrink: 0, boxSizing: "border-box",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: checked ? C.green : "#fff",
        border: `1px solid ${checked ? C.green : C.border}`,
      }}
    >
      {checked && (
        <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6.2l2.4 2.4 4.6-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function taskMeta(task) {
  if (task.status === "Completed") {
    const completedDate = formatDate(task.completedAt);
    return completedDate ? `Completed ${completedDate}` : "Completed";
  }
  const dueDate = formatDate(task.dueDate);
  if (task.isOverdue) return dueDate ? `Overdue · Due ${dueDate}` : "Overdue";
  return dueDate ? `Due ${dueDate}` : "No due date";
}

function TaskRow({ task, isLast, onComplete, isCompleting, isDisabled }) {
  const isDone = task.status === "Completed";
  return (
    <li style={{ ...s.row, borderBottom: isLast ? "none" : `1px solid ${C.border}` }}>
      <button
        type="button"
        onClick={() => onComplete(task)}
        disabled={isDone || isDisabled}
        aria-label={isDone ? `${task.title} completed` : `Mark ${task.title} complete`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          border: 0,
          padding: 0,
          background: "transparent",
          color: "inherit",
          textAlign: "left",
          cursor: isDone || isDisabled ? "default" : "pointer",
          fontFamily: "inherit",
        }}
      >
        <CheckBox checked={isDone} />
        <span>
          <span style={s.taskTitle}>{task.title}</span>
          <span style={s.taskMeta}>{isCompleting ? "Saving completion…" : taskMeta(task)}</span>
        </span>
      </button>
    </li>
  );
}

function getInitials(user) {
  const name = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("")
    : user?.email?.[0] || "U";
  return initials.toUpperCase();
}

export default function MyOnboardingPage() {
  const user = getStoredUser() || {};
  const employeeName = user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "there";
  const [checklistId, setChecklistId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const completed = tasks.filter((task) => task.status === "Completed").length;
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTiny = useMediaQuery("(max-width: 480px)");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTasks() {
      setIsLoading(true);
      setError("");
      const result = await getMyOnboardingChecklist();
      if (!isMounted) return;

      if (!result.success || result.data?.success === false) {
        if (result.status === 404) {
          setChecklistId(null);
          setTasks([]);
        } else {
          setError(result.error || result.data?.message || "Could not load your onboarding checklist.");
        }
      } else {
        const payload = result.data?.data;
        const checklist = payload?.onboarding || payload?.checklist || payload;
        if (!Array.isArray(checklist?.tasks)) {
          setError("The onboarding service returned an unexpected checklist.");
        } else {
          setChecklistId(checklist._id || checklist.id || null);
          setTasks(checklist.tasks);
        }
      }
      setIsLoading(false);
    }

    loadTasks();
    return () => { isMounted = false; };
  }, []);

  async function handleCompleteTask(task) {
    const taskId = task._id || task.id;
    if (!checklistId || !taskId || task.status === "Completed" || completingTaskId !== null) return;

    setCompletingTaskId(taskId);
    setError("");
    try {
      const result = await updateMyOnboardingTask(checklistId, taskId, { status: "Completed" });
      if (!result.success || result.data?.success === false) {
        throw new Error(result.error || result.data?.message || "Could not complete this task.");
      }
      const payload = result.data?.data;
      const completedTask = payload?.task || payload;

      setTasks((currentTasks) => currentTasks.map((currentTask) => (
        (currentTask._id || currentTask.id) === taskId
          ? { ...currentTask, ...(completedTask?.status === "Completed" ? completedTask : {}), status: "Completed", completedAt: completedTask?.completedAt || new Date().toISOString() }
          : currentTask
      )));
    } catch (completionError) {
      setError(completionError.message || "Could not complete this task.");
    } finally {
      setCompletingTaskId(null);
    }
  }

  // Close the drawer when leaving mobile width, and on Escape.
  useEffect(() => { if (!isMobile) setMenuOpen(false); }, [isMobile]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div style={s.shell}>
      <Sidebar activeKey="onboarding" isMobile={isMobile} open={menuOpen} onClose={() => setMenuOpen(false)} />
      {isMobile && menuOpen && <button type="button" style={s.backdrop} onClick={() => setMenuOpen(false)} aria-label="Close menu" />}

      <div style={s.main}>
        <Topbar initials={getInitials(user)} isMobile={isMobile} isTiny={isTiny} menuOpen={menuOpen} onMenu={() => setMenuOpen(true)} />

        <main style={s.content}>
          <div style={s.layout}>
            <section style={s.card} aria-labelledby="onb-welcome">
              <h2 id="onb-welcome" style={s.welcome}>Welcome, {employeeName}!</h2>
              <p style={s.subtitle}>Your onboarding checklist · Tasks assigned to you</p>

              <div
                style={s.track}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={Math.max(tasks.length, 1)}
                aria-valuenow={completed}
                aria-label="Onboarding progress"
              >
                <div style={{ width: `${percent}%`, height: "100%", background: C.teal, borderRadius: 999 }} />
              </div>
              <p style={s.progressLabel}>{completed} of {tasks.length} tasks complete</p>

              {error && (
                <p role="alert" style={{ margin: "8px 0", color: C.red, fontSize: 8 }}>
                  {error}
                </p>
              )}

              {isLoading ? (
                <p role="status" style={s.taskMeta}>Loading your onboarding checklist…</p>
              ) : tasks.length === 0 ? (
                <p style={s.taskMeta}>No onboarding tasks have been assigned to you yet.</p>
              ) : (
                <ul style={s.list}>
                  {tasks.map((task, i) => (
                    <TaskRow
                      key={task._id || task.id}
                      task={task}
                      isLast={i === tasks.length - 1}
                      onComplete={handleCompleteTask}
                      isCompleting={completingTaskId === (task._id || task.id)}
                      isDisabled={completingTaskId !== null || !checklistId}
                    />
                  ))}
                </ul>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

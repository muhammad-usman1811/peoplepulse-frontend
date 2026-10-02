import React, { useState } from 'react';
import { Award, Check, Clock3, DollarSign, Megaphone, Users } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const INITIAL_NOTIFICATIONS = [
  { id: 1, icon: 'check', title: 'Leave request approved', body: 'Your Annual Leave for Sep 10–12 was approved by Bilal Ahmed.', time: '2h', read: false },
  { id: 2, icon: 'dollar', title: 'Payslip available', body: 'Your payslip for August 2026 is ready to view.', time: '1d', read: false },
  { id: 3, icon: 'megaphone', title: 'New announcement', body: 'Office closed for Eid holidays — Sep 22–24.', time: '2h', read: false },
  { id: 4, icon: 'award', title: 'Performance review scheduled', body: 'Your Q3 self-review is due by Oct 15.', time: '3d', read: true },
  { id: 5, icon: 'clock', title: 'Attendance correction needed', body: 'Missing clock-out on Sep 14. Please submit a correction.', time: '5d', read: false },
  { id: 6, icon: 'users', title: 'Welcome to the team', body: 'Mahnoor Aslam joined Product Design.', time: '1w', read: true },
];

const NOTIFICATION_ICONS = {
  check: Check,
  dollar: DollarSign,
  megaphone: Megaphone,
  award: Award,
  clock: Clock3,
  users: Users,
};

const styles = `
  .notifications-page { width: 100%; max-width: 1100px; margin: 0 auto; }
  .notifications-card { padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
  .notifications-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  .notifications-card-header h2 { margin: 0; color: #111827; font-size: 14.5px; font-weight: 700; line-height: 1.3; }
  .notifications-subtitle { margin-top: 2px; color: #6b7280; font-size: 12px; }
  .notifications-mark-all { height: 28px; padding: 0 14px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; color: #374151; font-size: 12px; font-weight: 500; white-space: nowrap; cursor: pointer; }
  .notifications-mark-all:hover:not(:disabled) { background: #f9fafb; }
  .notifications-mark-all:disabled { opacity: .5; cursor: default; }
  .notifications-mark-all:focus-visible, .notifications-item:focus-visible { outline: 2px solid #2b6777; outline-offset: 2px; }
  .notifications-list { margin: 14px 0 0; padding: 0; list-style: none; }
  .notifications-list li { border-bottom: 1px solid #eef0f2; }
  .notifications-list li:last-child { border-bottom: 0; }
  .notifications-item { position: relative; display: flex; align-items: center; gap: 13px; width: 100%; min-height: 63px; padding: 12px 8px 12px 22px; border: 0; background: #fff; color: inherit; text-align: left; cursor: pointer; }
  .notifications-item[data-unread='true'] { background: #f8fafb; }
  .notifications-item:hover { background: #f3f6f8; }
  .notifications-dot { position: absolute; left: 3px; top: 50%; width: 7px; height: 7px; margin-top: -3.5px; border-radius: 50%; background: #2b6777; }
  .notifications-icon { display: grid; place-items: center; width: 34px; height: 34px; flex: 0 0 34px; border-radius: 50%; background: #f1f3f5; color: #6b7280; }
  .notifications-copy { flex: 1; min-width: 0; }
  .notifications-line { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
  .notifications-title { color: #111827; font-size: 13.5px; font-weight: 600; }
  .notifications-time { flex: 0 0 auto; color: #9ca3af; font-size: 11.5px; }
  .notifications-body { margin-top: 1px; color: #6b7280; font-size: 12.5px; }
  .notifications-empty { padding: 32px 0; color: #6b7280; font-size: 13px; text-align: center; }
  @media (max-width: 560px) {
    .notifications-card { padding: 16px; }
    .notifications-item { align-items: flex-start; }
    .notifications-line { flex-wrap: wrap; gap: 2px 10px; }
  }
`;

function NotificationsPanel({ notifications, onMarkAllRead, onMarkRead }) {
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <section className="notifications-card" aria-labelledby="notifications-panel-title">
      <div className="notifications-card-header">
        <div>
          <h2 id="notifications-panel-title">All Notifications</h2>
          <div className="notifications-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </div>
        </div>
        <button
          type="button"
          className="notifications-mark-all"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
        >
          Mark all read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="notifications-empty">You have no notifications.</div>
      ) : (
        <ul className="notifications-list">
          {notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.icon] || Megaphone;
            return (
              <li key={notification.id}>
                <button
                  type="button"
                  className="notifications-item"
                  data-unread={!notification.read}
                  aria-label={`${notification.read ? '' : 'Unread: '}${notification.title}. Mark as read.`}
                  onClick={() => onMarkRead(notification.id)}
                >
                  {!notification.read && <span className="notifications-dot" aria-label="Unread" />}
                  <span className="notifications-icon"><Icon size={16} strokeWidth={1.8} /></span>
                  <span className="notifications-copy">
                    <span className="notifications-line">
                      <span className="notifications-title">{notification.title}</span>
                      <span className="notifications-time">{notification.time}</span>
                    </span>
                    <span className="notifications-body" style={{ display: 'block' }}>{notification.body}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  };

  const markRead = (id) => {
    setNotifications((current) => current.map((notification) => (
      notification.id === id ? { ...notification, read: true } : notification
    )));
  };

  return (
    <DashboardLayout title="Notifications" breadcrumbs="Home / Notifications">
      <style>{styles}</style>
      <div className="notifications-page">
        <NotificationsPanel
          notifications={notifications}
          onMarkAllRead={markAllRead}
          onMarkRead={markRead}
        />
      </div>
    </DashboardLayout>
  );
}

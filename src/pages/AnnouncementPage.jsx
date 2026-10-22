import { useMemo, useState } from 'react';
import { Megaphone, Pin, Search } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getStoredUser } from '../services/api';
import './AnnouncementPage.css';

const DEMO_ANNOUNCEMENTS = [
  {
    id: 1,
    title: 'Office closed for Eid holidays',
    body: 'The office will remain closed from Sep 22–24. Remote coverage continues as usual for support teams.',
    source: 'Company-wide',
    scope: 'company',
    postedAgo: '2 hours ago',
    pinned: true,
  },
  {
    id: 2,
    title: 'Open enrollment for health insurance',
    body: 'Open enrollment closes Sep 30. Update your dependents in My Profile before the deadline.',
    source: 'HR',
    scope: 'company',
    postedAgo: 'Yesterday',
    pinned: false,
  },
  {
    id: 3,
    title: 'Sprint planning moved to Monday',
    body: 'Due to the holiday, sprint planning for Team Falcon moves to Monday 10 AM.',
    source: 'Engineering',
    scope: 'department',
    department: 'Engineering',
    postedAgo: '2 days ago',
    pinned: false,
  },
  {
    id: 4,
    title: 'Welcome our new hires!',
    body: 'Please welcome Mahnoor Aslam (Product Design) and Ali Raza (Operations) who joined this week.',
    source: 'Company-wide',
    scope: 'company',
    postedAgo: '4 days ago',
    pinned: false,
  },
];

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'company', label: 'Company-wide' },
  { key: 'department', label: 'My Department' },
];

function getUserInitials(user) {
  const name = user?.name || user?.fullName || '';
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return initials || user?.email?.[0]?.toUpperCase() || 'AK';
}

function AnnouncementCard({ item }) {
  return (
    <li className="announcement-card">
      <div className="announcement-card-icon" aria-hidden="true">
        <Megaphone size={15} />
      </div>
      <div className="announcement-card-body">
        <h2 className="announcement-card-title">{item.title}</h2>
        <p className="announcement-card-text">{item.body}</p>
        <div className="announcement-card-meta">{item.source} · {item.postedAgo}</div>
      </div>
      {item.pinned && (
        <span className="announcement-pinned">
          <Pin size={11} />
          Pinned
        </span>
      )}
    </li>
  );
}

export default function AnnouncementPage() {
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const user = getStoredUser();
  const department = user?.department || user?.departmentName || '';
  const initials = getUserInitials(user);

  const visibleAnnouncements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return DEMO_ANNOUNCEMENTS
      .filter((announcement) => {
        if (tab === 'company') return announcement.scope === 'company';
        if (tab === 'department') {
          return announcement.scope === 'department' && announcement.department === department;
        }
        return true;
      })
      .filter((announcement) => (
        !normalizedQuery
        || `${announcement.title} ${announcement.body} ${announcement.source}`
          .toLowerCase()
          .includes(normalizedQuery)
      ))
      .sort((first, second) => Number(second.pinned) - Number(first.pinned));
  }, [department, query, tab]);

  return (
    <DashboardLayout title="Announcements" breadcrumbs="Home / Announcements">
      <div className="announcement-page">
        <div className="announcement-toolbar">
          <div className="announcement-user" aria-label={`Signed-in user ${initials}`}>
            {initials}
          </div>
          <label className="announcement-search">
            <Search size={14} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search announcements"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search announcements"
            />
          </label>
        </div>

        <div className="announcement-tabs" role="tablist" aria-label="Announcement scope">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              className={`announcement-tab${tab === item.key ? ' active' : ''}`}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {visibleAnnouncements.length ? (
          <ul className="announcement-list">
            {visibleAnnouncements.map((announcement) => (
              <AnnouncementCard key={announcement.id} item={announcement} />
            ))}
          </ul>
        ) : (
          <div className="announcement-empty">
            No announcements match. Try another tab or clear your search.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

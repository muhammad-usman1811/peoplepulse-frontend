import React, { useEffect, useState } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { getCurrentUser } from '../services/api';

export default function Dashboard() {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const result = await getCurrentUser();
        if (!result.success) throw new Error(result.error || 'Could not load your account details.');
        const payload = result.data?.user || result.data?.data?.user || result.data?.data || result.data;
        if (active) setUserName(payload?.name || payload?.fullName || payload?.username || '');
      } catch (error) {
        if (active) setLoadError(error.message || 'Could not load your account details.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadUser();
    return () => {
      active = false;
    };
  }, [retryCount]);

  return (
    <DashboardLayout title="Dashboard" breadcrumbs="Home / Dashboard">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div>
          <p className="text-sm text-slate-500">Employee dashboard</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            {loading ? 'Loading your dashboard…' : `Welcome back${userName ? `, ${userName}` : ''}`}
          </h2>
          {loadError && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {loadError}{' '}
              <button type="button" className="font-semibold underline" onClick={() => setRetryCount((count) => count + 1)}>
                Retry
              </button>
            </p>
          )}
        </div>

        <section className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="brand-accent-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-lg">
              <Clock size={21} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Attendance Management</h3>
              <p className="mt-1 text-sm text-slate-500">
                View today’s attendance, team status, and clock-in details.
              </p>
            </div>
          </div>
          <Link
            to="/attendance"
            className="brand-action-button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            Open attendance
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </DashboardLayout>
  );
}
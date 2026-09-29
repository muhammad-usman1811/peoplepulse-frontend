import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

export default function Dashboard() {
  return (
    <DashboardLayout title="Dashboard" breadcrumbs="Home / Dashboard">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div>
          <p className="text-sm text-slate-500">Employee dashboard</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Welcome back, Ayesha</h2>
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
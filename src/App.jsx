import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Attendance from './pages/Attendance';
import MyLeavePage from './pages/MyLeavePage';
import MyWFHPage from './pages/MyWFHPage';
import MyPayslipsPage from './pages/MyPayslipsPage';
import MyPerformance from './pages/MyPerformance';
import MyDocumentsPage from './pages/MyDocumentsPage';
import MyOnboardingPage from './pages/MyOnboardingPage';
import NotificationsPage from './pages/Notifications';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';


// HR Admin Pages
import EmployeeDirectory from './components/hr/EmployeeDirectory';
import AttendanceManagement from './components/hr/AttendanceManagement';
import LeaveManagement from './components/hr/LeaveManagement';
import PayrollProcessing from './components/hr/PayrollProcessing';
import RecruitmentDashboardPage from './components/hr/RecruitmentDashboardPage';
import OnboardingChecklist from './components/hr/OnboardingChecklist';
import PerformanceCycles from './components/hr/PerformanceCycles';
import AnnouncementsComposer from './components/hr/AnnouncementsComposer';
import ReportsAnalytics from './components/hr/ReportsAnalytics';

import HRProfile from './pages/HRProfile';


// Always show the login screen when opening the app root.
const RootRedirect = () => {
  return <Navigate to="/login" replace />;
};

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing / Root Route: Dashboard if authenticated, else Login */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public Authentication Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />
        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />
        {/* Protected Dashboard & Profile Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <Attendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leave"
          element={
            <ProtectedRoute>
              <MyLeavePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wfh"
          element={
            <ProtectedRoute>
              <MyWFHPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payslips"
          element={
            <ProtectedRoute>
              <MyPayslipsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/performance"
          element={
            <ProtectedRoute>
              <MyPerformance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <MyDocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <MyOnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />


        {/* HR Admin Routes - EJ1*/}
        <Route
          path="/hr/dashboard"
          element={
            <ProtectedRoute allowedRoles={['hr', 'hr_admin']}>
              <EmployeeDirectory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/directory"
          element={
            <ProtectedRoute allowedRoles={['hr', 'hr_admin']}>
              <EmployeeDirectory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/attendance"
          element={
            <ProtectedRoute allowedRoles={['hr', 'hr_admin']}>
              <AttendanceManagement />
            </ProtectedRoute>
          }
        />


        <Route
          path="/hr/leaves"
          element={
            <ProtectedRoute allowedRoles={['hr', 'hr_admin']}>
              <LeaveManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/payroll"
          element={
            <ProtectedRoute allowedRoles={['hr', 'hr_admin']}>
              <PayrollProcessing />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/recruitment"
          element={
            <ProtectedRoute allowedRoles={['hr', 'hr_admin']}>
              <RecruitmentDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/onboarding"
          element={
            <ProtectedRoute allowedRoles={['hr', 'hr_admin']}>
              <OnboardingChecklist />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/performance"
          element={
            <ProtectedRoute allowedRoles={['hr', 'hr_admin']}>
              <PerformanceCycles />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/announcements"
          element={
            <ProtectedRoute allowedRoles={['hr', 'hr_admin']}>
              <AnnouncementsComposer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/reports"
          element={
            <ProtectedRoute allowedRoles={['hr', 'hr_admin']}>
              <ReportsAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/profile"
          element={
            <ProtectedRoute allowedRoles={['hr', 'hr_admin']}>
              <HRProfile />
            </ProtectedRoute>
          }
        />

        
        {/* Catch-all fallback */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

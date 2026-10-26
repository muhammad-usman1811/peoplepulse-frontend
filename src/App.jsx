import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Attendance from './pages/Attendance';
import HRAttendancePage from './pages/HRAttendancePage';
import MyLeavePage from './pages/MyLeavePage';
import MyWFHPage from './pages/MyWFHPage';
import MyPayslipsPage from './pages/MyPayslipsPage';
import MyPerformance from './pages/MyPerformance';
import MyDocumentsPage from './pages/MyDocumentsPage';
import MyOnboardingPage from './pages/MyOnboardingPage';
import NotificationsPage from './pages/Notifications';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

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
            <ProtectedRoute>
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
          path="/hr/attendance"
          element={
            <ProtectedRoute>
              <HRAttendancePage />
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

        {/* Catch-all fallback */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

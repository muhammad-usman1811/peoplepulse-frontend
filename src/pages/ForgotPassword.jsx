import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import { ArrowLeftIcon, CheckCircleIcon, AlertCircleIcon } from '../components/Icons';
import { requestPasswordReset } from '../services/api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Turns a backend resetUrl (which may point at another host) into an in-app path.
const toResetPath = (resetUrl, resetToken) => {
  if (resetToken) return `/reset-password/${encodeURIComponent(resetToken)}`;
  try {
    const url = new URL(resetUrl, window.location.origin);
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
};

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string, resetPath?: string }
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (status?.type === 'error') setStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setStatus({ type: 'error', message: 'Please enter a valid work email address.' });
      return;
    }

    setIsLoading(true);
    setStatus(null);

    const res = await requestPasswordReset(trimmedEmail);
    setIsLoading(false);

    if (res.success) {
      // When the server has no email delivery configured it returns the link
      // directly. Only surface it in local development builds.
      const resetData = res.data?.data;
      const resetPath = import.meta.env.DEV && (resetData?.resetUrl || resetData?.resetToken)
        ? toResetPath(resetData.resetUrl, resetData.resetToken)
        : null;

      setStatus({
        type: 'success',
        message:
          res.data?.message ||
          `If an account exists for ${trimmedEmail}, a password reset link has been sent to it.`,
        resetPath
      });
      return;
    }

    setStatus({
      type: 'error',
      message: res.isDatabaseError || res.isTimeout || res.isNetworkError || res.status >= 500
        ? 'The password reset service is unavailable right now. Please try again in a few minutes.'
        : res.error || 'Failed to send reset link. Please check the email and try again.'
    });
  };

  return (
    <AuthLayout>
      <div className="back-link-wrapper">
        <Link to="/login" className="back-link">
          <ArrowLeftIcon />
          <span>Back to login</span>
        </Link>
      </div>

      <div className="form-header">
        <h2>Reset your password</h2>
        <p>
          Enter your work email address and we'll send you a link to reset your password.
        </p>
      </div>

      {status && (
        <div
          className={status.type === 'success' ? 'success-banner' : 'error-banner'}
          role={status.type === 'success' ? 'status' : 'alert'}
          aria-live="polite"
        >
          {status.type === 'success' ? <CheckCircleIcon /> : <AlertCircleIcon />}
          <div>
            <p><strong>{status.type === 'success' ? 'Check your inbox' : 'Request failed'}</strong></p>
            <span>{status.message}</span>
            {status.resetPath && (
              <p style={{ marginTop: '6px' }}>
                <Link to={status.resetPath} className="forgot-password-link">
                  Open reset link (dev only)
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Input
          id="reset-email"
          name="email"
          label="Work email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={handleEmailChange}
          required
          autoComplete="email"
          disabled={isLoading}
        />

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Sending link...' : (status?.type === 'success' ? 'Resend reset link' : 'Send reset link')}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;

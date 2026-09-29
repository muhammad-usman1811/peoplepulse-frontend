import React, { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import { ArrowLeftIcon, CheckCircleIcon, AlertCircleIcon } from '../components/Icons';
import { resetPasswordWithToken } from '../services/api';

const MIN_PASSWORD_LENGTH = 6;

export const ResetPassword = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  // Support both /reset-password/:token and /reset-password?token=...
  const token = params.token || searchParams.get('token') || '';

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (status?.type === 'error') setStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setStatus({ type: 'error', message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setIsLoading(true);
    setStatus(null);
    const res = await resetPasswordWithToken(token, formData.password);
    setIsLoading(false);

    if (res.success) {
      setStatus({ type: 'success', message: 'Your password has been reset. Redirecting to login...' });
      setTimeout(() => navigate('/login', { replace: true }), 1500);
      return;
    }

    setStatus({
      type: 'error',
      message: res.status === 400
        ? 'This reset link is invalid or has expired. Please request a new one.'
        : res.error || 'Could not reset your password. Please try again.'
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
        <h2>Choose a new password</h2>
        <p>Enter a new password for your PeoplePulse account.</p>
      </div>

      {!token ? (
        <div className="error-banner" role="alert">
          <AlertCircleIcon />
          <div>
            <p><strong>Missing reset token</strong></p>
            <span>
              This link is incomplete. <Link to="/forgot-password" className="forgot-password-link">Request a new reset link</Link>.
            </span>
          </div>
        </div>
      ) : (
        <>
          {status && (
            <div
              className={status.type === 'success' ? 'success-banner' : 'error-banner'}
              role={status.type === 'success' ? 'status' : 'alert'}
              aria-live="polite"
            >
              {status.type === 'success' ? <CheckCircleIcon /> : <AlertCircleIcon />}
              <div>
                <p><strong>{status.type === 'success' ? 'Password updated' : 'Reset failed'}</strong></p>
                <span>{status.message}</span>
              </div>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <Input
              id="new-password"
              name="password"
              label="New password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              disabled={isLoading || status?.type === 'success'}
            />

            <Input
              id="confirm-password"
              name="confirmPassword"
              label="Confirm new password"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
              disabled={isLoading || status?.type === 'success'}
            />

            <button type="submit" className="btn-primary" disabled={isLoading || status?.type === 'success'}>
              {isLoading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;

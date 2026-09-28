import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import {
  CheckCircleIcon,
  AlertCircleIcon,
  GoogleIcon,
  MicrosoftIcon,
} from '../components/Icons';
import { loginUser } from '../services/api';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loginStatus, setLoginStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (loginStatus) setLoginStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginStatus(null);

    try {
      const res = await loginUser({
        email: formData.email,
        password: formData.password
      });

      setIsLoading(false);

      if (res.success) {
        setLoginStatus({
          type: 'success',
          message: 'Authentication successful! Redirecting to dashboard...'
        });
        setTimeout(() => {
          navigate(from);
        }, 600);
      } else {
        setLoginStatus({
          type: 'error',
          message: res.error || 'Incorrect email or password.'
        });
      }
    } catch (err) {
      setIsLoading(false);
      setLoginStatus({
        type: 'error',
        message: err.message || 'An unexpected error occurred during login.'
      });
    }
  };

  const handleProviderSignIn = (provider) => {
    setLoginStatus({
      type: 'error',
      message: `${provider} sign-in is not configured for this application yet.`
    });
  };

  return (
    <AuthLayout>
      <div className="form-header">
        <h2>Welcome back</h2>
        <p>Enter your credentials to access your account</p>
      </div>

      {loginStatus?.type === 'success' && (
        <div className="success-banner">
          <CheckCircleIcon />
          <div style={{ flex: 1 }}>
            <p><strong>Authentication successful</strong></p>
            <span>{loginStatus.message}</span>
          </div>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          id="work-email"
          name="email"
          label="Work email"
          type="email"
          placeholder="name@company.com"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />

        <Input
          id="password"
          name="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
        />

        <div className="forgot-password-row">
          <Link to="/forgot-password" className="forgot-password-link">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {loginStatus?.type === 'error' && (
        <div className="error-banner" role="alert" aria-live="polite">
          <AlertCircleIcon />
          <div style={{ flex: 1 }}>
            <p><strong>Login error</strong></p>
            <span>{loginStatus.message}</span>
          </div>
        </div>
      )}

      <div className="auth-divider"><span>or</span></div>
      <div className="social-buttons-container">
        <button
          type="button"
          className="btn-social"
          onClick={() => handleProviderSignIn('Google')}
        >
          <GoogleIcon />
          Sign in with Google
        </button>
        <button
          type="button"
          className="btn-social"
          onClick={() => handleProviderSignIn('Microsoft')}
        >
          <MicrosoftIcon />
          Sign in with Microsoft
        </button>
      </div>
    </AuthLayout>
  );
};

export default Login;

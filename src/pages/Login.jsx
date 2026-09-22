import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import { GoogleIcon, CheckCircleIcon, AlertCircleIcon } from '../components/Icons';
import { loginUser, loginDemoSession } from '../services/api';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/profile';

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

  const handleFillDemo = () => {
    setFormData({
      email: 'admin@peoplepulse.com',
      password: 'password123'
    });
    setLoginStatus(null);
  };

  const handleDemoLogin = (emailToUse) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const res = loginDemoSession(emailToUse || formData.email || 'admin@peoplepulse.com');
      setLoginStatus({
        type: 'success',
        message: 'Signed in successfully! Redirecting to profile...'
      });
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    }, 400);
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
          message: 'Authentication successful! Redirecting to profile...'
        });
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 600);
      } else {
        setLoginStatus({
          type: 'error',
          message: res.error || 'Login failed. Please check your credentials.',
          isDatabaseError: res.isDatabaseError || res.isTimeout
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

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      loginDemoSession('alex.morgan@gmail.com');
      setFormData({
        email: 'alex.morgan@gmail.com',
        password: '••••••••••••'
      });
      setLoginStatus({
        type: 'success',
        message: 'Google authentication successful! Redirecting to profile...'
      });
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    }, 500);
  };

  return (
    <AuthLayout>
      <div className="form-header">
        <h2>Welcome back</h2>
        <p>Enter your credentials to access your account</p>
      </div>

      {loginStatus && (
        <div className={loginStatus.type === 'success' ? 'success-banner' : 'error-banner'}>
          {loginStatus.type === 'success' ? <CheckCircleIcon /> : <AlertCircleIcon />}
          <div style={{ flex: 1 }}>
            <p><strong>{loginStatus.type === 'success' ? 'Authentication successful' : 'Login error'}</strong></p>
            <span>{loginStatus.message}</span>
            {loginStatus.isDatabaseError && (
              <div style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleDemoLogin(formData.email || 'admin@peoplepulse.com')}
                  style={{
                    backgroundColor: '#0A373B',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Continue with Demo Session
                </button>
              </div>
            )}
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
          rightLabelElement={
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot password?
            </Link>
          }
        />

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="social-buttons-container">
          <button
            type="button"
            className="btn-social"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <GoogleIcon />
            <span>Sign in with Google</span>
          </button>
        </div>

        <div className="demo-credentials-box">
          <div className="demo-creds-info">
            <span className="demo-tag">Demo Creds</span>
            <code>admin@peoplepulse.com</code> / <code>password123</code>
          </div>
          <button
            type="button"
            className="btn-auto-fill"
            onClick={handleFillDemo}
          >
            Auto Fill
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;

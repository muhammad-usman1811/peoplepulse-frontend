
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

import {
    loginUser,
    getStoredUser,
} from '../services/api';

// Redirect users to the correct landing page for their role.
export const getHomePath = (role) => {
    switch (role?.toLowerCase()?.trim()) {
        case 'employee':
            return '/dashboard';

        case 'hr':
        case 'hr_admin':
            return '/hr/directory';

        case 'super_admin':
        case 'superadmin':
            return '/superadmin/organization-setup';

        default:
            return '/login';
    }
};

const allowedPaths = {
    employee: [
        '/dashboard',
        '/profile',
        '/attendance',
        '/leave',
        '/wfh',
        '/payslips',
        '/performance',
        '/documents',
        '/onboarding',
        '/announcements',
        '/notifications',
    ],

    hr_admin: ['/hr/'],
    hr: ['/hr/'],

    super_admin: ['/superadmin/'],
    superadmin: ['/superadmin/'],
};

const canAccessRequestedPath = (path, role) => {
    if (!path || !role) {
        return false;
    }

    const normalizedRole = role.toLowerCase().trim();
    const paths = allowedPaths[normalizedRole] || [];

    return paths.some((allowed) =>
        allowed.endsWith('/')
            ? path.startsWith(allowed)
            : path === allowed
    );
};

export const Login = () => {
    console.log("PEOPLEPULSE UPDATED LOGIN FILE LOADED");
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [loginStatus, setLoginStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (loginStatus) {
            setLoginStatus(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsLoading(true);
        setLoginStatus(null);

        try {
            const res = await loginUser({
                email: formData.email,
                password: formData.password,
            });

            if (!res.success) {
                setLoginStatus({
                    type: 'error',
                    message: res.error || 'Incorrect email or password.',
                });
                return;
            }

            // Get the user saved by loginUser()
            const user =
                res.data?.user ||
                res.data?.data?.user ||
                getStoredUser();

            console.log('Logged in user:', user);

            const role = user?.role?.toLowerCase()?.trim();

            console.log('User role:', role);

            const roleHome = getHomePath(role);

            if (roleHome === '/login') {
                setLoginStatus({
                    type: 'error',
                    message: `Unknown account role: ${user?.role || 'undefined'}`,
                });
                return;
            }

            setLoginStatus({
                type: 'success',
                message: 'Authentication successful! Redirecting...',
            });

            const requestedPath = location.state?.from?.pathname;

            let destination = roleHome;

            // HR must always land on the HR directory.
            if (role === 'hr' || role === 'hr_admin') {
                destination = '/hr/directory';
            } else if (canAccessRequestedPath(requestedPath, role)) {
                destination = requestedPath;
            }

            console.log('Logged-in role:', role);
            console.log('Final destination:', destination);

            navigate(destination, { replace: true });
            console.log('Requested path:', requestedPath);
            console.log('Role home:', roleHome);
            console.log('Final destination:', destination);

            navigate(destination, { replace: true });

        } catch (err) {
            console.error('Login error:', err);

            setLoginStatus({
                type: 'error',
                message: err.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleProviderSignIn = (provider) => {
        setLoginStatus({
            type: 'error',
            message: `${provider} sign-in is not configured for this application yet.`,
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
                        <p>
                            <strong>Authentication successful</strong>
                        </p>

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
                    <Link
                        to="/forgot-password"
                        className="forgot-password-link"
                    >
                        Forgot password?
                    </Link>
                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading}
                >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>

            {loginStatus?.type === 'error' && (
                <div
                    className="error-banner"
                    role="alert"
                    aria-live="polite"
                >
                    <AlertCircleIcon />

                    <div style={{ flex: 1 }}>
                        <p>
                            <strong>Login error</strong>
                        </p>

                        <span>{loginStatus.message}</span>
                    </div>
                </div>
            )}

            <div className="auth-divider">
                <span>or</span>
            </div>

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

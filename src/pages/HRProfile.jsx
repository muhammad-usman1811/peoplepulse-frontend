
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Card from '../components/Card';
import ToggleSwitch from '../components/ToggleSwitch';
import { Lock, X, CheckCircle2 } from 'lucide-react';

import {
    getMyProfile,
    getNotificationPreferences,
    updateNotificationPreferences,
    updatePassword,
    getStoredUser
} from '../services/api';

function getApiPayload(result) {
    const payload = result?.data;
    return (
        payload?.profile ||
        payload?.data?.profile ||
        payload?.data?.user ||
        payload?.data ||
        payload ||
        {}
    );
}

export const HRProfile = () => {
    const storedUser = getStoredUser();

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        department: '',
        designation: '',
        phoneNumber: ''
    });

    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [preferenceError, setPreferenceError] = useState('');

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [passwordError, setPasswordError] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);
    const [savingPreferences, setSavingPreferences] = useState(false);

    useEffect(() => {
        let active = true;

        const loadProfile = async () => {
            setLoading(true);
            setLoadError('');

            const [profileResult, preferenceResult] = await Promise.all([
                getMyProfile(),
                getNotificationPreferences()
            ]);

            if (!active) return;

            // Use API profile, with stored login data as fallback.
            if (profileResult.success) {
                const data = getApiPayload(profileResult);

                const apiName =
                    data.name && data.name !== '[Decryption Error]'
                        ? data.name
                        : '';

                setProfile({
                    name: apiName || (
                        storedUser?.name !== '[Decryption Error]'
                            ? storedUser?.name || ''
                            : ''
                    ),
                    email: data.email || storedUser?.email || '',
                    department:
                        data.department?.name ||
                        data.department ||
                        storedUser?.department ||
                        '',
                    designation:
                        data.designation?.name ||
                        data.designation ||
                        storedUser?.designation ||
                        '',
                    phoneNumber: data.phoneNumber || ''
                });
            } else {
                setProfile({
                    name:
                        storedUser?.name !== '[Decryption Error]'
                            ? storedUser?.name || ''
                            : '',
                    email: storedUser?.email || '',
                    department: storedUser?.department || '',
                    designation: storedUser?.designation || '',
                    phoneNumber: ''
                });

                setLoadError(
                    profileResult.error || 'Could not load profile details.'
                );
            }

            if (preferenceResult.success) {
                const preferences = getApiPayload(preferenceResult);
                setEmailNotifications(preferences.email ?? true);
                setPushNotifications(preferences.push ?? true);
            } else {
                setPreferenceError(
                    preferenceResult.error ||
                    'Could not load notification preferences.'
                );
            }

            setLoading(false);
        };

        loadProfile();

        return () => {
            active = false;
        };
    }, []);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3500);
    };

    const savePreference = async (key, value) => {
        const previous = {
            email: emailNotifications,
            push: pushNotifications
        };

        const next = { ...previous, [key]: value };

        setEmailNotifications(next.email);
        setPushNotifications(next.push);
        setPreferenceError('');
        setSavingPreferences(true);

        try {
            const result = await updateNotificationPreferences(next);

            if (!result.success) {
                throw new Error(
                    result.error || 'Could not update preferences.'
                );
            }

            showToast('Notification preferences updated.');
        } catch (error) {
            setEmailNotifications(previous.email);
            setPushNotifications(previous.push);
            setPreferenceError(error.message);
        } finally {
            setSavingPreferences(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (!passwordForm.currentPassword) {
            setPasswordError('Enter your current password.');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters.');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }

        setPasswordError('');
        setSavingPassword(true);

        try {
            const result = await updatePassword(
                passwordForm.currentPassword,
                passwordForm.newPassword
            );

            if (!result.success) {
                throw new Error(result.error || 'Could not update password.');
            }

            setIsPasswordModalOpen(false);
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            showToast('Password updated successfully.');
        } catch (error) {
            setPasswordError(error.message);
        } finally {
            setSavingPassword(false);
        }
    };

    const initials = profile.name
        ? profile.name
            .trim()
            .split(/\s+/)
            .map((word) => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : 'HR';

    return (
        <DashboardLayout
            title="My Profile"
            breadcrumbs="Home / HR / Profile"
            role="hr_admin"
        >
            {toastMessage && (
                <div className="profile-toast-notification">
                    <CheckCircle2 size={18} />
                    <span>{toastMessage}</span>
                </div>
            )}

            {loadError && (
                <div className="profile-toast-notification" role="alert">
                    {loadError}
                </div>
            )}

            {loading && (
                <p className="mb-4 text-sm text-slate-500">
                    Loading your profile...
                </p>
            )}

            <div className="profile-page-grid">
                <div className="profile-top-section">
                    <Card className="profile-photo-card">
                        <h2 className="profile-card-title">HR Profile</h2>

                        <div className="profile-photo-wrapper">
                            <div className="profile-avatar-circle">
                                <span className="avatar-text">{initials}</span>
                            </div>

                            <h3 className="profile-user-name">
                                {profile.name || 'Name unavailable'}
                            </h3>

                            <p className="profile-user-role">
                                {profile.designation || 'HR Team'} • {profile.department}
                            </p>
                        </div>
                    </Card>

                    <Card className="personal-info-card">
                        <div className="card-header-group">
                            <h2 className="profile-card-title">
                                Personal Information
                            </h2>
                            <p className="profile-card-subtitle">
                                Your HR account information
                            </p>
                        </div>

                        <div className="personal-info-form">
                            <div className="form-grid-2col">
                                <div className="profile-form-group">
                                    <label className="profile-form-label">
                                        Full Name
                                    </label>
                                    <input
                                        className="profile-form-input"
                                        value={profile.name}
                                        readOnly
                                        placeholder="Name unavailable"
                                    />
                                </div>

                                <div className="profile-form-group">
                                    <label className="profile-form-label">
                                        Work Email
                                    </label>
                                    <input
                                        type="email"
                                        className="profile-form-input"
                                        value={profile.email}
                                        readOnly
                                    />
                                </div>

                                <div className="profile-form-group">
                                    <label className="profile-form-label">
                                        Department
                                    </label>
                                    <input
                                        className="profile-form-input"
                                        value={profile.department}
                                        readOnly
                                    />
                                </div>

                                <div className="profile-form-group">
                                    <label className="profile-form-label">
                                        Designation
                                    </label>
                                    <input
                                        className="profile-form-input"
                                        value={profile.designation}
                                        readOnly
                                    />
                                </div>

                                <div className="profile-form-group">
                                    <label className="profile-form-label">
                                        Phone Number
                                    </label>
                                    <input
                                        className="profile-form-input"
                                        value={profile.phoneNumber}
                                        readOnly
                                        placeholder="Not provided"
                                    />
                                </div>

                                <div className="profile-form-group">
                                    <label className="profile-form-label">
                                        Account Role
                                    </label>
                                    <input
                                        className="profile-form-input"
                                        value="HR"
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="profile-bottom-section">
                    <Card className="security-card">
                        <div className="card-header-group">
                            <h2 className="profile-card-title">Security</h2>
                            <p className="profile-card-subtitle">
                                Password and notification preferences
                            </p>
                        </div>

                        <div className="security-items-list">
                            <div className="security-item-row">
                                <div className="security-item-text">
                                    <h4 className="security-item-heading">
                                        Change Password
                                    </h4>
                                    <p className="security-item-subtext">
                                        Keep your account secure
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="btn-update-action"
                                    onClick={() => setIsPasswordModalOpen(true)}
                                >
                                    Update
                                </button>
                            </div>

                            <div className="security-divider" />

                            <div className="security-item-row">
                                <span className="security-toggle-label">
                                    Email notifications
                                </span>

                                <ToggleSwitch
                                    id="hr-email-notifications"
                                    checked={emailNotifications}
                                    onChange={(value) => savePreference('email', value)}
                                    label="Email notifications"
                                />
                            </div>

                            <div className="security-divider" />

                            <div className="security-item-row">
                                <span className="security-toggle-label">
                                    Push notifications
                                </span>

                                <ToggleSwitch
                                    id="hr-push-notifications"
                                    checked={pushNotifications}
                                    onChange={(value) => savePreference('push', value)}
                                    label="Push notifications"
                                />
                            </div>

                            {preferenceError && (
                                <p className="mt-3 text-xs text-red-600" role="alert">
                                    {preferenceError}
                                </p>
                            )}

                            {savingPreferences && (
                                <p className="mt-3 text-xs text-slate-500">
                                    Saving preferences...
                                </p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {isPasswordModalOpen && (
                <div
                    className="modal-backdrop"
                    onClick={() => setIsPasswordModalOpen(false)}
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div className="modal-title-with-icon">
                                <Lock size={20} className="modal-title-icon" />
                                <h3>Update Password</h3>
                            </div>

                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={() => setIsPasswordModalOpen(false)}
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {passwordError && (
                            <div className="modal-error-banner">
                                {passwordError}
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit} className="modal-form">
                            {[
                                ['currentPassword', 'Current Password'],
                                ['newPassword', 'New Password'],
                                ['confirmPassword', 'Confirm New Password']
                            ].map(([field, label]) => (
                                <div className="profile-form-group" key={field}>
                                    <label className="profile-form-label">
                                        {label}
                                    </label>

                                    <input
                                        type="password"
                                        className="profile-form-input"
                                        value={passwordForm[field]}
                                        onChange={(e) =>
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                [field]: e.target.value
                                            }))
                                        }
                                    />
                                </div>
                            ))}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn-save-changes"
                                    disabled={savingPassword}
                                >
                                    {savingPassword ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default HRProfile;

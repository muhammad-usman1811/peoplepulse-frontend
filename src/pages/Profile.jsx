import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Card from '../components/Card';
import ToggleSwitch from '../components/ToggleSwitch';
import { Check, X, Camera, Lock, CheckCircle2 } from 'lucide-react';

export const Profile = () => {
  // Personal information form state
  const [personalInfo, setPersonalInfo] = useState({
    fullName: 'Ayesha Khan',
    employeeId: 'EMP-1042',
    workEmail: 'ayesha.khan@company.com',
    phoneNumber: '+92 300 1234567',
    department: 'Product Design',
    manager: 'Bilal Ahmed',
    role: 'UI/UX Designer',
    avatarInitials: 'AK'
  });

  // Security & Notification state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Toast / Status message
  const [toastMessage, setToastMessage] = useState(null);

  // Password Modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');

  // Photo change state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSavePersonalInfo = (e) => {
    e.preventDefault();
    showToast('Personal information updated successfully!');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordError('');
    setIsPasswordModalOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    showToast('Password updated successfully!');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setIsPhotoModalOpen(false);
        showToast('Profile photo updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <DashboardLayout title="My Profile" breadcrumbs="Home / Profile">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="profile-toast-notification">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="profile-page-grid">
        {/* Top Row: Left Profile Photo Card & Right Personal Information Card */}
        <div className="profile-top-section">
          {/* Profile Photo Card */}
          <Card className="profile-photo-card">
            <h2 className="profile-card-title">Profile Photo</h2>
            
            <div className="profile-photo-wrapper">
              <div className="profile-avatar-circle">
                {photoPreview ? (
                  <img src={photoPreview} alt={personalInfo.fullName} className="avatar-image" />
                ) : (
                  <span className="avatar-text">{personalInfo.avatarInitials}</span>
                )}
              </div>

              <h3 className="profile-user-name">{personalInfo.fullName}</h3>
              <p className="profile-user-role">
                {personalInfo.role} • {personalInfo.department}
              </p>

              <button 
                type="button" 
                className="btn-change-photo"
                onClick={() => setIsPhotoModalOpen(true)}
              >
                Change Photo
              </button>
            </div>
          </Card>

          {/* Personal Information Card */}
          <Card className="personal-info-card">
            <div className="card-header-group">
              <h2 className="profile-card-title">Personal Information</h2>
              <p className="profile-card-subtitle">Keep your details up to date</p>
            </div>

            <form onSubmit={handleSavePersonalInfo} className="personal-info-form">
              <div className="form-grid-2col">
                {/* Full Name */}
                <div className="profile-form-group">
                  <label htmlFor="fullName" className="profile-form-label">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    className="profile-form-input"
                    value={personalInfo.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Employee ID */}
                <div className="profile-form-group">
                  <label htmlFor="employeeId" className="profile-form-label">
                    Employee ID
                  </label>
                  <input
                    id="employeeId"
                    name="employeeId"
                    type="text"
                    className="profile-form-input"
                    value={personalInfo.employeeId}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Work Email */}
                <div className="profile-form-group">
                  <label htmlFor="workEmail" className="profile-form-label">
                    Work Email
                  </label>
                  <input
                    id="workEmail"
                    name="workEmail"
                    type="email"
                    className="profile-form-input"
                    value={personalInfo.workEmail}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Phone Number */}
                <div className="profile-form-group">
                  <label htmlFor="phoneNumber" className="profile-form-label">
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    className="profile-form-input"
                    value={personalInfo.phoneNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Department */}
                <div className="profile-form-group">
                  <label htmlFor="department" className="profile-form-label">
                    Department
                  </label>
                  <div className="select-custom-wrapper">
                    <select
                      id="department"
                      name="department"
                      className="profile-form-select"
                      value={personalInfo.department}
                      onChange={handleInputChange}
                    >
                      <option value="Product Design">Product Design</option>
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Quality Assurance">Quality Assurance</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>
                </div>

                {/* Manager */}
                <div className="profile-form-group">
                  <label htmlFor="manager" className="profile-form-label">
                    Manager
                  </label>
                  <input
                    id="manager"
                    name="manager"
                    type="text"
                    className="profile-form-input"
                    value={personalInfo.manager}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-submit-row">
                <button type="submit" className="btn-save-changes">
                  Save Changes
                </button>
              </div>
            </form>
          </Card>
        </div>

        {/* Bottom Section: Security Card */}
        <div className="profile-bottom-section">
          <Card className="security-card">
            <div className="card-header-group">
              <h2 className="profile-card-title">Security</h2>
              <p className="profile-card-subtitle">Password and notification preferences</p>
            </div>

            <div className="security-items-list">
              {/* Change Password Row */}
              <div className="security-item-row">
                <div className="security-item-text">
                  <h4 className="security-item-heading">Change Password</h4>
                  <p className="security-item-subtext">Last changed 3 months ago</p>
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

              {/* Email Notifications Row */}
              <div className="security-item-row">
                <div className="security-item-text">
                  <span className="security-toggle-label">Email notifications</span>
                </div>
                <ToggleSwitch
                  id="email-notifications-toggle"
                  checked={emailNotifications}
                  onChange={setEmailNotifications}
                  label="Email notifications"
                />
              </div>

              <div className="security-divider" />

              {/* Push Notifications Row */}
              <div className="security-item-row">
                <div className="security-item-text">
                  <span className="security-toggle-label">Push notifications</span>
                </div>
                <ToggleSwitch
                  id="push-notifications-toggle"
                  checked={pushNotifications}
                  onChange={setPushNotifications}
                  label="Push notifications"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Password Update Modal */}
      {isPasswordModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="modal-form">
              <div className="profile-form-group">
                <label className="profile-form-label">Current Password</label>
                <input
                  type="password"
                  className="profile-form-input"
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>

              <div className="profile-form-group">
                <label className="profile-form-label">New Password</label>
                <input
                  type="password"
                  className="profile-form-input"
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>

              <div className="profile-form-group">
                <label className="profile-form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="profile-form-input"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save-changes">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Photo Modal */}
      {isPhotoModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsPhotoModalOpen(false)}>
          <div className="modal-content photo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Camera size={20} className="modal-title-icon" />
                <h3>Change Profile Photo</h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setIsPhotoModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="photo-upload-area">
              <div className="photo-preview-box">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="avatar-preview-img" />
                ) : (
                  <div className="profile-avatar-circle modal-avatar">
                    <span className="avatar-text">{personalInfo.avatarInitials}</span>
                  </div>
                )}
              </div>

              <label htmlFor="photo-upload-input" className="btn-upload-file">
                Upload New Image
                <input 
                  id="photo-upload-input" 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
              </label>
              <p className="photo-upload-hint">Supported formats: JPG, PNG, GIF (Max: 5MB)</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Profile;

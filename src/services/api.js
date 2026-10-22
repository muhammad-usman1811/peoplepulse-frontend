/**
 * PeoplePulse API Service
 * Official backend endpoint: https://peoplepulse-backend.vercel.app/api
 * Swagger Documentation: https://peoplepulse-backend.vercel.app/api-docs/#/
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://peoplepulse-backend.vercel.app/api');
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

/**
 * Helper to perform fetch with JSON headers, Bearer JWT, request timeout & robust error parsing
 */
async function request(endpoint, options = {}, timeoutMs = 8000) {
  const { responseType, ...fetchOptions } = options;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${cleanEndpoint}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    Accept: 'application/json',
    ...(options.headers || {})
  };

  const token = localStorage.getItem('peoplepulse_token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal
    });
    clearTimeout(timer);

    let data;
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && responseType === 'blob') {
      data = await response.blob();
    } else if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text || response.statusText };
      }
    }

    if (!response.ok) {
      let rawMsg =
        data?.message ||
        data?.error ||
        data?.msg ||
        `Request failed with status ${response.status}`;

      const isDbTimeout =
        typeof rawMsg === 'string' &&
        (rawMsg.includes('buffering timed out') ||
          rawMsg.includes('timed out after') ||
          rawMsg.includes('MongooseError') ||
          rawMsg.includes('MongoServerSelectionError'));

      const formattedError = isDbTimeout
        ? 'The backend server could not connect to MongoDB Atlas (database buffering timed out).'
        : rawMsg;

      return {
        success: false,
        status: response.status,
        error: formattedError,
        rawError: rawMsg,
        isDatabaseError: isDbTimeout,
        data
      };
    }

    return {
      success: true,
      status: response.status,
      data
    };
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err.name === 'AbortError';
    return {
      success: false,
      status: 0,
      error: isTimeout
        ? 'The request timed out while waiting for the backend server.'
        : err.name === 'TypeError' && err.message.includes('fetch')
          ? `Could not reach API server at ${RAW_API_URL}.`
          : err.message || 'An unexpected network error occurred.',
      isTimeout,
      isNetworkError: true
    };
  }
}

export async function apiRequest(endpoint, options = {}, timeoutMs = 8000) {
  return request(endpoint, options, timeoutMs);
}

/**
 * Check backend API health status
 * Endpoint: GET /api/health
 */
export async function checkApiHealth() {
  const result = await request('/health', { method: 'GET' });
  return result;
}

/**
 * Login user (Super Admin & Employees)
 * Endpoint: POST /api/auth/login
 * Only a genuine success response from the backend (i.e. the email/password
 * matched a real user in the database) grants access. Any failure - wrong
 * email, wrong password, or a network/server error - is surfaced as-is and
 * never silently logs the user in.
 */
export async function loginUser({ email, password }) {
  const payload = {
    username: email,
    password
  };

  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, 20000);

  if (res.success && res.data) {
    const token =
      res.data.token ||
      res.data.data?.token ||
      res.data.accessToken ||
      res.data.data?.accessToken ||
      res.data.access_token ||
      res.data.jwt;
    const user = res.data.user || res.data.data?.user || { email };

    if (!token) {
      return {
        success: false,
        status: res.status,
        error: 'The login response did not include an authentication token.'
      };
    }

    localStorage.setItem('peoplepulse_token', token);
    if (user) {
      localStorage.setItem('peoplepulse_user', JSON.stringify(user));
    }
    return res;
  }

  // Backend rejected the login (wrong email, wrong password, or the
  // account doesn't exist). Pass the real error through - don't grant
  // access.
  return {
    ...res,
    error: res.isDatabaseError
      ? res.error
      : res.status >= 500
        ? 'The login service returned a server error. Please try again later or contact your administrator.'
        : res.isTimeout
          ? 'The login request timed out while waiting for the authentication service.'
          : res.error || 'Incorrect email or password.'
  };
}

/**
 * Get current authenticated user profile
 * Endpoint: GET /api/auth/me
 */
export async function getCurrentUser() {
  return await request('/auth/me', { method: 'GET' });
}

/**
 * Get the authenticated user's profile details.
 * Endpoint: GET /api/profile
 */
export async function getMyProfile() {
  return await request('/profile', { method: 'GET' });
}

/**
 * Update the authenticated user's profile details.
 * Endpoint: PUT /api/profile
 */
export async function updateMyProfile(profile) {
  return await request('/profile', {
    method: 'PUT',
    body: JSON.stringify(profile)
  }, 20000);
}

/**
 * Change the authenticated user's password.
 * Endpoint: PUT /api/profile/password
 */
export async function updatePassword(currentPassword, newPassword) {
  return await request('/profile/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword })
  }, 20000);
}

/**
 * Get the authenticated user's notification preferences.
 * Endpoint: GET /api/profile/notifications
 */
export async function getNotificationPreferences() {
  return await request('/profile/notifications', { method: 'GET' });
}

/**
 * Update the authenticated user's notification preferences.
 * Endpoint: PUT /api/profile/notifications
 */
export async function updateNotificationPreferences(preferences) {
  return await request('/profile/notifications', {
    method: 'PUT',
    body: JSON.stringify(preferences)
  }, 20000);
}

/**
 * Request password reset link
 * Endpoint: POST /api/auth/forgot-password
 */
export async function requestPasswordReset(email) {
  return await request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  }, 20000);
}

/**
 * Reset password using token
 * Endpoint: PUT /api/auth/reset-password/:resetToken
 */
export async function resetPasswordWithToken(resetToken, newPassword) {
  return await request(`/auth/reset-password/${encodeURIComponent(resetToken)}`, {
    method: 'PUT',
    body: JSON.stringify({ password: newPassword })
  }, 20000);
}

/**
 * Get payslips visible to the authenticated user.
 * Endpoint: GET /api/payroll/payslips
 */
export async function getMyPayslips({ page = 1, limit = 100, month, status } = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (month) query.set('month', month);
  if (status) query.set('status', status);
  return await request(`/payroll/payslips?${query.toString()}`, { method: 'GET' }, 20000);
}

/**
 * Get a single payslip visible to the authenticated user.
 * Endpoint: GET /api/payroll/payslips/:id
 */
export async function getMyPayslip(payslipId) {
  return await request(`/payroll/payslips/${encodeURIComponent(payslipId)}`, { method: 'GET' }, 20000);
}

/**
 * Performance APIs
 * Swagger: https://peoplepulse-backend.vercel.app/api-docs/#/
 */
export async function submitPerformanceSelfReview(cycleId, payload) {
  return await request(`/performance/cycles/${encodeURIComponent(cycleId)}/reviews`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }, 20000);
}

/**
 * List review cycles available to the authenticated user.
 * Endpoint: GET /api/performance/cycles
 */
export async function getPerformanceCycles({ status = 'open', page = 1, limit = 100 } = {}) {
  const query = new URLSearchParams({ status, page: String(page), limit: String(limit) });
  return await request(`/performance/cycles?${query.toString()}`, { method: 'GET' }, 20000);
}

/**
 * List the authenticated employee's performance reviews.
 * Endpoint: GET /api/performance/reviews/my
 */
export async function getMyPerformanceReviews({ page = 1, limit = 100, cycle } = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (cycle) query.set('cycle', cycle);
  return await request(`/performance/reviews/my?${query.toString()}`, { method: 'GET' }, 20000);
}

/**
 * List performance reviews for the authenticated manager's direct reports.
 * Endpoint: GET /api/performance/team
 */
export async function getPerformanceTeamReviews({ page = 1, limit = 100 } = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  return await request(`/performance/team?${query.toString()}`, { method: 'GET' }, 20000);
}

/**
 * List reviews submitted for a performance cycle (HR/Admin access).
 * Endpoint: GET /api/performance/cycles/:cycleId/reviews
 */
export async function getPerformanceCycleReviews(cycleId, { page = 1, limit = 100 } = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  return await request(
    `/performance/cycles/${encodeURIComponent(cycleId)}/reviews?${query.toString()}`,
    { method: 'GET' },
    20000
  );
}

/**
 * Create a performance cycle (HR/Admin access).
 * Endpoint: POST /api/performance/cycles
 */
export async function createPerformanceCycle(payload) {
  return await request('/performance/cycles', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, 20000);
}

/**
 * Close a performance cycle (HR/Admin access).
 * Endpoint: PATCH /api/performance/cycles/:cycleId/close
 */
export async function closePerformanceCycle(cycleId) {
  return await request(`/performance/cycles/${encodeURIComponent(cycleId)}/close`, {
    method: 'PATCH'
  }, 20000);
}

/**
 * Submit or update a manager review (assigned manager or HR/Admin access).
 * Endpoint: PUT /api/performance/reviews/:reviewId/manager-review
 */
export async function submitPerformanceManagerReview(reviewId, payload) {
  return await request(`/performance/reviews/${encodeURIComponent(reviewId)}/manager-review`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }, 20000);
}

export async function getPerformanceReview(reviewId) {
  return await request(`/performance/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'GET'
  }, 20000);
}

/**
 * Get the active onboarding checklist for the authenticated user.
 * Endpoint: GET /api/onboarding/my-onboarding
 */
export async function getMyOnboardingChecklist() {
  return await request('/onboarding/my-onboarding', { method: 'GET' }, 20000);
}

/**
 * Update a task in an onboarding checklist.
 * Endpoint: PATCH /api/onboarding/:checklistId/tasks/:taskId
 */
export async function updateMyOnboardingTask(checklistId, taskId, updates) {
  return await request(`/onboarding/${encodeURIComponent(checklistId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  }, 20000);
}

/**
 * List documents uploaded by the authenticated employee.
 * Endpoint: GET /api/employee-documents/me
 */
export async function getMyDocuments() {
  return await request('/employee-documents/me', { method: 'GET' }, 20000);
}

/**
 * Upload a document for the authenticated employee.
 * Endpoint: POST /api/employee-documents/upload
 */
export async function uploadMyDocument(file, category) {
  const body = new FormData();
  body.append('category', category);
  body.append('file', file);
  return await request('/employee-documents/upload', { method: 'POST', body }, 20000);
}

/**
 * Delete a document uploaded by the authenticated employee.
 * Endpoint: DELETE /api/employee-documents/:id
 */
export async function deleteMyDocument(documentId) {
  return await request(`/employee-documents/${encodeURIComponent(documentId)}`, { method: 'DELETE' }, 20000);
}

/**
 * Download a document file visible to the authenticated user.
 * Endpoint: GET /api/documents/:id/file
 */
export async function getMyDocumentFile(documentId) {
  return await request(`/documents/${encodeURIComponent(documentId)}/file`, {
    method: 'GET',
    responseType: 'blob'
  }, 20000);
}

/**
 * Attendance APIs
 * Swagger: https://peoplepulse-backend.vercel.app/api-docs/#/
 */
export async function getMyAttendance({ from, to, limit = 30 } = {}) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  return await request(`/attendance/me?${query.toString()}`, { method: 'GET' }, 20000);
}

/**
 * Record the authenticated employee's clock-in for today.
 * Endpoint: POST /api/attendance/clock-in
 */
export async function clockIn() {
  return await request('/attendance/clock-in', {
    method: 'POST',
    body: JSON.stringify({})
  }, 20000);
}

/**
 * Record the authenticated employee's clock-out for today.
 * Endpoint: POST /api/attendance/clock-out
 */
export async function clockOut() {
  return await request('/attendance/clock-out', {
    method: 'POST',
    body: JSON.stringify({})
  }, 20000);
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated() {
  const token = localStorage.getItem('peoplepulse_token');
  return Boolean(token);
}

/**
 * Get stored user profile from localStorage
 */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem('peoplepulse_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Logout and clear session
 */
export function logoutUser() {
  localStorage.removeItem('peoplepulse_token');
  localStorage.removeItem('peoplepulse_user');
}

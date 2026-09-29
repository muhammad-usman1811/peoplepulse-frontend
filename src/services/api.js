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
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
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
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timer);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
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
 * Attendance APIs
 * Swagger: https://peoplepulse-backend.vercel.app/api-docs/#/
 */
export async function getMyAttendance() {
  return await request('/attendance/me', { method: 'GET' });
}

export async function clockIn() {
  return await request('/attendance/clock-in', {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function clockOut() {
  return await request('/attendance/clock-out', {
    method: 'POST',
    body: JSON.stringify({})
  });
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


import { apiRequest } from './api';
import { daysBetween } from '../utils/dates';

export const ENDPOINTS = {
    leaveRequests: '/leave-requests/my',
    createLeaveRequest: '/leave-requests',
    wfhRequests: '/wfh-requests/my',
    createWfhRequest: '/wfh-requests',
};

export const LEAVE_TYPES = [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'casual', label: 'Casual Leave' },
];

export const DURATIONS = [
    { value: 'full_day', label: 'Full Day' },
    { value: 'half_day', label: 'Half Day' },
];

async function request(path, { method = 'GET', body } = {}) {
    const result = await apiRequest(path, {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!result.success) {
        // These endpoints are not in the backend Swagger yet; say so instead of showing "Route ... not found".
        if (result.status === 404) throw new Error('This service is not available on the server yet.');
        throw new Error(result.error || 'The request could not be completed.');
    }
    return result.data;
}

const pick = (obj, keys) => {
    for (const key of keys) if (obj?.[key] != null) return obj[key];
    return undefined;
};

const unwrap = (data) => data?.data ?? data ?? {};

function unwrapList(data) {
    const value = data?.data ?? data;
    if (Array.isArray(value)) return value;
    return value?.items ?? value?.results ?? value?.requests ?? [];
}

export function normalizeStatus(value) {
    const status = String(value ?? 'pending').toLowerCase();
    if (status.startsWith('approv')) return 'Approved';
    if (status.startsWith('reject') || status === 'denied' || status === 'declined') return 'Rejected';
    if (status.startsWith('cancel')) return 'Cancelled';
    return 'Pending';
}

function leaveTypeLabel(value) {
    const raw = value && typeof value === 'object' ? value.name ?? value.label : value;
    const found = LEAVE_TYPES.find((type) => type.value === String(raw ?? '').toLowerCase());
    return found ? found.label : String(raw ?? '—');
}

export function normalizeLeave(record) {
    const from = pick(record, ['fromDate', 'startDate', 'from', 'start_date']);
    const to = pick(record, ['toDate', 'endDate', 'to', 'end_date']) ?? from;
    const halfDay = String(pick(record, ['duration']) ?? '').startsWith('half');
    return {
        id: pick(record, ['id', '_id', 'requestId']) ?? `${from}-${to}-${Math.random()}`,
        type: leaveTypeLabel(pick(record, ['leaveType', 'type', 'leave_type'])),
        from,
        to,
        days: pick(record, ['days', 'totalDays', 'numberOfDays']) ?? (halfDay ? 0.5 : daysBetween(from, to)),
        status: normalizeStatus(record.status),
    };
}

export function normalizeWfh(record) {
    return {
        id: pick(record, ['id', '_id', 'requestId']) ?? `${record.date}-${Math.random()}`,
        date: pick(record, ['date', 'workDate', 'startDate', 'wfhDate']),
        status: normalizeStatus(record.status),
    };
}

export async function getLeaveRequests() {
    return unwrapList(await request(ENDPOINTS.leaveRequests)).map(normalizeLeave);
}

export async function applyLeave({ leaveType, fromDate, toDate, reason }) {
    const payload = { type: leaveType, startDate: fromDate, endDate: toDate, reason };
    const data = await request(ENDPOINTS.createLeaveRequest, { method: 'POST', body: payload });
    return normalizeLeave({ ...payload, status: 'pending', ...unwrap(data) });
}

export async function getWfhRequests() {
    return unwrapList(await request(ENDPOINTS.wfhRequests)).map(normalizeWfh);
}

export async function applyWfh({ date, reason }) {
    const payload = { startDate: date, endDate: date, reason };
    const data = await request(ENDPOINTS.createWfhRequest, { method: 'POST', body: payload });
    return normalizeWfh({ ...payload, date, status: 'pending', ...unwrap(data) });
}
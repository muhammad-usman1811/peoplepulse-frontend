const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (value) => String(value).padStart(2, '0');

export function toKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const todayKey = () => toKey(new Date());

export function parseKey(key) {
    const [year, month, day] = String(key ?? '').slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
}

export function formatShort(key) {
    const date = parseKey(key);
    return date ? `${MONTHS[date.getMonth()]} ${date.getDate()}` : '—';
}

export function formatLong(key) {
    const date = parseKey(key);
    return date ? `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}` : '—';
}

export function formatRange(from, to) {
    const start = String(from ?? '').slice(0, 10);
    const end = String(to ?? '').slice(0, 10);
    if (!end || start === end) return formatShort(start);
    return `${formatShort(start)} – ${formatShort(end)}`;
}

export function daysBetween(from, to) {
    const start = parseKey(from);
    const end = parseKey(to ?? from);
    if (!start || !end) return null;
    return Math.round((end - start) / 86400000) + 1;
}

export function addDays(date, amount) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + amount);
    return copy;
}

export function startOfWeek(date) {
    return addDays(date, -((date.getDay() + 6) % 7));
}
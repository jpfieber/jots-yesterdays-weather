/**
 * Debounce function to limit the rate at which a function can fire.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to wait before invoking the function.
 * @returns {Function} - A debounced version of the function.
 */
export function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        const later = () => {
            clearTimeout(timeout);
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Replace placeholders in a string with corresponding values.
 * @param {string} str - The string containing placeholders.
 * @param {Object} placeholders - An object mapping placeholders to their values.
 * @returns {string} - The string with placeholders replaced.
 */
export function replacePlaceholders(str, placeholders) {
    return str.replace(/YYYY|YY|MMMM|MMM|MM|M|DDDD|DDD|DD|D/g, (match) => placeholders[match] || match);
}

/**
 * Format a date into an ISO 8601 string with timezone offset.
 * @param {Date} date - The date to format.
 * @returns {string} - The formatted date string.
 */
export function formatDate(date) {
    const pad = (num) => String(num).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const offsetHours = pad(Math.floor(absOffset / 60));
    const offsetMinutes = pad(absOffset % 60);
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMinutes}`;
}
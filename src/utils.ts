type DebouncedFunction<T extends (...args: any[]) => any> = (...args: Parameters<T>) => void;

/**
 * Debounce function to limit the rate at which a function can fire.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to wait before invoking the function.
 * @returns {Function} - A debounced version of the function.
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): DebouncedFunction<T> {
    let timeout: NodeJS.Timeout | null;
    return function (this: any, ...args: Parameters<T>) {
        const context = this;
        const later = () => {
            timeout = null;
            func.apply(context, args);
        };
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

type DatePlaceholders = {
    [key in 'YYYY' | 'YY' | 'MMMM' | 'MMM' | 'MM' | 'M' | 'DDDD' | 'DDD' | 'DD' | 'D']: string | number;
};

/**
 * Replace placeholders in a string with corresponding values.
 * @param {string} str - The string containing placeholders.
 * @param {DatePlaceholders} placeholders - An object mapping placeholders to their values.
 * @returns {string} - The string with placeholders replaced.
 */
export function replacePlaceholders(str: string, placeholders: DatePlaceholders): string {
    return str.replace(/YYYY|YY|MMMM|MMM|MM|M|DDDD|DDD|DD|D/g, (match) =>
        String(placeholders[match as keyof DatePlaceholders] || match)
    );
}

/**
 * Format a date into an ISO 8601 string with timezone offset.
 * @param {Date} date - The date to format.
 * @returns {string} - The formatted date string.
 */
export function formatDate(date: Date): string {
    const pad = (num: number): string => String(num).padStart(2, '0');
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

/**
 * Validate time string format (HH:MM).
 * @param {string} time - The time string to validate.
 * @returns {boolean} - Whether the time string is valid.
 */
export function isValidTimeFormat(time: string): boolean {
    if (!time) return true; // Empty string is valid (disables scheduling)
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(time);
}
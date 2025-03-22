/**
 * Format a number with thousands separators
 * @param {number} num - The number to format
 * @returns {string} Formatted number with commas as thousand separators
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Convert Rials to Tomans (divide by 10)
 * @param {number} rials - Amount in Rials
 * @returns {number} Amount in Tomans
 */
export function rialToToman(rials) {
  return rials / 10;
}

/**
 * Format a date timestamp to a human-readable format
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
} 
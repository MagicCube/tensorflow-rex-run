/**
 * Return the current timestamp.
 * @return {number}
 */
export function getTimeStamp() {
  return performance.now();
}

/**
 * Get random number.
 * @param {number} min
 * @param {number} max
 * @param {number}
 */
export function getRandomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

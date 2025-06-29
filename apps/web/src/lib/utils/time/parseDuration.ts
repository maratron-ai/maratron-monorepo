export function parseDuration(duration: string): number {
  if (!duration || typeof duration !== 'string') {
    return 0;
  }
  
  const parts = duration.split(":").map(Number);
  
  // Validate that all parts are valid numbers and non-negative
  if (parts.some(part => isNaN(part) || part < 0)) {
    return 0;
  }
  
  if (parts.length === 3) {
    const [h, m, s] = parts;
    // Additional validation for time ranges
    if (m >= 60 || s >= 60) {
      return 0;
    }
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    // Additional validation for time ranges
    if (s >= 60) {
      return 0;
    }
    return m * 60 + s;
  }
  if (parts.length === 1) {
    // Handle single number as seconds
    const [s] = parts;
    return s;
  }
  return 0;
}

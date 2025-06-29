import bcrypt from 'bcryptjs';

/**
 * Number of salt rounds for bcrypt hashing
 * 12 rounds provides strong security as of 2024
 * Each additional round doubles the computation time
 */
const SALT_ROUNDS = 12;

/**
 * Hashes a password using bcrypt with a secure salt
 * @param password - The plain text password to hash
 * @returns Promise<string> - The hashed password
 * @throws Error if password is empty or undefined
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.trim() === '') {
    throw new Error('Password cannot be empty');
  }

  try {
    // Generate salt and hash password in one step
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verifies a password against a bcrypt hash
 * @param password - The plain text password to verify
 * @param hash - The bcrypt hash to compare against
 * @returns Promise<boolean> - True if password matches hash, false otherwise
 * @throws Error if password or hash is empty
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || password.trim() === '') {
    throw new Error('Password cannot be empty');
  }

  if (!hash || hash.trim() === '') {
    throw new Error('Hash cannot be empty');
  }

  try {
    // Use bcrypt's secure comparison
    const isValid = await bcrypt.compare(password, hash);
    return isValid;
  } catch {
    // If comparison fails (e.g., invalid hash format), return false
    // Don't throw error to avoid information leakage
    return false;
  }
}

/**
 * Generates a cryptographically secure random password
 * Includes uppercase, lowercase, numbers, and special characters
 * @param length - Length of password to generate (minimum 8, default 12)
 * @returns string - The generated secure password
 * @throws Error if length is less than 8
 */
export function generateSecurePassword(length: number = 12): string {
  if (length < 8) {
    throw new Error('Password length must be at least 8');
  }

  // Character sets for password generation
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*';
  
  // Ensure at least one character from each set
  const requiredChars = [
    lowercase[Math.floor(Math.random() * lowercase.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    specialChars[Math.floor(Math.random() * specialChars.length)]
  ];

  // Fill remaining length with random characters from all sets
  const allChars = lowercase + uppercase + numbers + specialChars;
  const remainingChars = [];
  
  for (let i = 4; i < length; i++) {
    remainingChars.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Combine required and remaining characters, then shuffle
  const passwordArray = [...requiredChars, ...remainingChars];
  
  // Fisher-Yates shuffle algorithm
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
}

/**
 * Password security configuration
 */
export const PASSWORD_CONFIG = {
  SALT_ROUNDS,
  MIN_LENGTH: 8,
  RECOMMENDED_LENGTH: 12
} as const;
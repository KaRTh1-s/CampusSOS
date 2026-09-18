import crypto from 'node:crypto';

/**
 * Generates a collision-resistant, human-readable report tracking ID
 * adhering to the project format: CS-2026-XXXX
 *
 * Example: CS-2026-7F4A, CS-2026-B81E
 */
export function generateReportId(): string {
  const hexSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `CS-2026-${hexSuffix}`;
}

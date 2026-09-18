import { ValidationResult } from '../types/index';

export const MIN_DESCRIPTION_LENGTH = 10;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_LOCATION_LENGTH = 200;

export function validateDescription(description: string): ValidationResult {
  const trimmed = description.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Please describe what happened before requesting analysis.',
    };
  }

  if (trimmed.length < MIN_DESCRIPTION_LENGTH) {
    return {
      isValid: false,
      error: `Description is too short. Please provide at least ${MIN_DESCRIPTION_LENGTH} characters so the system can understand the issue.`,
    };
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      isValid: false,
      error: `Description exceeds the maximum limit of ${MAX_DESCRIPTION_LENGTH} characters (${description.length}/${MAX_DESCRIPTION_LENGTH}).`,
    };
  }

  return { isValid: true };
}

export function validateLocation(location?: string): ValidationResult {
  if (!location) {
    return { isValid: true };
  }

  if (location.length > MAX_LOCATION_LENGTH) {
    return {
      isValid: false,
      error: `Location is too long. Please keep it under ${MAX_LOCATION_LENGTH} characters.`,
    };
  }

  return { isValid: true };
}

import {
  AnalyzeRequestInput,
  CreateReportInput,
  Priority,
  ReportStatus,
  UpdateReportStatusInput,
} from '../types/index.js';

export const ALLOWED_PRIORITIES: readonly Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const ALLOWED_STATUSES: readonly ReportStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const;

export interface ValidationResult<T> {
  isValid: boolean;
  error?: string;
  data?: T;
}

/**
 * Safely parses stringified JSON body from API Gateway event
 */
export function parseRequestBody(raw: string | null | undefined): {
  success: boolean;
  data?: unknown;
  error?: string;
} {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return { success: false, error: 'Request body cannot be empty.' };
  }

  try {
    const parsed = JSON.parse(raw);
    return { success: true, data: parsed };
  } catch {
    return { success: false, error: 'Malformed JSON payload.' };
  }
}

export interface MultipartField {
  name: string;
  value: string;
}

export interface MultipartFile {
  name: string;
  filename: string;
  contentType: string;
  data: Buffer;
  size: number;
}

export interface ParsedMultipart {
  fields: Record<string, string>;
  file: MultipartFile | null;
}

/**
 * Lightweight multipart/form-data parser for Node.js native HTTP.
 * Handles a single file field alongside text fields.
 * Does NOT use third-party libraries.
 */
export function parseMultipartBody(body: Buffer, boundary: string): ParsedMultipart | null {
  try {
    const delimiter = Buffer.from(`--${boundary}`);
    const fields: Record<string, string> = {};
    let file: MultipartFile | null = null;

    // Split on boundary
    const parts: Buffer[] = [];
    let start = 0;
    let searchStart = 0;
    while (searchStart < body.length) {
      const idx = body.indexOf(delimiter, searchStart);
      if (idx === -1) break;
      if (start > 0) {
        // Extract part between previous boundary end and this boundary
        const part = body.slice(start, idx - 2); // strip trailing CRLF
        if (part.length > 0) parts.push(part);
      }
      start = idx + delimiter.length + 2; // skip boundary + CRLF
      searchStart = idx + delimiter.length;
    }

    for (const part of parts) {
      // Find header/body separator (double CRLF)
      const separatorIdx = part.indexOf(Buffer.from('\r\n\r\n'));
      if (separatorIdx === -1) continue;

      const headerSection = part.slice(0, separatorIdx).toString('utf-8');
      const partBody = part.slice(separatorIdx + 4);

      const dispositionMatch = headerSection.match(/Content-Disposition:[^\r\n]*name="([^"]+)"/i);
      if (!dispositionMatch) continue;
      const fieldName = dispositionMatch[1];

      const filenameMatch = headerSection.match(/filename="([^"]+)"/i);
      const contentTypeMatch = headerSection.match(/Content-Type:\s*([^\r\n]+)/i);

      if (filenameMatch && contentTypeMatch) {
        // This is a file field
        file = {
          name: fieldName,
          filename: filenameMatch[1],
          contentType: contentTypeMatch[1].trim(),
          data: partBody,
          size: partBody.length,
        };
      } else {
        // Regular text field
        fields[fieldName] = partBody.toString('utf-8');
      }
    }

    return { fields, file };
  } catch {
    return null;
  }
}

/**
 * Validates POST /analyze request input
 */
export function validateAnalyzeInput(data: unknown): ValidationResult<AnalyzeRequestInput> {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Request body must be a valid JSON object.' };
  }

  const record = data as Record<string, unknown>;

  if (typeof record.description !== 'string') {
    return { isValid: false, error: 'Field "description" is required and must be a string.' };
  }

  const trimmedDesc = record.description.trim();
  if (trimmedDesc.length < 10) {
    return {
      isValid: false,
      error: 'Description must contain at least 10 characters.',
    };
  }

  if (record.description.length > 2000) {
    return {
      isValid: false,
      error: 'Description cannot exceed 2000 characters.',
    };
  }

  let location: string | undefined;
  if (record.location !== undefined && record.location !== null) {
    if (typeof record.location !== 'string') {
      return { isValid: false, error: 'Field "location" must be a string if provided.' };
    }
    const trimmedLoc = record.location.trim();
    if (trimmedLoc.length > 200) {
      return { isValid: false, error: 'Location cannot exceed 200 characters.' };
    }
    location = trimmedLoc || undefined;
  }

  return {
    isValid: true,
    data: {
      description: trimmedDesc,
      location,
    },
  };
}

/**
 * Validates POST /reports request input
 */
export function validateCreateReportInput(data: unknown): ValidationResult<CreateReportInput> {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Request body must be a valid JSON object.' };
  }

  const record = data as Record<string, unknown>;

  // Description validation
  if (typeof record.description !== 'string') {
    return { isValid: false, error: 'Field "description" is required and must be a string.' };
  }
  const trimmedDesc = record.description.trim();
  if (trimmedDesc.length < 10 || record.description.length > 2000) {
    return { isValid: false, error: 'Description must be between 10 and 2000 characters.' };
  }

  // Location validation
  let location: string | undefined;
  if (record.location !== undefined && record.location !== null) {
    if (typeof record.location !== 'string') {
      return { isValid: false, error: 'Field "location" must be a string if provided.' };
    }
    if (record.location.trim().length > 200) {
      return { isValid: false, error: 'Location cannot exceed 200 characters.' };
    }
    location = record.location.trim() || undefined;
  }

  // Category
  if (typeof record.category !== 'string' || !record.category.trim()) {
    return { isValid: false, error: 'Field "category" is required and cannot be empty.' };
  }

  // Priority
  if (typeof record.priority !== 'string' || !ALLOWED_PRIORITIES.includes(record.priority as Priority)) {
    return {
      isValid: false,
      error: `Field "priority" must be one of: ${ALLOWED_PRIORITIES.join(', ')}.`,
    };
  }

  // Summary
  if (typeof record.summary !== 'string' || !record.summary.trim()) {
    return { isValid: false, error: 'Field "summary" is required and cannot be empty.' };
  }

  // Recommended Action
  if (typeof record.recommendedAction !== 'string' || !record.recommendedAction.trim()) {
    return { isValid: false, error: 'Field "recommendedAction" is required and cannot be empty.' };
  }

  // Department
  if (typeof record.department !== 'string' || !record.department.trim()) {
    return { isValid: false, error: 'Field "department" is required and cannot be empty.' };
  }

  return {
    isValid: true,
    data: {
      description: trimmedDesc,
      location,
      category: record.category.trim(),
      priority: record.priority as Priority,
      summary: record.summary.trim(),
      recommendedAction: record.recommendedAction.trim(),
      department: record.department.trim(),
    },
  };
}

/**
 * Validates PATCH /reports/{id}/status request input
 */
export function validateUpdateStatusInput(data: unknown): ValidationResult<UpdateReportStatusInput> {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Request body must be a valid JSON object.' };
  }

  const record = data as Record<string, unknown>;

  if (typeof record.status !== 'string' || !ALLOWED_STATUSES.includes(record.status as ReportStatus)) {
    return {
      isValid: false,
      error: `Field "status" must be one of: ${ALLOWED_STATUSES.join(', ')}.`,
    };
  }

  return {
    isValid: true,
    data: {
      status: record.status as ReportStatus,
    },
  };
}

/**
 * Validates lifecycle status transitions
 */
export function validateStatusTransition(
  currentStatus: ReportStatus,
  requestedStatus: ReportStatus
): { isAllowed: boolean; error?: string } {
  // Allow idempotent updates
  if (currentStatus === requestedStatus) {
    return { isAllowed: true };
  }

  // Valid forward progressions
  if (currentStatus === 'OPEN' && requestedStatus === 'IN_PROGRESS') {
    return { isAllowed: true };
  }

  if (currentStatus === 'IN_PROGRESS' && requestedStatus === 'RESOLVED') {
    return { isAllowed: true };
  }

  // Disallow invalid backwards or skip transitions
  return {
    isAllowed: false,
    error: `Invalid status transition from "${currentStatus}" to "${requestedStatus}".`,
  };
}

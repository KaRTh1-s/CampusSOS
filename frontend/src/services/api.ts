/**
 * CAMPUSSOS HTTP API CLIENT
 * =========================
 * Production-ready HTTP abstraction connecting the React frontend to the
 * CampusSOS backend service (local in Part 4, AWS API Gateway in Phase 10).
 */

import { AnalysisResult, IssueInput, Report } from '../types/index.js';

// Base URL configurable via Vite environment variable, fallback to local backend port 3001
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/+$/, '');

const REQUEST_TIMEOUT_MS = 10000;

interface BackendCreateReportResponse {
  reportId: string;
  status: 'OPEN';
  createdAt: string;
  updatedAt: string;
}

interface BackendErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

/**
 * Reusable HTTP request helper with AbortController timeout,
 * strict header injection, and friendly error parsing.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });

    // Parse JSON body safely
    let data: any = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const errorPayload = data as BackendErrorResponse | null;
      const backendMessage = errorPayload?.error?.message;
      const message =
        backendMessage || `Server responded with status ${response.status} (${response.statusText || 'Error'}).`;
      throw new Error(message);
    }

    return data as T;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The server took too long to respond. Please try again.');
    }

    // Network error (e.g. server down / connection refused)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        'Unable to communicate with the CampusSOS backend service. Please check your network connection or verify that the server is running.'
      );
    }

    // Rethrow known application errors
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sends student natural language issue description to backend for AI assessment.
 * Calls POST /analyze
 */
export async function analyzeIssue(input: IssueInput): Promise<AnalysisResult> {
  const payload = {
    description: input.description.trim(),
    location: input.location?.trim() || undefined,
  };

  return request<AnalysisResult>('/analyze', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Creates and records a new incident report on the backend.
 * Calls POST /reports
 * The backend is authoritative for generating report ID and setting initial status.
 */
export async function createReport(
  payload: Omit<Report, 'reportId' | 'status' | 'createdAt'>
): Promise<Report> {
  const response = await request<BackendCreateReportResponse>('/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    ...payload,
    reportId: response.reportId,
    status: response.status,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}

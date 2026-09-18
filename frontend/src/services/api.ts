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
 * If evidenceFile is provided, sends as multipart/form-data so the backend can upload to S3.
 * The backend is authoritative for generating report ID and setting initial status.
 */
export async function createReport(
  payload: Omit<Report, 'reportId' | 'status' | 'createdAt' | 'evidence'>,
  evidenceFile?: File
): Promise<Report> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const url = `${API_BASE_URL}/reports`;

  try {
    let fetchOptions: RequestInit;

    if (evidenceFile) {
      // Use multipart/form-data to include the evidence binary
      const form = new FormData();
      form.append('description', payload.description);
      if (payload.location) form.append('location', payload.location);
      form.append('category', payload.category);
      form.append('priority', payload.priority);
      form.append('summary', payload.summary);
      form.append('recommendedAction', payload.recommendedAction);
      form.append('department', payload.department);
      form.append('evidence', evidenceFile, evidenceFile.name);

      fetchOptions = {
        method: 'POST',
        signal: controller.signal,
        // Do NOT set Content-Type — browser sets it automatically with correct boundary
        body: form,
      };
    } else {
      fetchOptions = {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      };
    }

    const response = await fetch(url, fetchOptions);

    let data: any = null;
    const text = await response.text();
    if (text) {
      try { data = JSON.parse(text); } catch { data = null; }
    }

    if (!response.ok) {
      const backendMessage = (data as any)?.error?.message;
      throw new Error(backendMessage || `Server responded with status ${response.status}.`);
    }

    const backendResp = data as BackendCreateReportResponse & { evidence?: Report['evidence'] };
    return {
      ...payload,
      reportId: backendResp.reportId,
      status: backendResp.status,
      createdAt: backendResp.createdAt,
      updatedAt: backendResp.updatedAt,
      evidence: backendResp.evidence,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The server took too long to respond. Please try again.');
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to communicate with the CampusSOS backend service. Please check your network connection or verify that the server is running.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Retrieves a paginated/filtered list of reports from the backend.
 * Calls GET /reports
 */
export async function getReports(params?: { status?: string; priority?: string; category?: string }): Promise<{ reports: Report[]; count: number }> {
  let queryStr = '';
  if (params) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.append('status', params.status);
    if (params.priority) searchParams.append('priority', params.priority);
    if (params.category) searchParams.append('category', params.category);
    queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
  }

  return request<{ reports: Report[]; count: number }>(`/reports${queryStr}`, {
    method: 'GET',
  });
}

/**
 * Retrieves a single report by ID.
 * Calls GET /reports/{id}
 */
export async function getReport(id: string): Promise<Report> {
  return request<Report>(`/reports/${id}`, {
    method: 'GET',
  });
}

/**
 * Updates the status of an existing report.
 * Calls PATCH /reports/{id}/status
 */
export async function updateReportStatus(id: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'): Promise<{ reportId: string; status: string; updatedAt: string }> {
  return request<{ reportId: string; status: string; updatedAt: string }>(`/reports/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/**
 * Requests a short-lived presigned S3 URL for viewing evidence attached to a report.
 * Calls GET /reports/{id}/evidence
 * The presigned URL expires in 5 minutes and is never stored.
 */
export async function getEvidenceUrl(id: string): Promise<{ presignedUrl: string; expiresIn: number; contentType: string }> {
  return request<{ presignedUrl: string; expiresIn: number; contentType: string }>(`/reports/${id}/evidence`, {
    method: 'GET',
  });
}

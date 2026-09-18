/**
 * CAMPUSSOS API CLIENT ABSTRACTION
 * ================================
 * This module abstracts all network interactions.
 * During Part 2, it routes calls to the local mock services and localStorage.
 * In Phase 4-6, this will be swapped to fetch() calls against Amazon API Gateway.
 */

import { AnalysisResult, IssueInput, Report } from '../types';
import { analyzeIssueMock } from './mockAnalysisService';
import { saveReportToStorage } from '../utils/storage';

/**
 * Generates a mock collision-resistant client-side report ID
 * Example format: CS-2026-4821
 */
function generateReportId(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `CS-2026-${randomDigits}`;
}

/**
 * Analyzes an issue description using AI triage (mocked in Part 2).
 */
export async function analyzeIssue(input: IssueInput): Promise<AnalysisResult> {
  // In Phase 6, replace with:
  // const res = await fetch(`${API_BASE_URL}/analyze`, { method: 'POST', body: JSON.stringify(input) });
  // return res.json();
  return analyzeIssueMock(input.description, input.location);
}

/**
 * Creates and records a new incident report.
 */
export async function createReport(
  payload: Omit<Report, 'reportId' | 'status' | 'createdAt'>
): Promise<Report> {
  // Short simulated network delay
  await new Promise((resolve) => setTimeout(resolve, 400));

  const newReport: Report = {
    ...payload,
    reportId: generateReportId(),
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };

  // Persist locally for demo
  saveReportToStorage(newReport);

  return newReport;
}

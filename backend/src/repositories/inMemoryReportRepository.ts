/**
 * IN-MEMORY REPORT REPOSITORY
 * ===========================
 * NOTICE: This in-memory repository is for local development and unit testing only.
 * AWS Lambda invocations are stateless; production persistence will use Amazon DynamoDB
 * in Phase 5. Do not rely on this repository for production data persistence.
 */

import { Report, ReportFilters, ReportStatus } from '../types/index.js';
import { ReportRepository } from './reportRepository.js';

export class InMemoryReportRepository implements ReportRepository {
  private reports: Map<string, Report> = new Map();

  async create(report: Report): Promise<Report> {
    // Clone to prevent external mutation
    const cloned = { ...report };
    this.reports.set(cloned.reportId, cloned);
    return { ...cloned };
  }

  async getById(reportId: string): Promise<Report | null> {
    const report = this.reports.get(reportId);
    if (!report) return null;
    return { ...report };
  }

  async list(filters?: ReportFilters): Promise<Report[]> {
    let result = Array.from(this.reports.values());

    if (filters?.status) {
      result = result.filter((r) => r.status === filters.status);
    }

    if (filters?.priority) {
      result = result.filter((r) => r.priority === filters.priority);
    }

    // Sort newest first (descending createdAt)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filters?.limit && filters.limit > 0) {
      result = result.slice(0, filters.limit);
    }

    return result.map((r) => ({ ...r }));
  }

  async updateStatus(
    reportId: string,
    status: ReportStatus,
    updatedAt: string
  ): Promise<Report | null> {
    const existing = this.reports.get(reportId);
    if (!existing) return null;

    const updated: Report = {
      ...existing,
      status,
      updatedAt,
    };

    this.reports.set(reportId, updated);
    return { ...updated };
  }

  /**
   * Clears repository contents (primarily for test suite resets)
   */
  clear(): void {
    this.reports.clear();
  }
}

// Singleton default instance for local testing
export const defaultReportRepository = new InMemoryReportRepository();

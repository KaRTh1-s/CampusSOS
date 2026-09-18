import { Report, ReportFilters, ReportStatus } from '../types/index.js';

/**
 * Interface defining the persistence operations for CampusSOS reports.
 * In Phase 5, a DynamoDBReportRepository implementing this interface
 * will replace the InMemoryReportRepository.
 */
export interface ReportRepository {
  create(report: Report): Promise<Report>;
  getById(reportId: string): Promise<Report | null>;
  list(filters?: ReportFilters): Promise<Report[]>;
  updateStatus(reportId: string, status: ReportStatus, updatedAt: string): Promise<Report | null>;
}

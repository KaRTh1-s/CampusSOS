import { CreateReportInput, Report, ReportFilters, ReportStatus } from '../types/index.js';
import { ReportRepository } from '../repositories/reportRepository.js';
import { defaultReportRepository } from '../repositories/inMemoryReportRepository.js';
import { DynamoDbReportRepository } from '../repositories/dynamoDbReportRepository.js';
import { generateReportId } from '../utils/reportId.js';
import { validateStatusTransition } from '../utils/validation.js';

export class ReportService {
  constructor(private readonly repository: ReportRepository) {}

  /**
   * Creates and persists a new incident report
   */
  async createReport(input: CreateReportInput): Promise<Report> {
    const now = new Date().toISOString();
    const report: Report = {
      reportId: generateReportId(),
      description: input.description,
      location: input.location,
      category: input.category,
      priority: input.priority,
      summary: input.summary,
      recommendedAction: input.recommendedAction,
      department: input.department,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.create(report);
  }

  /**
   * Retrieves a report by its unique identifier
   */
  async getReportById(reportId: string): Promise<Report | null> {
    return this.repository.getById(reportId);
  }

  /**
   * Lists reports with optional status and priority filtering
   */
  async listReports(filters?: ReportFilters): Promise<{ reports: Report[]; count: number }> {
    const reports = await this.repository.list(filters);
    return {
      reports,
      count: reports.length,
    };
  }

  /**
   * Transitions report lifecycle status with validation
   */
  async updateReportStatus(
    reportId: string,
    nextStatus: ReportStatus
  ): Promise<
    | { success: true; report: Report }
    | { success: false; code: 'NOT_FOUND' | 'BAD_REQUEST'; message: string }
  > {
    const existing = await this.repository.getById(reportId);
    if (!existing) {
      return {
        success: false,
        code: 'NOT_FOUND',
        message: `Report with ID "${reportId}" was not found.`,
      };
    }

    const transitionCheck = validateStatusTransition(existing.status, nextStatus);
    if (!transitionCheck.isAllowed) {
      return {
        success: false,
        code: 'BAD_REQUEST',
        message: transitionCheck.error || `Invalid status transition to "${nextStatus}".`,
      };
    }

    const now = new Date().toISOString();
    const updated = await this.repository.updateStatus(reportId, nextStatus, now);

    if (!updated) {
      return {
        success: false,
        code: 'NOT_FOUND',
        message: `Report with ID "${reportId}" could not be updated.`,
      };
    }

    return { success: true, report: updated };
  }
}

// Select persistence mode based on environment variables
const persistenceMode = process.env.PERSISTENCE_MODE || 'in-memory';
let activeRepository: ReportRepository;

if (persistenceMode === 'dynamodb') {
  activeRepository = new DynamoDbReportRepository();
} else {
  activeRepository = defaultReportRepository;
}

// Singleton default instance
export const defaultReportService = new ReportService(activeRepository);

import type { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { ReportService, defaultReportService } from '../services/reportService.js';
import { Priority, ReportFilters, ReportStatus } from '../types/index.js';
import { errorResponse, successResponse } from '../utils/response.js';
import { ALLOWED_PRIORITIES, ALLOWED_STATUSES } from '../utils/validation.js';

export function createListReportsHandler(
  reportService: ReportService = defaultReportService
): APIGatewayProxyHandler {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Support HTTP OPTIONS preflight
    if (event.httpMethod === 'OPTIONS') {
      return successResponse(200, { message: 'OK' });
    }

    try {
      const query = event.queryStringParameters || {};
      const filters: ReportFilters = {};

      if (query.status) {
        const upperStatus = query.status.toUpperCase() as ReportStatus;
        if (!ALLOWED_STATUSES.includes(upperStatus)) {
          return errorResponse(
            400,
            'BAD_REQUEST',
            `Invalid status filter. Allowed values: ${ALLOWED_STATUSES.join(', ')}.`
          );
        }
        filters.status = upperStatus;
      }

      if (query.priority) {
        const upperPriority = query.priority.toUpperCase() as Priority;
        if (!ALLOWED_PRIORITIES.includes(upperPriority)) {
          return errorResponse(
            400,
            'BAD_REQUEST',
            `Invalid priority filter. Allowed values: ${ALLOWED_PRIORITIES.join(', ')}.`
          );
        }
        filters.priority = upperPriority;
      }

      if (query.limit) {
        const parsedLimit = parseInt(query.limit, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          filters.limit = Math.min(parsedLimit, 100);
        }
      }

      const result = await reportService.listReports(filters);

      return successResponse(200, {
        reports: result.reports,
        count: result.count,
      });
    } catch (error) {
      console.error('Unhandled error in listReportsHandler:', error);
      return errorResponse(
        500,
        'INTERNAL_ERROR',
        'An unexpected internal error occurred while retrieving reports.'
      );
    }
  };
}

// Export default Lambda handler entrypoint
export const handler = createListReportsHandler();

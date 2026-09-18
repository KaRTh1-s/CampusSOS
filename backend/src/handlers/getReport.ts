import type { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { ReportService, defaultReportService } from '../services/reportService.js';
import { errorResponse, successResponse } from '../utils/response.js';

export function createGetReportHandler(
  reportService: ReportService = defaultReportService
): APIGatewayProxyHandler {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Support HTTP OPTIONS preflight
    if (event.httpMethod === 'OPTIONS') {
      return successResponse(200, { message: 'OK' });
    }

    try {
      const reportId = event.pathParameters?.id;
      if (!reportId || !reportId.trim()) {
        return errorResponse(400, 'BAD_REQUEST', 'Missing required path parameter "id".');
      }

      const report = await reportService.getReportById(reportId.trim());
      if (!report) {
        return errorResponse(
          404,
          'NOT_FOUND',
          `Report with ID "${reportId}" was not found.`
        );
      }

      return successResponse(200, report);
    } catch (error) {
      console.error('Unhandled error in getReportHandler:', error);
      return errorResponse(
        500,
        'INTERNAL_ERROR',
        'An unexpected internal error occurred while retrieving the report.'
      );
    }
  };
}

// Export default Lambda handler entrypoint
export const handler = createGetReportHandler();

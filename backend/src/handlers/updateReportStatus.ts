import type { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { ReportService, defaultReportService } from '../services/reportService.js';
import { errorResponse, successResponse } from '../utils/response.js';
import { parseRequestBody, validateUpdateStatusInput } from '../utils/validation.js';

export function createUpdateReportStatusHandler(
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

      // 1. Parse JSON body
      const parsedBody = parseRequestBody(event.body);
      if (!parsedBody.success) {
        return errorResponse(400, 'BAD_REQUEST', parsedBody.error || 'Invalid request body.');
      }

      // 2. Validate input fields
      const validation = validateUpdateStatusInput(parsedBody.data);
      if (!validation.isValid || !validation.data) {
        return errorResponse(
          400,
          'VALIDATION_ERROR',
          validation.error || 'Input validation failed.'
        );
      }

      // 3. Delegate to Report Service
      const result = await reportService.updateReportStatus(
        reportId.trim(),
        validation.data.status
      );

      if (!result.success) {
        const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
        return errorResponse(statusCode, result.code, result.message);
      }

      // 4. Return updated record summary
      return successResponse(200, {
        reportId: result.report.reportId,
        status: result.report.status,
        updatedAt: result.report.updatedAt,
      });
    } catch (error) {
      console.error('Unhandled error in updateReportStatusHandler:', error);
      return errorResponse(
        500,
        'INTERNAL_ERROR',
        'An unexpected internal error occurred while updating the report status.'
      );
    }
  };
}

// Export default Lambda handler entrypoint
export const handler = createUpdateReportStatusHandler();

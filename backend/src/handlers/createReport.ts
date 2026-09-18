import type { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { ReportService, defaultReportService } from '../services/reportService.js';
import { errorResponse, successResponse } from '../utils/response.js';
import { parseRequestBody, validateCreateReportInput } from '../utils/validation.js';

export function createCreateReportHandler(
  reportService: ReportService = defaultReportService
): APIGatewayProxyHandler {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Support HTTP OPTIONS preflight
    if (event.httpMethod === 'OPTIONS') {
      return successResponse(200, { message: 'OK' });
    }

    try {
      // 1. Parse JSON body
      const parsedBody = parseRequestBody(event.body);
      if (!parsedBody.success) {
        return errorResponse(400, 'BAD_REQUEST', parsedBody.error || 'Invalid request body.');
      }

      // 2. Validate input fields
      const validation = validateCreateReportInput(parsedBody.data);
      if (!validation.isValid || !validation.data) {
        return errorResponse(
          400,
          'VALIDATION_ERROR',
          validation.error || 'Input validation failed.'
        );
      }

      // 3. Delegate to Report Service
      const created = await reportService.createReport(validation.data);

      // 4. Return HTTP 201 Created adhering to API contract
      return successResponse(201, {
        reportId: created.reportId,
        status: created.status,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    } catch (error) {
      console.error('Unhandled error in createReportHandler:', error);
      return errorResponse(
        500,
        'INTERNAL_ERROR',
        'An unexpected internal error occurred while creating the report.'
      );
    }
  };
}

// Export default Lambda handler entrypoint
export const handler = createCreateReportHandler();

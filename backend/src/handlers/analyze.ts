import type { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { AnalysisService, defaultAnalysisService } from '../services/analysisService.js';
import { errorResponse, successResponse } from '../utils/response.js';
import { parseRequestBody, validateAnalyzeInput } from '../utils/validation.js';

export function createAnalyzeHandler(
  analysisService: AnalysisService = defaultAnalysisService
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
      const validation = validateAnalyzeInput(parsedBody.data);
      if (!validation.isValid || !validation.data) {
        return errorResponse(
          400,
          'VALIDATION_ERROR',
          validation.error || 'Input validation failed.'
        );
      }

      // 3. Delegate to Analysis Service
      const result = await analysisService.analyze(
        validation.data.description,
        validation.data.location
      );

      // 4. Return HTTP 200 with structured analysis
      return successResponse(200, result);
    } catch (error) {
      console.error('Unhandled error in analyzeHandler:', error);
      return errorResponse(
        500,
        'INTERNAL_ERROR',
        'An unexpected internal error occurred while analyzing the issue.'
      );
    }
  };
}

// Export default Lambda handler entrypoint
export const handler = createAnalyzeHandler();

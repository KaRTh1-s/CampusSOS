import type { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { AnalysisService, defaultAnalysisService } from '../services/analysisService.js';
import { BedrockAnalysisService } from '../services/bedrockAnalysisService.js';
import { errorResponse, successResponse } from '../utils/response.js';
import { parseRequestBody, validateAnalyzeInput } from '../utils/validation.js';
import { config } from '../config/environment.js';

export function createAnalyzeHandler(
  analysisService: AnalysisService
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
    } catch (error: any) {
      console.error('Unhandled error in analyzeHandler:', error);
      // For controlled bedrock errors thrown from the service:
      const message = error.message || 'An unexpected internal error occurred while analyzing the issue.';
      return errorResponse(
        500,
        'INTERNAL_ERROR',
        message
      );
    }
  };
}

// Select active analysis service based on configuration
const activeAnalysisService = config.analysisMode === 'bedrock' 
  ? new BedrockAnalysisService() 
  : defaultAnalysisService;

// Export default Lambda handler entrypoint
export const handler = createAnalyzeHandler(activeAnalysisService);

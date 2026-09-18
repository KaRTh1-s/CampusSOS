/**
 * GET /reports/{id}/evidence
 * ==========================
 * Returns a short-lived (5 minute) presigned S3 GET URL for admin evidence viewing.
 * The URL is generated on-demand and never stored in DynamoDB.
 * The S3 bucket is private — there are no permanent public URLs.
 */

import type { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { ReportService, defaultReportService } from '../services/reportService.js';
import { S3EvidenceService, defaultS3EvidenceService } from '../services/s3EvidenceService.js';
import { errorResponse, successResponse } from '../utils/response.js';

export function createGetEvidenceUrlHandler(
  reportService: ReportService = defaultReportService,
  evidenceService: S3EvidenceService = defaultS3EvidenceService
): APIGatewayProxyHandler {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod === 'OPTIONS') {
      return successResponse(200, { message: 'OK' });
    }

    try {
      const reportId = event.pathParameters?.id;
      if (!reportId || typeof reportId !== 'string' || !reportId.trim()) {
        return errorResponse(400, 'VALIDATION_ERROR', 'Report ID is required.');
      }

      const report = await reportService.getReportById(reportId.trim());
      if (!report) {
        return errorResponse(404, 'NOT_FOUND', `Report with ID "${reportId}" was not found.`);
      }

      if (!report.evidence || !report.evidence.objectKey) {
        return errorResponse(404, 'NOT_FOUND', `Report "${reportId}" does not have any evidence attached.`);
      }

      const presignedUrl = await evidenceService.getPresignedUrl(report.evidence.objectKey);

      return successResponse(200, {
        presignedUrl,
        expiresIn: 300,
        contentType: report.evidence.contentType,
        size: report.evidence.size,
        uploadedAt: report.evidence.uploadedAt,
      });
    } catch (error) {
      console.error('Unhandled error in getEvidenceUrlHandler:', error);
      return errorResponse(500, 'INTERNAL_ERROR', 'Unable to generate evidence access URL.');
    }
  };
}

export const handler = createGetEvidenceUrlHandler();

import type { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { ReportService, defaultReportService } from '../services/reportService.js';
import { S3EvidenceService, defaultS3EvidenceService } from '../services/s3EvidenceService.js';
import { errorResponse, successResponse } from '../utils/response.js';
import { parseRequestBody, validateCreateReportInput, parseMultipartBody } from '../utils/validation.js';
import { generateReportId } from '../utils/reportId.js';

export function createCreateReportHandler(
  reportService: ReportService = defaultReportService,
  evidenceService: S3EvidenceService = defaultS3EvidenceService
): APIGatewayProxyHandler {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Support HTTP OPTIONS preflight
    if (event.httpMethod === 'OPTIONS') {
      return successResponse(200, { message: 'OK' });
    }

    try {
      const contentType = event.headers?.['content-type'] || event.headers?.['Content-Type'] || '';
      const isMultipart = contentType.includes('multipart/form-data');

      let reportData: unknown;
      let evidenceBuffer: Buffer | null = null;
      let evidenceContentType: string = '';
      let evidenceFilename: string = '';
      let evidenceSize: number = 0;

      if (isMultipart) {
        // Extract boundary from Content-Type header
        const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
        if (!boundaryMatch) {
          return errorResponse(400, 'BAD_REQUEST', 'Multipart request is missing boundary parameter.');
        }
        const boundary = boundaryMatch[1];

        // Decode body (base64 when forwarded from localDevServer binary, utf-8 otherwise)
        const rawBody = event.isBase64Encoded
          ? Buffer.from(event.body || '', 'base64')
          : Buffer.from(event.body || '', 'utf-8');

        const parsed = parseMultipartBody(rawBody, boundary);
        if (!parsed) {
          return errorResponse(400, 'BAD_REQUEST', 'Failed to parse multipart form data.');
        }

        // Reconstruct report fields from form fields
        reportData = {
          description: parsed.fields['description'],
          location: parsed.fields['location'] || undefined,
          category: parsed.fields['category'],
          priority: parsed.fields['priority'],
          summary: parsed.fields['summary'],
          recommendedAction: parsed.fields['recommendedAction'],
          department: parsed.fields['department'],
        };

        // Capture evidence file if present
        if (parsed.file && parsed.file.size > 0) {
          evidenceBuffer = parsed.file.data;
          evidenceContentType = parsed.file.contentType;
          evidenceFilename = parsed.file.filename;
          evidenceSize = parsed.file.size;
        }
      } else {
        // Standard JSON body
        const parsedBody = parseRequestBody(event.body);
        if (!parsedBody.success) {
          return errorResponse(400, 'BAD_REQUEST', parsedBody.error || 'Invalid request body.');
        }
        reportData = parsedBody.data;
      }

      // Validate report fields (without evidence)
      const validation = validateCreateReportInput(reportData);
      if (!validation.isValid || !validation.data) {
        return errorResponse(400, 'VALIDATION_ERROR', validation.error || 'Input validation failed.');
      }

      // If evidence is present, validate and upload to S3 first
      // Pre-generate report ID so S3 key uses the real ID
      let evidenceMetadata = undefined;
      const preGeneratedId = generateReportId();

      if (evidenceBuffer && evidenceBuffer.length > 0) {
        const evidenceValidation = evidenceService.validateEvidence(
          evidenceContentType,
          evidenceSize,
          evidenceBuffer
        );
        if (!evidenceValidation.isValid) {
          return errorResponse(400, 'VALIDATION_ERROR', evidenceValidation.error || 'Evidence file is not valid.');
        }

        try {
          evidenceMetadata = await evidenceService.upload({
            reportId: preGeneratedId,
            fileBuffer: evidenceBuffer,
            contentType: evidenceContentType,
            originalFilename: evidenceFilename,
            size: evidenceSize,
          });
        } catch (s3Error: any) {
          console.error('S3 evidence upload failed:', s3Error);
          return errorResponse(
            500,
            'EVIDENCE_UPLOAD_FAILED',
            'Evidence upload failed. The report was not created to maintain consistency.'
          );
        }
      }

      // Create report in the repository using the pre-generated ID
      const created = await reportService.createReport(
        { ...validation.data, evidence: evidenceMetadata },
        preGeneratedId
      );

      // Return HTTP 201 Created
      return successResponse(201, {
        reportId: created.reportId,
        status: created.status,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        ...(created.evidence ? { evidence: created.evidence } : {}),
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

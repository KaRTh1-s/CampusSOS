/**
 * S3 EVIDENCE SERVICE
 * ===================
 * Handles private S3 uploads of image evidence for campus incident reports.
 * - Validates MIME type (JPEG/PNG/WebP only) by inspecting magic bytes.
 * - Generates safe, predictable object keys (no user-controlled paths).
 * - Never exposes permanent public URLs.
 * - Generates short-lived presigned GET URLs for admin viewing.
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { config } from '../config/environment.js';
import { EvidenceMetadata } from '../types/index.js';

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Magic byte signatures for allowed image types
const MAGIC_BYTES: Array<{ type: string; bytes: number[]; offset?: number }> = [
  { type: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { type: 'image/png',  bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // "RIFF"
];

export interface EvidenceUploadInput {
  reportId: string;
  fileBuffer: Buffer;
  contentType: string;
  originalFilename: string;
  size: number;
}

export interface EvidenceValidationResult {
  isValid: boolean;
  error?: string;
  resolvedContentType?: string;
}

export class S3EvidenceService {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({ region: config.awsRegion });
    this.bucket = config.s3EvidenceBucket;
  }

  /**
   * Validates evidence metadata and inspects magic bytes.
   * Backend is authoritative — browser-supplied MIME type is not trusted alone.
   */
  validateEvidence(contentType: string, size: number, bytes: Buffer): EvidenceValidationResult {
    if (size > MAX_FILE_SIZE_BYTES) {
      return {
        isValid: false,
        error: `Evidence file exceeds the maximum allowed size of 5 MB (got ${(size / 1024 / 1024).toFixed(2)} MB).`,
      };
    }

    // Check magic bytes to verify true format
    let detectedType: string | null = null;
    for (const sig of MAGIC_BYTES) {
      const offset = sig.offset ?? 0;
      const matches = sig.bytes.every((b, i) => bytes[offset + i] === b);
      if (matches) {
        // For WebP: also verify bytes 8-11 are "WEBP"
        if (sig.type === 'image/webp') {
          const webpMarker = [0x57, 0x45, 0x42, 0x50]; // "WEBP"
          const webpMatch = webpMarker.every((b, i) => bytes[8 + i] === b);
          if (webpMatch) {
            detectedType = 'image/webp';
            break;
          }
        } else {
          detectedType = sig.type;
          break;
        }
      }
    }

    if (!detectedType) {
      return {
        isValid: false,
        error: 'Evidence file format not recognized. Only JPEG, PNG, and WebP images are accepted.',
      };
    }

    if (!(detectedType in ALLOWED_CONTENT_TYPES)) {
      return {
        isValid: false,
        error: `Evidence file type "${detectedType}" is not allowed. Accepted types: JPEG, PNG, WebP.`,
      };
    }

    return { isValid: true, resolvedContentType: detectedType };
  }

  /**
   * Generates a safe, deterministic S3 object key.
   * Never uses user-supplied filename directly.
   */
  generateObjectKey(reportId: string, contentType: string): string {
    const ext = ALLOWED_CONTENT_TYPES[contentType] || 'bin';
    // Sanitize reportId: allow only alphanumeric, dashes, underscores
    const safeReportId = reportId.replace(/[^a-zA-Z0-9\-_]/g, '');
    const uuid = randomUUID();
    return `evidence/${safeReportId}/${uuid}.${ext}`;
  }

  /**
   * Uploads evidence to the private S3 bucket and returns metadata.
   */
  async upload(input: EvidenceUploadInput): Promise<EvidenceMetadata> {
    if (!this.bucket) {
      throw new Error('S3 evidence bucket is not configured (S3_EVIDENCE_BUCKET).');
    }

    const validation = this.validateEvidence(input.contentType, input.size, input.fileBuffer);
    if (!validation.isValid || !validation.resolvedContentType) {
      throw new Error(validation.error || 'Evidence validation failed.');
    }

    const objectKey = this.generateObjectKey(input.reportId, validation.resolvedContentType);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      Body: input.fileBuffer,
      ContentType: validation.resolvedContentType,
      ContentLength: input.size,
      // No ACL — bucket defaults to private
    });

    await this.client.send(command);

    return {
      objectKey,
      contentType: validation.resolvedContentType,
      size: input.size,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates a short-lived presigned GET URL for admin viewing.
   * URL expires in 5 minutes (300 seconds). Never stored in DynamoDB.
   */
  async getPresignedUrl(objectKey: string): Promise<string> {
    if (!this.bucket) {
      throw new Error('S3 evidence bucket is not configured (S3_EVIDENCE_BUCKET).');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });

    return getSignedUrl(this.client, command, { expiresIn: 300 });
  }

  /**
   * Checks if an object exists in S3 (used for testing/validation).
   */
  async objectExists(objectKey: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }));
      return true;
    } catch {
      return false;
    }
  }
}

export const defaultS3EvidenceService = new S3EvidenceService();

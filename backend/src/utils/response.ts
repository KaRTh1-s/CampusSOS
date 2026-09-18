import type { APIGatewayProxyResult } from 'aws-lambda';
import { config } from '../config/environment.js';

/**
 * Common CORS headers for Lambda responses
 */
export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': config.corsOrigin,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
  'Content-Type': 'application/json',
};

/**
 * Returns a standardized success Lambda proxy response
 */
export function successResponse(statusCode: number, data: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  };
}

/**
 * Returns a standardized error Lambda proxy response
 */
export function errorResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): APIGatewayProxyResult {
  const errorPayload = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };

  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(errorPayload),
  };
}

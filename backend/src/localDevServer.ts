/**
 * LOCAL DEVELOPMENT HTTP SERVER
 * =============================
 * NOTICE: This is a lightweight development-only HTTP server using native Node.js http.
 * It simulates AWS API Gateway proxy integration locally without third-party frameworks.
 * It does NOT represent production infrastructure (which uses AWS API Gateway + Lambda).
 */

import http from 'node:http';
import { URL } from 'node:url';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handler as analyzeHandler } from './handlers/analyze.js';
import { handler as createReportHandler } from './handlers/createReport.js';
import { handler as listReportsHandler } from './handlers/listReports.js';
import { handler as getReportHandler } from './handlers/getReport.js';
import { handler as updateReportStatusHandler } from './handlers/updateReportStatus.js';
import { handler as getEvidenceUrlHandler } from './handlers/getEvidenceUrl.js';
import { config } from './config/environment.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

function createMockEvent(
  method: string,
  pathname: string,
  queryParams: Record<string, string>,
  pathParams: Record<string, string> | null,
  body: string,
  rawBody?: Buffer,
  contentType?: string
): APIGatewayProxyEvent {
  return {
    httpMethod: method,
    path: pathname,
    queryStringParameters: Object.keys(queryParams).length > 0 ? queryParams : null,
    multiValueQueryStringParameters: null,
    pathParameters: pathParams,
    // For multipart, store base64 body so handler can decode it
    body: rawBody ? rawBody.toString('base64') : (body || null),
    isBase64Encoded: !!rawBody,
    headers: contentType ? { 'content-type': contentType } : {},
    multiValueHeaders: {},
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
  };
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;
  const method = req.method?.toUpperCase() || 'GET';

  // Read request body as Buffer (supports both binary and text)
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const rawBodyBuffer = Buffer.concat(chunks);
  const bodyStr = rawBodyBuffer.toString('utf-8');

  const incomingContentType = req.headers['content-type'] || '';

  const queryParams: Record<string, string> = {};
  parsedUrl.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  let result: APIGatewayProxyResult;

  // Handle CORS preflight OPTIONS
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': config.corsOrigin,
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
    });
    res.end();
    return;
  }

  // Route: POST /api/analyze or POST /analyze
  if (method === 'POST' && (pathname === '/api/analyze' || pathname === '/analyze')) {
    const event = createMockEvent(method, pathname, queryParams, null, bodyStr);
    result = (await analyzeHandler(event, {} as any, () => {})) as APIGatewayProxyResult;
  }
  // Route: POST /api/reports or POST /reports
  else if (method === 'POST' && (pathname === '/api/reports' || pathname === '/reports')) {
    const isMultipart = incomingContentType.includes('multipart/form-data');
    const event = isMultipart
      ? createMockEvent(method, pathname, queryParams, null, '', rawBodyBuffer, incomingContentType)
      : createMockEvent(method, pathname, queryParams, null, bodyStr);
    result = (await createReportHandler(event, {} as any, () => {})) as APIGatewayProxyResult;
  }
  // Route: GET /api/reports or GET /reports
  else if (method === 'GET' && (pathname === '/api/reports' || pathname === '/reports')) {
    const event = createMockEvent(method, pathname, queryParams, null, bodyStr);
    result = (await listReportsHandler(event, {} as any, () => {})) as APIGatewayProxyResult;
  }
  // Route: GET /reports/{id}/evidence
  else if (
    method === 'GET' &&
    (pathname.startsWith('/api/reports/') || pathname.startsWith('/reports/')) &&
    pathname.endsWith('/evidence')
  ) {
    const segments = pathname.split('/').filter(Boolean);
    // segments: ['reports', '{id}', 'evidence'] → id at index 1
    const id = segments[segments.length - 2];
    const event = createMockEvent(method, pathname, queryParams, { id }, bodyStr);
    result = (await getEvidenceUrlHandler(event, {} as any, () => {})) as APIGatewayProxyResult;
  }
  // Route: GET /api/reports/{id} or GET /reports/{id}
  else if (
    method === 'GET' &&
    (pathname.startsWith('/api/reports/') || pathname.startsWith('/reports/'))
  ) {
    const segments = pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 1];
    const event = createMockEvent(method, pathname, queryParams, { id }, bodyStr);
    result = (await getReportHandler(event, {} as any, () => {})) as APIGatewayProxyResult;
  }
  // Route: PATCH /api/reports/{id}/status or PATCH /reports/{id}/status
  else if (
    method === 'PATCH' &&
    (pathname.includes('/reports/') && pathname.endsWith('/status'))
  ) {
    const segments = pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 2];
    const event = createMockEvent(method, pathname, queryParams, { id }, bodyStr);
    result = (await updateReportStatusHandler(event, {} as any, () => {})) as APIGatewayProxyResult;
  } else {
    result = {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: { code: 'NOT_FOUND', message: `Route ${method} ${pathname} not found.` },
      }),
    };
  }

  res.writeHead(result.statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': config.corsOrigin,
    ...(result.headers || {}),
  });
  res.end(result.body);
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[CampusSOS Backend] Local dev adapter running at http://localhost:${PORT}`);
    console.log(`Available endpoints:`);
    console.log(`  POST  /analyze`);
    console.log(`  POST  /reports`);
    console.log(`  GET   /reports`);
    console.log(`  GET   /reports/{id}`);
    console.log(`  GET   /reports/{id}/evidence`);
    console.log(`  PATCH /reports/{id}/status`);
  });
}

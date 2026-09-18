import http from 'node:http';
import { URL } from 'node:url';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handler as analyzeHandler } from '../src/handlers/analyze.js';
import { handler as createReportHandler } from '../src/handlers/createReport.js';
import { handler as listReportsHandler } from '../src/handlers/listReports.js';
import { handler as getReportHandler } from '../src/handlers/getReport.js';
import { handler as updateReportStatusHandler } from '../src/handlers/updateReportStatus.js';
import { defaultReportRepository } from '../src/repositories/inMemoryReportRepository.js';
import { config } from '../src/config/environment.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`✅ PASS: ${message}`);
    passed++;
  }
}

function createMockEvent(
  method: string,
  pathname: string,
  queryParams: Record<string, string>,
  pathParams: Record<string, string> | null,
  body: string
): APIGatewayProxyEvent {
  return {
    httpMethod: method,
    path: pathname,
    queryStringParameters: Object.keys(queryParams).length > 0 ? queryParams : null,
    multiValueQueryStringParameters: null,
    pathParameters: pathParams,
    body: body || null,
    headers: {},
    multiValueHeaders: {},
    isBase64Encoded: false,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
  };
}

function createDevServer(port: number): Promise<http.Server> {
  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url || '/', `http://localhost:${port}`);
    const pathname = parsedUrl.pathname;
    const method = req.method?.toUpperCase() || 'GET';

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const body = Buffer.concat(chunks).toString('utf-8');

    const queryParams: Record<string, string> = {};
    parsedUrl.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    let result: APIGatewayProxyResult;

    if (method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': config.corsOrigin,
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
      });
      res.end();
      return;
    }

    if (method === 'POST' && (pathname === '/api/analyze' || pathname === '/analyze')) {
      const event = createMockEvent(method, pathname, queryParams, null, body);
      result = (await analyzeHandler(event, {} as any, () => {})) as APIGatewayProxyResult;
    } else if (method === 'POST' && (pathname === '/api/reports' || pathname === '/reports')) {
      const event = createMockEvent(method, pathname, queryParams, null, body);
      result = (await createReportHandler(event, {} as any, () => {})) as APIGatewayProxyResult;
    } else if (method === 'GET' && (pathname === '/api/reports' || pathname === '/reports')) {
      const event = createMockEvent(method, pathname, queryParams, null, body);
      result = (await listReportsHandler(event, {} as any, () => {})) as APIGatewayProxyResult;
    } else if (
      method === 'GET' &&
      (pathname.startsWith('/api/reports/') || pathname.startsWith('/reports/'))
    ) {
      const segments = pathname.split('/').filter(Boolean);
      const id = segments[segments.length - 1];
      const event = createMockEvent(method, pathname, queryParams, { id }, body);
      result = (await getReportHandler(event, {} as any, () => {})) as APIGatewayProxyResult;
    } else if (
      method === 'PATCH' &&
      pathname.includes('/reports/') &&
      pathname.endsWith('/status')
    ) {
      const segments = pathname.split('/').filter(Boolean);
      const id = segments[segments.length - 2];
      const event = createMockEvent(method, pathname, queryParams, { id }, body);
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
      ...(result.headers || {}),
    });
    res.end(result.body);
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function runIntegrationTests() {
  console.log('===========================================================');
  console.log('CAMPUSSOS REAL HTTP INTEGRATION TEST SUITE (FRONTEND <-> BACKEND)');
  console.log('===========================================================\n');

  const TEST_PORT = 3105;
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  defaultReportRepository.clear();
  const server = await createDevServer(TEST_PORT);
  console.log(`Live HTTP Test Server listening at ${BASE_URL}\n`);

  try {
    // 1. CORS Preflight
    console.log('--- 1. CORS Preflight (OPTIONS /analyze) ---');
    const corsRes = await fetch(`${BASE_URL}/analyze`, { method: 'OPTIONS' });
    assert(corsRes.status === 200, `OPTIONS status is 200 (got ${corsRes.status})`);
    assert(
      corsRes.headers.get('access-control-allow-origin') === config.corsOrigin,
      `CORS allow-origin is "${corsRes.headers.get('access-control-allow-origin')}"`
    );

    // 2. Flow A: Electrical Smoke Hazard
    console.log('\n--- 2. End-to-End Flow A: Electrical Hazard ---');
    const flowARes = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'There is smoke coming from an electrical panel in Block C.',
        location: 'Block C',
      }),
    });
    assert(flowARes.status === 200, `POST /analyze returns 200 (got ${flowARes.status})`);
    const flowAData = await flowARes.json();
    assert(flowAData.category === 'Electrical Safety', `Category is Electrical Safety (got "${flowAData.category}")`);
    assert(flowAData.priority === 'CRITICAL', `Priority is CRITICAL (got "${flowAData.priority}")`);
    assert(flowAData.department === 'Campus Safety & Electrical Maintenance', `Department matches`);

    // 3. Flow B: Leaking Washroom Tap
    console.log('\n--- 3. End-to-End Flow B: Leaking Tap Maintenance ---');
    const flowBRes = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'The hostel bathroom tap is leaking badly.',
        location: 'Hostel 2',
      }),
    });
    assert(flowBRes.status === 200, `POST /analyze returns 200 (got ${flowBRes.status})`);
    const flowBData = await flowBRes.json();
    assert(flowBData.category === 'Plumbing & Water', `Category is Plumbing & Water (got "${flowBData.category}")`);
    assert(flowBData.priority === 'LOW' || flowBData.priority === 'MEDIUM', `Priority is LOW or MEDIUM (got "${flowBData.priority}")`);

    // 4. Flow C: Lost Student ID
    console.log('\n--- 4. End-to-End Flow C: Lost ID Card ---');
    const flowCRes = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'I lost my college ID card near the library.',
        location: 'Central Library',
      }),
    });
    assert(flowCRes.status === 200, `POST /analyze returns 200 (got ${flowCRes.status})`);
    const flowCData = await flowCRes.json();
    assert(flowCData.category === 'Security & Access', `Category is Security & Access (got "${flowCData.category}")`);
    assert(flowCData.priority === 'LOW', `Priority is LOW (got "${flowCData.priority}")`);

    // 5. Submit Official Report (POST /reports)
    console.log('\n--- 5. Submit Official Report (POST /reports) ---');
    const reportRes = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'There is smoke coming from an electrical panel in Block C.',
        location: 'Block C',
        category: flowAData.category,
        priority: flowAData.priority,
        summary: flowAData.summary,
        recommendedAction: flowAData.recommendedAction,
        department: flowAData.department,
      }),
    });
    assert(reportRes.status === 201, `POST /reports returns 201 Created (got ${reportRes.status})`);
    const reportData = await reportRes.json();
    assert(typeof reportData.reportId === 'string', 'reportId is string');
    assert(reportData.reportId.startsWith('CS-2026-'), `Report ID format CS-2026-XXXX (got "${reportData.reportId}")`);
    assert(reportData.status === 'OPEN', `Initial status is OPEN (got "${reportData.status}")`);
    assert(typeof reportData.createdAt === 'string', 'createdAt timestamp present');
    const createdReportId = reportData.reportId;

    // 6. Retrieve Created Report (GET /reports/{id})
    console.log('\n--- 6. Retrieve Report by ID (GET /reports/{id}) ---');
    const getRes = await fetch(`${BASE_URL}/reports/${createdReportId}`);
    assert(getRes.status === 200, `GET /reports/{id} returns 200 (got ${getRes.status})`);
    const fetchedData = await getRes.json();
    assert(fetchedData.reportId === createdReportId, `Report ID matches "${createdReportId}"`);
    assert(fetchedData.category === 'Electrical Safety', `Category matches "Electrical Safety"`);

    // 7. Update Status (PATCH /reports/{id}/status)
    console.log('\n--- 7. Update Report Status (PATCH /reports/{id}/status) ---');
    const patchRes = await fetch(`${BASE_URL}/reports/${createdReportId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    assert(patchRes.status === 200, `PATCH returns 200 (got ${patchRes.status})`);
    const patchData = await patchRes.json();
    assert(patchData.status === 'IN_PROGRESS', `Status transitioned to IN_PROGRESS`);

    // 8. List Reports & Filter by Status (GET /reports)
    console.log('\n--- 8. List and Filter Reports (GET /reports?status=IN_PROGRESS) ---');
    const listRes = await fetch(`${BASE_URL}/reports?status=IN_PROGRESS`);
    assert(listRes.status === 200, `GET /reports returns 200 (got ${listRes.status})`);
    const listData = await listRes.json();
    assert(listData.count === 1, `count is 1 (got ${listData.count})`);
    assert(listData.reports[0].reportId === createdReportId, `List contains updated report`);

    // 9. Error Handling: Missing Description
    console.log('\n--- 9. Error Handling: Missing Description (HTTP 400) ---');
    const errRes1 = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(errRes1.status === 400, `Missing description returns 400 (got ${errRes1.status})`);
    const errData1 = await errRes1.json();
    assert(errData1.error.code === 'VALIDATION_ERROR', `Error code is VALIDATION_ERROR`);

    // 10. Error Handling: Missing Report (HTTP 404)
    console.log('\n--- 10. Error Handling: Non-existent Report (HTTP 404) ---');
    const errRes2 = await fetch(`${BASE_URL}/reports/CS-2026-9999`);
    assert(errRes2.status === 404, `Missing report returns 404 (got ${errRes2.status})`);

    // 11. Error Handling: Invalid Status Transition
    console.log('\n--- 11. Error Handling: Invalid Status Transition (HTTP 400) ---');
    const errRes3 = await fetch(`${BASE_URL}/reports/${createdReportId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'OPEN' }),
    });
    assert(errRes3.status === 400, `Invalid transition returns 400 (got ${errRes3.status})`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    console.log('\nLive HTTP Test Server stopped.');
  }

  console.log('\n===========================================================');
  console.log(`INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runIntegrationTests();

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handler as analyzeHandler } from '../src/handlers/analyze.js';
import { handler as createReportHandler } from '../src/handlers/createReport.js';
import { handler as listReportsHandler } from '../src/handlers/listReports.js';
import { handler as getReportHandler } from '../src/handlers/getReport.js';
import { handler as updateReportStatusHandler } from '../src/handlers/updateReportStatus.js';
import { defaultReportRepository } from '../src/repositories/inMemoryReportRepository.js';

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

function createMockEvent(options: {
  method: string;
  path: string;
  body?: unknown;
  rawBody?: string;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
}): APIGatewayProxyEvent {
  const bodyString =
    options.rawBody !== undefined
      ? options.rawBody
      : options.body !== undefined
      ? JSON.stringify(options.body)
      : null;

  return {
    httpMethod: options.method,
    path: options.path,
    body: bodyString,
    pathParameters: options.pathParameters || null,
    queryStringParameters: options.queryStringParameters || null,
    multiValueQueryStringParameters: null,
    headers: { 'Content-Type': 'application/json' },
    multiValueHeaders: {},
    isBase64Encoded: false,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
  };
}

async function invokeHandler(
  handlerFn: any,
  event: APIGatewayProxyEvent
): Promise<{ statusCode: number; data: any; headers?: any }> {
  const result = (await handlerFn(event, {} as any, () => {})) as APIGatewayProxyResult;
  let parsedData: any = null;
  try {
    parsedData = JSON.parse(result.body);
  } catch {
    parsedData = result.body;
  }
  return {
    statusCode: result.statusCode,
    data: parsedData,
    headers: result.headers,
  };
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('CAMPUSSOS BACKEND & LAMBDA HANDLER TEST SUITE');
  console.log('====================================================\n');

  // Reset in-memory repository before tests
  defaultReportRepository.clear();

  // ----------------------------------------------------
  // ANALYZE TESTS (Cases 1-12)
  // ----------------------------------------------------
  console.log('--- 1. Valid Electrical Issue ---');
  const res1 = await invokeHandler(
    analyzeHandler,
    createMockEvent({
      method: 'POST',
      path: '/analyze',
      body: {
        description: 'There is smoke and sparks coming from an electrical panel in Block C.',
        location: 'Block C, Room 204',
      },
    })
  );
  assert(res1.statusCode === 200, `Status code is 200 (got ${res1.statusCode})`);
  assert(res1.data.category === 'Electrical Safety', `Category is Electrical Safety (got "${res1.data.category}")`);
  assert(res1.data.priority === 'CRITICAL', `Priority is CRITICAL (got "${res1.data.priority}")`);
  assert(res1.data.recommendedAction.toLowerCase().includes('move away'), 'Action directs student to evacuate');

  console.log('\n--- 2. Valid Plumbing Issue ---');
  const res2 = await invokeHandler(
    analyzeHandler,
    createMockEvent({
      method: 'POST',
      path: '/analyze',
      body: {
        description: 'The hostel bathroom tap is leaking continuously onto the floor.',
        location: 'Hostel 3, 2nd Floor',
      },
    })
  );
  assert(res2.statusCode === 200, `Status code is 200 (got ${res2.statusCode})`);
  assert(res2.data.category === 'Plumbing & Water', `Category is Plumbing & Water (got "${res2.data.category}")`);
  assert(res2.data.priority === 'LOW' || res2.data.priority === 'MEDIUM', `Priority is LOW or MEDIUM (got "${res2.data.priority}")`);

  console.log('\n--- 3. Valid Lost ID ---');
  const res3 = await invokeHandler(
    analyzeHandler,
    createMockEvent({
      method: 'POST',
      path: '/analyze',
      body: {
        description: 'I lost my college ID card near the main library study pod.',
        location: 'Central Library',
      },
    })
  );
  assert(res3.statusCode === 200, `Status code is 200 (got ${res3.statusCode})`);
  assert(res3.data.category === 'Security & Access', `Category is Security & Access (got "${res3.data.category}")`);
  assert(res3.data.priority === 'LOW', `Priority is LOW (got "${res3.data.priority}")`);

  console.log('\n--- 4. Valid Security Incident ---');
  const res4 = await invokeHandler(
    analyzeHandler,
    createMockEvent({
      method: 'POST',
      path: '/analyze',
      body: {
        description: 'My classmate stole my phone from the cafeteria table.',
        location: 'Campus Cafeteria',
      },
    })
  );
  assert(res4.statusCode === 200, `Status code is 200 (got ${res4.statusCode})`);
  assert(res4.data.category === 'Security & Access', `Category is Security & Access (got "${res4.data.category}")`);
  assert(res4.data.priority === 'HIGH', `Priority is HIGH (got "${res4.data.priority}")`);
  assert(!res4.data.summary.toLowerCase().includes('guilty'), 'Summary avoids asserting legal guilt');

  console.log('\n--- 5. Valid Hostel Issue ---');
  const res5 = await invokeHandler(
    analyzeHandler,
    createMockEvent({
      method: 'POST',
      path: '/analyze',
      body: {
        description: 'The hostel room door lock is completely jammed and will not lock from outside.',
        location: 'Hostel 1, Room 108',
      },
    })
  );
  assert(res5.statusCode === 200, `Status code is 200 (got ${res5.statusCode})`);
  assert(res5.data.category === 'Hostel & Residential Life', `Category is Hostel & Residential Life (got "${res5.data.category}")`);
  assert(res5.data.priority === 'MEDIUM', `Priority is MEDIUM (got "${res5.data.priority}")`);

  console.log('\n--- 6. Valid Accessibility Issue ---');
  const res6 = await invokeHandler(
    analyzeHandler,
    createMockEvent({
      method: 'POST',
      path: '/analyze',
      body: {
        description: 'The wheelchair ramp to the science block is blocked by construction debris.',
        location: 'Science Block Entrance',
      },
    })
  );
  assert(res6.statusCode === 200, `Status code is 200 (got ${res6.statusCode})`);
  assert(res6.data.category === 'Accessibility & Mobility', `Category is Accessibility & Mobility (got "${res6.data.category}")`);
  assert(res6.data.priority === 'HIGH', `Priority is HIGH (got "${res6.data.priority}")`);

  console.log('\n--- 7. Generic Issue Fallback ---');
  const res7 = await invokeHandler(
    analyzeHandler,
    createMockEvent({
      method: 'POST',
      path: '/analyze',
      body: {
        description: 'I need general guidance on where to collect my annual sports day certificate.',
      },
    })
  );
  assert(res7.statusCode === 200, `Status code is 200 (got ${res7.statusCode})`);
  assert(res7.data.category === 'General Campus Support', `Category is General Campus Support (got "${res7.data.category}")`);

  console.log('\n--- 8. Missing Description ---');
  const res8 = await invokeHandler(
    analyzeHandler,
    createMockEvent({
      method: 'POST',
      path: '/analyze',
      body: { location: 'Campus Gate' },
    })
  );
  assert(res8.statusCode === 400, `Status code is 400 (got ${res8.statusCode})`);
  assert(res8.data.error.code === 'VALIDATION_ERROR', `Error code is VALIDATION_ERROR (got "${res8.data.error.code}")`);

  console.log('\n--- 9. Description Shorter than 10 Characters ---');
  const res9 = await invokeHandler(
    analyzeHandler,
    createMockEvent({
      method: 'POST',
      path: '/analyze',
      body: { description: 'help me' },
    })
  );
  assert(res9.statusCode === 400, `Status code is 400 (got ${res9.statusCode})`);
  assert(res9.data.error.code === 'VALIDATION_ERROR', `Error code is VALIDATION_ERROR (got "${res9.data.error.code}")`);
  assert(res9.data.error.message.includes('10'), 'Error message references minimum 10 characters');

  console.log('\n--- 10. Description Longer than 2000 Characters ---');
  const longDesc = 'A'.repeat(2005);
  const res10 = await invokeHandler(
    analyzeHandler,
    createMockEvent({
      method: 'POST',
      path: '/analyze',
      body: { description: longDesc },
    })
  );
  assert(res10.statusCode === 400, `Status code is 400 (got ${res10.statusCode})`);
  assert(res10.data.error.code === 'VALIDATION_ERROR', `Error code is VALIDATION_ERROR (got "${res10.data.error.code}")`);
  assert(res10.data.error.message.includes('2000'), 'Error message references maximum 2000 characters');

  console.log('\n--- 11. Invalid Location (Exceeding 200 Chars) ---');
  const longLoc = 'L'.repeat(250);
  const res11 = await invokeHandler(
    analyzeHandler,
    createMockEvent({
      method: 'POST',
      path: '/analyze',
      body: {
        description: 'There is a damaged floor tile in the hallway.',
        location: longLoc,
      },
    })
  );
  assert(res11.statusCode === 400, `Status code is 400 (got ${res11.statusCode})`);
  assert(res11.data.error.code === 'VALIDATION_ERROR', `Error code is VALIDATION_ERROR (got "${res11.data.error.code}")`);

  console.log('\n--- 12. Malformed JSON ---');
  const res12 = await invokeHandler(
    analyzeHandler,
    createMockEvent({
      method: 'POST',
      path: '/analyze',
      rawBody: '{ "description": "Broken door", INVALID_JSON }',
    })
  );
  assert(res12.statusCode === 400, `Status code is 400 (got ${res12.statusCode})`);
  assert(res12.data.error.code === 'BAD_REQUEST', `Error code is BAD_REQUEST (got "${res12.data.error.code}")`);

  // ----------------------------------------------------
  // REPORTS TESTS (Cases 13-24)
  // ----------------------------------------------------
  console.log('\n--- 13. Create Valid Report ---');
  const res13 = await invokeHandler(
    createReportHandler,
    createMockEvent({
      method: 'POST',
      path: '/reports',
      body: {
        description: 'Smoke is coming from the electrical panel in Block C.',
        location: 'Block C, Room 204',
        category: 'Electrical Safety',
        priority: 'CRITICAL',
        summary: 'Smoke reported from classroom electrical panel.',
        recommendedAction: 'Evacuate area and alert campus emergency.',
        department: 'Campus Safety & Electrical Maintenance',
      },
    })
  );
  assert(res13.statusCode === 201, `Status code is 201 (got ${res13.statusCode})`);
  assert(typeof res13.data.reportId === 'string' && res13.data.reportId.startsWith('CS-2026-'), `Report ID format is CS-2026-XXXX (got "${res13.data.reportId}")`);
  assert(res13.data.status === 'OPEN', `Status is OPEN (got "${res13.data.status}")`);
  assert(typeof res13.data.createdAt === 'string', 'createdAt is ISO string');
  assert(typeof res13.data.updatedAt === 'string', 'updatedAt is ISO string');
  const createdId = res13.data.reportId;

  console.log('\n--- 14. Create Invalid Report ---');
  const res14 = await invokeHandler(
    createReportHandler,
    createMockEvent({
      method: 'POST',
      path: '/reports',
      body: {
        description: 'Water leak',
        // Missing category, priority, summary, recommendedAction, department
      },
    })
  );
  assert(res14.statusCode === 400, `Status code is 400 (got ${res14.statusCode})`);
  assert(res14.data.error.code === 'VALIDATION_ERROR', `Error code is VALIDATION_ERROR (got "${res14.data.error.code}")`);

  console.log('\n--- 15. Get Existing Report ---');
  const res15 = await invokeHandler(
    getReportHandler,
    createMockEvent({
      method: 'GET',
      path: `/reports/${createdId}`,
      pathParameters: { id: createdId },
    })
  );
  assert(res15.statusCode === 200, `Status code is 200 (got ${res15.statusCode})`);
  assert(res15.data.reportId === createdId, `Retrieved matching reportId (got "${res15.data.reportId}")`);
  assert(res15.data.category === 'Electrical Safety', `Category matches (got "${res15.data.category}")`);

  console.log('\n--- 16. Get Missing Report ---');
  const res16 = await invokeHandler(
    getReportHandler,
    createMockEvent({
      method: 'GET',
      path: '/reports/CS-2026-NONEXIST',
      pathParameters: { id: 'CS-2026-NONEXIST' },
    })
  );
  assert(res16.statusCode === 404, `Status code is 404 (got ${res16.statusCode})`);
  assert(res16.data.error.code === 'NOT_FOUND', `Error code is NOT_FOUND (got "${res16.data.error.code}")`);

  // Create a second report for list and filter tests
  const secondReport = await invokeHandler(
    createReportHandler,
    createMockEvent({
      method: 'POST',
      path: '/reports',
      body: {
        description: 'Water tap leaking slowly in washroom.',
        category: 'Plumbing & Water',
        priority: 'LOW',
        summary: 'Minor washroom tap leak.',
        recommendedAction: 'Facilities maintenance dispatched.',
        department: 'Campus Facilities & Plumbing Maintenance',
      },
    })
  );
  const secondId = secondReport.data.reportId;

  console.log('\n--- 17. List Reports ---');
  const res17 = await invokeHandler(
    listReportsHandler,
    createMockEvent({
      method: 'GET',
      path: '/reports',
    })
  );
  assert(res17.statusCode === 200, `Status code is 200 (got ${res17.statusCode})`);
  assert(Array.isArray(res17.data.reports), 'reports is array');
  assert(res17.data.count === 2, `count is 2 (got ${res17.data.count})`);

  console.log('\n--- 18. Filter by Status ---');
  const res18 = await invokeHandler(
    listReportsHandler,
    createMockEvent({
      method: 'GET',
      path: '/reports',
      queryStringParameters: { status: 'OPEN' },
    })
  );
  assert(res18.statusCode === 200, `Status code is 200 (got ${res18.statusCode})`);
  assert(res18.data.reports.every((r: any) => r.status === 'OPEN'), 'All filtered reports have status OPEN');

  console.log('\n--- 19. Filter by Priority ---');
  const res19 = await invokeHandler(
    listReportsHandler,
    createMockEvent({
      method: 'GET',
      path: '/reports',
      queryStringParameters: { priority: 'CRITICAL' },
    })
  );
  assert(res19.statusCode === 200, `Status code is 200 (got ${res19.statusCode})`);
  assert(res19.data.count === 1, `count is 1 (got ${res19.data.count})`);
  assert(res19.data.reports[0].reportId === createdId, `Critical report is "${createdId}"`);

  console.log('\n--- 20. Update OPEN -> IN_PROGRESS ---');
  const res20 = await invokeHandler(
    updateReportStatusHandler,
    createMockEvent({
      method: 'PATCH',
      path: `/reports/${createdId}/status`,
      pathParameters: { id: createdId },
      body: { status: 'IN_PROGRESS' },
    })
  );
  assert(res20.statusCode === 200, `Status code is 200 (got ${res20.statusCode})`);
  assert(res20.data.status === 'IN_PROGRESS', `Status updated to IN_PROGRESS (got "${res20.data.status}")`);
  assert(res20.data.reportId === createdId, `ReportId returned is "${createdId}"`);

  console.log('\n--- 21. Update IN_PROGRESS -> RESOLVED ---');
  const res21 = await invokeHandler(
    updateReportStatusHandler,
    createMockEvent({
      method: 'PATCH',
      path: `/reports/${createdId}/status`,
      pathParameters: { id: createdId },
      body: { status: 'RESOLVED' },
    })
  );
  assert(res21.statusCode === 200, `Status code is 200 (got ${res21.statusCode})`);
  assert(res21.data.status === 'RESOLVED', `Status updated to RESOLVED (got "${res21.data.status}")`);

  console.log('\n--- 22. Invalid Status ---');
  const res22 = await invokeHandler(
    updateReportStatusHandler,
    createMockEvent({
      method: 'PATCH',
      path: `/reports/${secondId}/status`,
      pathParameters: { id: secondId },
      body: { status: 'DELETED' },
    })
  );
  assert(res22.statusCode === 400, `Status code is 400 (got ${res22.statusCode})`);
  assert(res22.data.error.code === 'VALIDATION_ERROR', `Error code is VALIDATION_ERROR (got "${res22.data.error.code}")`);

  console.log('\n--- 23. Invalid Transition (RESOLVED -> OPEN) ---');
  const res23 = await invokeHandler(
    updateReportStatusHandler,
    createMockEvent({
      method: 'PATCH',
      path: `/reports/${createdId}/status`,
      pathParameters: { id: createdId },
      body: { status: 'OPEN' },
    })
  );
  assert(res23.statusCode === 400, `Status code is 400 (got ${res23.statusCode})`);
  assert(res23.data.error.code === 'BAD_REQUEST', `Error code is BAD_REQUEST (got "${res23.data.error.code}")`);
  assert(res23.data.error.message.includes('Invalid status transition'), 'Error message mentions invalid transition');

  console.log('\n--- 24. Update Missing Report ---');
  const res24 = await invokeHandler(
    updateReportStatusHandler,
    createMockEvent({
      method: 'PATCH',
      path: '/reports/CS-2026-NONEXIST/status',
      pathParameters: { id: 'CS-2026-NONEXIST' },
      body: { status: 'IN_PROGRESS' },
    })
  );
  assert(res24.statusCode === 404, `Status code is 404 (got ${res24.statusCode})`);
  assert(res24.data.error.code === 'NOT_FOUND', `Error code is NOT_FOUND (got "${res24.data.error.code}")`);

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();

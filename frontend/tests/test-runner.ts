/**
 * Automated Verification Script for CampusSOS Student Workflow
 * Tests all required cases from Section 27.
 */

import { analyzeIssueMock } from '../src/services/mockAnalysisService';
import { validateDescription, validateLocation, MIN_DESCRIPTION_LENGTH, MAX_DESCRIPTION_LENGTH } from '../src/utils/validation';

let failed = 0;
let passed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`✅ PASS: ${message}`);
    passed++;
  }
}

async function runTests() {
  console.log('==============================================');
  console.log('CAMPUSSOS AUTOMATED WORKFLOW TEST SUITE');
  console.log('==============================================\n');

  // CASE 1: Electrical smoke
  console.log('--- Test Case 1: Electrical Smoke Hazard ---');
  const case1 = await analyzeIssueMock('There is smoke coming from an electrical panel in Block C.', 'Block C');
  assert(case1.category === 'Electrical Safety', `Category is "${case1.category}" (expected "Electrical Safety")`);
  assert(case1.priority === 'CRITICAL', `Priority is "${case1.priority}" (expected "CRITICAL")`);
  assert(case1.recommendedAction.toLowerCase().includes('move away'), 'Action directs student to evacuate');
  assert(case1.department === 'Campus Safety & Electrical Maintenance', `Department is "${case1.department}"`);

  // CASE 2: Leaking tap
  console.log('\n--- Test Case 2: Leaking Tap Maintenance ---');
  const case2 = await analyzeIssueMock('The hostel bathroom tap is leaking continuously onto the floor.', 'Hostel 4');
  assert(case2.category === 'Plumbing & Water', `Category is "${case2.category}" (expected "Plumbing & Water")`);
  assert(case2.priority === 'LOW' || case2.priority === 'MEDIUM', `Priority is "${case2.priority}" (expected LOW or MEDIUM)`);

  // CASE 3: Lost ID Card
  console.log('\n--- Test Case 3: Lost Student ID ---');
  const case3 = await analyzeIssueMock('I lost my college ID card near the library.', 'Central Library');
  assert(case3.category === 'Security & Access', `Category is "${case3.category}" (expected "Security & Access")`);
  assert(case3.priority === 'LOW' || case3.priority === 'MEDIUM', `Priority is "${case3.priority}" (expected LOW or MEDIUM)`);

  // CASE 4: Security incident / reported theft (Presumption of innocence)
  console.log('\n--- Test Case 4: Security Incident / Reported Theft ---');
  const case4 = await analyzeIssueMock('My classmate stole my phone from the study hall.', 'Study Hall');
  assert(case4.category === 'Security & Access', `Category is "${case4.category}" (expected "Security & Access")`);
  assert(case4.priority === 'HIGH', `Priority is "${case4.priority}" (expected "HIGH")`);
  assert(!case4.summary.toLowerCase().includes('guilty'), 'Summary maintains objectivity');
  assert(case4.recommendedAction.toLowerCase().includes('confrontation'), 'Action instructs avoiding confrontation');

  // CASE 5: Input with fewer than 10 characters
  console.log('\n--- Test Case 5: Validation - Fewer than 10 characters ---');
  const shortResult = validateDescription('help');
  assert(!shortResult.isValid, 'Validation rejects inputs under 10 chars');
  assert(shortResult.error ? shortResult.error.includes(String(MIN_DESCRIPTION_LENGTH)) : false, `Validation error mentions min length (${shortResult.error})`);

  const emptyResult = validateDescription('   ');
  assert(!emptyResult.isValid, 'Validation rejects whitespace-only inputs');

  // CASE 6: Input with 2000+ characters
  console.log('\n--- Test Case 6: Validation - Exceeding 2000 characters ---');
  const longText = 'A'.repeat(2005);
  const longResult = validateDescription(longText);
  assert(!longResult.isValid, 'Validation rejects inputs exceeding 2000 chars');
  assert(longResult.error ? longResult.error.includes(String(MAX_DESCRIPTION_LENGTH)) : false, `Validation error mentions max length (${longResult.error})`);

  // Valid length
  const validResult = validateDescription('There is a small water puddle near the entrance door.');
  assert(validResult.isValid, 'Validation passes for standard valid input');

  // Location validation
  const validLoc = validateLocation('Block B, Room 102');
  assert(validLoc.isValid, 'Valid location passes');
  const longLoc = validateLocation('B'.repeat(250));
  assert(!longLoc.isValid, 'Overlong location fails');

  console.log('\n==============================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==============================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

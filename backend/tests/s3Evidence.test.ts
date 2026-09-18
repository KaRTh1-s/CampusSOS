/**
 * S3EvidenceService Offline Unit Tests
 * =====================================
 * Tests validation, key generation, and metadata without real S3 calls.
 */

import { S3EvidenceService } from '../src/services/s3EvidenceService.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

// --- Magic byte helpers ---
function jpegBuffer(): Buffer {
  return Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
}
function pngBuffer(): Buffer {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
}
function webpBuffer(): Buffer {
  // RIFF....WEBP
  const buf = Buffer.alloc(12);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(0, 4); // placeholder size
  buf.write('WEBP', 8, 'ascii');
  return buf;
}
function executableBuffer(): Buffer {
  // ELF magic bytes
  return Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00]);
}
function oversizedBuffer(mb: number): Buffer {
  return Buffer.alloc(mb * 1024 * 1024 + 1);
}

const service = new S3EvidenceService();

async function runTests() {
  console.log('\n================================================');
  console.log('S3 EVIDENCE SERVICE OFFLINE UNIT TESTS');
  console.log('================================================\n');

  // 1. Valid JPEG accepted
  console.log('--- Test 1: Valid JPEG accepted ---');
  const r1 = service.validateEvidence('image/jpeg', 100, jpegBuffer());
  assert(r1.isValid === true, 'JPEG magic bytes accepted');
  assert(r1.resolvedContentType === 'image/jpeg', `Resolved content type is image/jpeg (got ${r1.resolvedContentType})`);

  // 2. Valid PNG accepted
  console.log('\n--- Test 2: Valid PNG accepted ---');
  const r2 = service.validateEvidence('image/png', 200, pngBuffer());
  assert(r2.isValid === true, 'PNG magic bytes accepted');
  assert(r2.resolvedContentType === 'image/png', `Resolved content type is image/png (got ${r2.resolvedContentType})`);

  // 3. Valid WebP accepted
  console.log('\n--- Test 3: Valid WebP accepted ---');
  const r3 = service.validateEvidence('image/webp', 300, webpBuffer());
  assert(r3.isValid === true, 'WebP magic bytes accepted');
  assert(r3.resolvedContentType === 'image/webp', `Resolved content type is image/webp (got ${r3.resolvedContentType})`);

  // 4. Oversized file rejected
  console.log('\n--- Test 4: Oversized file (> 5 MB) rejected ---');
  const r4 = service.validateEvidence('image/jpeg', 6 * 1024 * 1024, oversizedBuffer(6));
  assert(r4.isValid === false, 'Oversized file rejected');
  assert(r4.error !== undefined && r4.error.includes('5 MB'), `Error mentions 5 MB limit (got: ${r4.error})`);

  // 5. Unsupported MIME (executable) rejected
  console.log('\n--- Test 5: Executable file rejected ---');
  const r5 = service.validateEvidence('application/octet-stream', 100, executableBuffer());
  assert(r5.isValid === false, 'Executable magic bytes rejected');

  // 6. HTML/SVG content rejected
  console.log('\n--- Test 6: HTML/text file rejected ---');
  const htmlBuffer = Buffer.from('<html><body>hacked</body></html>');
  const r6 = service.validateEvidence('image/jpeg', htmlBuffer.length, htmlBuffer);
  assert(r6.isValid === false, 'HTML file rejected by magic byte check even with image/* MIME type');

  // 7. Safe object key generation - no path traversal
  console.log('\n--- Test 7: Safe object key generation ---');
  const key1 = service.generateObjectKey('CS-2026-ABCD', 'image/jpeg');
  assert(key1.startsWith('evidence/CS-2026-ABCD/'), `Key starts with correct prefix (got: ${key1})`);
  assert(key1.endsWith('.jpg'), `Key ends with .jpg (got: ${key1})`);
  assert(!key1.includes('..'), 'Key contains no path traversal');
  assert(!key1.includes(' '), 'Key contains no spaces');

  // 8. Unsafe reportId sanitized in key
  console.log('\n--- Test 8: Unsafe reportId sanitized in generated key ---');
  const key2 = service.generateObjectKey('../../../etc/passwd', 'image/png');
  assert(!key2.includes('..'), `Key sanitized from path traversal (got: ${key2})`);
  assert(!key2.includes('/etc/'), `Key does not contain /etc/ (got: ${key2})`);
  assert(key2.endsWith('.png'), `Key ends with .png (got: ${key2})`);

  // 9. Empty buffer rejected
  console.log('\n--- Test 9: Empty buffer rejected ---');
  const r9 = service.validateEvidence('image/jpeg', 0, Buffer.alloc(0));
  assert(r9.isValid === false, 'Empty buffer rejected (no valid magic bytes)');

  console.log('\n================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});

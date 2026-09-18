import { DynamoDbReportRepository } from '../src/repositories/dynamoDbReportRepository.js';
import { Report } from '../src/types/index.js';

// Ensure we use the correct table
process.env.AWS_REGION = 'ap-south-1';
process.env.DYNAMODB_TABLE_NAME = 'CampusSOS-Reports';
process.env.PERSISTENCE_MODE = 'dynamodb';

async function runTests() {
  console.log('--- Starting DynamoDB Integration Tests ---');
  const repo = new DynamoDbReportRepository();

  const testId = `CS-TEST-${Date.now()}`;
  const now = new Date().toISOString();

  const testReport: Report = {
    reportId: testId,
    description: 'Test fire in lab',
    category: 'Fire',
    priority: 'CRITICAL',
    summary: 'A small test fire',
    recommendedAction: 'Extinguish',
    department: 'Safety',
    status: 'OPEN',
    createdAt: now,
    updatedAt: now
  };

  try {
    console.log(`1. Creating test report ${testId}...`);
    await repo.create(testReport);
    console.log('✅ Create successful');

    console.log(`2. Getting test report ${testId}...`);
    const fetched = await repo.getById(testId);
    if (!fetched || fetched.reportId !== testId) {
      throw new Error('Get failed or mismatched ID');
    }
    console.log('✅ Get successful');

    console.log('3. Listing reports (testing filter by OPEN)...');
    const list = await repo.list({ status: 'OPEN', limit: 10 });
    const foundInList = list.find(r => r.reportId === testId);
    if (!foundInList) {
      throw new Error('List failed to find the created report');
    }
    console.log('✅ List successful');

    console.log('4. Updating report status to IN_PROGRESS...');
    const updatedTime = new Date().toISOString();
    const updated = await repo.updateStatus(testId, 'IN_PROGRESS', updatedTime);
    if (!updated || updated.status !== 'IN_PROGRESS' || updated.updatedAt !== updatedTime) {
      throw new Error('Update failed or returned incorrect data');
    }
    console.log('✅ Update successful');

    // Clean up manually using docClient to keep the repository clean (or we could just leave it as it's a test record, but instructions say "clean up only the test item")
    console.log(`5. Cleaning up test record ${testId}...`);
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, DeleteCommand } = await import('@aws-sdk/lib-dynamodb');
    
    const client = new DynamoDBClient({ region: 'ap-south-1' });
    const docClient = DynamoDBDocumentClient.from(client);
    await docClient.send(new DeleteCommand({
      TableName: 'CampusSOS-Reports',
      Key: { reportId: testId }
    }));
    console.log('✅ Cleanup successful');

    console.log('--- All DynamoDB tests passed! ---');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();

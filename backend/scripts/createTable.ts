import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

const REGION = process.env.AWS_REGION || 'ap-south-1';
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'CampusSOS-Reports';

const client = new DynamoDBClient({ region: REGION });

async function createTable() {
  console.log(`Checking if table ${TABLE_NAME} exists in ${REGION}...`);
  try {
    const describeCommand = new DescribeTableCommand({ TableName: TABLE_NAME });
    const response = await client.send(describeCommand);
    console.log(`Table ${TABLE_NAME} already exists.`);
    console.log(`Status: ${response.Table?.TableStatus}`);
    console.log(`ARN: ${response.Table?.TableArn}`);
    return;
  } catch (error: any) {
    if (error.name !== 'ResourceNotFoundException') {
      console.error('Error checking table:', error);
      process.exit(1);
    }
  }

  console.log(`Creating table ${TABLE_NAME}...`);
  try {
    const createCommand = new CreateTableCommand({
      TableName: TABLE_NAME,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        {
          AttributeName: 'reportId',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'reportId',
          KeyType: 'HASH',
        },
      ],
    });

    await client.send(createCommand);
    console.log(`Table creation initiated.`);
    
    // Wait for table to be active
    console.log('Waiting for table to become ACTIVE...');
    let active = false;
    let arn = '';
    while (!active) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const describeCommand = new DescribeTableCommand({ TableName: TABLE_NAME });
      const response = await client.send(describeCommand);
      if (response.Table?.TableStatus === 'ACTIVE') {
        active = true;
        arn = response.Table.TableArn || '';
      }
    }
    
    console.log(`Table ${TABLE_NAME} is now ACTIVE!`);
    console.log(`ARN: ${arn}`);
  } catch (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  }
}

createTable();

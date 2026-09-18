import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  ScanCommand, 
  UpdateCommand 
} from '@aws-sdk/lib-dynamodb';
import { Report, ReportFilters, ReportStatus } from '../types/index.js';
import { ReportRepository } from './reportRepository.js';

export class DynamoDbReportRepository implements ReportRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const region = process.env.AWS_REGION || 'ap-south-1';
    this.tableName = process.env.DYNAMODB_TABLE_NAME || 'CampusSOS-Reports';
    
    const client = new DynamoDBClient({ region });
    this.docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });
  }

  async create(report: Report): Promise<Report> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: report,
        ConditionExpression: 'attribute_not_exists(reportId)',
      });
      await this.docClient.send(command);
      return report;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error(`Report with ID ${report.reportId} already exists.`);
      }
      throw error;
    }
  }

  async getById(reportId: string): Promise<Report | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { reportId },
    });
    const response = await this.docClient.send(command);
    return (response.Item as Report) || null;
  }

  async list(filters?: ReportFilters): Promise<Report[]> {
    let items: Report[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;

    // Build filter expression
    let FilterExpression: string | undefined = undefined;
    const ExpressionAttributeNames: Record<string, string> = {};
    const ExpressionAttributeValues: Record<string, any> = {};

    const filterParts: string[] = [];
    if (filters?.status) {
      filterParts.push('#status = :status');
      ExpressionAttributeNames['#status'] = 'status';
      ExpressionAttributeValues[':status'] = filters.status;
    }
    if (filters?.priority) {
      filterParts.push('#priority = :priority');
      ExpressionAttributeNames['#priority'] = 'priority';
      ExpressionAttributeValues[':priority'] = filters.priority;
    }
    
    if (filterParts.length > 0) {
      FilterExpression = filterParts.join(' AND ');
    }

    // Paginate through all results
    do {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression,
        ExpressionAttributeNames: Object.keys(ExpressionAttributeNames).length > 0 ? ExpressionAttributeNames : undefined,
        ExpressionAttributeValues: Object.keys(ExpressionAttributeValues).length > 0 ? ExpressionAttributeValues : undefined,
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const response: any = await this.docClient.send(command);
      if (response.Items) {
        items = items.concat(response.Items as Report[]);
      }
      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Sort newest first (descending createdAt) in memory since Scan doesn't guarantee order
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply limit if specified
    if (filters?.limit && filters.limit > 0) {
      items = items.slice(0, filters.limit);
    }

    return items;
  }

  async updateStatus(reportId: string, status: ReportStatus, updatedAt: string): Promise<Report | null> {
    try {
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { reportId },
        UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
        ConditionExpression: 'attribute_exists(reportId)',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#updatedAt': 'updatedAt'
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':updatedAt': updatedAt
        },
        ReturnValues: 'ALL_NEW'
      });

      const response = await this.docClient.send(command);
      return (response.Attributes as Report) || null;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        return null; // Equivalent to not found in our abstraction
      }
      throw error;
    }
  }
}

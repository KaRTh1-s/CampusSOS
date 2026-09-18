# CampusSOS Backend

## Status: PLANNED (To be initialized in Phase 4)

### Target Stack:
- **Runtime**: Node.js 20+ / TypeScript
- **Compute**: AWS Lambda functions (Serverless)
- **API**: Amazon API Gateway (REST API)
- **Database Client**: AWS SDK v3 for DynamoDB (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`)
- **AI Client**: AWS SDK v3 for Bedrock Runtime (`@aws-sdk/client-bedrock-runtime`)

### Planned Handlers:
- `analyzeIssue`: Calls Amazon Bedrock with system prompts enforcing safety constraints and structured JSON extraction.
- `createReport`: Generates unique report ID, persists structured record to DynamoDB.
- `listReports`: Retrieves and filters incidents from DynamoDB for the admin interface.
- `getReportById`: Retrieves individual report details.
- `updateReportStatus`: Updates report lifecycle state (OPEN -> IN_PROGRESS -> RESOLVED).

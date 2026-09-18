# CampusSOS Infrastructure as Code (IaC)

## Status: PLANNED (To be initialized in Phase 10)

### Target Stack:
- **Hosting**: AWS Amplify Hosting for static React frontend.
- **API & Compute**: AWS SAM / CloudFormation / AWS CDK or lightweight deployment automation.
- **Region**: Asia Pacific (Mumbai) - `ap-south-1`
- **Cost Policy**: 100% Serverless on-demand tier (DynamoDB On-Demand, Lambda Pay-per-invocation, Bedrock pay-per-token). Zero idle infrastructure costs.

### Planned Resources:
- Amazon DynamoDB Table: `CampusSOS-Reports` (Partition Key: `reportId`, GSI: `status-createdAt-index`)
- AWS Lambda Execution Roles (Least-privilege IAM policies for Bedrock and DynamoDB)
- Amazon API Gateway HTTP/REST API with CORS configuration

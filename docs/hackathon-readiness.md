# CampusSOS Hackathon Readiness

This document outlines the current state of the CampusSOS MVP for hackathon demonstration purposes, explicitly delineating what is fully functional, what is mocked, and what remains to be implemented for a production deployment.

## 1. Architecture & General Status
The application follows a serverless React + Node.js (Lambda-compatible) + DynamoDB architecture.
- **Frontend**: React SPA (Vite)
- **Backend**: Node.js API simulating Lambda + API Gateway integration locally.
- **Data Persistence**: Real Amazon DynamoDB table in `ap-south-1`.
- **AI Engine**: Amazon Bedrock (Anthropic Claude).

## 2. Working Now (Demonstrable)
The following features are **fully implemented and working**:
- **Student Reporting Flow**: Submitting natural language descriptions of campus issues.
- **Validation**: Strict boundary checks on payload size (10-2000 chars) and data types.
- **Mock AI Fallback**: If Bedrock is unavailable, `MockAnalysisService` accurately simulates AI assessment and JSON parsing.
- **DynamoDB Persistence**: Reports are saved, retrieved, listed, and updated in real-time to the `CampusSOS-Reports` table.
- **Admin Dashboard**: Live incident tracking, status mutation (`OPEN` -> `IN_PROGRESS` -> `RESOLVED`), client-side filtering, and priority visualization.
- **CORS Protection**: The local API restricts CORS strictly to `http://localhost:5173`.

## 3. Implemented but AWS Access Pending
The following is fully coded but requires AWS account verification to function live:
- **Amazon Bedrock AI**: The `BedrockAnalysisService` is implemented. It injects a system prompt, queries Claude 3, and safely parses/validates the returned JSON. Live invocation fails until AWS grants model access, so the app defaults to `ANALYSIS_MODE=mock`.

## 4. Security Status
### Current Protections
- **No Hardcoded Secrets**: Secrets are kept out of source code.
- **Input Validation**: Backend strictly validates all inputs, rejecting malformed JSON and out-of-bounds strings.
- **Idempotency & Transitions**: Status transitions are enforced at the backend level. The frontend cannot arbitrarily set invalid states (e.g. `RESOLVED` to `OPEN`).
- **XSS Prevention**: React frontend renders text safely; no usage of `dangerouslySetInnerHTML`.
- **DynamoDB Safety**: No destructive API calls (`DeleteTable`, `UpdateTable`) are exposed in the runtime API. Updates are scoped and Conditional expressions (`attribute_not_exists`) prevent overwriting.

### Known Limitations (Hackathon Waivers)
- **Authentication**: The `/admin` portal is entirely unauthenticated. Anyone with the URL can view and manage incidents.
- **Rate Limiting**: There is no API Gateway or WAF enforcing rate limits.

## 5. Future Production Work (Post-Hackathon)
To transition this MVP to a production-grade application, the following must be implemented:
1. **AWS Cognito Authentication**: Secure the admin dashboard and introduce Role-Based Access Control (RBAC).
2. **AWS API Gateway Deployment**: Deploy the API handlers as true Lambda functions behind an API Gateway with WAF and rate limiting.
3. **IAM Least Privilege**: Finalize the exact IAM Execution Roles for the Lambda functions rather than using local developer credentials.
4. **S3 Image Uploads**: Implement pre-signed URLs to allow students to attach photos securely.
5. **Production Build Hosting**: Host the React frontend on AWS Amplify.

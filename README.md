# CampusSOS

## Overview
CampusSOS is an AI-powered campus safety and support reporting platform built for students and campus administration. It eliminates the friction of navigating complex ticketing systems by allowing students to report hazards and issues using natural language. 

## Problem
College and university students frequently encounter safety hazards and facility issues across campus, such as exposed wiring, water leaks, or security concerns. When these occur, students face friction:
1. **Uncertain Categorization**: They don't know the exact technical category.
2. **Ambiguous Urgency**: They don't know whether an issue requires immediate evacuation or standard ticketing.
3. **Department Confusion**: They don't know whether to contact Campus Security, Maintenance, or the Health Center.
4. **Lack of Immediate Safety Advice**: Students may accidentally endanger themselves by tampering with damaged equipment.

## Solution
CampusSOS provides a simple, intelligent single-entry interface where students describe incidents in everyday language. Using Amazon Bedrock, CampusSOS immediately categorizes the issue, assigns a standardized severity priority, distills a concise summary for personnel, provides immediate safety instructions, and routes the issue to the appropriate department.

## Key Features
- **Natural Language Reporting**: Students report issues as if they were texting a friend.
- **AI Triage**: Amazon Bedrock analyzes reports to determine category and priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- **Immediate Safety Guidance**: AI generates life-safety instructions (e.g., "Move away from the area. Do not touch exposed wires.") before submission.
- **Private S3 Evidence Upload**: Students can attach photo evidence, which is securely stored in a private bucket with short-lived presigned URLs for admin viewing.
- **Admin Dashboard**: Real-time incident tracking and status management (`OPEN`, `IN_PROGRESS`, `RESOLVED`).

## How It Works
1. **Student Submission**: The student types a description of the hazard and optionally attaches a photo.
2. **AI Analysis**: The backend requests an analysis from Amazon Bedrock.
3. **Review & Confirm**: The student reviews the AI's triage and safety advice, then submits.
4. **Persistence & Routing**: The report is persisted in Amazon DynamoDB. Any attached evidence is streamed to Amazon S3.
5. **Admin Triage**: Administrators view incidents on a centralized dashboard and update statuses as issues are resolved.

## Architecture
The application uses a serverless, decoupled architecture. 
- **Frontend**: React 18 SPA (Vite)
- **Backend API**: Node.js REST API
- **Service Abstraction**: The backend utilizes a service layer (`AnalysisService`, `ReportService`, `S3EvidenceService`) to cleanly decouple business logic from HTTP handling and allow active fallbacks.

## AWS Services
- **Amazon DynamoDB**: Used for resilient, serverless incident and report persistence (`CampusSOS-Reports` table).
- **Amazon S3**: Used for private evidence storage (`campussos-evidence-ap-south-1` bucket) utilizing Block Public Access and short-lived presigned GET URLs.
- **Amazon Bedrock**: Integrated for AI-powered natural language incident analysis. (See AI section below).

## AI / Amazon Bedrock
The `BedrockAnalysisService` invokes Amazon Bedrock models (e.g., Anthropic Claude, Amazon Nova) to parse unstructured text into a strict JSON schema containing the category, priority, summary, recommended action, and department. 
> **Note on Bedrock Access**: The full Bedrock integration is implemented. However, due to AWS account/model access verification delays, the local backend currently defaults to an active `MockAnalysisService` fallback to ensure continuous evaluation and demonstration without hard-blocking the workflow.

## Student Workflow
1. Navigate to the main portal `/`.
2. Enter the issue description and location.
3. Optionally select an image file (JPEG, PNG, WebP).
4. Click **Analyze Issue**.
5. Review the AI-generated assessment.
6. Click **Create Report** to finalize submission.

## Admin Workflow
1. Navigate to `/admin`.
2. View real-time statistics (Total, Open, In Progress, Resolved).
3. Filter reports by status or priority.
4. Click on any report to view the original text, AI assessment, and any attached evidence.
5. Update the status using the dropdown selector.

## Evidence Upload
Evidence upload is mediated entirely by the backend for security:
- **Validation**: Strict server-side magic-byte checking and 5 MB size limits.
- **Storage**: S3 objects are entirely private.
- **Access**: The admin dashboard requests a 5-minute pre-signed S3 URL to view the image, ensuring no permanent public links exist.

## Security
- **No Exposed Credentials**: AWS credentials are mathematically isolated from the frontend.
- **Private S3**: Bucket has Block Public Access fully enabled.
- **Backend Validation**: Strict length bounds on descriptions (10-2000 chars) prevent buffer exhaustion and token-cost spikes.
- **Adversarial Prompt Defense**: AI instructions isolate student input to prevent prompt injection.
> **Limitations**: Administrator authentication (Amazon Cognito) and production IAM roles/API Gateway deployments are planned for future phases and are not currently active in this prototype.

## Project Structure
- `frontend/`: React Vite SPA.
- `backend/`: Node.js serverless handlers, services, and AWS SDK integrations.
- `docs/`: Extensive project documentation and architecture specifications.

## Local Setup
Requirements: Node.js 20.x

1. Clone the repository.
2. Run `npm install` in both `/frontend` and `/backend` directories.

## Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```env
AWS_REGION=ap-south-1
VITE_API_BASE_URL=http://localhost:3001/api
DYNAMODB_TABLE_NAME=CampusSOS-Reports
S3_EVIDENCE_BUCKET=campussos-evidence-ap-south-1
PERSISTENCE_MODE=dynamodb
ANALYSIS_MODE=mock
BEDROCK_MODEL_ID=global.anthropic.claude-fable-5-1
```

## Running the Application
To run the local development stack:
1. Start the backend: `cd backend && npm start` (Runs on `http://localhost:3001`)
2. Start the frontend: `cd frontend && npm run dev` (Runs on `http://localhost:5173`)

## Testing
Comprehensive testing suites are included in the backend:
- Unit Tests: `npm run test:unit`
- S3 Integration: `npm run test:s3`
- DynamoDB Integration: `npm run test:dynamo`
- Bedrock Integration: `npm run test:bedrock`

## Current Limitations
- **Admin Authentication**: The `/admin` route is currently unprotected for prototype demonstration purposes.
- **AWS Deployment**: While the backend code is designed for AWS Lambda, it is currently running via a local Node.js HTTP adapter simulating API Gateway.

## Future Improvements
- Deploy frontend to AWS Amplify Hosting.
- Deploy backend to AWS Lambda via Amazon API Gateway.
- Implement Amazon Cognito for secure administrator authentication.
- Implement Amazon SNS for SMS/Email notifications on critical incidents.

## Hackathon Context
Built for **WeMakeDevs × AWS First Commit (Bharat Builds Tour, September 17–20, 2026)**.

## Team
*[Team details to be filled in]*

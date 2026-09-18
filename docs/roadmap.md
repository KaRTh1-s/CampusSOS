# CampusSOS Development Roadmap

> **Hackathon**: WeMakeDevs × AWS First Commit | Bharat Builds Tour (Sept 17–20, 2026)  
> **Development Strategy**: Iterative, demo-first, serverless architecture.

---

## Phases Overview

| Phase | Description | Status | Deliverables |
|---|---|---|---|
| **Phase 1** | **Project Foundation & Architecture** | **COMPLETED (Part 1)** | Git repo init, strict `.gitignore`, root package.json, complete architectural specs, API contracts, DB schemas, UI plan, and testing strategy. Zero AWS cost incurred. |
| **Phase 2** | **Frontend Shell & UI Design System** | **COMPLETED (Part 2)** | Vite + React + TypeScript setup, clean CSS design tokens, accessible student submission form, AI analysis cards, and layout responsive across devices. |
| **Phase 3** | **Student Reporting Workflow (Mocked AI)** | **COMPLETED (Part 2)** | End-to-end student flow using deterministic mock AI responses (`mockAnalysisService`), safe `localStorage` persistence, error boundaries, and confirmation view. |
| **Phase 4** | **Backend API & Lambda Scaffolding** | **NEXT (Part 3)** | Serverless handlers for `/analyze` and `/reports` with robust input validation, error handling middleware, and standard error response schemas. |
| **Phase 5** | **DynamoDB Persistence Integration** | *PLANNED* | Connect `createReport`, `listReports`, and `updateReportStatus` handlers to DynamoDB with on-demand capacity and status-createdAt index. |
| **Phase 6** | **Amazon Bedrock AI Integration** | *PLANNED* | Real-time Bedrock invocation with Amazon Nova / Titan in `ap-south-1`. System prompt engineering for classification, priority, safety actions, and strict JSON output. |
| **Phase 7** | **Admin Incident Dashboard** | *PLANNED* | Admin UI with live metrics (Total, Open, In Progress, Resolved), incident search, multi-criteria filtering, and one-click status transitions. |
| **Phase 8** | **Production Security & Validation** | *PLANNED* | Strict CORS setup, credential exposure audit, least-privilege IAM policy validation, rate limiting considerations, and payload size guards. |
| **Phase 9** | **Optional S3 Evidence Upload** | *PLANNED* | Pre-signed URL upload flow for student photo attachments stored in private Amazon S3 bucket. |
| **Phase 10** | **AWS Cloud Deployment** | *PLANNED* | Deploy backend via CloudFormation / SAM / CDK and host frontend via AWS Amplify Hosting in `ap-south-1`. |
| **Phase 11** | **End-to-End Testing & Bug Squashing** | *PLANNED* | Edge case testing (critical hazards, injection attempts, network dropouts, empty queries), browser cross-compatibility checks. |
| **Phase 12** | **README & Hackathon Documentation** | *PLANNED* | Comprehensive project documentation, AWS architecture breakdown, problem statement, AI disclosure, and license attribution. |
| **Phase 13** | **3-Minute Demo Preparation** | *PLANNED* | Timed script, demo flow rehearsed: problem -> report creation -> Bedrock analysis -> DynamoDB storage -> Admin triage -> AWS console verification. |
| **Phase 14** | **Final Submission Checklist** | *PLANNED* | Public GitHub repo sanity check, video upload link verification, hackathon submission portal compliance. |

# CampusSOS Technical Architecture

> **Document Status**: Final Architecture Specification (Hackathon Submission)
> **Deployment Status**: Backend API running locally with live DynamoDB and S3. Bedrock fallback mode active.
> **Target Region**: Asia Pacific (Mumbai) - `ap-south-1`

---

## 1. System Overview

**CampusSOS** is an AI-powered campus safety and support reporting platform built for students and campus administrators. When students encounter incidents or hazards—ranging from electrical fires to hostel maintenance or lost ID cards—they often struggle to categorize the issue, assess urgency, or determine the correct department to contact.

CampusSOS solves this by allowing students to describe issues in plain, natural language. An integrated AI pipeline powered by **Amazon Bedrock** classifies the category, assigns a standardized urgency priority, produces an objective incident summary, and returns an immediate safety recommendation. The student reviews this structured analysis and confirms submission, creating an actionable incident record stored in **Amazon DynamoDB** for administrators to triage, assign, and resolve.

---

## 2. High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Client Layer"]
        Student["Student Browser"]
        Admin["Admin Browser"]
    end

    subgraph APILayer["Local Backend API"]
        LocalServer["Local Node.js HTTP Server\n(Simulates API Gateway)"]
    end

    subgraph ServiceLayer["Service Layer & Fallbacks"]
        AnalysisSvc["AnalysisService"]
        MockBedrock["MockAnalysisService\n(Active Fallback)"]
        RealBedrock["BedrockAnalysisService\n(Implemented, Pending AWS Access)"]
        ReportSvc["ReportService"]
        EvidenceSvc["S3EvidenceService"]
    end

    subgraph Database["Data Persistence (Live AWS)"]
        DDB[("Amazon DynamoDB\nCampusSOS-Reports")]
    end

    subgraph Storage["Storage (Live AWS)"]
        S3[("Amazon S3\ncampussos-evidence-ap-south-1\n(Private Block Public Access)")]
    end

    Student -->|HTTP Request| LocalServer
    Admin -->|HTTP Request| LocalServer

    LocalServer -->|POST /analyze| AnalysisSvc
    AnalysisSvc -.-> RealBedrock
    AnalysisSvc -->|Fallback| MockBedrock

    LocalServer -->|POST /reports\n(Multipart)| ReportSvc
    LocalServer -->|POST /reports\n(Multipart)| EvidenceSvc

    ReportSvc -->|PutItem, Query, UpdateItem| DDB
    EvidenceSvc -->|PutObject| S3
    
    LocalServer -->|GET /reports/{id}/evidence| EvidenceSvc
    EvidenceSvc -->|Generate Presigned URL| S3
```

### Abstraction Rationale
The `AnalysisService` abstraction is critical for development reliability. Because live Amazon Bedrock invocation is currently restricted pending AWS account verification, the application cleanly falls back to `MockAnalysisService`. This guarantees that the core product flow remains functional and testable without hard-blocking the frontend or database development on third-party API approval.


---

## 3. Frontend Architecture

- **Framework**: React 18 with TypeScript.
- **Build Tool**: Vite for rapid development and lightweight bundles.
- **Design System**: Vanilla CSS tokens (CSS Variables) prioritizing:
  - Clean typography, high contrast, and accessible UI (WCAG AA).
  - Modern aesthetic with subtle glassmorphism and crisp visual hierarchy.
  - Mobile-responsive layout for on-the-go student submissions.
  - No bloated CSS frameworks to maintain complete styling control and minimal bundle size.
- **Client State**:
  - `IssueSubmissionContext`: Holds active issue draft, AI analysis response, validation state, and submission progress.
  - `AdminViewContext`: Holds filter criteria (status, priority), cached report queries, and selection state.
- **API Client**: Modular fetch wrapper with centralized error handling, request timeouts, and automatic JSON parsing.

---

## 4. Backend Architecture

- **Runtime**: Node.js 20.x on AWS Lambda (Serverless).
- **Execution Model**: Event-driven micro-handlers matching API Gateway routes.
- **Layered Architecture & Separation of Concerns**:

```
Frontend (React 18 + Vite SPA)
       |
       | [Live HTTP Requests]
       v
Local HTTP Server (localDevServer.ts)
       |
AWS Lambda Handlers (analyze.ts, createReport.ts, listReports.ts, getReport.ts, updateReportStatus.ts, getEvidenceUrl.ts)
       |
Service Layer
 ├── AnalysisService
 │     ├── MockAnalysisService       <-- [Active Fallback]
 │     └── BedrockAnalysisService    <-- [Implemented, Pending AWS Access]
 ├── ReportService
 │     └── DynamoDBReportRepository  <-- [Live AWS Integration]
 └── S3EvidenceService               <-- [Live AWS Integration]
```

### Key Modules Implemented (Part 3):
1. `analyze.ts`: Accepts natural language text, validates bounds (10–2000 chars), invokes `AnalysisService`, and returns structured JSON output.
2. `createReport.ts`: Validates all required fields, generates collision-resistant `CS-2026-XXXX` report ID, sets initial status to `OPEN`, and persists via `ReportService`.
3. `listReports.ts`: Supports filtering by `status` and `priority`, returning sorted incident lists.
4. `getReport.ts`: Point lookup for a single report by ID. Returns 404 if not found.
5. `updateReportStatus.ts`: Validates status transitions (`OPEN` -> `IN_PROGRESS` -> `RESOLVED`), updates `updatedAt` timestamp, and prevents invalid backward transitions (e.g. `RESOLVED` -> `OPEN`).

### Prompt Injection & Untrusted Data Boundary:
- The backend treats all student inputs as **untrusted data**.
- The AI layer is architected such that user text is injected strictly within isolated data markers (e.g. `<student_report>...</student_report>`).
- User input is never evaluated as code, and system safety constraints cannot be overridden by text inside the report description.

---

## 5. API Architecture

All endpoints communicate via standard HTTPS JSON payloads through Amazon API Gateway.

| Method | Endpoint | Description | Auth / Access |
|---|---|---|---|
| `POST` | `/analyze` | Sends issue text to Bedrock AI (or Mock Fallback); returns category, priority, summary, and action | Public (Student) |
| `POST` | `/reports` | Persists confirmed report into DynamoDB. Parses multipart/form-data for optional evidence upload to S3. | Public (Student) |
| `GET` | `/reports` | Lists submitted reports with optional `status` filter | Admin |
| `GET` | `/reports/{id}` | Retrieves full incident record by `reportId` | Admin / Student |
| `PATCH` | `/reports/{id}/status` | Updates incident status (`OPEN`, `IN_PROGRESS`, `RESOLVED`) | Admin |
| `GET` | `/reports/{id}/evidence`| Retrieves a short-lived presigned S3 GET URL for viewing evidence | Admin |

*(See [api_contract.md](file:///d:/CampusSOS/docs/api_contract.md) for full schema specifications).*

---

## 6. AI Architecture & Safety Guardrails

### 6.1 Model Selection
- Primary: **Amazon Nova Micro / Lite** (or Amazon Titan Text Premier / Anthropic Claude 3 Haiku depending on availability in `ap-south-1`).
- Cost-conscious selection: Low-latency, cost-effective inference ideal for classification and extraction tasks.

### 6.2 Output Contract
Amazon Bedrock is instructed to respond strictly in valid JSON conforming to:
```json
{
  "category": "Electrical Safety",
  "priority": "CRITICAL",
  "summary": "Smoke has been reported from an electrical panel.",
  "recommendedAction": "Move away from the affected area and contact appropriate campus emergency or maintenance personnel. Do not attempt electrical repair.",
  "department": "Campus Safety / Maintenance"
}
```

### 6.3 Safety & Ethics Principles (Non-Negotiable)
1. **Routing Assistant, Not Emergency Dispatcher**: The AI is explicitly informed it is a triage and routing tool. It must never give do-it-yourself repair guidance on dangerous items (e.g., high voltage, chemical spills, gas leaks, structural collapse).
2. **De-escalation and Life Safety First**: For critical hazards (smoke, sparks, physical danger), the primary recommendation must direct individuals to evacuate and notify trained emergency staff.
3. **Presumption of Innocence / Objective Reporting**: The AI must never validate or declare accusations of criminal conduct. Descriptions such as "X stole my bag" must be neutrally classified as "Lost Property / Security Incident" without asserting guilt.
4. **Prompt Injection & Adversarial Defense**: System prompts enforce strict boundary markers, ignoring instructions embedded within the user text attempting to override system behavior.

---

## 7. Database Architecture (Amazon DynamoDB)

- **Table Name**: `CampusSOS-Reports`
- **Billing Mode**: `PAY_PER_REQUEST` (On-Demand - zero baseline idle cost).
- **Partition Key (PK)**: `reportId` (String, UUID v4).
- **Global Secondary Index (GSI)**: `status-createdAt-index`
  - GSI Partition Key: `status` (String: `OPEN` | `IN_PROGRESS` | `RESOLVED`)
  - GSI Sort Key: `createdAt` (String: ISO-8601 UTC timestamp)
  - Projection: `ALL` (to allow fast dashboard queries without secondary table lookups)

*(See [database_schema.md](file:///d:/CampusSOS/docs/database_schema.md) for complete schema design).*

---

## 8. AWS Security Architecture

1. **Zero Secret Exposure**:
   - No AWS Access Keys, Secret Keys, or session tokens are stored in source code, committed to Git, or exposed to the client browser.
   - The frontend communicates solely with the API Gateway endpoint.
2. **Least Privilege IAM Roles**:
   - Lambda execution roles are granted fine-grained permissions:
     - `bedrock:InvokeModel` scoped strictly to the selected model ARN.
     - `dynamodb:PutItem`, `GetItem`, `Query`, `UpdateItem` scoped strictly to `arn:aws:dynamodb:ap-south-1:*:table/CampusSOS-Reports*`.
     - CloudWatch Logs for logging error traces (scrubbed of sensitive user PII).
3. **Input Sanitization & Length Limits**:
   - API Gateway and Lambda validate payload bounds (descriptions strictly constrained to 10–2000 characters).
   - Prevents buffer exhaustion and runaway Bedrock token costs.

---

## 9. S3 Evidence Storage (Private)

- **S3 Bucket**: `campussos-evidence-{accountId}-ap-south-1`
- **Bucket Configuration**: Block Public Access fully enabled. Objects are completely private.
- **Upload Protocol**: The frontend uploads via `multipart/form-data` to the backend. The backend strictly validates magic-bytes (JPEG, PNG, WebP) and size (5MB max) before streaming to S3.
- **Retrieval Protocol**: Admin Dashboard fetches a short-lived (5-minute) pre-signed S3 `GET` URL to render the image. No permanent public links exist.

---

## 10. Deployment Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    participant Browser as React Frontend
    participant APIGW as API Gateway
    participant Lambda as Lambda (analyze/report)
    participant Bedrock as Amazon Bedrock
    participant DDB as DynamoDB Table

    Student->>Browser: Types "Smoke from electrical panel in Room 302"
    Student->>Browser: Clicks "Analyze Issue"
    Browser->>APIGW: POST /analyze { description, location }
    APIGW->>Lambda: Forward event
    Lambda->>Bedrock: Converse (System prompt + Issue text)
    Bedrock-->>Lambda: Structured JSON (Category, Priority, Action)
    Lambda-->>APIGW: 200 OK + JSON
    APIGW-->>Browser: AI Analysis Result
    Browser-->>Student: Displays Category: Electrical Safety, Priority: CRITICAL
    
    Student->>Browser: Reviews & Clicks "Create Report"
    Browser->>APIGW: POST /reports { description, location, category, priority, ... }
    APIGW->>Lambda: Forward create event
    Lambda->>DDB: PutItem (reportId, status: OPEN, createdAt)
    DDB-->>Lambda: Success
    Lambda-->>APIGW: 201 Created { reportId: "rep-98f2..." }
    APIGW-->>Browser: Confirmation
    Browser-->>Student: Shows "Report #rep-98f2 Submitted Successfully"
```

# CampusSOS

> **AI-Powered Campus Safety and Support Reporting Platform**  
> *Built for WeMakeDevs × AWS First Commit (Bharat Builds Tour, September 17–20, 2026)*

---

## 📌 Project Status

| Phase | Milestone | Status |
|---|---|---|
| **Phase 1** | Foundation, Architecture & Technical Specs | **COMPLETED (Part 1)** |
| **Phase 2** | Frontend Shell & Complete Student MVP UI | **COMPLETED (Part 2 - Local)** |
| **Phase 3** | Student Reporting Workflow Integration | **COMPLETED (Part 2 - Local Mock)** |
| **Phase 4** | Backend Lambda API & Handlers | **COMPLETED (Part 3 - Local)** |
| **Phase 4 (Pt. 4)** | Full Frontend ↔ Backend Local HTTP Integration | **COMPLETED (Part 4 - Local)** |
| **Phase 5**| DynamoDB Persistence Integration | **COMPLETED (Part 5 - AWS)** |
| **Phase 6**| Amazon Bedrock AI Integration | **COMPLETED (Part 6 - AWS)** |
| **Phase 7**| Admin Incident Dashboard | **COMPLETED (Part 7 - Local)** |
| **Phase 8**| Security & Validation | **COMPLETED (Part 8 - Local)** |
| **Phase 9**| Optional S3 | *PLANNED* |
| **Phase 10–14**| AWS Deployment, E2E Testing & Demo Video | *PLANNED* |

> **Current Implementation Note**:  
> - **PART 1**: Foundation and architecture complete.  
> - **PART 2**: Student frontend MVP implemented locally.  
> - **PART 3**: Backend Lambda-compatible API implemented locally.  
> - **PART 4**: Local frontend-backend integration complete. React now communicates via live HTTP requests with the Lambda-compatible backend.  
> - **PART 5**: Real DynamoDB Persistence connected to local backend using AWS SDK.
> - **PART 6**: Amazon Bedrock AI Integration implemented. (Currently running in Mock fallback mode pending AWS account verification for live access).
> - **PART 7**: Admin Incident Dashboard added to the frontend. (Authentication is NOT implemented yet; this is a hackathon prototype).
>
> **Current Local Architecture**:  
> `React SPA` $\rightarrow$ `Local HTTP API` $\rightarrow$ `Lambda Handlers` $\rightarrow$ `MockAnalysisService / InMemoryReportRepository`  
>
> **Future AWS Target**:  
> `React SPA` $\rightarrow$ `AWS Amplify` $\rightarrow$ `Amazon API Gateway` $\rightarrow$ `AWS Lambda` $\rightarrow$ `Amazon Bedrock / Amazon DynamoDB`  
>
> *AWS cloud resources are **NOT** deployed yet (zero cloud costs incurred).*

---

## Problem

College and university students frequently encounter safety hazards and facility issues across campus:
- **Safety Hazards**: Exposed high-voltage wiring, sparks, smoke, gas odors, broken glass.
- **Infrastructure & Maintenance**: Elevator breakdowns, water leaks, structural damage, broken classroom doors.
- **Residential & Hostel Issues**: Power outages, plumbing failures, lock failures.
- **Student Services**: Lost campus ID cards, accessibility obstacles for disabled students, security incidents.

In high-stress or urgent moments, students face major friction:
1. **Uncertain Categorization**: They don't know which technical category an issue belongs to.
2. **Ambiguous Urgency**: They don't know whether an issue requires immediate evacuation or standard ticketing.
3. **Department Confusion**: They don't know whether to contact Campus Security, Electrical Maintenance, Hostel Warden, or the Health Center.
4. **Lack of Immediate Safety Advice**: Students may accidentally endanger themselves by tampering with damaged equipment or standing in hazard zones.

---

## Proposed Solution

**CampusSOS** solves this problem by providing a simple, intelligent single-entry interface where students describe incidents in **natural, everyday language** (e.g., *"There is smoke coming from an electrical panel in our classroom"*).

Using **Amazon Bedrock**, CampusSOS immediately:
1. **Categorizes the issue** accurately (e.g., `Electrical Safety`).
2. **Assigns a standardized severity priority** (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
3. **Distills a concise, objective summary** for campus personnel.
4. **Provides immediate safety instructions** (e.g., *"Move away from the area immediately. Do not attempt repairs."*).
5. **Routes the issue** to the appropriate campus department.

The student reviews the AI analysis and submits the report with a single tap, generating a unique tracking ID stored in **Amazon DynamoDB**. Campus administrators monitor and triage incidents in real time through a dedicated Admin Dashboard.

---

## Target Users

1. **Students & Campus Community**: Any student, faculty member, or campus visitor needing to report hazards or facility issues quickly without bureaucratic friction.
2. **Campus Administrators & Facilities Staff**: Campus security officers, maintenance dispatchers, and hostel wardens who need a centralized dashboard to prioritize critical emergencies and track resolutions.

---

## Core Workflow

### Student Flow:
1. **Open CampusSOS**: Access the web app on any mobile or desktop browser.
2. **Describe Problem**: Enter natural language details and optional location.
3. **Analyze Issue**: Amazon Bedrock analyzes the description in real time.
4. **Review & Confirm**: The student sees the assigned category, urgency badge, summary, and immediate safety recommendations.
5. **Create Report**: The student confirms submission, receives a unique `reportId`, and sees instant submission confirmation.

### Administrator Flow:
1. **Open Admin Dashboard**: View all reported campus incidents in real time.
2. **Filter & Search**: Triage by status (`OPEN`, `IN_PROGRESS`, `RESOLVED`) or urgency (`CRITICAL`, `HIGH`).
3. **Inspect Incident**: Read student statements, AI summaries, and exact locations.
4. **Update Status**: Transition status from `OPEN` to `IN_PROGRESS` or `RESOLVED`.

---

## MVP Features

| Feature | Description | Implementation Status |
|---|---|---|
| **Natural Language Issue Submission** | Free-form text input with length validation and location tagging. | **Implemented (Local MVP)** |
| **AI Triage & Classification** | Categorization, priority assignment, and summary via Amazon Bedrock. | *Mocked Locally (Phase 2); Real Bedrock Planned (Phase 6)* |
| **Safety Guidance Callout** | Immediate life-safety actions generated to prevent hazardous DIY interventions. | **Implemented (Local MVP)** |
| **Unique Incident ID Tracking** | Collision-resistant format (`CS-2026-XXXX`) with clipboard copy. | **Implemented (Local MVP)** |
| **Persistent Data Storage** | Safe local persistence with DynamoDB planned for Phase 5. | **Implemented Locally (`localStorage`); DynamoDB Planned (Phase 5)** |
| **Admin Incident Management** | Real-time dashboard with status toggles (`OPEN` / `IN_PROGRESS` / `RESOLVED`). | *Planned (Phase 7)* |
| **Evidence / Photo Upload** | Direct-to-S3 pre-signed upload for photo evidence. | *Planned (Phase 9 - Future)* |

---

## Planned AWS Architecture

The CampusSOS architecture is designed to be **100% serverless, cost-conscious, and reliable**:

```
[ Student / Admin Web Browser ]
              |
              v (HTTPS)
     [ AWS Amplify Hosting ]
              |
              v (API Requests)
     [ Amazon API Gateway ]
              |
              v
       [ AWS Lambda ]
        |          \
        |           \
        v            v
[ Amazon Bedrock ]  [ Amazon DynamoDB ]
(Nova / Titan AI)   (CampusSOS-Reports Table)
```

- **Hosting**: AWS Amplify Hosting (Static React distribution).
- **API**: Amazon API Gateway (REST API routing, throttling, CORS).
- **Compute**: AWS Lambda (Node.js 20.x serverless handlers).
- **AI Engine**: Amazon Bedrock (`ap-south-1` Asia Pacific - Mumbai) using Amazon Nova Micro/Lite or Titan models for structured JSON triage.
- **Database**: Amazon DynamoDB with On-Demand capacity (`PAY_PER_REQUEST`) and a `status-createdAt-index` Global Secondary Index.
- **Storage (Future Phase 9)**: Amazon S3 with pre-signed URLs for photo evidence.

---

## Technology Stack

### Frontend:
- **Framework**: React 18
- **Language**: TypeScript
- **Bundler**: Vite
- **Styling**: Vanilla CSS Design System with CSS Custom Properties (zero framework bloat)
- **Accessibility**: Semantic HTML5, WCAG AA compliant contrast and keyboard navigation

### Backend:
- **Runtime**: Node.js 20.x
- **Language**: TypeScript
- **Compute**: AWS Lambda
- **SDK**: AWS SDK for JavaScript v3 (`@aws-sdk/client-bedrock-runtime`, `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`)

### Cloud & Database:
- **Cloud Provider**: Amazon Web Services (AWS)
- **Primary Region**: Asia Pacific (Mumbai) - `ap-south-1`
- **Database**: Amazon DynamoDB
- **Generative AI**: Amazon Bedrock
- **API Gateway**: Amazon API Gateway

---

## Security Considerations

1. **Zero Credential Exposure**:
   - No AWS Access Keys, Secret Keys, or credentials exist in source code, repository commits, or browser bundles.
   - Frontend accesses AWS services exclusively through authenticated/scoped API Gateway routes.
2. **Least-Privilege IAM Execution Roles**:
   - Lambda execution roles are strictly scoped to `bedrock:InvokeModel` and explicit table ARN actions on `CampusSOS-Reports`.
3. **Safety & Ethical AI Guardrails**:
   - CampusSOS is a **reporting and routing assistant**, not an emergency dispatcher, legal authority, or law enforcement agency.
   - AI instructions strictly forbid dangerous DIY repair recommendations (e.g. electrical or chemical tampering).
   - Accusations of crimes are treated objectively as reported security events without legal assertions of guilt.
4. **Input Sanitization & Abuse Prevention**:
   - Input length limits (10 to 2000 characters) prevent buffer exhaustion and runaway Bedrock token costs.
   - System prompts are hardened against prompt injection attempts.

---

## Development Phases

- **Phase 1: Project Foundation & Architecture** *(Current - Completed)*
- **Phase 2: Frontend Shell & UI Design System** *(Next)*
- **Phase 3: Student Reporting Workflow (Mocked AI)**
- **Phase 4: Backend API & Lambda Scaffolding**
- **Phase 5: DynamoDB Persistence Integration**
- **Phase 6: Amazon Bedrock AI Integration**
- **Phase 7: Admin Incident Dashboard**
- **Phase 8: Production Security & Validation**
- **Phase 9: Optional S3 Evidence Upload**
- **Phase 10: AWS Cloud Deployment**
- **Phase 11: End-to-End Testing & Bug Squashing**
- **Phase 12: README & Hackathon Documentation**
- **Phase 13: 3-Minute Demo Preparation**
- **Phase 14: Final Submission Checklist**

*(See [docs/roadmap.md](file:///d:/CampusSOS/docs/roadmap.md) for full phase details).*

---

## Hackathon Compliance

- **Hackathon**: WeMakeDevs × AWS First Commit | Bharat Builds Tour (Sept 17–20, 2026).
- **Newly Built Constraint**: Repository initialized during the hackathon period with clean git history starting with Part 1 foundation.
- **Genuine AWS Usage**: AWS is central to core functionality: Amazon Bedrock performs generative triage and categorization; Amazon DynamoDB provides persistent storage; AWS Lambda and API Gateway handle serverless compute.
- **Cost Discipline**: Serverless pay-per-request architecture guarantees zero idle costs and operates strictly within AWS Free Tier limits.
- **AI Tooling Disclosure**: AI development assistance tools utilized during architecture and development will be fully disclosed in the final submission writeup.
- **Open Source Licensing**: Released under the [MIT License](file:///d:/CampusSOS/LICENSE).

---

## Documentation Index

- 📘 [System Architecture & Diagrams](file:///d:/CampusSOS/docs/architecture.md)
- 🔌 [API Contract Specification](file:///d:/CampusSOS/docs/api_contract.md)
- 🗄️ [DynamoDB Database Schema](file:///d:/CampusSOS/docs/database_schema.md)
- 🎨 [UI & Page Architecture](file:///d:/CampusSOS/docs/ui_design.md)
- 🧪 [Testing & QA Strategy](file:///d:/CampusSOS/docs/testing_strategy.md)
- 🗺️ [14-Phase Development Roadmap](file:///d:/CampusSOS/docs/roadmap.md)

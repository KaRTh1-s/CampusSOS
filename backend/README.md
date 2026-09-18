# CampusSOS Backend

> **AWS Lambda-Compatible Serverless Backend**  
> Target Runtime: Node.js 20.x | Language: TypeScript

---

## 📌 Architecture & Design Principles

The CampusSOS backend follows a clean layered architecture with strict separation of concerns:

```
[ HTTP / AWS Lambda Proxy Event ]
               |
               v
        [ Lambda Handler ]
  (e.g., analyze.ts, createReport.ts)
               |
               v
        [ Service Layer ]
  (AnalysisService, ReportService)
         |              \
         v               v
  [ AI Provider ]   [ Repository ]
  - Mock (current)   - InMemory (current)
  - Bedrock (future) - DynamoDB (future)
```

### Key Architectural Rules:
1. **Decoupled Handlers**: Handlers only parse Lambda proxy events, invoke validation utilities, delegate to services, and format standardized responses. No direct business logic or DB calls in handlers.
2. **Pluggable AI Provider**: `AnalysisService` interface decouples `MockAnalysisService` (used in local development and testing) from the future `BedrockAnalysisService` (Phase 6).
3. **Pluggable Persistence**: `ReportRepository` interface decouples `InMemoryReportRepository` (used in local development and testing) from the future `DynamoDBReportRepository` (Phase 5).
4. **Authoritative Backend Validation**: Input constraints (10–2000 character descriptions, allowed enum values, allowed lifecycle state transitions) are strictly enforced in the backend regardless of frontend state.

---

## 📁 Directory Structure

```
backend/
├── src/
│   ├── handlers/
│   │   ├── analyze.ts            # POST /analyze
│   │   ├── createReport.ts       # POST /reports
│   │   ├── listReports.ts        # GET /reports
│   │   ├── getReport.ts          # GET /reports/{id}
│   │   └── updateReportStatus.ts # PATCH /reports/{id}/status
│   │
│   ├── services/
│   │   ├── analysisService.ts    # AI triage interface & Mock implementation
│   │   └── reportService.ts      # Core report business logic & orchestration
│   │
│   ├── repositories/
│   │   ├── reportRepository.ts         # Persistence interface
│   │   └── inMemoryReportRepository.ts # In-memory local repository
│   │
│   ├── types/
│   │   └── index.ts              # Shared domain models & interfaces
│   │
│   ├── utils/
│   │   ├── validation.ts         # Request payload & status transition validators
│   │   ├── response.ts           # Standardized Lambda proxy response & CORS
│   │   └── reportId.ts           # Collision-resistant ID generator (CS-2026-XXXX)
│   │
│   ├── config/
│   │   └── environment.ts        # Environment & configuration defaults
│   │
│   └── localDevServer.ts         # Lightweight native HTTP server for local dev
│
├── tests/
│   └── backend.test.ts           # 24-case automated test suite (66 assertions)
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Setup & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Test Suite
Executes all 24 test cases simulating Lambda proxy events:
```bash
npm test
```

### 3. Build Production Bundle
Compiles TypeScript into Node.js 20 compatible JavaScript with declaration maps:
```bash
npm run build
```

### 4. Optional: Run Local Development Server
Starts a local HTTP server on port 3001 using Node's native `http` module:
```bash
npm start
```

---

## ⚠️ Local Limitations & Future AWS Integration

| Component | Current Implementation (Part 3) | Future AWS Target |
|---|---|---|
| **Compute** | Direct Lambda handler invocation & local adapter | AWS Lambda (Node.js 20.x runtime) |
| **API Edge** | Local request dispatcher | Amazon API Gateway (REST API with CORS) |
| **Persistence** | `InMemoryReportRepository` (`Map<string, Report>`) | Amazon DynamoDB (`CampusSOS-Reports` table) |
| **AI Triage** | `MockAnalysisService` (rule-based deterministic) | Amazon Bedrock (Amazon Nova / Titan models) |
| **Cloud Deployment**| Not deployed; zero cloud resources created | AWS CloudFormation / SAM / CDK (Phase 10) |

> **Notice on In-Memory Persistence**:  
> In-memory storage is designed strictly for local unit and integration tests. Because live AWS Lambda invocations are stateless, production data will be persisted to Amazon DynamoDB in Phase 5.

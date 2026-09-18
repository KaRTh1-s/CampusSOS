# CampusSOS DynamoDB Database Schema Design

> **Document Status**: Database Design Specification (Part 1 Foundation)  
> **Target Service**: Amazon DynamoDB  
> **Region**: Asia Pacific (Mumbai) - `ap-south-1`  
> **Billing Mode**: `PAY_PER_REQUEST` (On-Demand Capacity - Zero baseline cost)

---

## 1. Table Overview

| Parameter | Value |
|---|---|
| **Table Name** | `CampusSOS-Reports` |
| **Partition Key (PK)** | `reportId` (String: `UUIDv4` or prefixed `rep-<uuid>`) |
| **Sort Key (SK)** | None (Single-item point lookup by `reportId`) |
| **Billing Mode** | On-Demand (`PAY_PER_REQUEST`) |
| **Server-Side Encryption** | Enabled (AWS Owned Key / default) |
| **Point-in-Time Recovery (PITR)** | Optional for Production / Disabled for Dev to minimize cost |

---

## 2. Global Secondary Index (GSI)

To support efficient queries by incident status without performing expensive full-table scans, a GSI is designated:

### GSI: `status-createdAt-index`
- **GSI Partition Key (`PK`)**: `status` (String: `OPEN` | `IN_PROGRESS` | `RESOLVED`)
- **GSI Sort Key (`SK`)**: `createdAt` (String: ISO-8601 Timestamp, e.g. `2026-09-18T11:30:00.000Z`)
- **Projection Type**: `ALL` (Provides all attributes directly to the Admin Dashboard to avoid secondary read requests)
- **Use Case**: Admin dashboard query: *"Fetch all OPEN reports sorted by newest first."*

---

## 3. Attribute Definitions & Data Dictionary

| Attribute Name | DynamoDB Type | Required | Description | Example |
|---|---|---|---|---|
| `reportId` | `S` (String) | **Yes** | Unique identifier (UUIDv4) | `"rep-7f8a92b1-4c12-48df-9e23-8bc101a4df02"` |
| `description` | `S` (String) | **Yes** | Original text submitted by student | `"Water leaking heavily from bathroom ceiling"` |
| `location` | `S` (String) | No | Specific location or room number | `"Hostel 4, 3rd Floor East Wing"` |
| `category` | `S` (String) | **Yes** | AI-classified problem domain | `"Plumbing & Water"` |
| `priority` | `S` (String) | **Yes** | Severity enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | `"HIGH"` |
| `summary` | `S` (String) | **Yes** | AI-distilled concise summary | `"Major water leak in residential hostel ceiling"` |
| `recommendedAction` | `S` (String) | **Yes** | AI immediate safety instructions | `"Keep distance from standing water. Contact hostel warden."` |
| `department` | `S` (String) | **Yes** | Responsible campus handling unit | `"Hostel Maintenance / Facilities"` |
| `status` | `S` (String) | **Yes** | Lifecycle state: `OPEN`, `IN_PROGRESS`, `RESOLVED` | `"OPEN"` |
| `createdAt` | `S` (String) | **Yes** | ISO-8601 UTC timestamp of submission | `"2026-09-18T11:30:00.000Z"` |
| `updatedAt` | `S` (String) | **Yes** | ISO-8601 UTC timestamp of last modification | `"2026-09-18T11:30:00.000Z"` |
| `evidenceUrl` | `S` (String) | No | (Future Phase 9) Amazon S3 image URL | `null` |

---

## 4. Sample Item Document (JSON)

```json
{
  "reportId": "rep-7f8a92b1-4c12-48df-9e23-8bc101a4df02",
  "description": "There is smoke coming from an electrical panel in our classroom on the 2nd floor of Block B.",
  "location": "Block B, 2nd Floor, Room 204",
  "category": "Electrical Safety",
  "priority": "CRITICAL",
  "summary": "Smoke has been reported originating from an electrical panel inside a classroom.",
  "recommendedAction": "Evacuate the immediate classroom area. Do not touch or attempt to inspect the electrical panel. Notify campus facilities and emergency services immediately.",
  "department": "Campus Safety & Electrical Maintenance",
  "status": "OPEN",
  "createdAt": "2026-09-18T11:30:00.000Z",
  "updatedAt": "2026-09-18T11:30:00.000Z",
  "evidenceUrl": null
}
```

---

## 5. Query Access Patterns & Cost Optimization

| Access Pattern | Target | Key Condition Expression | Expected Latency |
|---|---|---|---|
| 1. Create Report | Main Table | `PutItem` | ~5–10ms |
| 2. Get Report by ID | Main Table | `GetItem(Key: { reportId })` | ~3–5ms |
| 3. List Reports by Status (Newest first) | `status-createdAt-index` | `Query(status = :s, ScanIndexForward = false)` | ~5–15ms |
| 4. Update Status | Main Table | `UpdateItem(Key: { reportId }, UpdateExpression: "SET #s = :s, updatedAt = :u")` | ~5–10ms |

### Cost Discipline:
- By using `PAY_PER_REQUEST`, we incur $0 when idle.
- DynamoDB free tier includes 25 GB of storage and 25 read/write capacity units, ensuring this hackathon project operates well within the free tier.

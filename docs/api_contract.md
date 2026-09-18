# CampusSOS API Contract Specification

> **Base URL**: `/api` (e.g. `https://api.campussos.internal/api` or `http://localhost:3001/api`)  
> **Content-Type**: `application/json`  
> **Status**: Specification (Part 1 Design)

---

## 1. POST /analyze

Analyzes a student's natural language issue description using Amazon Bedrock to determine category, urgency priority, summary, department, and recommended safety action.

### Request
- **Method**: `POST`
- **Path**: `/analyze`
- **Headers**:
  - `Content-Type: application/json`
- **Body**:
```json
{
  "description": "There is smoke coming from an electrical panel in our classroom on the 2nd floor of Block B.",
  "location": "Block B, 2nd Floor, Room 204"
}
```

#### Field Validations:
| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `description` | String | **Yes** | Min length: 10 chars, Max length: 2000 chars. Must not be whitespace-only. |
| `location` | String | No | Max length: 200 chars. |

### Success Response
- **Status**: `200 OK`
- **Body**:
```json
{
  "success": true,
  "data": {
    "category": "Electrical Safety",
    "priority": "CRITICAL",
    "summary": "Smoke has been reported originating from an electrical panel inside a classroom.",
    "recommendedAction": "Evacuate the immediate classroom area. Do not touch or attempt to inspect the electrical panel. Notify campus facilities and emergency services immediately.",
    "department": "Campus Safety & Electrical Maintenance"
  }
}
```

#### Allowed Priority Values:
- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

#### Standard Categories:
- `Electrical Safety`
- `Fire / Hazard`
- `Infrastructure & Structural`
- `Plumbing & Water`
- `Hostel & Residential Life`
- `Security & Access`
- `Medical / Health`
- `Accessibility & Mobility`
- `General Maintenance`

---

## 2. POST /reports

Creates and persists a new incident report into DynamoDB after student review.

### Request
- **Method**: `POST`
- **Path**: `/reports`
- **Headers**:
  - `Content-Type: application/json`
- **Body**:
```json
{
  "description": "There is smoke coming from an electrical panel in our classroom on the 2nd floor of Block B.",
  "location": "Block B, 2nd Floor, Room 204",
  "category": "Electrical Safety",
  "priority": "CRITICAL",
  "summary": "Smoke has been reported originating from an electrical panel inside a classroom.",
  "recommendedAction": "Evacuate the immediate classroom area. Do not touch or attempt to inspect the electrical panel. Notify campus facilities and emergency services immediately.",
  "department": "Campus Safety & Electrical Maintenance"
}
```

### Success Response
- **Status**: `201 Created`
- **Body**:
```json
{
  "success": true,
  "data": {
    "reportId": "rep-7f8a92b1-4c12-48df-9e23-8bc101a4df02",
    "status": "OPEN",
    "createdAt": "2026-09-18T11:30:00.000Z",
    "message": "Report created successfully"
  }
}
```

---

## 3. GET /reports

Retrieves a list of submitted reports for administrative monitoring and triage.

### Request
- **Method**: `GET`
- **Path**: `/reports`
- **Query Parameters**:
| Parameter | Type | Required | Description |
|---|---|---|---|
| `status` | String | No | Filter by status: `OPEN`, `IN_PROGRESS`, `RESOLVED` |
| `priority` | String | No | Filter by priority: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `limit` | Number | No | Max items to return (default: 50, max: 100) |

### Success Response
- **Status**: `200 OK`
- **Body**:
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "reportId": "rep-7f8a92b1-4c12-48df-9e23-8bc101a4df02",
        "category": "Electrical Safety",
        "priority": "CRITICAL",
        "summary": "Smoke has been reported originating from an electrical panel inside a classroom.",
        "location": "Block B, 2nd Floor, Room 204",
        "status": "OPEN",
        "createdAt": "2026-09-18T11:30:00.000Z",
        "updatedAt": "2026-09-18T11:30:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

## 4. GET /reports/{id}

Retrieves full details of a specific incident report by its unique `reportId`.

### Request
- **Method**: `GET`
- **Path**: `/reports/{id}`
- **Parameters**: `id` (String: UUID or formatted report identifier)

### Success Response
- **Status**: `200 OK`
- **Body**:
```json
{
  "success": true,
  "data": {
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
    "updatedAt": "2026-09-18T11:30:00.000Z"
  }
}
```

---

## 5. PATCH /reports/{id}/status

Updates the operational status of an incident report (e.g. from `OPEN` to `IN_PROGRESS` or `RESOLVED`).

### Request
- **Method**: `PATCH`
- **Path**: `/reports/{id}/status`
- **Body**:
```json
{
  "status": "IN_PROGRESS"
}
```

#### Validation Rules:
- `status` must be one of: `OPEN`, `IN_PROGRESS`, `RESOLVED`.

### Success Response
- **Status**: `200 OK`
- **Body**:
```json
{
  "success": true,
  "data": {
    "reportId": "rep-7f8a92b1-4c12-48df-9e23-8bc101a4df02",
    "status": "IN_PROGRESS",
    "updatedAt": "2026-09-18T11:45:00.000Z"
  }
}
```

---

## 6. Standard Error Format

All error responses across all endpoints adhere to this standard structure:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "The issue description must be between 10 and 2000 characters.",
    "details": [
      {
        "field": "description",
        "issue": "String must contain at least 10 character(s)"
      }
    ]
  }
}
```

### Common HTTP Error Codes:
- `400 Bad Request`: Validation failure (empty description, invalid enum value).
- `404 Not Found`: Report ID does not exist.
- `422 Unprocessable Entity`: AI model returned unparseable content.
- `500 Internal Server Error`: Downstream AWS service error or unhandled runtime exception.

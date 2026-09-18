# CampusSOS UI & Page Architecture Specification

> **Target Goal**: Clean, accessible, high-impact user interface supporting student emergency reporting and administrative triage. Ready for Best UI consideration.

---

## 1. Design System & Aesthetic Principles

- **Palette**: Clean, modern dark-slate and high-contrast alert tones:
  - Background: Deep slate (`#0B0F17`) and crisp surface card (`#161F30`).
  - Text: Primary off-white (`#F8FAFC`), Secondary muted (`#94A3B8`).
  - Accent / Brand: Electric Indigo (`#6366F1`) and Sky Blue (`#38BDF8`).
  - Priority Badges:
    - `CRITICAL`: Urgent Crimson (`#EF4444`) with subtle pulse animation.
    - `HIGH`: Amber Orange (`#F59E0B`).
    - `MEDIUM`: Sunflower Gold (`#EAB308`).
    - `LOW`: Emerald Teal (`#10B981`).
- **Typography**: Clean sans-serif stack (`Inter`, system-ui, -apple-system, sans-serif).
- **Mobile First**: Optimized touch targets (minimum 48x48px), readable font sizes on phones, and thumb-friendly bottom action bars.
- **Zero Distraction**: No gratuitous animations, fake graphs, or clutter. Focus on clarity, immediate comprehension, and swift emergency reporting.

---

## 2. Student Interface Workflow

```
[ 1. Landing / Overview ]
           |
           v
[ 2. Describe Incident ]  <-- Natural language text + optional location
           |
           v (Click "Analyze Issue" -> Loading indicator)
[ 3. AI Analysis Card ]   <-- Category, Priority badge, Summary, Safety Instructions
           |
           v (Click "Submit Report" -> Confirmation)
[ 4. Report Confirmation ] <-- Unique Report ID, Copy button, Status indicator
```

### Page 1: Student Home & Issue Submission (`/`)
- **Header**: Minimalist CampusSOS badge, emergency hotline quick-call pill.
- **Hero / Prompt**: "Report a Campus Issue in Plain Words".
- **Input Area**:
  - Multi-line textarea with dynamic character counter (`10 / 2000`).
  - Location input (e.g. "Library 3rd Floor, Study Pod 4").
  - Primary CTA: `[ Analyze Issue with AI ]` (Disabled until >10 chars).

### Page 2: AI Analysis & Verification View
- Appears immediately upon AI response without page reload.
- **Components**:
  - **Severity Alert Banner**: Color-coded by Priority (`CRITICAL`, `HIGH`, etc.).
  - **Structured Metadata Grid**:
    - Identified Category (e.g., *Electrical Safety*)
    - Recommended Department (e.g., *Facilities & Electrical Team*)
  - **Summary**: Concise bullet or sentence summarizing the incident.
  - **Immediate Safety Recommendation**: Callout box highlighting immediate protective actions (e.g. "Do not touch wires. Keep back 10 feet.").
- **Actions**:
  - `[ Submit Report ]` (Primary Green/Indigo CTA).
  - `[ Edit Description ]` (Secondary Ghost CTA).

### Page 3: Confirmation View (`/confirmation/:id`)
- Prominent success checkmark.
- Display generated Report ID (e.g. `rep-7f8a92b1`).
- Single-click "Copy ID" utility.
- Brief message explaining the next steps: campus security/maintenance has been notified.
- `[ Submit Another Issue ]` or `[ View Status ]` buttons.

---

## 3. Administrator Interface Workflow (`/admin`)

### 1. Dashboard Metrics Bar
- 4 clean indicator cards:
  - **Total Reports**
  - **Open (Action Needed)**
  - **In Progress**
  - **Resolved**

### 2. Filter & Search Controls
- Filter by status dropdown: All | Open | In Progress | Resolved.
- Filter by priority: All | Critical | High | Medium | Low.
- Fast search by Report ID or location.

### 3. Report Triage Table / Card Grid
- Columns:
  - ID & Timestamp
  - Category
  - Priority Badge
  - Location
  - Summary
  - Current Status
  - Actions (`[ View Details ]`, quick status dropdown)

### 4. Incident Detail Drawer / Modal
- Full original student statement.
- AI analysis breakdown and recommended action.
- Actionable Status Toggle:
  - `[ Mark In Progress ]`
  - `[ Mark Resolved ]`
- Audit timestamps (`createdAt`, `updatedAt`).

---

## 4. State Management & Ergonomics

| UI State | Presentation Strategy |
|---|---|
| **Loading AI Analysis** | Pulsing skeleton placeholder with reassuring copy: *"AI is assessing urgency and routing..."* |
| **Loading Reports** | Shimmer rows in admin table. |
| **Empty Admin List** | Friendly zero-state graphic: *"No open incidents found in this category."* |
| **Network / Server Error** | Non-blocking toast notification with retry button. |
| **Input Validation** | Inline red helper text for inputs < 10 characters or exceeding limit. |

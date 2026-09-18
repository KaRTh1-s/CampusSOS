# CampusSOS Demo Script

**Target Time:** 3–5 minutes

## 0:00 — Problem
"College and university campuses manage hundreds of facilities and safety issues daily—from electrical faults and plumbing leaks to accessibility barriers and security concerns. When students encounter these issues, they often face friction: they don't know the technical category, they aren't sure how urgent it is, and they don't know which department to contact. Worse, they might not know how to stay safe while reporting it."

## 0:30 — Student Portal
"Enter CampusSOS. A simple, AI-powered incident reporting platform built for students and campus administration. Let's look at the student experience."
*(Show the CampusSOS landing page)*

## 1:00 — Submit Incident
"A student spots a hazard. They simply open CampusSOS and describe it in natural language. For this demo, let's say they type:"
- **Description:** "There is a water leak near the washroom entrance in the Engineering Block. The floor becomes slippery when students walk through the area."
- **Location:** "Engineering Block - Ground Floor"

"The student can optionally attach a photo of the issue. Let's upload an image."
*(Attach a small sample image)*

"Then, they click 'Analyze Issue'."

## 1:30 — AI Analysis
"Behind the scenes, Amazon Bedrock immediately analyzes the natural language report. Within seconds, it returns a structured assessment:"
*(Show the Analysis Confirmation Page)*
- **Category:** It correctly identifies this as `Plumbing & Water`.
- **Priority:** It flags it as `MEDIUM` priority due to the slipping hazard.
- **Summary:** It generates a concise summary for the maintenance team.
- **Department:** It routes it to `Facilities Management`.
- **Recommended Action:** Crucially, it provides immediate safety guidance for the student, advising them to stay clear of the slippery area.

"The student reviews this and clicks 'Submit Report'."

## 2:00 — Evidence
"The photo evidence is securely uploaded directly to a private Amazon S3 bucket, ensuring it's not publicly accessible but safely stored for the administration."

## 2:20 — Admin Dashboard
"Now, let's switch to the campus administration side."
*(Navigate to the `/admin` route)*
"The Admin Dashboard provides a real-time overview of all reported campus incidents. We can see live statistics: Total, Open, In Progress, and Resolved tickets. The incident we just submitted is immediately visible in the table."

## 2:45 — Incident Details
*(Click on the newly submitted incident in the table)*
"When an administrator opens the incident, they see the complete picture:"
- "The original **User Report** and location."
- "The **AI Assessment** with priority and department routing."
- "And the attached **Evidence**. The admin can click 'View Evidence' to get a secure, short-lived presigned URL to view the photo stored in S3."
*(Click 'View Evidence' to demonstrate the presigned URL opening the image)*

## 3:15 — Status Workflow
"The administrator can now manage the incident lifecycle."
- "They change the status from **OPEN** to **IN_PROGRESS** while a maintenance crew is dispatched."
*(Change status to IN_PROGRESS)*
- "Once the leak is fixed, they change it to **RESOLVED**."
*(Change status to RESOLVED)*
- "These updates are immediately persisted in our Amazon DynamoDB table."

## 3:40 — AWS Architecture
"CampusSOS is built on a 100% serverless, reliable, and cost-effective AWS architecture:"
- **Amazon DynamoDB** provides scalable persistence for our incident records.
- **Amazon S3** securely stores private evidence attachments with Block Public Access enabled.
- **Amazon Bedrock** provides the generative AI triage, transforming unstructured student reports into structured, actionable data.
*(Note: Briefly mention that live Bedrock invocation might be pending AWS account verification, but the system architecture fully supports it via the BedrockAnalysisService).*

## 4:00 — Closing
"CampusSOS eliminates the friction of campus reporting. It gives students immediate safety guidance and provides administrators with structured, prioritized data—helping campuses resolve issues faster and keep everyone safe."

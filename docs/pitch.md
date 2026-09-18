# CampusSOS Pitch

## One-line Pitch
CampusSOS is an AI-powered incident reporting platform that turns unstructured student hazard reports into categorized, prioritized, and actionable data for campus administration while providing immediate safety guidance.

## Short 50-word Pitch
CampusSOS uses Amazon Bedrock to instantly analyze natural-language student reports of campus hazards. It categorizes issues, assigns priority levels, provides immediate life-safety guidance to the student, and securely routes the data—along with private S3 evidence—to a real-time admin dashboard powered by DynamoDB for fast administrative triage and resolution.

## Short 100-word Pitch
When students encounter campus hazards, they often don't know the exact technical category, urgency, or which department to contact, leading to friction and delayed responses. CampusSOS solves this by allowing students to describe issues in plain natural language and upload photo evidence. Using Amazon Bedrock, the platform instantly categorizes the incident, determines the priority, and generates immediate safety instructions. This structured data is persisted in Amazon DynamoDB and presented on a centralized Admin Dashboard, enabling campus security and facilities teams to seamlessly triage and resolve issues faster, ensuring a safer and more responsive campus environment.

## Problem Statement
College and university campuses manage hundreds of facilities and safety issues daily. Students face significant friction when reporting these issues: they don't know technical categorizations, they struggle to determine the urgency, and they aren't sure which department to contact. Furthermore, they lack immediate safety guidance, which could lead to accidental self-harm if they attempt to intervene in hazardous situations (like electrical faults).

## Solution
CampusSOS provides a single, intelligent entry point for all campus issues. Students simply describe the problem in natural language and attach a photo. The system uses AI to parse the report, structure the data, provide safety guidance, and route it to a centralized dashboard where administrators can track and resolve incidents efficiently.

## Key Technical Innovation
The core innovation is the decoupling of incident reporting from rigid, multi-step dropdown forms. By utilizing Generative AI (Amazon Bedrock) as a middleware triage agent, CampusSOS transforms unstructured natural language and enforces a strict, predictable JSON schema (Category, Priority, Summary, Action, Department) before the data ever touches the persistence layer (DynamoDB).

## AWS Services
- **Amazon Bedrock:** Powers the core AI triage, classification, and safety instruction generation.
- **Amazon DynamoDB:** Provides scalable, serverless persistence for incident tracking and metadata.
- **Amazon S3:** Securely stores private evidence attachments with Block Public Access, utilizing short-lived presigned URLs for secure administrative viewing.

## AI Component
The AI component is implemented via the `BedrockAnalysisService`. It leverages advanced prompt engineering to ensure the LLM strictly adheres to predefined categories (e.g., `Electrical Safety`, `Plumbing & Water`) and priorities (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), while producing valid JSON output. It acts as an intelligent router and safety advisor.

## Impact
CampusSOS reduces the time-to-report for students, prevents miscategorized support tickets, and gives campus administrators immediate, prioritized visibility into critical infrastructure and safety hazards, ultimately fostering a safer campus community.

## Future Roadmap
- **Phase 10:** Full AWS Cloud Deployment (Amplify Hosting, API Gateway, Lambda).
- **Phase 11:** SMS/Email Notification integration via Amazon SNS.
- **Phase 12:** Administrator Authentication via Amazon Cognito.
- **Phase 13:** Automated work-order generation for legacy campus ticketing systems.

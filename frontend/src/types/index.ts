export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ReportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface AnalysisResult {
  category: string;
  priority: Priority;
  summary: string;
  recommendedAction: string;
  department: string;
}

export interface Report {
  reportId: string;
  description: string;
  location?: string;
  category: string;
  priority: Priority;
  summary: string;
  recommendedAction: string;
  department: string;
  status: ReportStatus;
  createdAt: string;
}

export interface IssueInput {
  description: string;
  location?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

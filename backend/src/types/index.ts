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
  updatedAt: string;
}

export interface AnalyzeRequestInput {
  description: string;
  location?: string;
}

export interface CreateReportInput {
  description: string;
  location?: string;
  category: string;
  priority: Priority;
  summary: string;
  recommendedAction: string;
  department: string;
}

export interface UpdateReportStatusInput {
  status: ReportStatus;
}

export interface ReportFilters {
  status?: ReportStatus;
  priority?: Priority;
  limit?: number;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

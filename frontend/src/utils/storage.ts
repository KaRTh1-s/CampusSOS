import { Report } from '../types';

const STORAGE_KEY = 'campusSOS_reports';

export function getStoredReports(): Report[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('Storage corrupted: expected array of reports. Resetting to empty.');
      return [];
    }

    // Filter out invalid items
    return parsed.filter((item): item is Report => {
      return (
        item &&
        typeof item === 'object' &&
        typeof item.reportId === 'string' &&
        typeof item.description === 'string' &&
        typeof item.priority === 'string' &&
        typeof item.status === 'string'
      );
    });
  } catch (error) {
    console.warn('Failed to parse local reports storage:', error);
    return [];
  }
}

export function saveReportToStorage(report: Report): boolean {
  try {
    const existing = getStoredReports();
    const updated = [report, ...existing.filter((r) => r.reportId !== report.reportId)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Failed to save report to localStorage:', error);
    return false;
  }
}

export function getReportByIdFromStorage(reportId: string): Report | null {
  const reports = getStoredReports();
  return reports.find((r) => r.reportId === reportId) || null;
}

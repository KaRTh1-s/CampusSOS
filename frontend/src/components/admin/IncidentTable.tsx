import React from 'react';
import { Report } from '../../types/index';
import { Badge } from './Badge';

interface IncidentTableProps {
  reports: Report[];
  selectedReportId: string | null;
  onSelectReport: (report: Report) => void;
}

export const IncidentTable: React.FC<IncidentTableProps> = ({
  reports,
  selectedReportId,
  onSelectReport,
}) => {
  if (reports.length === 0) {
    return (
      <div className="incident-list-container empty-state">
        <h3>No incidents found</h3>
        <p>Try adjusting your filters or refresh to see the latest reports.</p>
      </div>
    );
  }

  return (
    <div className="incident-list-container">
      <table className="incident-table" aria-label="Incidents List">
        <thead>
          <tr>
            <th>Report ID</th>
            <th>Priority</th>
            <th>Category</th>
            <th>Status</th>
            <th>Reported Date</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const date = new Date(report.createdAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            });
            const isSelected = selectedReportId === report.reportId;
            
            return (
              <tr 
                key={report.reportId} 
                onClick={() => onSelectReport(report)}
                className={isSelected ? 'selected' : ''}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectReport(report);
                  }
                }}
              >
                <td data-label="Report ID">
                  <span className="report-id-cell">{report.reportId}</span>
                </td>
                <td data-label="Priority">
                  <Badge type="priority" value={report.priority} />
                </td>
                <td data-label="Category">{report.category}</td>
                <td data-label="Status">
                  <Badge type="status" value={report.status} />
                </td>
                <td data-label="Reported Date">{date}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

import React, { useState } from 'react';
import { Report } from '../../types/index';
import { Badge } from './Badge';

interface IncidentDetailsPanelProps {
  report: Report | null;
  onStatusUpdate: (id: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => Promise<void>;
  isUpdating: boolean;
}

export const IncidentDetailsPanel: React.FC<IncidentDetailsPanelProps> = ({
  report,
  onStatusUpdate,
  isUpdating
}) => {
  const [localStatus, setLocalStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Sync local status when report changes
  React.useEffect(() => {
    if (report) {
      setLocalStatus(report.status);
      setError(null);
    }
  }, [report]);

  if (!report) {
    return (
      <div className="incident-details-panel">
        <div className="empty-state">
          <p>Select an incident to view details.</p>
        </div>
      </div>
    );
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    setLocalStatus(newStatus);
    setError(null);
    try {
      await onStatusUpdate(report.reportId, newStatus);
    } catch (err: any) {
      // Revert to current status on failure
      setLocalStatus(report.status);
      setError(err.message || 'Failed to update status');
    }
  };

  const createdDate = new Date(report.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  
  const updatedDate = report.updatedAt ? new Date(report.updatedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }) : 'Not updated yet';

  return (
    <aside className="incident-details-panel" aria-label="Incident Details">
      <div className="details-header">
        <h2>Report Details</h2>
        <span className="report-id-cell">{report.reportId}</span>
      </div>

      <div className="details-section">
        <h3>Reported Issue (User Input)</h3>
        <div className="details-row">
          <span className="details-label">Description</span>
          <p className="details-value">{report.description}</p>
        </div>
        {report.location && (
          <div className="details-row">
            <span className="details-label">Location</span>
            <p className="details-value">{report.location}</p>
          </div>
        )}
        <div className="details-row">
          <span className="details-label">Created At</span>
          <p className="details-value">{createdDate}</p>
        </div>
      </div>

      <div className="details-section">
        <h3>AI Assessment</h3>
        <div className="details-row">
          <span className="details-label">Priority & Status</span>
          <div className="details-value" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Badge type="priority" value={report.priority} />
            <Badge type="status" value={report.status} />
          </div>
        </div>
        <div className="details-row">
          <span className="details-label">Category</span>
          <p className="details-value">{report.category}</p>
        </div>
        <div className="details-row">
          <span className="details-label">Summary</span>
          <p className="details-value">{report.summary}</p>
        </div>
        <div className="details-row">
          <span className="details-label">Recommended Action</span>
          <p className="details-value">{report.recommendedAction}</p>
        </div>
        <div className="details-row">
          <span className="details-label">Department</span>
          <p className="details-value">{report.department}</p>
        </div>
        <div className="details-row">
          <span className="details-label">Last Updated At</span>
          <p className="details-value">{updatedDate}</p>
        </div>
      </div>

      <div className="status-management">
        <h3>Manage Status</h3>
        {error && <div className="error-message" style={{ marginBottom: '1rem', color: 'var(--error-color)' }}>{error}</div>}
        <select
          value={localStatus}
          onChange={handleStatusChange}
          disabled={isUpdating}
          aria-label="Update report status"
        >
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        {isUpdating && <p className="loading-indicator">Updating...</p>}
      </div>
    </aside>
  );
};

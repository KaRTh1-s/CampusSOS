import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReport } from '../context/ReportContext';
import { PriorityBadge } from '../components/PriorityBadge';
import { CheckCircleIcon, CopyIcon, CheckIcon, SparklesIcon } from '../components/Icons';

export const ConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const { latestReport, resetReportFlow } = useReport();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!latestReport) {
      navigate('/', { replace: true });
    }
  }, [latestReport, navigate]);

  if (!latestReport) {
    return null;
  }

  const { reportId, category, priority, status } = latestReport;

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(reportId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  const handleReportAnother = () => {
    resetReportFlow();
    navigate('/');
  };

  return (
    <div className="page-container">
      <div className="card card-elevated confirmation-card">
        <div className="success-icon-wrap" aria-hidden="true">
          <CheckCircleIcon size={38} />
        </div>

        <h1 className="confirmation-title">Report Created Successfully</h1>
        <p className="confirmation-subtitle">
          Your campus issue has been documented and routed for operational assessment.
        </p>

        <div className="report-id-card">
          <span className="report-id-label">Official Tracking Identifier</span>
          <div className="report-id-value-row">
            <span className="report-id-code">{reportId}</span>
            <button
              type="button"
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopyId}
              aria-label="Copy Report ID to clipboard"
            >
              {copied ? (
                <>
                  <CheckIcon size={14} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <CopyIcon size={14} />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="confirmation-details-grid">
          <div className="conf-mini-card">
            <p className="conf-mini-label">Category</p>
            <p className="conf-mini-val">{category}</p>
          </div>

          <div className="conf-mini-card">
            <p className="conf-mini-label">Assigned Priority</p>
            <div style={{ marginTop: '0.2rem' }}>
              <PriorityBadge priority={priority} showIcon={false} />
            </div>
          </div>

          <div className="conf-mini-card">
            <p className="conf-mini-label">Lifecycle Status</p>
            <p className="conf-mini-val" style={{ color: 'var(--brand-accent)' }}>
              {status}
            </p>
          </div>
        </div>

        <div className="confirmation-note">
          <p>
            <strong>Note:</strong> Your report has been recorded in this local demo environment. In Phase 5, this will
            be persisted to <strong>Amazon DynamoDB</strong> with real-time alerting for campus administration.
          </p>
        </div>

        <div className="confirmation-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={handleReportAnother}>
            <SparklesIcon size={18} />
            <span>Report Another Issue</span>
          </button>
        </div>
      </div>
    </div>
  );
};

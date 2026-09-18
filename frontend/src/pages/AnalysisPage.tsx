import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReport } from '../context/ReportContext';
import { createReport } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { AlertTriangleIcon, ShieldAlertIcon, ArrowLeftIcon, SparklesIcon } from '../components/Icons';
import { ErrorBanner } from '../components/ErrorBanner';

export const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    description,
    location,
    analysisResult,
    setLatestReport,
    isSubmitting,
    setIsSubmitting,
    error,
    setError,
  } = useReport();

  // If page was directly accessed without an analysis result, redirect to home
  useEffect(() => {
    if (!analysisResult) {
      navigate('/', { replace: true });
    }
  }, [analysisResult, navigate]);

  if (!analysisResult) {
    return null;
  }

  const { category, priority, summary, recommendedAction, department } = analysisResult;

  const isCriticalOrHigh = priority === 'CRITICAL' || priority === 'HIGH';

  const handleCreateReport = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const created = await createReport({
        description,
        location: location.trim() || undefined,
        category,
        priority,
        summary,
        recommendedAction,
        department,
      });

      setLatestReport(created);
      navigate('/confirmation');
    } catch (err) {
      console.error('Failed to create report:', err);
      setError('An error occurred while creating the report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDescription = () => {
    // Return to home with preserved text
    navigate('/');
  };

  return (
    <div className="page-container">
      <div className="analysis-header">
        <div className="analysis-header-top">
          <div>
            <div className="hero-pill" style={{ marginBottom: '0.5rem' }}>
              <SparklesIcon size={14} />
              <span>Analysis Complete</span>
            </div>
            <h1 className="analysis-title">Incident Assessment</h1>
          </div>
          <PriorityBadge priority={priority} />
        </div>
        <p className="analysis-subtitle">
          Review the categorized details and recommended action below before submitting your official report.
        </p>
      </div>

      <div className="card card-elevated">
        {error && <ErrorBanner title="Submission Error" message={error} />}

        <div className="analysis-card-body">
          {/* Safety Callout Banner */}
          <div
            className={`safety-callout ${
              priority === 'CRITICAL' ? 'critical' : priority === 'HIGH' ? 'high' : 'normal'
            }`}
            role="alert"
          >
            <div className="safety-callout-icon">
              {isCriticalOrHigh ? <AlertTriangleIcon size={22} /> : <ShieldAlertIcon size={22} />}
            </div>
            <div className="safety-callout-content">
              <h4>Recommended Immediate Action</h4>
              <p>{recommendedAction}</p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="analysis-meta-grid">
            <div className="meta-item">
              <p className="meta-label">Category</p>
              <p className="meta-value">{category}</p>
            </div>

            <div className="meta-item">
              <p className="meta-label">Routing Department</p>
              <p className="meta-value">{department}</p>
            </div>

            <div className="meta-item">
              <p className="meta-label">Priority Level</p>
              <div style={{ marginTop: '0.25rem' }}>
                <PriorityBadge priority={priority} />
              </div>
            </div>

            <div className="meta-item">
              <p className="meta-label">Reported Location</p>
              <p className="meta-value">{location || 'Campus (Unspecified)'}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="analysis-summary-block">
            <h3 className="analysis-summary-title">Incident Summary</h3>
            <p className="analysis-summary-text">{summary}</p>
          </div>

          {/* Original Statement */}
          <div className="original-statement-block">
            <h4 className="original-statement-title">Your Original Statement</h4>
            <p className="original-statement-text">"{description}"</p>
          </div>

          {/* Action Buttons */}
          <div className="analysis-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleEditDescription}
              disabled={isSubmitting}
            >
              <ArrowLeftIcon size={16} />
              <span>Edit Description</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleCreateReport}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                  <span>Recording Report...</span>
                </>
              ) : (
                <span>Create Official Report</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

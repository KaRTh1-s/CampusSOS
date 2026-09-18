import React from 'react';

interface LoadingOverlayProps {
  title?: string;
  subtitle?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  title = 'Analyzing your report...',
  subtitle = 'Evaluating urgency, identifying category, and preparing safety guidance',
}) => {
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <div>
        <p className="loading-text-title">{title}</p>
        <p className="loading-text-subtitle">{subtitle}</p>
      </div>
    </div>
  );
};

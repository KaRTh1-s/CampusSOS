import React from 'react';
import { AlertTriangleIcon } from './Icons';

interface ErrorBannerProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  title = 'Action Required',
  message,
}) => {
  return (
    <div className="error-banner" role="alert">
      <div className="error-banner-icon" aria-hidden="true">
        <AlertTriangleIcon size={18} />
      </div>
      <div className="error-banner-content">
        <h4>{title}</h4>
        <p>{message}</p>
      </div>
    </div>
  );
};

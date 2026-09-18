import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlertIcon, AlertTriangleIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="site-header" role="banner">
      <div className="header-container">
        <Link to="/" className="brand-link" aria-label="CampusSOS Home">
          <div className="brand-logo-wrap">
            <ShieldAlertIcon size={22} />
          </div>
          <div className="brand-title-wrap">
            <span className="brand-name">CampusSOS</span>
            <span className="brand-tagline">Campus safety, made simpler</span>
          </div>
        </Link>

        <div className="header-actions">
          <div className="mode-badge" title="Running locally with deterministic AI triage in Phase 2">
            <span className="mode-badge-dot" aria-hidden="true" />
            <span>Local Demo</span>
          </div>

          <a
            href="tel:911"
            className="emergency-pill"
            title="In immediate physical danger, contact emergency services"
          >
            <AlertTriangleIcon size={14} />
            <span>Emergency: Ext. 2222</span>
          </a>
        </div>
      </div>
    </header>
  );
};

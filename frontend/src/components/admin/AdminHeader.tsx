import React from 'react';
import { Link } from 'react-router-dom';

interface AdminHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onRefresh, isRefreshing }) => {
  return (
    <header className="admin-header">
      <div>
        <h1>CampusSOS Incident Dashboard</h1>
        <p>Monitor, triage, and manage campus safety reports.</p>
      </div>
      <div className="admin-header-actions">
        <button 
          className="btn-secondary" 
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh Reports"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
        <Link to="/" className="btn-secondary">
          Student Portal
        </Link>
      </div>
    </header>
  );
};

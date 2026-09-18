import React from 'react';

interface FilterBarProps {
  statusFilter: string;
  priorityFilter: string;
  searchTerm: string;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onSearchChange: (term: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  statusFilter,
  priorityFilter,
  searchTerm,
  onStatusChange,
  onPriorityChange,
  onSearchChange,
}) => {
  return (
    <div className="filter-bar">
      <input
        type="text"
        className="filter-input"
        placeholder="Search by Report ID, summary, or location..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search reports"
      />
      <select
        className="filter-select"
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        aria-label="Filter by status"
      >
        <option value="">All Statuses</option>
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
      </select>
      <select
        className="filter-select"
        value={priorityFilter}
        onChange={(e) => onPriorityChange(e.target.value)}
        aria-label="Filter by priority"
      >
        <option value="">All Priorities</option>
        <option value="CRITICAL">Critical</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>
    </div>
  );
};

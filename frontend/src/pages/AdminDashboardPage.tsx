import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getReports, updateReportStatus } from '../services/api';
import { Report } from '../types/index';
import { AdminHeader } from '../components/admin/AdminHeader';
import { StatCard } from '../components/admin/StatCard';
import { FilterBar } from '../components/admin/FilterBar';
import { IncidentTable } from '../components/admin/IncidentTable';
import { IncidentDetailsPanel } from '../components/admin/IncidentDetailsPanel';
import { useDebounce } from '../utils/useDebounce';

export const AdminDashboardPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getReports({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setReports(data.reports);
      
      // Clear selected report if it's no longer in the list (optional, but good practice)
      if (selectedReportId && !data.reports.find(r => r.reportId === selectedReportId)) {
        setSelectedReportId(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load reports.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, selectedReportId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Client-side search filtering
  const filteredReports = useMemo(() => {
    if (!debouncedSearchTerm) return reports;
    
    const lowerSearch = debouncedSearchTerm.toLowerCase();
    return reports.filter(r => 
      r.reportId.toLowerCase().includes(lowerSearch) ||
      r.summary.toLowerCase().includes(lowerSearch) ||
      (r.location && r.location.toLowerCase().includes(lowerSearch))
    );
  }, [reports, debouncedSearchTerm]);

  // Derived Statistics (from currently fetched reports. If pagination were implemented, we'd need backend stats)
  const stats = useMemo(() => {
    const total = filteredReports.length;
    let open = 0;
    let inProgress = 0;
    let resolved = 0;
    let critical = 0;
    let high = 0;

    filteredReports.forEach(r => {
      if (r.status === 'OPEN') open++;
      if (r.status === 'IN_PROGRESS') inProgress++;
      if (r.status === 'RESOLVED') resolved++;
      if (r.priority === 'CRITICAL') critical++;
      if (r.priority === 'HIGH') high++;
    });

    return { total, open, inProgress, resolved, critical, high };
  }, [filteredReports]);

  const handleStatusUpdate = async (id: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    setIsUpdatingStatus(true);
    try {
      await updateReportStatus(id, newStatus);
      // Optimistic update
      setReports(prev => prev.map(r => r.reportId === id ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r));
    } catch (err) {
      throw err; // rethrow for the details panel to catch and show error
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const selectedReport = useMemo(() => {
    return reports.find(r => r.reportId === selectedReportId) || null;
  }, [reports, selectedReportId]);

  return (
    <div className="admin-dashboard">
      <AdminHeader onRefresh={fetchReports} isRefreshing={isLoading} />
      
      {error && <div className="error-message" style={{ marginBottom: '2rem' }}>{error}</div>}

      <div className="stat-cards-container">
        <StatCard title="Total Reports" value={stats.total} />
        <StatCard title="Open" value={stats.open} />
        <StatCard title="In Progress" value={stats.inProgress} />
        <StatCard title="Resolved" value={stats.resolved} />
        <StatCard title="High Priority" value={stats.high} highlight="high" />
        <StatCard title="Critical" value={stats.critical} highlight="critical" />
      </div>

      <FilterBar 
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        searchTerm={searchTerm}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onSearchChange={setSearchTerm}
      />

      <div className="admin-content">
        {isLoading && reports.length === 0 ? (
          <div className="incident-list-container empty-state">
            <p>Loading reports...</p>
          </div>
        ) : (
          <IncidentTable 
            reports={filteredReports} 
            selectedReportId={selectedReportId} 
            onSelectReport={(report) => setSelectedReportId(report.reportId)}
          />
        )}
        
        <IncidentDetailsPanel 
          report={selectedReport} 
          onStatusUpdate={handleStatusUpdate}
          isUpdating={isUpdatingStatus}
        />
      </div>
    </div>
  );
};

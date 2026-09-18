import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  highlight?: 'critical' | 'high';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, highlight }) => {
  return (
    <div className={`stat-card ${highlight ? highlight : ''}`}>
      <span className="stat-card-title">{title}</span>
      <span className="stat-card-value">{value}</span>
    </div>
  );
};

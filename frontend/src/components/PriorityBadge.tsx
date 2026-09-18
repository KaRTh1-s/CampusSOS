import React from 'react';
import { Priority } from '../types';
import { AlertTriangleIcon, ShieldAlertIcon } from './Icons';

interface PriorityBadgeProps {
  priority: Priority;
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, showIcon = true }) => {
  const normalized = (priority || 'MEDIUM').toUpperCase() as Priority;
  const classModifier = normalized.toLowerCase();

  return (
    <span className={`badge-priority ${classModifier}`}>
      {showIcon && (
        normalized === 'CRITICAL' || normalized === 'HIGH' ? (
          <AlertTriangleIcon size={14} />
        ) : (
          <ShieldAlertIcon size={14} />
        )
      )}
      <span>{normalized}</span>
    </span>
  );
};

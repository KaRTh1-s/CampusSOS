import React from 'react';

interface BadgeProps {
  type: 'priority' | 'status';
  value: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value }) => {
  return (
    <span className={`badge badge-${type}-${value}`}>
      {value.replace('_', ' ')}
    </span>
  );
};

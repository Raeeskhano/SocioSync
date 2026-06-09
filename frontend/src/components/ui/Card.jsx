import React from 'react';

const Card = ({
  children,
  className = '',
  level = 'lowest', // lowest, low, high, highest
  ...props
}) => {
  const bgLevels = {
    lowest: 'bg-surface-container-lowest',
    low: 'bg-surface-container-low',
    high: 'bg-surface-container-high',
    highest: 'bg-surface-container-highest',
  };

  return (
    <div
      className={`${bgLevels[level]} rounded-xl p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

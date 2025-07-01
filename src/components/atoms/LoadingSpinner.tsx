import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };
  
  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        border-t-transparent 
        border-primary
        rounded-full 
        animate-spin
        ${className}
      `}
      role="status"
      aria-label="loading"
    ></div>
  );
};

export default LoadingSpinner;

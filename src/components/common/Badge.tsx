import React from 'react';

interface BadgeProps {
  text: string;
  color?: string;
  bgColor?: string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  text, 
  color = 'white', 
  bgColor = '#3B82F6',
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ 
        backgroundColor: bgColor, 
        color: color 
      }}
    >
      {text}
    </span>
  );
};

export default Badge;
import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  headerAction?: ReactNode;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  headerAction,
}) => {
  return (
    <div className={`bg-white shadow overflow-hidden rounded-lg ${className}`}>
      {title && (
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">{children}</div>
    </div>
  );
};

export default Card;
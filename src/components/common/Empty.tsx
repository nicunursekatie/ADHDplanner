import React, { ReactNode } from 'react';
import { InboxIcon } from 'lucide-react';

interface EmptyProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

const Empty: React.FC<EmptyProps> = ({
  title,
  description,
  icon = <InboxIcon className="mx-auto h-12 w-12 text-gray-400" />,
  action,
}) => {
  return (
    <div className="text-center py-12">
      <div className="inline-block">{icon}</div>
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default Empty;
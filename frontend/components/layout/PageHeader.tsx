import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#7B3FF2] via-[#00A8E8] to-[#006B3F] bg-clip-text text-transparent">
          {title}
        </h1>
        {description && <p className="mt-2 text-gray-600 text-lg">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

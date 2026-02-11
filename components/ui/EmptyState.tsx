import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ElementType; // To allow passing a Lucide icon component
  title: string;
  description?: string;
  action?: React.ReactNode; // For a button or other CTA
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon: Icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center p-6 text-center text-muted-foreground",
          className
        )}
        {...props}
      >
        {Icon && (
          <div className="mb-4 text-5xl text-gray-400">
            {/* Using text-5xl and text-gray-400 for a large, subtle icon */}
            <Icon />
          </div>
        )}
        <h3 className="mb-2 text-xl font-semibold text-text-DEFAULT">{title}</h3>
        {description && <p className="mb-4 text-sm">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

export { EmptyState };

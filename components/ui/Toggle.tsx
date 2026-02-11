import * as React from "react";
import { cn } from "@/lib/utils";

export type ToggleProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, ...props }, ref) => {
    return (
      <label className={cn("relative inline-flex items-center cursor-pointer", className)}>
        <input type="checkbox" value="" className="sr-only peer" ref={ref} {...props} />
        <div className="w-11 h-6 bg-input rounded-full peer peer-focus:ring-2 peer-focus:ring-ring dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border after:border-background after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
      </label>
    );
  }
);

Toggle.displayName = "Toggle";

export { Toggle };

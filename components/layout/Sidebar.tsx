import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";
// import { IconName } from "lucide-react"; // Placeholder for icon imports

interface NavItem {
  href: string;
  label: string;
  icon?: React.ElementType; // Lucide icon component
}

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  navItems: NavItem[];
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, navItems, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full flex-col overflow-y-auto border-r bg-background",
          "w-64", // Fixed width for sidebar
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-center h-16 border-b">
          <Link href="/" className="flex items-center space-x-2">
            {/* TrustWork Logo Placeholder */}
            {/* <IconName className="h-6 w-6" /> */}
            <span className="font-bold text-lg text-primary">TrustWork</span>
          </Link>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-text-secondary transition-all hover:bg-primary/10 hover:text-primary"
            >
              {item.icon && <item.icon className="h-5 w-5" />}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

export { Sidebar };

import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";
// import { IconName } from "lucide-react"; // Placeholder for icon import

export type NavbarProps = React.HTMLAttributes<HTMLElement>;

const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  ({ className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(
          "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          className
        )}
        {...props}
      >
        <div className="container mx-auto flex h-14 items-center px-4 md:px-6">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            {/* TrustWork Logo Placeholder */}
            {/* <IconName className="h-6 w-6" /> */}
            <span className="font-bold text-lg text-primary">TrustWork</span>
          </Link>
          <div className="flex-1 flex items-center justify-end space-x-4">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/how-it-works" className="transition-colors hover:text-primary text-text-secondary">
                How it Works
              </Link>
              <Link href="/for-workers" className="transition-colors hover:text-primary text-text-secondary">
                For Workers
              </Link>
              <Link href="/for-employers" className="transition-colors hover:text-primary text-text-secondary">
                For Employers
              </Link>
            </nav>
            {/* Authentication/User actions can go here */}
            {/* <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">Login</Button>
              <Button size="sm">Register</Button>
            </div> */}
          </div>
        </div>
      </nav>
    );
  }
);
Navbar.displayName = "Navbar";

export { Navbar };

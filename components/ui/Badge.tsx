import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "destructive" | "verified";
}

function Badge({ className, variant, ...props }: BadgeProps) {
  const baseClasses =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors " +
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  const variantClasses = {
    default: "border-transparent bg-primary text-primary-foreground",
    primary: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-text-secondary text-white",
    destructive: "border-transparent bg-destructive text-destructive-foreground",
    outline: "text-text-secondary border-text-secondary",
    verified: "border-transparent bg-accent text-accent-foreground",
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant || "default"], className)} {...props} />
  );
}

export { Badge };

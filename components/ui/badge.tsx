import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "glass" | "success" | "warning" | "destructive";
  size?: "sm" | "default" | "lg";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors",
          // Size variants
          {
            "px-2 py-0.5 text-xs rounded-md": size === "sm",
            "px-2.5 py-1 text-xs rounded-lg": size === "default",
            "px-3 py-1.5 text-sm rounded-lg": size === "lg",
          },
          // Style variants
          {
            "bg-muted text-muted-foreground": variant === "default",
            "bg-primary text-primary-foreground": variant === "primary",
            "bg-secondary text-secondary-foreground": variant === "secondary",
            "border border-border bg-transparent text-foreground": variant === "outline",
            "bg-white/15 backdrop-blur-sm text-white border border-white/10": variant === "glass",
            "bg-success/15 text-success": variant === "success",
            "bg-warning/15 text-warning": variant === "warning",
            "bg-destructive/15 text-destructive": variant === "destructive",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
export type { BadgeProps };

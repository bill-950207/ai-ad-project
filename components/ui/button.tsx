import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "gradient" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
          // Variant styles
          {
            "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]":
              variant === "default",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]":
              variant === "secondary",
            "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground active:scale-[0.98]":
              variant === "outline",
            "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]":
              variant === "ghost",
            "bg-gradient-to-r from-primary to-purple-500 text-white hover:opacity-90 shadow-lg shadow-primary/20 active:scale-[0.98]":
              variant === "gradient",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]":
              variant === "destructive",
          },
          // Size styles
          {
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3 text-sm": size === "sm",
            "h-12 rounded-lg px-8 text-lg": size === "lg",
            "h-10 w-10 p-0": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };

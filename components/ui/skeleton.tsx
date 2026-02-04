import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "rectangular" | "text";
  /** Animation type (default: pulse) */
  animation?: "pulse" | "shimmer" | "none";
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "default", animation = "pulse", ...props }, ref) => {
    const baseClasses = "bg-gradient-to-br from-card to-secondary/30 border border-border/50";

    const animationClasses = {
      pulse: "animate-pulse",
      shimmer: "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
      none: "",
    };

    const variantClasses = {
      default: "rounded-lg",
      circular: "rounded-full",
      rectangular: "rounded-none",
      text: "rounded h-4 w-full",
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          animationClasses[animation],
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

// Pre-built skeleton patterns
interface CardSkeletonProps {
  aspectRatio?: "square" | "video" | "portrait";
  showText?: boolean;
  className?: string;
}

function CardSkeleton({ aspectRatio = "square", showText = false, className }: CardSkeletonProps) {
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className={cn(aspectClasses[aspectRatio], "w-full rounded-2xl")} />
      {showText && (
        <div className="space-y-2">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      )}
    </div>
  );
}

interface GridSkeletonProps {
  /** Number of skeleton items (default: 8) */
  count?: number;
  /** Responsive column configuration */
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  /** Aspect ratio of each item (default: square) */
  aspectRatio?: "square" | "video" | "portrait";
  /** Show text placeholders below each card */
  showText?: boolean;
  className?: string;
}

function GridSkeleton({
  count = 8,
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  aspectRatio = "square",
  showText = false,
  className,
}: GridSkeletonProps) {
  const getGridColsClass = () => {
    const classes = [];
    if (columns.default) classes.push(`grid-cols-${columns.default}`);
    if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
    return classes.join(" ");
  };

  return (
    <div className={cn(`grid ${getGridColsClass()} gap-5`, className)}>
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} aspectRatio={aspectRatio} showText={showText} />
      ))}
    </div>
  );
}

interface ListSkeletonProps {
  /** Number of skeleton items (default: 5) */
  count?: number;
  /** Show avatar placeholder */
  showAvatar?: boolean;
  className?: string;
}

function ListSkeleton({ count = 5, showAvatar = false, className }: ListSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          {showAvatar && (
            <Skeleton variant="circular" className="w-10 h-10 flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface TableSkeletonProps {
  /** Number of rows (default: 5) */
  rows?: number;
  /** Number of columns (default: 4) */
  cols?: number;
  className?: string;
}

function TableSkeleton({ rows = 5, cols = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-border">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} variant="text" className="flex-1 h-5" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2">
          {Array.from({ length: cols }, (_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              className="flex-1"
              style={{ width: `${Math.random() * 30 + 50}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export { Skeleton, CardSkeleton, GridSkeleton, ListSkeleton, TableSkeleton };
export type { SkeletonProps, CardSkeletonProps, GridSkeletonProps, ListSkeletonProps, TableSkeletonProps };

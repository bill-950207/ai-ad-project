'use client'

import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef, ReactNode } from "react";
import { Button, ButtonProps } from "./button";
import { useLanguage } from "@/contexts/language-context";
import {
  ImageIcon,
  VideoIcon,
  UserCircle2,
  Music,
  Package,
  FolderOpen,
  SearchX,
  AlertCircle,
  LucideIcon
} from "lucide-react";

type EmptyStateT = {
  noImages?: { title?: string; description?: string };
  noVideos?: { title?: string; description?: string };
  noAvatars?: { title?: string; description?: string };
  noMusic?: { title?: string; description?: string };
  noProducts?: { title?: string; description?: string };
  noResults?: { title?: string; description?: string };
  error?: { title?: string; description?: string };
};

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Icon to display (can be a Lucide icon component or custom ReactNode) */
  icon?: LucideIcon | ReactNode;
  /** Main title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: ButtonProps["variant"];
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Size variant */
  size?: "sm" | "default" | "lg";
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({
    className,
    icon: IconProp,
    title,
    description,
    action,
    secondaryAction,
    size = "default",
    ...props
  }, ref) => {
    const sizeClasses = {
      sm: {
        container: "py-8",
        iconWrapper: "w-12 h-12 mb-3",
        iconSize: "w-6 h-6",
        title: "text-base",
        description: "text-sm",
      },
      default: {
        container: "py-12",
        iconWrapper: "w-16 h-16 mb-4",
        iconSize: "w-8 h-8",
        title: "text-lg",
        description: "text-sm",
      },
      lg: {
        container: "py-16",
        iconWrapper: "w-20 h-20 mb-6",
        iconSize: "w-10 h-10",
        title: "text-xl",
        description: "text-base",
      },
    };

    const sizes = sizeClasses[size];

    // Render icon
    const renderIcon = () => {
      if (!IconProp) {
        return <FolderOpen className={cn(sizes.iconSize, "text-muted-foreground")} />;
      }

      // If it's a Lucide icon component
      if (typeof IconProp === "function") {
        const LucideIcon = IconProp as LucideIcon;
        return <LucideIcon className={cn(sizes.iconSize, "text-muted-foreground")} />;
      }

      // If it's a custom ReactNode
      return IconProp;
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center",
          sizes.container,
          className
        )}
        {...props}
      >
        <div className={cn(
          "rounded-2xl bg-muted/50 flex items-center justify-center",
          sizes.iconWrapper
        )}>
          {renderIcon()}
        </div>

        <h3 className={cn("font-semibold text-foreground mb-1", sizes.title)}>
          {title}
        </h3>

        {description && (
          <p className={cn("text-muted-foreground max-w-sm", sizes.description)}>
            {description}
          </p>
        )}

        {(action || secondaryAction) && (
          <div className="flex items-center gap-3 mt-6">
            {action && (
              action.href ? (
                <a href={action.href}>
                  <Button variant={action.variant || "default"}>
                    {action.label}
                  </Button>
                </a>
              ) : (
                <Button
                  variant={action.variant || "default"}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              )
            )}
            {secondaryAction && (
              secondaryAction.href ? (
                <a href={secondaryAction.href}>
                  <Button variant="ghost">
                    {secondaryAction.label}
                  </Button>
                </a>
              ) : (
                <Button variant="ghost" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              )
            )}
          </div>
        )}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

// Pre-built empty states for common use cases
interface PresetEmptyStateProps extends Omit<EmptyStateProps, "icon" | "title" | "description"> {
  customTitle?: string;
  customDescription?: string;
}

function NoImagesEmptyState({ customTitle, customDescription, ...props }: PresetEmptyStateProps) {
  const { t } = useLanguage();
  const emptyStateT = t.common?.emptyState as EmptyStateT | undefined;
  return (
    <EmptyState
      icon={ImageIcon}
      title={customTitle || emptyStateT?.noImages?.title || "No images yet"}
      description={customDescription || emptyStateT?.noImages?.description || "Create your first image ad to get started"}
      {...props}
    />
  );
}

function NoVideosEmptyState({ customTitle, customDescription, ...props }: PresetEmptyStateProps) {
  const { t } = useLanguage();
  const emptyStateT = t.common?.emptyState as EmptyStateT | undefined;
  return (
    <EmptyState
      icon={VideoIcon}
      title={customTitle || emptyStateT?.noVideos?.title || "No videos yet"}
      description={customDescription || emptyStateT?.noVideos?.description || "Create your first video ad to get started"}
      {...props}
    />
  );
}

function NoAvatarsEmptyState({ customTitle, customDescription, ...props }: PresetEmptyStateProps) {
  const { t } = useLanguage();
  const emptyStateT = t.common?.emptyState as EmptyStateT | undefined;
  return (
    <EmptyState
      icon={UserCircle2}
      title={customTitle || emptyStateT?.noAvatars?.title || "No avatars yet"}
      description={customDescription || emptyStateT?.noAvatars?.description || "Create your first avatar to get started"}
      {...props}
    />
  );
}

function NoMusicEmptyState({ customTitle, customDescription, ...props }: PresetEmptyStateProps) {
  const { t } = useLanguage();
  const emptyStateT = t.common?.emptyState as EmptyStateT | undefined;
  return (
    <EmptyState
      icon={Music}
      title={customTitle || emptyStateT?.noMusic?.title || "No music yet"}
      description={customDescription || emptyStateT?.noMusic?.description || "Generate your first music track to get started"}
      {...props}
    />
  );
}

function NoProductsEmptyState({ customTitle, customDescription, ...props }: PresetEmptyStateProps) {
  const { t } = useLanguage();
  const emptyStateT = t.common?.emptyState as EmptyStateT | undefined;
  return (
    <EmptyState
      icon={Package}
      title={customTitle || emptyStateT?.noProducts?.title || "No products yet"}
      description={customDescription || emptyStateT?.noProducts?.description || "Add your first product to get started"}
      {...props}
    />
  );
}

function NoResultsEmptyState({ customTitle, customDescription, ...props }: PresetEmptyStateProps) {
  const { t } = useLanguage();
  const emptyStateT = t.common?.emptyState as EmptyStateT | undefined;
  return (
    <EmptyState
      icon={SearchX}
      title={customTitle || emptyStateT?.noResults?.title || "No results found"}
      description={customDescription || emptyStateT?.noResults?.description || "Try adjusting your search or filters"}
      {...props}
    />
  );
}

function ErrorEmptyState({ customTitle, customDescription, ...props }: PresetEmptyStateProps) {
  const { t } = useLanguage();
  const emptyStateT = t.common?.emptyState as EmptyStateT | undefined;
  return (
    <EmptyState
      icon={AlertCircle}
      title={customTitle || emptyStateT?.error?.title || "Something went wrong"}
      description={customDescription || emptyStateT?.error?.description || "An error occurred. Please try again."}
      {...props}
    />
  );
}

export {
  EmptyState,
  NoImagesEmptyState,
  NoVideosEmptyState,
  NoAvatarsEmptyState,
  NoMusicEmptyState,
  NoProductsEmptyState,
  NoResultsEmptyState,
  ErrorEmptyState,
};
export type { EmptyStateProps, PresetEmptyStateProps };

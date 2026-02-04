'use client'

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { HTMLAttributes, forwardRef, useEffect, useCallback, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** ARIA label for the modal */
  ariaLabel?: string;
  /** Close on backdrop click (default: true) */
  closeOnBackdrop?: boolean;
  /** Close on Escape key (default: true) */
  closeOnEscape?: boolean;
  /** Show close button in header (default: true) */
  showCloseButton?: boolean;
  /** Custom class for the modal container */
  className?: string;
}

interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Icon element to display before title */
  icon?: ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
}

type ModalBodyProps = HTMLAttributes<HTMLDivElement>;

type ModalFooterProps = HTMLAttributes<HTMLDivElement>;

const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, icon, onClose, showCloseButton = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between p-6 border-b border-border",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="text-xl font-bold text-foreground">{children}</div>
        </div>
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>
    );
  }
);
ModalHeader.displayName = "ModalHeader";

const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("p-6", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ModalBody.displayName = "ModalBody";

const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-end gap-3 p-6 pt-0",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ModalFooter.displayName = "ModalFooter";

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({
    isOpen,
    onClose,
    children,
    size = "md",
    ariaLabel,
    closeOnBackdrop = true,
    closeOnEscape = true,
    className,
  }, ref) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Handle Escape key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        onClose();
      }
    }, [closeOnEscape, onClose]);

    // Focus trap and keyboard handling
    useEffect(() => {
      if (isOpen) {
        previousActiveElement.current = document.activeElement as HTMLElement;
        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        // Focus the modal
        setTimeout(() => {
          modalRef.current?.focus();
        }, 0);
      }

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";

        // Restore focus
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    const sizeClasses = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      full: "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]",
    };

    const modalContent = (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closeOnBackdrop ? onClose : undefined}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          ref={(node) => {
            (modalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          className={cn(
            "relative bg-card border border-border rounded-2xl w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200 outline-none",
            sizeClasses[size],
            className
          )}
          tabIndex={-1}
        >
          {children}
        </div>
      </div>
    );

    // Use portal to render at document root
    if (typeof window !== "undefined") {
      return createPortal(modalContent, document.body);
    }

    return modalContent;
  }
);
Modal.displayName = "Modal";

export { Modal, ModalHeader, ModalBody, ModalFooter };
export type { ModalProps, ModalHeaderProps, ModalBodyProps, ModalFooterProps };

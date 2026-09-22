import React, { ReactNode, useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { useRouter } from "next/navigation";

const modalVariants = cva(
  "fixed inset-0 z-50 flex items-center justify-center px-4 py-4 sm:p-6",
  {
    variants: {
      variant: {
        default: "bg-black/50 backdrop-blur-sm",
        // Additional variants could be added here
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const modalContentVariants = cva(
  "relative bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-md",
  {
    variants: {
      variant: {
        default: "",
        // Additional variants could be added here
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ModalProps {
  children: ReactNode;
  className?: string;
  onClose?: () => void;
  variant?: VariantProps<typeof modalVariants>["variant"];
}

const Modal = React.forwardRef<
  HTMLDivElement,
  ModalProps
>(({ className, children, onClose, variant = "default", ...props }, ref) => {
  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Handle backdrop click
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div
      ref={ref}
      className={modalVariants({ variant, className })}
      onClick={handleClick}
      {...props}
    >
      <div className={modalContentVariants({ variant })}>
        {children}
      </div>
    </div>
  );
});
Modal.displayName = "Modal";

interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
}

const ModalHeader = ({ children, className = "" }: ModalHeaderProps) => {
  return (
    <div className={`flex items-start justify-between p-4 border-b rounded-t dark:border-slate-800 ${className}`}>
      {children}
    </div>
  );
};
ModalHeader.displayName = "ModalHeader";

interface ModalTitleProps {
  children: ReactNode;
  className?: string;
}

const ModalTitle = ({ children, className = "" }: ModalTitleProps) => {
  return (
    <h3 className={`text-lg font-semibold text-slate-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
};
ModalTitle.displayName = "ModalTitle";

interface ModalDescriptionProps {
  children: ReactNode;
  className?: string;
}

const ModalDescription = ({ children, className = "" }: ModalDescriptionProps) => {
  return (
    <div className={`mt-3 text-slate-500 dark:text-slate-400 ${className}`}>
      {children}
    </div>
  );
};
ModalDescription.displayName = "ModalDescription";

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

const ModalFooter = ({ children, className = "" }: ModalFooterProps) => {
  return (
    <div className={`flex items-center p-4 border-t border-slate-200 rounded-b dark:border-slate-800 ${className}`}>
      {children}
    </div>
  );
};
ModalFooter.displayName = "ModalFooter";

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

const ModalBody = ({ children, className = "" }: ModalBodyProps) => {
  return (
    <div className={`mt-4 space-y-6 ${className}`}>
      {children}
    </div>
  );
};
ModalBody.displayName = "ModalBody";

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalBody,
  modalVariants,
  modalContentVariants,
};
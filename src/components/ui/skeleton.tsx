import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const skeletonVariants = cva(
  "animate-pulse bg-slate-200 rounded",
  {
    variants: {
      variant: {
        default: "",
        circular: "rounded-full",
        square: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof skeletonVariants>["variant"];
  className?: string;
  height?: string | number;
  width?: string | number;
}

const Skeleton = React.forwardRef<
  HTMLDivElement,
  SkeletonProps
>(({ className, variant, height, width, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={skeletonVariants({ variant, className })}
      style={{ height, width }}
      {...props}
    />
  );
});
Skeleton.displayName = "Skeleton";

export { Skeleton, skeletonVariants };
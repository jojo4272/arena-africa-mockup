import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "rounded-md border border-input bg-background shadow-sm",
  {
    variants: {
      variant: {
        default: "",
        destructive:
          "border-destructive/50 text-destructive bg-destructive/5",
        outline:
          "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof cardVariants>["variant"];
  className?: string;
}

const Card = React.forwardRef<
  HTMLDivElement,
  CardProps
>(({ className, variant, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cardVariants({ variant, className })}
      {...props}
    />
  );
});
Card.displayName = "Card";

export { Card, cardVariants };
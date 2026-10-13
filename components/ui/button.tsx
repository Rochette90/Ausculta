import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]",
  {
    variants: {
      variant: {
        default: "bg-[var(--ink)] px-5 py-3 text-[var(--paper)] hover:bg-[var(--ink-hover)]",
        outline: "border-[1.5px] border-[var(--line)] bg-transparent px-5 py-3 text-[var(--ink)] hover:border-[var(--ink)]",
        ghost: "px-4 py-2 text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]",
        destructive: "bg-[var(--red)] px-5 py-3 text-white hover:opacity-90",
      },
      size: {
        default: "min-h-11",
        sm: "min-h-9 px-3 py-2 text-xs",
        lg: "min-h-12 px-7 py-3.5 text-base",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({ className, variant, size, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

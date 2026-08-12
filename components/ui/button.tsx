import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-teal-700 px-5 py-3 text-white shadow-sm hover:bg-teal-800",
        outline: "border border-slate-200 bg-white px-5 py-3 text-slate-900 hover:border-teal-600 hover:text-teal-700",
        ghost: "px-4 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950",
        destructive: "bg-rose-600 px-5 py-3 text-white hover:bg-rose-700",
      },
      size: {
        default: "min-h-11",
        sm: "min-h-9 px-3 py-2 text-xs",
        lg: "min-h-12 px-7 py-3.5",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({ className, variant, size, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

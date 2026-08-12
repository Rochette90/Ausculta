import * as React from "react";
import { cn } from "../../lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} className={cn("flex min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:opacity-50", className)} {...props} />;
}

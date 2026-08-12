import * as React from "react";
import { cn } from "../../lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm", className)} {...props} />;
}

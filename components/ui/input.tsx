import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} className={cn("flex min-h-12 w-full rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-base text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted-light)] focus:border-[var(--ink)] disabled:opacity-60", className)} {...props} />;
}

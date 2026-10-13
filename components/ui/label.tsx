import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  // The consumer supplies htmlFor because this reusable primitive cannot know the input id.
  // eslint-disable-next-line jsx-a11y/label-has-associated-control
  return <label className={cn("text-sm font-semibold text-[var(--ink)]", className)} {...props} />;
}

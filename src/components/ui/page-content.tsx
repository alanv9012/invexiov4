import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type PageContentProps = HTMLAttributes<HTMLElement>;

/** Consistent vertical rhythm and entrance motion for dashboard pages. */
export function PageContent({ className, children, ...props }: PageContentProps) {
  return (
    <section className={cn("space-y-6 animate-page-enter", className)} {...props}>
      {children}
    </section>
  );
}

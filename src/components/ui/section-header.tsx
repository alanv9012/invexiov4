import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type SectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  size?: "page" | "section";
};

export function SectionHeader({
  title,
  description,
  action,
  className,
  size = "section"
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        size === "page" && "gap-4",
        className
      )}
    >
      <div className="space-y-1">
        <h2
          className={cn(
            "font-semibold tracking-tight text-foreground",
            size === "page" ? "text-display" : "text-title"
          )}
        >
          {title}
        </h2>
        {description ? <p className="text-body-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto [&_button]:w-full sm:[&_button]:w-auto">{action}</div> : null}
    </div>
  );
}

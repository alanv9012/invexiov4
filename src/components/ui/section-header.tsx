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
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        size === "page" && "mb-2",
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
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import { Card } from "@/components/ui/card";

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <Card variant="dashed" padding="lg" className={cn("text-center", className)}>
      <h3 className="text-title text-foreground">{title}</h3>
      {description ? <p className="mt-2 text-body-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </Card>
  );
}

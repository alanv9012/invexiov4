import { cn } from "@/lib/ui/cn";
import { Input, type InputProps } from "@/components/ui/input";

export function SearchField({ className, ...props }: InputProps) {
  return (
    <div className={cn("relative", className)}>
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20L17 17" strokeLinecap="round" />
        </svg>
      </span>
      <Input className="pl-9" {...props} />
    </div>
  );
}

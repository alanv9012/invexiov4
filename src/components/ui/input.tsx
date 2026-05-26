import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

const fieldClassName =
  "w-full min-h-11 rounded-md border border-border-strong bg-surface px-3 py-2.5 text-base text-foreground outline-none transition duration-150 placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70 md:min-h-10 md:py-2 md:text-body-sm";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-foreground", className)} {...props} />;
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export function Input({ className, hasError, ...props }: InputProps) {
  return (
    <input
      className={cn(
        fieldClassName,
        hasError && "border-danger focus:border-danger focus:ring-danger/10",
        className
      )}
      {...props}
    />
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

export function Textarea({ className, hasError, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        fieldClassName,
        "min-h-[5rem] resize-y",
        hasError && "border-danger focus:border-danger focus:ring-danger/10",
        className
      )}
      {...props}
    />
  );
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

export function Select({ className, hasError, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        fieldClassName,
        hasError && "border-danger focus:border-danger focus:ring-danger/10",
        className
      )}
      {...props}
    />
  );
}

export type FormFieldProps = {
  label: string;
  htmlFor?: string;
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormField({ label, htmlFor, error, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error ? <p className="text-caption text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-caption text-danger-foreground">{error}</p> : null}
    </div>
  );
}

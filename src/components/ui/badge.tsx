"use client";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "outline";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantToClasses: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  success:
    "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  warning:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline:
    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
};

export function Badge({
  variant = "default",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantToClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

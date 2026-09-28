import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider", {
  variants: {
    variant: {
      default: "bg-accent text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      outline: "border bg-transparent text-muted-foreground",
      destructive: "bg-red-50 text-red-700",
      warning: "bg-amber-50 text-amber-700",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }: HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

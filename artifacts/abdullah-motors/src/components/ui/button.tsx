import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium cursor-pointer transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-primary text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.64_0.21_280/0.5)] hover:shadow-[var(--shadow-glow-strong)] hover:scale-[1.02]",
        glass:
          "glass-surface text-foreground hover:bg-[color-mix(in_oklab,var(--surface)_85%,transparent)] hover:border-white/20 hover:scale-[1.02]",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-surface hover:border-white/20",
        gold: "bg-gold text-background font-semibold shadow-[var(--shadow-gold)] hover:brightness-110 hover:scale-[1.02]",
        ghost: "text-foreground hover:bg-surface",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-110",
        link: "text-foreground underline-offset-4 hover:underline hover:text-white",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        default: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

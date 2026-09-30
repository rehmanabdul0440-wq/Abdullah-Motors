import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onInvalid, onInput, ...props }, ref) => {
    const [invalid, setInvalid] = React.useState(false);
    const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleInvalid = (e: React.FormEvent<HTMLInputElement>) => {
      setInvalid(false);
      // Re-trigger reflow so the shake animation restarts on repeated submits.
      requestAnimationFrame(() => setInvalid(true));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setInvalid(false), 500);
      onInvalid?.(e);
    };

    const handleInput = (e: React.InputEvent<HTMLInputElement>) => {
      if (invalid) setInvalid(false);
      onInput?.(e);
    };

    return (
      <input
        type={type}
        onInvalid={handleInvalid}
        onInput={handleInput}
        data-invalid={invalid || undefined}
        className={cn(
          "flex h-11 w-full rounded-full border border-border bg-input px-4 py-2 text-sm text-foreground transition-[box-shadow,border-color,background-color] duration-300 ease-out",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:border-[color-mix(in_oklab,var(--primary)_55%,transparent)]",
          "focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_18%,transparent),0_0_28px_-4px_color-mix(in_oklab,var(--primary)_45%,transparent)]",
          "data-[invalid=true]:border-destructive data-[invalid=true]:shadow-[0_0_0_4px_color-mix(in_oklab,var(--destructive)_22%,transparent)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

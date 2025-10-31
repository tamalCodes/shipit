"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost" | "link" | "segment";
type ButtonSize = "sm" | "md" | "lg" | "none";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isActive?: boolean;
};

const baseClass =
  "inline-flex items-center justify-center font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:outline-zinc-900",
  outline:
    "rounded-2xl border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-zinc-300",
  ghost:
    "rounded-full bg-transparent text-zinc-600 hover:text-zinc-900 focus-visible:outline-zinc-400",
  link:
    "rounded-none bg-transparent p-0 text-sm font-medium text-zinc-500 underline underline-offset-2 focus-visible:outline-none hover:text-zinc-900",
  segment:
    "rounded-full bg-transparent text-sm focus-visible:outline-zinc-900",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-4 py-3 text-sm",
  lg: "px-5 py-3 text-base",
  none: "",
};

const segmentStateClasses = {
  active: "bg-white text-zinc-900 shadow-sm",
  inactive: "text-zinc-600 hover:text-zinc-900",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size,
      isActive = false,
      type = "button",
      ...props
    },
    ref
  ) => {
    const resolvedSize =
      size ?? (variant === "segment" ? "sm" : variant === "link" ? "none" : "md");

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          baseClass,
          variantClasses[variant],
          resolvedSize !== "none" ? sizeClasses[resolvedSize] : "",
          variant === "segment"
            ? isActive
              ? segmentStateClasses.active
              : segmentStateClasses.inactive
            : "",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export default Button;

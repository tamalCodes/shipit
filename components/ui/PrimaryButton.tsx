"use client";

import { forwardRef } from "react";

import Button, { type ButtonProps } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type PrimaryButtonProps = ButtonProps & {
  isLoading?: boolean;
  loadingText?: string;
};

const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  (
    {
      children,
      className,
      isLoading = false,
      loadingText = "Loading...",
      disabled,
      ...props
    },
    ref
  ) => (
    <Button
      ref={ref}
      variant="primary"
      size="md"
      disabled={disabled || isLoading}
      className={cn(
        "h-12 cursor-pointer disabled:cursor-not-allowed w-full rounded-2xl text-sm font-semibold",
        className
      )}
      {...props}
    >
      {isLoading ? loadingText : children}
    </Button>
  )
);

PrimaryButton.displayName = "PrimaryButton";

export default PrimaryButton;

"use client";

import { forwardRef } from "react";

import Button, { type ButtonProps } from "@/components/ui/Button";

type OAuthButtonProps = ButtonProps & {
  provider?: "google";
  isLoading?: boolean;
};

const googleIcon = (
  <svg
    aria-hidden="true"
    focusable="false"
    className="h-4 w-4"
    viewBox="0 0 18 18"
  >
    <path
      d="M17.64 9.2045c0-.638-.0573-1.2517-.1636-1.8409H9v3.4813h4.8436c-.2091 1.125-.8436 2.0782-1.7968 2.7164v2.2582h2.9087c1.7036-1.5673 2.6845-3.8809 2.6845-6.6149z"
      fill="#4285F4"
    />
    <path
      d="M9 18c2.43 0 4.4672-.8055 5.9564-2.1809l-2.9087-2.2582c-.8055.54-1.8354.8582-3.0477.8582-2.3441 0-4.3282-1.5832-5.0359-3.7105H.957031v2.3314C2.43886 15.9832 5.48139 18 9 18z"
      fill="#34A853"
    />
    <path
      d="M3.96411 10.7086C3.78516 10.1682 3.68182 9.59318 3.68182 9c0-.59318.10334-1.16818.28229-1.70864V4.95914H.957614C.347045 6.16818 0 7.54773 0 9c0 1.4523.347045 2.8318.957614 4.0409l3.006496-2.3323z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.57955c1.3214 0 2.5059.45454 3.4427 1.34591l2.5827-2.58273C13.4632.89 11.426 0 9 0 5.48139 0 2.43886 2.01682.957031 4.95914l3.006497 2.33222C4.67182 5.16273 6.65591 3.57955 9 3.57955z"
      fill="#EA4335"
    />
  </svg>
);

const OAuthButton = forwardRef<HTMLButtonElement, OAuthButtonProps>(
  (
    {
      children = "Continue with Google",
      provider = "google",
      isLoading = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => (
    <Button
      ref={ref}
      variant="outline"
      size="md"
      disabled={disabled || isLoading}
      className={`h-12 cursor-pointer disabled:cursor-not-allowed w-full gap-3 rounded-2xl ${
        className ?? ""
      }`}
      {...props}
    >
      {provider === "google" ? googleIcon : null}
      {isLoading ? "Connecting..." : children}
    </Button>
  )
);

OAuthButton.displayName = "OAuthButton";

export default OAuthButton;

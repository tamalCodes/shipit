"use client";

import { FormEvent } from "react";

import Divider from "@/components/ui/Divider";
import InputField from "@/components/ui/InputField";
import OAuthButton from "@/components/ui/OAuthButton";
import PrimaryButton from "@/components/ui/PrimaryButton";

type EmailStepProps = {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  error?: string;
  isLoading: boolean;
  canSubmit: boolean;
  onContinueWithGoogle: () => void;
  isGoogleLoading: boolean;
};

export default function EmailStep({
  email,
  onEmailChange,
  onSubmit,
  error,
  isLoading,
  canSubmit,
  onContinueWithGoogle,
  isGoogleLoading,
}: EmailStepProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSubmit && !isLoading) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-10">
      <header className="space-y-2 text-left">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Sign in
        </h1>
        <p className="text-sm text-zinc-500">
          Use Google or your email.
        </p>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <InputField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          errorMessage={error}
          disabled={isLoading}
          required
        />

        <PrimaryButton
          type="submit"
          isLoading={isLoading}
          loadingText="Checking..."
          disabled={!canSubmit}
        >
          Continue
        </PrimaryButton>
      </form>

      <div className="space-y-4">
        <Divider />
        <OAuthButton
          onClick={onContinueWithGoogle}
          disabled={isLoading}
          isLoading={isGoogleLoading}
        />
      </div>
    </div>
  );
}

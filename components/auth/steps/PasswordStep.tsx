"use client";

import { FormEvent } from "react";

import Divider from "@/components/ui/Divider";
import InputField from "@/components/ui/InputField";
import OAuthButton from "@/components/ui/OAuthButton";
import PrimaryButton from "@/components/ui/PrimaryButton";

type PasswordStepProps = {
  email: string;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  error?: string;
  isLoading: boolean;
  canSubmit: boolean;
  onForgotPassword: () => void;
  onContinueWithGoogle: () => void;
  isGoogleLoading: boolean;
};

export default function PasswordStep({
  email,
  password,
  onPasswordChange,
  onSubmit,
  error,
  isLoading,
  canSubmit,
  onForgotPassword,
  onContinueWithGoogle,
  isGoogleLoading,
}: PasswordStepProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSubmit && !isLoading) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-10">
      <header className="space-y-2 text-left">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-zinc-950">
          Welcome back
        </h1>
        <p className="text-sm text-zinc-500">
          {email}
        </p>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <InputField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          errorMessage={error}
          disabled={isLoading}
          required
        />

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs font-medium text-zinc-500 underline underline-offset-2 transition hover:text-zinc-900"
          >
            Forgot password?
          </button>
        </div>

        <PrimaryButton
          type="submit"
          isLoading={isLoading}
          loadingText="Signing in..."
          disabled={!canSubmit}
        >
          Log in
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

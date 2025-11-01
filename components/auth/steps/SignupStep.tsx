"use client";

import { FormEvent } from "react";

import Divider from "@/components/ui/Divider";
import InputField from "@/components/ui/InputField";
import OAuthButton from "@/components/ui/OAuthButton";
import PrimaryButton from "@/components/ui/PrimaryButton";

type SignupStepProps = {
  email: string;
  name: string;
  password: string;
  onNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  errors: {
    name?: string;
    password?: string;
  };
  isLoading: boolean;
  canSubmit: boolean;
  onContinueWithGoogle: () => void;
  isGoogleLoading: boolean;
};

export default function SignupStep({
  email,
  name,
  password,
  onNameChange,
  onPasswordChange,
  onSubmit,
  errors,
  isLoading,
  canSubmit,
  onContinueWithGoogle,
  isGoogleLoading,
}: SignupStepProps) {
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
          Create your account
        </h1>
        <p className="text-sm text-zinc-500">
          We&apos;ll send updates to {email}.
        </p>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <InputField
          label="Full name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          errorMessage={errors.name}
          disabled={isLoading}
          required
        />

        <InputField
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          errorMessage={errors.password}
          disabled={isLoading}
          required
        />

        <PrimaryButton
          type="submit"
          isLoading={isLoading}
          loadingText="Creating..."
          disabled={!canSubmit}
        >
          Create account
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

      <p className="text-xs text-zinc-400">
        By continuing you agree to our Terms & Privacy Policy.
      </p>
    </div>
  );
}

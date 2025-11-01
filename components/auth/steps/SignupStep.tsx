"use client";

import { FormEvent, useState } from "react";
import { FiCheck, FiEye, FiEyeOff, FiX } from "react-icons/fi";

import Divider from "@/components/ui/Divider";
import InputField from "@/components/ui/InputField";
import OAuthButton from "@/components/ui/OAuthButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import type { PasswordCheck } from "@/lib/password";

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
  passwordChecks: PasswordCheck[];
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
  passwordChecks,
  isLoading,
  canSubmit,
  onContinueWithGoogle,
  isGoogleLoading,
}: SignupStepProps) {
  const [showPassword, setShowPassword] = useState(false);

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

        <div className="space-y-1.5">
          <label
            htmlFor="signup-password"
            className="block text-sm font-medium text-zinc-700"
          >
            Password<span className="ml-0.5 text-rose-500">*</span>
          </label>

          <div className="relative">
            <input
              id="signup-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              disabled={isLoading}
              required
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:opacity-70"
            />

            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500 transition hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          </div>

          {errors.password ? (
            <p className="text-sm text-rose-500">{errors.password}</p>
          ) : null}

          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
            {passwordChecks.map((requirement) => {
              const Icon = requirement.met ? FiCheck : FiX;
              return (
                <li
                  key={requirement.id}
                  className={`flex items-center gap-1.5 ${
                    requirement.met ? "text-emerald-600" : "text-zinc-500"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{requirement.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

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

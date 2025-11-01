"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import InputField from "@/components/ui/InputField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import {
  evaluatePassword,
  isPasswordStrong,
  MIN_PASSWORD_LENGTH,
  PasswordCheck,
} from "@/lib/password";

type ResetPasswordFlowProps = {
  initialEmail?: string;
  token?: string;
};

type View =
  | "request"
  | "request_success"
  | "reset"
  | "reset_success";

type RequestStatus = "idle" | "loading" | "error";

type ResetStatus = "idle" | "loading" | "error";

export default function ResetPasswordFlow({
  initialEmail,
  token,
}: ResetPasswordFlowProps) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("idle");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestToken, setRequestToken] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetStatus, setResetStatus] = useState<ResetStatus>("idle");
  const [resetError, setResetError] = useState<string | null>(null);

  const [view, setView] = useState<View>(
    token ? "reset" : "request"
  );

  const normalizedToken = token ?? requestToken ?? "";

  const passwordChecks: PasswordCheck[] = useMemo(
    () => evaluatePassword(password.trim()),
    [password]
  );

  const passwordStrong = useMemo(
    () => isPasswordStrong(password.trim()),
    [password]
  );

  const passwordMatchesConfirmation =
    password.trim() === confirmPassword.trim();

  useEffect(() => {
    if (token && view !== "reset") {
      setView("reset");
    }

    if (!token && view === "reset") {
      setView("request");
    }
  }, [token, view]);

  const handleRequestSubmit = async () => {
    if (requestStatus === "loading") {
      return;
    }

    const trimmedEmail = email.trim();

    if (trimmedEmail.length === 0) {
      setRequestError("Enter the email associated with your account.");
      return;
    }

    setRequestError(null);
    setRequestStatus("loading");

    try {
      const response = await fetch("/api/auth/password/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof payload?.message === "string"
            ? payload.message
            : "We couldn’t start the password reset right now.";
        throw new Error(message);
      }

      if (typeof payload?.token === "string") {
        setRequestToken(payload.token);
      }

      setView("request_success");
    } catch (error) {
      setRequestStatus("error");
      setRequestError(
        error instanceof Error
          ? error.message
          : "We couldn’t start the password reset right now."
      );
      return;
    }

    setRequestStatus("idle");
  };

  const handleResetSubmit = async () => {
    if (resetStatus === "loading") {
      return;
    }

    if (normalizedToken.trim().length === 0) {
      setResetError(
        "Your reset link is missing or has expired. Request a new one."
      );
      return;
    }

    if (!passwordStrong) {
      setResetError("Please meet all password requirements.");
      return;
    }

    if (!passwordMatchesConfirmation) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetError(null);
    setResetStatus("loading");

    try {
      const response = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: normalizedToken,
          password,
          confirmPassword,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof payload?.message === "string"
            ? payload.message
            : "We couldn’t reset your password.";
        throw new Error(message);
      }

      setView("reset_success");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setResetStatus("error");
      setResetError(
        error instanceof Error
          ? error.message
          : "We couldn’t reset your password."
      );
      return;
    }

    setResetStatus("idle");
  };

  const renderRequestForm = () => (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600">
        Enter the email address you used to sign in and we’ll send you a link to
        reset your password.
      </p>

      <div className="space-y-4">
        <InputField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          errorMessage={requestError ?? undefined}
          disabled={requestStatus === "loading"}
          required
        />

        <PrimaryButton
          type="button"
          onClick={handleRequestSubmit}
          isLoading={requestStatus === "loading"}
          loadingText="Sending link..."
          disabled={requestStatus === "loading"}
        >
          Send reset link
        </PrimaryButton>
      </div>
    </div>
  );

  const renderRequestSuccess = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900">
        Check your inbox
      </h2>
      <p className="text-sm text-zinc-600">
        If an account exists for <span className="font-medium">{email}</span>,
        we just sent you a link to reset your password.
      </p>
      {requestToken ? (
        <div className="space-y-2 rounded-md border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-700">
          <div>
            <span className="block font-medium">Development token</span>
            <span className="break-all font-mono">{requestToken}</span>
          </div>
          <Link
            href={`/reset-password?token=${encodeURIComponent(requestToken)}`}
            className="inline-flex text-indigo-600 underline hover:text-indigo-500"
          >
            Open reset form with this token
          </Link>
        </div>
      ) : null}
    </div>
  );

  const renderPasswordCheck = (check: PasswordCheck) => (
    <li
      key={check.id}
      className={`flex items-center gap-1.5 ${
        check.met ? "text-emerald-600" : "text-zinc-500"
      } text-xs`}
    >
      <span aria-hidden="true">{check.met ? "✔" : "✖"}</span>
      <span>{check.label}</span>
    </li>
  );

  const renderResetForm = () => (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600">
        Choose a new password that meets the requirements below.
      </p>

      <div className="space-y-4">
        <InputField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          errorMessage={undefined}
          disabled={resetStatus === "loading"}
          required
        />

        <InputField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          errorMessage={resetError ?? undefined}
          disabled={resetStatus === "loading"}
          required
        />

        <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
          {passwordChecks.map(renderPasswordCheck)}
        </ul>

        <PrimaryButton
          type="button"
          onClick={handleResetSubmit}
          isLoading={resetStatus === "loading"}
          loadingText="Updating..."
          disabled={
            resetStatus === "loading" ||
            password.trim().length < MIN_PASSWORD_LENGTH ||
            !passwordStrong ||
            !passwordMatchesConfirmation
          }
        >
          Update password
        </PrimaryButton>
      </div>
    </div>
  );

  const renderResetSuccess = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900">
        Password updated
      </h2>
      <p className="text-sm text-zinc-600">
        Your password has been changed. You can now close this window and log in
        with your new password.
      </p>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl">
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-zinc-950">
            Reset your password
          </h1>
        </header>

        {view === "request" ? renderRequestForm() : null}
        {view === "request_success" ? renderRequestSuccess() : null}
        {view === "reset" ? renderResetForm() : null}
        {view === "reset_success" ? renderResetSuccess() : null}
      </div>
    </div>
  );
}

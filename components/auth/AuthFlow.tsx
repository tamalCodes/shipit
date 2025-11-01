"use client";

import { useRouter } from "next/navigation";
import { useReducer, useState } from "react";

import EmailStep from "@/components/auth/steps/EmailStep";
import PasswordStep from "@/components/auth/steps/PasswordStep";
import SignupStep from "@/components/auth/steps/SignupStep";
import { setAuthToken } from "@/lib/auth-client";
import {
  evaluatePassword,
  isPasswordStrong,
  MIN_PASSWORD_LENGTH,
} from "@/lib/password";

type AuthStatus =
  | "idle"
  | "validating"
  | "needs_password"
  | "needs_signup"
  | "submitting"
  | "done";

type AuthStep = "email" | "password" | "signup";

export interface UserCheckResponse {
  exists: boolean;
}

interface AuthSuccessResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface AuthState {
  step: AuthStep;
  status: AuthStatus;
  email: string;
  name: string;
  password: string;
  errors: Partial<Record<"email" | "password" | "name" | "general", string>>;
}

type AuthAction =
  | { type: "updateEmail"; email: string }
  | { type: "updatePassword"; password: string }
  | { type: "updateName"; name: string }
  | { type: "setStatus"; status: AuthStatus }
  | { type: "setStep"; step: AuthStep; status: AuthStatus }
  | { type: "setErrors"; errors: Partial<AuthState["errors"]> }
  | { type: "clearErrors"; keys?: Array<keyof AuthState["errors"]> }
  | { type: "reset" };

const initialState: AuthState = {
  step: "email",
  status: "idle",
  email: "",
  name: "",
  password: "",
  errors: {},
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "updateEmail": {
      const nextErrors = { ...state.errors };
      delete nextErrors.email;
      delete nextErrors.general;

      return {
        ...state,
        email: action.email,
        errors: nextErrors,
      };
    }
    case "updatePassword": {
      const nextErrors = { ...state.errors };
      delete nextErrors.password;
      delete nextErrors.general;

      return {
        ...state,
        password: action.password,
        errors: nextErrors,
      };
    }
    case "updateName": {
      const nextErrors = { ...state.errors };
      delete nextErrors.name;
      delete nextErrors.general;

      return {
        ...state,
        name: action.name,
        errors: nextErrors,
      };
    }
    case "setStatus":
      return {
        ...state,
        status: action.status,
      };
    case "setStep": {
      const nextState: AuthState = {
        ...state,
        step: action.step,
        status: action.status,
        errors: {},
      };

      if (action.step !== "signup") {
        nextState.name = state.name;
      }

      if (action.step === "password" || action.step === "signup") {
        nextState.password = "";
      }

      if (action.step === "email") {
        nextState.name = "";
        nextState.password = "";
      }

      return nextState;
    }
    case "setErrors":
      return {
        ...state,
        errors: {
          ...state.errors,
          ...action.errors,
        },
      };
    case "clearErrors": {
      if (!action.keys) {
        return {
          ...state,
          errors: {},
        };
      }

      const nextErrors = { ...state.errors };
      action.keys.forEach((key) => {
        delete nextErrors[key];
      });

      return {
        ...state,
        errors: nextErrors,
      };
    }
    case "reset":
      return initialState;
    default:
      return state;
  }
}

type AuthFlowProps = {
  redirectTo?: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function postJson<TResponse>(
  url: string,
  body: Record<string, unknown>
): Promise<TResponse> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("Network error while calling", url, error);
    throw new Error("Unable to reach the server. Please try again.");
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof (payload as { message?: string } | null)?.message === "string"
        ? (payload as { message?: string }).message
        : "Request failed. Please try again.";

    throw new Error(message);
  }

  return payload as TResponse;
}

async function checkEmail(email: string): Promise<UserCheckResponse> {
  return postJson<UserCheckResponse>("/api/auth/status", { email });
}

function createSessionToken(prefix: string) {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

export default function AuthFlow({ redirectTo }: AuthFlowProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isGoogleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const isEmailValid = emailRegex.test(state.email.trim());
  const trimmedPassword = state.password.trim();
  const passwordChecks = evaluatePassword(trimmedPassword);
  const passwordIsStrong = isPasswordStrong(trimmedPassword);
  const canSubmitPasswordStep = trimmedPassword.length >= MIN_PASSWORD_LENGTH;
  const hasName = state.name.trim().length >= 2;

  const handleEmailSubmit = async () => {
    if (!isEmailValid) {
      dispatch({
        type: "setErrors",
        errors: { email: "Enter a valid email address." },
      });
      return;
    }

    dispatch({ type: "setStatus", status: "validating" });

    try {
      const response = await checkEmail(state.email.trim());

      if (response.exists) {
        dispatch({
          type: "setStep",
          step: "password",
          status: "needs_password",
        });
      } else {
        dispatch({ type: "setStep", step: "signup", status: "needs_signup" });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      const lower = message.toLowerCase();

      if (lower.includes("email")) {
        dispatch({
          type: "setErrors",
          errors: { email: message },
        });
      } else {
        dispatch({
          type: "setErrors",
          errors: { general: message },
        });
      }
    }

    dispatch({ type: "setStatus", status: "idle" });
  };

  const handlePasswordSubmit = async () => {
    if (!canSubmitPasswordStep) {
      dispatch({
        type: "setErrors",
        errors: {
          password: "Enter at least 8 characters.",
        },
      });
      return;
    }

    dispatch({ type: "setStatus", status: "submitting" });

    try {
      const response = await postJson<AuthSuccessResponse>("/api/auth/login", {
        email: state.email.trim(),
        password: state.password.trim(),
      });

      setAuthToken(response.token);
      dispatch({ type: "setStatus", status: "done" });
      router.replace(redirectTo ?? "/");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to log in right now. Please try again.";

      if (message.toLowerCase().includes("invalid email or password")) {
        dispatch({
          type: "setErrors",
          errors: {
            password: "Invalid email or password.",
          },
        });
      } else {
        dispatch({
          type: "setErrors",
          errors: { general: message },
        });
      }

      dispatch({ type: "setStatus", status: "needs_password" });
    }
  };

  const handleSignupSubmit = async () => {
    const nextErrors: AuthState["errors"] = {};

    if (!hasName) {
      nextErrors.name = "Tell us your name.";
    }

    if (!passwordIsStrong) {
      nextErrors.password = "Please meet all password requirements.";
    }

    if (Object.keys(nextErrors).length > 0) {
      dispatch({ type: "setErrors", errors: nextErrors });
      return;
    }

    dispatch({ type: "setStatus", status: "submitting" });

    try {
      const response = await postJson<AuthSuccessResponse>("/api/auth/signup", {
        email: state.email.trim(),
        password: state.password.trim(),
        name: state.name.trim(),
      });

      setAuthToken(response.token);
      dispatch({ type: "setStatus", status: "done" });
      router.replace(redirectTo ?? "/");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create your account right now. Please try again.";
      const lowered = message.toLowerCase();

      if (lowered.includes("email")) {
        dispatch({
          type: "setErrors",
          errors: { email: message },
        });
      } else if (lowered.includes("password")) {
        dispatch({
          type: "setErrors",
          errors: { password: message },
        });
      } else if (lowered.includes("name")) {
        dispatch({
          type: "setErrors",
          errors: { name: message },
        });
      } else {
        dispatch({
          type: "setErrors",
          errors: { general: message },
        });
      }

      dispatch({ type: "setStatus", status: "needs_signup" });
    }
  };

  const handleForgotPassword = () => {
    const emailParam = state.email.trim();
    const params = new URLSearchParams();

    if (emailParam.length > 0) {
      params.set("email", emailParam);
    }

    const query = params.toString();
    router.push(`/reset-password${query ? `?${query}` : ""}`);
  };

  const handleContinueWithGoogle = () => {
    if (isGoogleLoading) {
      return;
    }
    setGoogleLoading(true);
    setTimeout(() => {
      setAuthToken(createSessionToken("google"));
      router.replace(redirectTo ?? "/");
      router.refresh();
    }, 900);
  };

  const isValidating = state.status === "validating";
  const isSubmitting = state.status === "submitting";

  const renderStep = () => {
    if (state.step === "email") {
      return (
        <EmailStep
          email={state.email}
          onEmailChange={(value) =>
            dispatch({ type: "updateEmail", email: value })
          }
          onSubmit={handleEmailSubmit}
          error={state.errors.email}
          isLoading={isValidating}
          canSubmit={isEmailValid}
          onContinueWithGoogle={handleContinueWithGoogle}
          isGoogleLoading={isGoogleLoading}
        />
      );
    }

    if (state.step === "password") {
      return (
        <PasswordStep
          email={state.email}
          password={state.password}
        onPasswordChange={(value) =>
          dispatch({ type: "updatePassword", password: value })
        }
        onSubmit={handlePasswordSubmit}
        error={state.errors.password}
        isLoading={isSubmitting}
        canSubmit={canSubmitPasswordStep}
        onForgotPassword={handleForgotPassword}
        onContinueWithGoogle={handleContinueWithGoogle}
        isGoogleLoading={isGoogleLoading}
      />
    );
    }

    return (
      <SignupStep
        email={state.email}
        name={state.name}
        password={state.password}
        onNameChange={(value) => dispatch({ type: "updateName", name: value })}
        onPasswordChange={(value) =>
          dispatch({ type: "updatePassword", password: value })
        }
        onSubmit={handleSignupSubmit}
        passwordChecks={passwordChecks}
        errors={{
          name: state.errors.name,
          password: state.errors.password,
        }}
        isLoading={isSubmitting}
        canSubmit={hasName && passwordIsStrong}
        onContinueWithGoogle={handleContinueWithGoogle}
        isGoogleLoading={isGoogleLoading}
      />
    );
  };

  return (
    <div className="w-full">
      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl">
        {state.errors.general ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
            {state.errors.general}
          </div>
        ) : null}

        <div className="relative">{renderStep()}</div>
      </div>
    </div>
  );
}

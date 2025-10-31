"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import { setAuthToken } from "@/lib/auth-client";

type AuthMode = "signin" | "signup";

interface AuthFormProps {
  redirectTo?: string;
}

export default function AuthForm({ redirectTo }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    // Placeholder handler until backend wiring is ready.
    console.table(
      Array.from(formData.entries()).reduce<Record<string, FormDataEntryValue>>(
        (acc, [key, value]) => {
          acc[key] = value;
          return acc;
        },
        {}
      )
    );

    setTimeout(() => {
      const token =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);

      setAuthToken(token);
      setIsSubmitting(false);
      form.reset();

      router.replace(redirectTo ?? "/");
      router.refresh();
    }, 600);
  };

  const handleGoogle = () => {
    // Placeholder handler for upcoming OAuth integration.
    console.log("Continue with Google clicked");
  };

  const isSignUp = mode === "signup";

  return (
    <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-xl backdrop-blur-sm transition-colors">
      <div className="flex flex-col gap-3 text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Welcome
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          {isSignUp ? "Create your account" : "Sign in to continue"}
        </h1>
        <p className="text-sm text-zinc-500">
          Use your email and password or continue with Google.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-full bg-zinc-100 p-1 text-sm font-medium text-zinc-600">
        <Button
          onClick={() => setMode("signin")}
          variant="segment"
          isActive={mode === "signin"}
        >
          Log in
        </Button>
        <Button
          onClick={() => setMode("signup")}
          variant="segment"
          isActive={mode === "signup"}
        >
          Sign up
        </Button>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        {isSignUp && (
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-zinc-700">
              Full name
            </label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Taylor Swift"
              required
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <label htmlFor="password" className="font-medium text-zinc-700">
              Password
            </label>
            {!isSignUp && (
              <Button
                variant="link"
                size="none"
                className="text-xs text-zinc-500"
              >
                Forgot?
              </Button>
            )}
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            placeholder="••••••••"
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSignUp ? "Create account" : "Log in"}
        </Button>
      </form>

      <div className="mt-6">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-200" />
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
            or
          </span>
          <div className="h-px flex-1 bg-zinc-200" />
        </div>
        <Button
          onClick={handleGoogle}
          variant="outline"
          className="mt-4 w-full gap-3"
        >
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
          Continue with Google
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-400">
        By continuing you agree to our Terms & Privacy Policy.
      </p>
    </div>
  );
}

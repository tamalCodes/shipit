"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiLogOut } from "react-icons/fi";

import Button from "@/components/ui/Button";
import { clearAuthToken } from "@/lib/auth-client";

type SignOutButtonVariant = "button" | "icon";

type SignOutButtonProps = {
  variant?: SignOutButtonVariant;
};

export default function SignOutButton({
  variant = "button",
}: SignOutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(() => {
      clearAuthToken();
      router.replace("/auth");
      router.refresh();
    });
  };

  if (variant === "icon") {
    return (
      <Button
        onClick={handleSignOut}
        disabled={isPending}
        variant="outline"
        size="none"
        className="h-10 w-10 rounded-xl p-0 text-zinc-500 hover:text-zinc-900 disabled:text-zinc-400"
        aria-label="Sign out"
      >
        <FiLogOut className="h-4 w-4" />
        <span className="sr-only">
          {isPending ? "Signing out..." : "Sign out"}
        </span>
      </Button>
    );
  }

  return (
    <Button
      onClick={handleSignOut}
      disabled={isPending}
      variant="outline"
      size="sm"
      className="rounded-full"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}

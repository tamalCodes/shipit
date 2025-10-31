"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import { clearAuthToken } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(() => {
      clearAuthToken();
      router.replace("/auth");
      router.refresh();
    });
  };

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

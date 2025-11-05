"use client";

import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt: () => Promise<void>;
};

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  if (!deferredPrompt || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-zinc-200 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
      <p className="text-sm font-semibold text-zinc-900">Install ShipIt</p>
      <p className="mt-1 text-xs text-zinc-500">
        Add ShipIt to your home screen for a faster experience.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
          onClick={handleInstall}
        >
          Install
        </button>
        <button
          type="button"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700"
          onClick={() => {
            setDismissed(true);
            setDeferredPrompt(null);
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}

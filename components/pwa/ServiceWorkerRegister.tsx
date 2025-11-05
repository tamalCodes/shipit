"use client";

import { useEffect } from "react";

const SW_PATH = "/sw.js";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Avoid noisy caching during local development; Next.js already handles HMR.
    if (process.env.NODE_ENV === "development") {
      return;
    }

    let isMounted = true;

    const handleControllerChange = () => {
      if (!isMounted) {
        return;
      }
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(SW_PATH, {
          scope: "/",
        });

        // Refresh clients when an updated worker takes control.
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) {
            return;
          }

          newWorker.addEventListener("statechange", () => {
            if (!isMounted || newWorker.state !== "installed") {
              return;
            }

            if (navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Service worker registration failed:", error);
        }
      }
    };

    register();

    return () => {
      isMounted = false;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
    };
  }, []);

  return null;
}

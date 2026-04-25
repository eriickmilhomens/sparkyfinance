import { ComponentType, lazy } from "react";

/**
 * Wraps React.lazy with retry + reload-on-failure logic.
 * Handles the "Importing a module script failed" error that occurs when
 * the user has a stale tab open after a new deploy (old chunk hashes no longer exist).
 */
const RELOAD_KEY = "sparky-chunk-reload";

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  delay = 500,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      // Successful load → clear any previous reload flag
      window.sessionStorage.removeItem(RELOAD_KEY);
      return mod;
    } catch (err: any) {
      const message = String(err?.message || "");
      const isChunkError =
        message.includes("Importing a module script failed") ||
        message.includes("Failed to fetch dynamically imported module") ||
        message.includes("error loading dynamically imported module") ||
        err?.name === "ChunkLoadError";

      // Retry a couple of times before giving up
      for (let i = 0; i < retries; i++) {
        try {
          await new Promise((r) => setTimeout(r, delay * (i + 1)));
          const mod = await factory();
          window.sessionStorage.removeItem(RELOAD_KEY);
          return mod;
        } catch {
          /* keep retrying */
        }
      }

      if (isChunkError) {
        const alreadyReloaded = window.sessionStorage.getItem(RELOAD_KEY);
        if (!alreadyReloaded) {
          window.sessionStorage.setItem(RELOAD_KEY, "1");
          window.location.reload();
          // Return a never-resolving promise to suspend until reload happens
          return new Promise<{ default: T }>(() => {});
        }
      }

      throw err;
    }
  });
}

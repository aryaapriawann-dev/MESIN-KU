import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function useStoreListener(onStoreChange: () => void) {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const handler = () => {
        callback();
        onStoreChange?.();
      };
      window.addEventListener("mesinku-store-change", handler);
      window.addEventListener("storage", handler);
      return () => {
        window.removeEventListener("mesinku-store-change", handler);
        window.removeEventListener("storage", handler);
      };
    },
    () => true,
    () => false
  );
}

import { useSyncExternalStore } from "react";
import { useStore } from "../store";

export default function useHydrated() {
  return useSyncExternalStore(
    (callback) => useStore.persist.onFinishHydration(callback),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}

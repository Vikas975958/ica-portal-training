import { useRef, useCallback } from "react";

export function useRequestDeduplicator() {
  const lastKeyRef = useRef<string>("");

  const shouldFetch = useCallback((keyObj: any) => {
    const key = JSON.stringify(keyObj);
    if (lastKeyRef.current === key) {
      return false;
    }
    lastKeyRef.current = key;
    return true;
  }, []);

  const forceRefetch = useCallback(() => {
    lastKeyRef.current = "";
  }, []);

  return { shouldFetch, forceRefetch };
}

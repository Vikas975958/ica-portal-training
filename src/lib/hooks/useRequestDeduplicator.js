import { useRef, useCallback } from "react";

export function useRequestDeduplicator() {
  const ongoingRequests = useRef(new Map());

  const dedupe = useCallback((key, fetcher) => {
    if (ongoingRequests.current.has(key)) {
      return ongoingRequests.current.get(key);
    }

    const promise = fetcher().finally(() => {
      ongoingRequests.current.delete(key);
    });

    ongoingRequests.current.set(key, promise);
    return promise;
  }, []);

  return { dedupe };
}

import { useCallback, useState } from "react";

export type Capture = {
  id: string;
  dataUrl: string;
  timestamp: number;
};

function makeId() {
  // crypto.randomUUID isn't available on every browser/TS lib target we support
  return (
    (window.crypto as any)?.randomUUID?.() ??
    `${Date.now()}_${Math.random().toString(36).slice(2)}`
  );
}

/**
 * Owns the list of captured solved-puzzle screenshots.
 * addCapture is built with the functional setState form so its identity
 * never changes - safe to close over from the long-lived setInterval loop
 * in App.tsx without re-running that effect.
 */
export function useCaptures() {
  const [captures, setCaptures] = useState<Capture[]>([]);

  const addCapture = useCallback((dataUrl: string) => {
    setCaptures((prev) => [
      ...prev,
      { id: makeId(), dataUrl, timestamp: Date.now() },
    ]);
  }, []);

  const removeCapture = useCallback((id: string) => {
    setCaptures((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setCaptures([]);
  }, []);

  return { captures, addCapture, removeCapture, clearAll };
}

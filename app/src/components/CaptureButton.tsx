import React from "react";

export default function CaptureButton({
  onCapture,
}: {
  onCapture: () => void;
}) {
  // Always mounted and always fully active - the user taps it as many
  // times as they want, whenever they want, rather than it only appearing
  // once a puzzle is solved. Repeated taps are how multiple captures (e.g.
  // across different solutions) get collected.
  return (
    <button
      className="capture-button"
      onClick={onCapture}
      aria-label="Capture solved puzzle"
    >
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <path
          fill="currentColor"
          d="M9 3 7.17 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.17L15 3H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"
        />
        <circle cx="12" cy="13" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  );
}

import React, { useState } from "react";
import { Capture } from "../hooks/useCaptures";
import { downloadCapture, shareCapture } from "../utils/shareCapture";

function filenameFor(capture: Capture) {
  return `sudoku-${capture.timestamp}.png`;
}

export default function CaptureGallery({
  captures,
  isOpen,
  onToggle,
  onDelete,
  onClearAll,
}: {
  captures: Capture[];
  isOpen: boolean;
  onToggle: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}) {
  // Tap-to-zoom preview is local to this component - not lifted to App.tsx,
  // and distinct from the full-screen-takeover pattern ruled out for the
  // gallery itself.
  const [zoomedId, setZoomedId] = useState<string | null>(null);
  const zoomed = captures.find((c) => c.id === zoomedId) || null;

  async function handleShare(capture: Capture) {
    const result = await shareCapture(capture.dataUrl, filenameFor(capture));
    if (result === "unsupported") {
      downloadCapture(capture.dataUrl, filenameFor(capture));
    }
  }

  return (
    <div className={`capture-gallery ${isOpen ? "capture-gallery--open" : ""}`}>
      <button
        className="capture-gallery__tab"
        onClick={onToggle}
        aria-label={isOpen ? "Hide captures" : "Show captures"}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 5h3l1.5-2h7L17 5h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm8 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"
          />
        </svg>
        {captures.length > 0 && (
          <span className="capture-gallery__count">{captures.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="capture-gallery__panel">
          <div className="capture-gallery__header">
            <span>Captures</span>
            {captures.length > 0 && (
              <button className="capture-gallery__clear" onClick={onClearAll}>
                Clear all
              </button>
            )}
          </div>
          {captures.length === 0 ? (
            <div className="capture-gallery__empty">
              No captures yet — tap the camera button once a puzzle is solved.
            </div>
          ) : (
            <div className="capture-gallery__strip">
              {captures.map((capture) => (
                <div className="capture-thumb" key={capture.id}>
                  <img
                    src={capture.dataUrl}
                    alt="Captured solved puzzle"
                    onClick={() => setZoomedId(capture.id)}
                  />
                  <div className="capture-thumb__actions">
                    <button
                      aria-label="Download"
                      onClick={() => downloadCapture(capture.dataUrl, filenameFor(capture))}
                    >
                      ⬇
                    </button>
                    <button aria-label="Share" onClick={() => handleShare(capture)}>
                      ⤴
                    </button>
                    <button aria-label="Delete" onClick={() => onDelete(capture.id)}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {zoomed && (
        <div className="capture-zoom" onClick={() => setZoomedId(null)}>
          <img src={zoomed.dataUrl} alt="Captured solved puzzle, enlarged" />
        </div>
      )}
    </div>
  );
}

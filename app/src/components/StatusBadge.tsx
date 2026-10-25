import React from "react";

export type ProcessingStatus = "scanning" | "detected" | "solved";

const LABELS: Record<ProcessingStatus, string> = {
  scanning: "Scanning…",
  detected: "Puzzle detected",
  solved: "Solved!",
};

export default function StatusBadge({ status }: { status: ProcessingStatus }) {
  return (
    <div className={`status-badge status-badge--${status}`}>
      <span className="status-badge__dot" />
      <span className="status-badge__label">{LABELS[status]}</span>
    </div>
  );
}

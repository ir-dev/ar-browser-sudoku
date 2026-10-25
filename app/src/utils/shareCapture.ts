// Save/share helpers for captured solved-puzzle screenshots.
//
// Browser-compat notes (don't "fix" the fallbacks below without re-reading this):
// - navigator.share with `files` needs iOS 15+ Safari / modern Android Chrome.
//   Desktop Firefox has no navigator.share at all, on any OS. Desktop Safari
//   and Chrome support it inconsistently across versions. Always feature-detect
//   with canShareFile() - never assume support from the UA alone.
// - Web Share must be invoked synchronously from the click handler's call
//   chain (it rides the user-activation gesture). Do the dataUrlToFile()
//   conversion first, then call share() without awaiting anything slow in
//   between, or some browsers silently reject the call.
// - Web Share requires a secure context. `yarn start` on localhost counts;
//   testing over a plain http://192.168.x.x LAN address on a phone will not.
// - iOS Safari has historically ignored the `download` attribute on <a> and
//   opened the image in a new tab instead (long-press-to-save flow). That's
//   an acceptable degraded fallback, not a bug.

/**
 * Trigger a browser download of a data URL.
 */
export function downloadCapture(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Convert a data URL (as produced by canvas.toDataURL()) into a File,
 * suitable for passing to navigator.share({ files: [...] }).
 */
export async function dataUrlToFile(
  dataUrl: string,
  filename: string
): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
}

export function canShareFile(file: File): boolean {
  try {
    return (navigator as any).canShare?.({ files: [file] }) ?? false;
  } catch {
    return false;
  }
}

/**
 * Whether the Web Share API is present at all on this browser. Support
 * doesn't change at runtime, so callers can compute this once at module
 * scope rather than re-checking on every render.
 */
export function isShareSupported(): boolean {
  return typeof (navigator as any).share === "function";
}

export type ShareResult = "shared" | "cancelled" | "unsupported";

/**
 * Share a captured image via the Web Share API, falling back to
 * 'unsupported' (caller should fall back to downloadCapture) when files
 * can't be shared on this browser.
 */
export async function shareCapture(
  dataUrl: string,
  filename: string
): Promise<ShareResult> {
  if (!isShareSupported()) {
    return "unsupported";
  }
  const file = await dataUrlToFile(dataUrl, filename);
  if (!canShareFile(file)) {
    return "unsupported";
  }
  try {
    await (navigator as any).share({
      files: [file],
      title: "Sudoku Solution",
    });
    return "shared";
  } catch (error) {
    if ((error as any)?.name === "AbortError") {
      return "cancelled";
    }
    throw error;
  }
}

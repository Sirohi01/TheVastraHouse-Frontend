const RELOAD_KEY = "chunk-reload-at";
const RELOAD_WINDOW_MS = 30_000;

export function isChunkLoadError(error: Error): boolean {
  return error.name === "ChunkLoadError" || /Loading chunk [\w-]+ failed/i.test(error.message);
}

/**
 * After a deploy, open tabs still reference old chunk hashes that no longer exist.
 * A single hard reload fetches the fresh HTML; the timestamp guard prevents a reload loop
 * if the chunk is genuinely missing.
 */
export function reloadOnceForChunkError(error: Error): boolean {
  if (!isChunkLoadError(error)) return false;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

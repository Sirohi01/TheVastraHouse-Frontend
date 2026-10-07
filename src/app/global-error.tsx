"use client";

import { useEffect } from "react";

import { reloadOnceForChunkError } from "@/lib/chunkReload";

export default function GlobalError({ error }: Readonly<{ error: Error }>) {
  useEffect(() => {
    reloadOnceForChunkError(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", padding: "4rem 1.25rem", textAlign: "center" }}>
        <h1>Something went wrong</h1>
        <p>Please reload the page.</p>
        <button onClick={() => window.location.reload()} type="button">
          Reload
        </button>
      </body>
    </html>
  );
}

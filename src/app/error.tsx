"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/states/ErrorState";
import { reloadOnceForChunkError } from "@/lib/chunkReload";

export default function ErrorPage({ error }: Readonly<{ error: Error }>) {
  useEffect(() => {
    reloadOnceForChunkError(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-144px)] max-w-4xl items-center px-5">
      <ErrorState title="Page failed to load" message={error.message} />
    </section>
  );
}

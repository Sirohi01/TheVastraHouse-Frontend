"use client";

import { useCallback, useEffect, useState } from "react";
import { downloadDocument, fetchMyDocuments, type OrderDocumentSummary } from "@/lib/documents";
import { useAuthStore } from "@/stores/authStore";

export function CustomerDocumentsClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [documents, setDocuments] = useState<OrderDocumentSummary[]>([]);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    try {
      setDocuments((await fetchMyDocuments(accessToken)).documents);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Documents could not load");
    }
  }, [accessToken]);
  useEffect(() => void load(), [load]);

  return (
    <main className="mx-auto min-h-[60vh] max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Invoices & Documents</h1>
      <p className="mt-2 text-sm text-muted-foreground">Download receipts, invoices and return documents for your orders.</p>
      {message ? <p className="mt-6 rounded-md border p-3 text-sm">{message}</p> : null}
      <div className="mt-6 grid gap-3">
        {documents.map((document) => (
          <article className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4" key={document._id}>
            <div><p className="font-semibold">{document.documentNumber}</p><p className="text-sm text-muted-foreground">{document.type.replace(/_/g, " ")} · Order {document.orderNumber} · {new Date(document.issuedAt).toLocaleDateString("en-IN")}</p></div>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => void downloadDocument(document._id, document.documentNumber, accessToken)} type="button">Download PDF</button>
          </article>
        ))}
        {!message && !documents.length ? <p className="rounded-lg border bg-white p-8 text-center text-muted-foreground">No documents are available yet.</p> : null}
      </div>
    </main>
  );
}

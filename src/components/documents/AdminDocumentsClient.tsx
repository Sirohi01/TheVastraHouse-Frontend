"use client";

import { useCallback, useEffect, useState } from "react";
import {
  downloadDocument,
  fetchAdminDocuments,
  generateDocument,
  resendDocument,
  type OrderDocumentSummary,
} from "@/lib/documents";
import { useAuthStore } from "@/stores/authStore";

const documentTypes = [
  "tax_invoice",
  "proforma_invoice",
  "receipt",
  "credit_note",
  "debit_note",
  "delivery_challan",
  "return_invoice",
];

export function AdminDocumentsClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [documents, setDocuments] = useState<OrderDocumentSummary[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDocuments((await fetchAdminDocuments(accessToken)).documents);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Documents could not load");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => void load(), [load]);

  async function create(formData: FormData) {
    setMessage("");
    try {
      await generateDocument(
        {
          orderId: String(formData.get("orderId") ?? ""),
          type: String(formData.get("type") ?? "tax_invoice"),
          amountOverride: formData.get("amountOverride")
            ? Number(formData.get("amountOverride"))
            : undefined,
          returnRequestId: String(formData.get("returnRequestId") ?? "") || undefined,
        },
        accessToken,
      );
      setMessage("Document generated.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Document generation failed");
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Invoices & Documents</h1>
        <p className="text-sm text-muted-foreground">
          Immutable GST documents and payment receipts.
        </p>
      </div>
      <form action={create} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-4">
        <input
          className="rounded-md border px-3 py-2 text-sm"
          name="orderId"
          placeholder="Order database ID"
          required
        />
        <select className="rounded-md border px-3 py-2 text-sm" name="type">
          {documentTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <input
          className="rounded-md border px-3 py-2 text-sm"
          name="returnRequestId"
          placeholder="Return ID (if applicable)"
        />
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
            min="1"
            name="amountOverride"
            placeholder="Amount override"
            type="number"
          />
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            type="submit"
          >
            Generate
          </button>
        </div>
      </form>
      {message ? <p className="rounded-md border bg-white p-3 text-sm">{message}</p> : null}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3">Document</th>
              <th className="p-3">Order</th>
              <th className="p-3">Type</th>
              <th className="p-3">Issued</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr className="border-t" key={document._id}>
                <td className="p-3 font-medium">{document.documentNumber}</td>
                <td className="p-3">{document.orderNumber}</td>
                <td className="p-3 capitalize">{document.type.replace(/_/g, " ")}</td>
                <td className="p-3">{new Date(document.issuedAt).toLocaleDateString("en-IN")}</td>
                <td className="p-3">₹{document.totals.grandTotal.toLocaleString("en-IN")}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      className="rounded border px-2 py-1"
                      onClick={() =>
                        void downloadDocument(document._id, document.documentNumber, accessToken)
                      }
                      type="button"
                    >
                      PDF
                    </button>
                    <button
                      className="rounded border px-2 py-1"
                      onClick={async () => {
                        await resendDocument(document._id, undefined, accessToken);
                        setMessage("Document email queued.");
                      }}
                      type="button"
                    >
                      Resend
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !documents.length ? (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={6}>
                  No documents generated yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        {loading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading documents…</p>
        ) : null}
      </div>
    </section>
  );
}

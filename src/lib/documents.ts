import { apiBaseUrl, apiFetch, authenticatedFetch } from "./api";

export type OrderDocumentSummary = {
  _id: string;
  documentNumber: string;
  type: string;
  orderId: string;
  orderNumber: string;
  issuedAt: string;
  currencyCode: string;
  totals: { grandTotal: number };
  customerEmail?: string;
};

export function fetchAdminDocuments(accessToken?: string) {
  return apiFetch<{ documents: OrderDocumentSummary[] }>("/documents/admin", { accessToken });
}

export function fetchMyDocuments(accessToken?: string) {
  return apiFetch<{ documents: OrderDocumentSummary[] }>("/documents/me", { accessToken });
}

export function generateDocument(
  input: { orderId: string; type: string; amountOverride?: number; returnRequestId?: string },
  accessToken?: string,
) {
  return apiFetch<{ document: OrderDocumentSummary }>("/documents/admin/generate", {
    accessToken,
    body: JSON.stringify(input),
    method: "POST",
  });
}

export function resendDocument(id: string, to?: string, accessToken?: string) {
  return apiFetch<{ document: OrderDocumentSummary }>(`/documents/admin/${id}/resend`, {
    accessToken,
    body: JSON.stringify({ to: to || undefined }),
    method: "POST",
  });
}

export async function downloadDocument(id: string, documentNumber: string, accessToken?: string) {
  const response = await authenticatedFetch(`/documents/${id}/pdf`, { accessToken });
  if (!response.ok) throw new Error("Document download failed");
  const url = URL.createObjectURL(await response.blob());
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `${documentNumber.replace(/\//g, "-")}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const documentPdfUrl = (id: string) => `${apiBaseUrl}/documents/${id}/pdf`;

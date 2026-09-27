"use client";

import { CreditCard, FileDown, PackageCheck, RotateCcw, Truck, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/states/EmptyState";
import { errorMessage, useToast } from "@/components/ui/Toast";
import { createOrderBalancePayment, fetchRazorpayCheckoutConfig, confirmCheckoutRazorpayPayment } from "@/lib/checkout";
import { formatMoney } from "@/lib/commerce";
import { downloadDocument } from "@/lib/documents";
import { cancelMyOrder, fetchMyOrder, type CustomerOrderDetailPayload } from "@/lib/orders";
import { loadRazorpayScript } from "@/lib/razorpay";
import { createReturnRequest } from "@/lib/returns";
import { useAuthStore } from "@/stores/authStore";

export function AccountOrderDetailClient({ orderNumber }: Readonly<{ orderNumber: string }>) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const toast = useToast();
  const [payload, setPayload] = useState<CustomerOrderDetailPayload>();
  const [cancelNote, setCancelNote] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [returnSku, setReturnSku] = useState("");
  const [returnQuantity, setReturnQuantity] = useState("1");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const next = await fetchMyOrder(orderNumber, accessToken);
      setPayload(next);
      setReturnSku((current) => current || next.order.items?.[0]?.sku || "");
    } catch (error) {
      toast.error(errorMessage(error, "Order could not be loaded"));
    }
  }

  useEffect(() => {
    if (accessToken) void load();
  }, [accessToken, orderNumber]);

  const canCancel = useMemo(
    () => Boolean(payload?.order.status && ["placed", "confirmed", "pending_payment"].includes(payload.order.status)),
    [payload?.order.status],
  );
  const canReturn = payload?.order.status === "delivered";

  async function cancelOrder() {
    setBusy(true);
    try {
      await cancelMyOrder(orderNumber, cancelNote || undefined, accessToken);
      toast.success("Order cancelled");
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Order could not be cancelled"));
    } finally {
      setBusy(false);
    }
  }

  async function submitReturn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await createReturnRequest(
        {
          items: [{ quantity: Number(returnQuantity), reason: returnReason, sku: returnSku }],
          orderNumber,
        },
        accessToken,
      );
      toast.success(`Return requested: ${result.returnRequest.returnNumber}`);
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Return request failed"));
    } finally {
      setBusy(false);
    }
  }

  async function payBalance() {
    if (!payload?.paymentSession) return;
    setBusy(true);
    try {
      const result = await createOrderBalancePayment(orderNumber, undefined, accessToken);
      const config = await fetchRazorpayCheckoutConfig();
      if (!config.keyId || !config.gatewayEnabled || result.gatewayOrder.id.startsWith("rzp_dev_")) {
        toast.error("Razorpay live checkout is not configured for this environment.");
        return;
      }
      await loadRazorpayScript();
      if (!window.Razorpay) {
        toast.error("Razorpay checkout could not load.");
        return;
      }
      const checkout = new window.Razorpay({
        amount: result.gatewayOrder.amount,
        currency: result.gatewayOrder.currency,
        description: `Balance payment for ${orderNumber}`,
        handler: (response) => {
          void (async () => {
            await confirmCheckoutRazorpayPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Balance payment received");
            await load();
          })().catch((error: unknown) => toast.error(errorMessage(error, "Payment verification failed")));
        },
        key: config.keyId,
        name: "The Vastra House",
        order_id: result.gatewayOrder.id,
        theme: { color: "#8b1e2d" },
      });
      checkout.open();
    } catch (error) {
      toast.error(errorMessage(error, "Balance payment could not start"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6">
        <Link className="text-sm font-semibold text-primary" href="/account/orders">Back to orders</Link>
        {!payload ? <EmptyState title="Loading order" message="Fetching order details." /> : (
          <>
            <section className="grid gap-4 rounded-md border border-border bg-card p-5 lg:grid-cols-[1fr_320px]">
              <div>
                <h1 className="text-2xl font-semibold">{payload.order.orderNumber}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{payload.order.status} · placed {payload.order.createdAt ? new Date(payload.order.createdAt).toLocaleString() : ""}</p>
                <div className="mt-4 grid gap-3">
                  {payload.order.items?.map((item) => (
                    <div className="flex items-center justify-between gap-3 border-b border-border pb-3 text-sm last:border-b-0" key={item.sku}>
                      <div><p className="font-semibold">{item.productName}</p><p className="text-muted-foreground">{item.sku} · Qty {item.quantity}</p></div>
                      <p className="font-semibold">{formatMoney(item.lineSubtotal, item.currencyCode)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <aside className="grid content-start gap-3 rounded-md bg-muted/40 p-4">
                <Info label="Grand total" value={formatMoney(payload.order.totals?.grandTotal ?? 0, payload.order.totals?.currencyCode)} />
                <Info label="Discounts" value={formatMoney(payload.order.totals?.discountTotal ?? 0, payload.order.totals?.currencyCode)} />
                <Info label="Store credit" value={formatMoney(payload.order.totals?.storeCreditApplied ?? 0, payload.order.totals?.currencyCode)} />
                <Info label="Rewards" value={formatMoney(payload.order.totals?.rewardValueApplied ?? 0, payload.order.totals?.currencyCode)} />
              </aside>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <Panel icon={<CreditCard size={18} />} title="Payment">
                {payload.paymentSession ? (
                  <>
                    <Info label="Status" value={payload.paymentSession.status} />
                    <Info label="Method" value={payload.paymentSession.method} />
                    <Info label="Paid" value={formatMoney(payload.paymentSession.paidAmount, payload.paymentSession.currencyCode)} />
                    <Info label="Balance" value={formatMoney(payload.paymentSession.outstandingAmount, payload.paymentSession.currencyCode)} />
                    {payload.paymentSession.outstandingAmount > 0 ? <button className="mt-3 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60" disabled={busy} onClick={() => void payBalance()} type="button">Pay balance</button> : null}
                  </>
                ) : <p className="text-sm text-muted-foreground">No payment session found.</p>}
              </Panel>

              <Panel icon={<Truck size={18} />} title="Shipment">
                <Info label="Method" value={payload.order.shippingMethod ?? "-"} />
                <Info label="Carrier" value={payload.order.shipment?.carrier ?? "-"} />
                <Info label="Tracking" value={payload.order.shipment?.trackingNumber ?? "-"} />
                {payload.order.shipment?.trackingUrl ? <a className="text-sm font-semibold text-primary" href={payload.order.shipment.trackingUrl}>Track shipment</a> : null}
              </Panel>

              <Panel icon={<FileDown size={18} />} title="Invoices">
                {payload.documents.length ? payload.documents.map((document) => (
                  <button className="rounded-md border border-border px-3 py-2 text-left text-sm font-semibold" key={document._id} onClick={() => void downloadDocument(document._id, document.documentNumber, accessToken)} type="button">
                    {document.documentType} {document.documentNumber}
                  </button>
                )) : <p className="text-sm text-muted-foreground">No documents issued yet.</p>}
              </Panel>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Panel icon={<PackageCheck size={18} />} title="Timeline">
                <ol className="grid gap-3">
                  {payload.timeline.map((event, index) => (
                    <li className="border-l-2 border-primary pl-3 text-sm" key={`${event.toStatus}-${event.createdAt ?? index}`}>
                      <p className="font-semibold">{event.fromStatus ? `${event.fromStatus} → ` : ""}{event.toStatus}</p>
                      <p className="text-muted-foreground">{event.createdAt ? new Date(event.createdAt).toLocaleString() : ""} {event.note ? `· ${event.note}` : ""}</p>
                    </li>
                  ))}
                </ol>
              </Panel>
              <Panel icon={<RotateCcw size={18} />} title="Refunds and returns">
                {payload.refunds.length ? payload.refunds.map((refund) => <Info key={refund._id} label={refund.status} value={formatMoney(refund.amount)} />) : <p className="text-sm text-muted-foreground">No refunds recorded.</p>}
                {canReturn ? (
                  <form className="mt-4 grid gap-3" onSubmit={submitReturn}>
                    <select className="h-10 rounded-md border border-border px-3 text-sm" onChange={(event) => setReturnSku(event.target.value)} value={returnSku}>
                      {payload.order.items?.map((item) => <option key={item.sku} value={item.sku}>{item.productName}</option>)}
                    </select>
                    <input className="h-10 rounded-md border border-border px-3 text-sm" min={1} onChange={(event) => setReturnQuantity(event.target.value)} type="number" value={returnQuantity} />
                    <input className="h-10 rounded-md border border-border px-3 text-sm" onChange={(event) => setReturnReason(event.target.value)} placeholder="Return reason" required value={returnReason} />
                    <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60" disabled={busy} type="submit">Request return</button>
                  </form>
                ) : null}
              </Panel>
            </section>

            {canCancel ? (
              <section className="rounded-md border border-border bg-card p-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold"><XCircle size={18} /> Cancel order</h2>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input className="h-10 min-w-0 flex-1 rounded-md border border-border px-3 text-sm" onChange={(event) => setCancelNote(event.target.value)} placeholder="Cancellation note" value={cancelNote} />
                  <button className="rounded-md border border-border px-4 py-2 text-sm font-semibold disabled:opacity-60" disabled={busy} onClick={() => void cancelOrder()} type="button">Cancel order</button>
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}

function Panel({ children, icon, title }: Readonly<{ children: React.ReactNode; icon: React.ReactNode; title: string }>) {
  return <section className="rounded-md border border-border bg-card p-4"><h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>{children}</section>;
}

function Info({ label, value }: Readonly<{ label: string; value?: string }>) {
  return <div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="text-right font-semibold">{value ?? "-"}</span></div>;
}

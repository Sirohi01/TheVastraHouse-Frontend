"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/states/EmptyState";
import { errorMessage, useToast } from "@/components/ui/Toast";
import { fetchMyOrders, type OrderRecord } from "@/lib/orders";
import { createReturnRequest, fetchMyReturns, type ReturnRequest } from "@/lib/returns";
import { useAuthStore } from "@/stores/authStore";

export function CustomerReturnsClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const toast = useToast();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) void load();
  }, [accessToken]);

  async function load() {
    setLoading(true);
    try {
      const [orderPayload, returnPayload] = await Promise.all([
        fetchMyOrders(accessToken),
        fetchMyReturns(accessToken),
      ]);
      setOrders(orderPayload.data.filter((order) => order.status === "delivered"));
      setReturns(returnPayload.returns);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load return-eligible orders"));
    } finally {
      setLoading(false);
    }
  }

  async function submitReturn(formData: FormData) {
    try {
      await createReturnRequest(
        {
          items: [
            {
              quantity: Number(formData.get("quantity")),
              reason: String(formData.get("reason") ?? ""),
              sku: String(formData.get("sku") ?? ""),
            },
          ],
          orderNumber: String(formData.get("orderNumber") ?? ""),
        },
        accessToken,
      );
      toast.success("Return request submitted");
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to submit return request"));
    }
  }

  return (
    <ProtectedRoute>
      <section className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex items-center gap-2">
          <RotateCcw className="text-primary" size={20} />
          <h1 className="font-serif text-3xl text-[#3d1620]">Returns</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Delivered items can be requested for return within 7 calendar days of delivery.
        </p>

        <h2 className="mt-8 text-lg font-semibold">Eligible delivered orders</h2>
        <div className="mt-3 grid gap-4">
          {orders.length ? (
            orders.map((order) => (
              <article className="rounded-lg border border-border bg-card p-4" key={order._id}>
                <p className="font-semibold">{order.orderNumber}</p>
                <div className="mt-3 grid gap-3">
                  {(order.items ?? []).map((item) => (
                    <form
                      action={submitReturn}
                      className="grid gap-2 rounded-md bg-muted/50 p-3 md:grid-cols-[1fr_100px_2fr_auto] md:items-end"
                      key={item.sku}
                    >
                      <div>
                        <p className="text-sm font-semibold">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                      </div>
                      <input name="orderNumber" type="hidden" value={order.orderNumber} />
                      <input name="sku" type="hidden" value={item.sku} />
                      <label className="text-xs font-medium">
                        Quantity
                        <input
                          className="mt-1 h-9 w-full rounded-md border border-border bg-card px-2"
                          defaultValue={1}
                          max={item.quantity}
                          min={1}
                          name="quantity"
                          required
                          type="number"
                        />
                      </label>
                      <label className="text-xs font-medium">
                        Reason
                        <input
                          className="mt-1 h-9 w-full rounded-md border border-border bg-card px-2"
                          minLength={3}
                          name="reason"
                          placeholder="Tell us what went wrong"
                          required
                        />
                      </label>
                      <button className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
                        Request return
                      </button>
                    </form>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title="No eligible orders"
              message={
                loading
                  ? "Loading delivered orders..."
                  : "No delivered order is currently eligible."
              }
            />
          )}
        </div>

        <h2 className="mt-10 text-lg font-semibold">Your return requests</h2>
        <div className="mt-3 grid gap-3">
          {returns.length ? (
            returns.map((item) => (
              <article className="rounded-lg border border-border bg-card p-4" key={item._id}>
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-semibold">{item.returnNumber}</p>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase">
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Order {item.orderNumber}</p>
                {item.decisionNote ? (
                  <p className="mt-2 text-sm text-muted-foreground">{item.decisionNote}</p>
                ) : null}
              </article>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No return requests yet.</p>
          )}
        </div>
      </section>
    </ProtectedRoute>
  );
}

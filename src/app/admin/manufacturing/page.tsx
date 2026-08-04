"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  createFabric,
  createProductionOrder,
  createVendor,
  fetchManufacturing,
  type FabricStock,
  type ManufacturingVendor,
  type ProductionOrder,
  updateProductionOrderStage,
} from "@/lib/manufacturing";
import { fetchAdminPreOrders, productionStages, type ProductionTracker } from "@/lib/preOrders";
import { useAuthStore } from "@/stores/authStore";

const inputClass = "h-10 rounded-md border border-border bg-white px-3 text-sm";
const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);

export default function ManufacturingPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [vendors, setVendors] = useState<ManufacturingVendor[]>([]);
  const [fabric, setFabric] = useState<FabricStock[]>([]);
  const [alerts, setAlerts] = useState<FabricStock[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [trackers, setTrackers] = useState<ProductionTracker[]>([]);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    try {
      const [[v, f, a, p], t] = await Promise.all([
        fetchManufacturing(token),
        fetchAdminPreOrders(token),
      ]);
      setVendors(v.vendors);
      setFabric(f.fabric);
      setAlerts(a.alerts);
      setOrders(p.productionOrders);
      setTrackers(t.trackers);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Manufacturing data could not load");
    }
  }, [token]);
  useEffect(() => {
    void load();
  }, [load]);

  async function submit(
    event: FormEvent<HTMLFormElement>,
    action: (body: unknown, token?: string) => Promise<unknown>,
    transform: (data: FormData) => unknown,
  ) {
    event.preventDefault();
    try {
      await action(transform(new FormData(event.currentTarget)), token);
      event.currentTarget.reset();
      setMessage("Saved successfully");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <main className="mx-auto grid max-w-7xl gap-5">
        <div>
          <h1 className="text-2xl font-semibold">Manufacturing</h1>
          <p className="text-sm text-muted-foreground">
            Vendor masters, raw fabric, production allocation and batch margin.
          </p>
        </div>
        {message ? <p className="text-sm font-semibold text-accent">{message}</p> : null}
        {alerts.length ? (
          <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
            <h2 className="font-semibold text-amber-900">Low fabric stock</h2>
            <p className="text-sm text-amber-800">
              {alerts.map((x) => `${x.sku}: ${x.onHand - x.reserved} ${x.unit}`).join(" · ")}
            </p>
          </section>
        ) : null}
        <section className="grid gap-4 lg:grid-cols-2">
          <form
            className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2"
            onSubmit={(e) =>
              void submit(e, createVendor, (d) => ({
                name: d.get("name"),
                type: d.get("type"),
                contactName: d.get("contactName") || undefined,
                phone: d.get("phone") || undefined,
              }))
            }
          >
            <h2 className="font-semibold sm:col-span-2">Add vendor</h2>
            <input className={inputClass} name="name" placeholder="Vendor name" required />
            <select className={inputClass} name="type">
              {["fabric", "tailor", "printing", "embroidery", "packaging"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <input className={inputClass} name="contactName" placeholder="Contact name" />
            <input className={inputClass} name="phone" placeholder="Phone" />
            <button className="rounded-md bg-primary p-2 font-semibold text-primary-foreground sm:col-span-2">
              Save vendor
            </button>
          </form>
          <form
            className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2"
            onSubmit={(e) =>
              void submit(e, createFabric, (d) => ({
                name: d.get("name"),
                sku: d.get("sku"),
                unit: d.get("unit"),
                onHand: Number(d.get("onHand")),
                reorderThreshold: Number(d.get("reorderThreshold")),
                costPerUnit: Number(d.get("costPerUnit")),
                vendorId: d.get("vendorId") || undefined,
              }))
            }
          >
            <h2 className="font-semibold sm:col-span-2">Add raw fabric</h2>
            <input className={inputClass} name="name" placeholder="Fabric name" required />
            <input className={inputClass} name="sku" placeholder="Raw SKU" required />
            <select className={inputClass} name="unit">
              <option>meter</option>
              <option>yard</option>
              <option>kilogram</option>
              <option>piece</option>
            </select>
            <select className={inputClass} name="vendorId">
              <option value="">No vendor</option>
              {vendors
                .filter((v) => v.type === "fabric")
                .map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name}
                  </option>
                ))}
            </select>
            <input
              className={inputClass}
              min="0"
              name="onHand"
              placeholder="On hand"
              required
              type="number"
            />
            <input
              className={inputClass}
              min="0"
              name="reorderThreshold"
              placeholder="Low-stock level"
              required
              type="number"
            />
            <input
              className={inputClass}
              min="0"
              name="costPerUnit"
              placeholder="Cost/unit"
              required
              type="number"
            />
            <button className="rounded-md bg-primary p-2 font-semibold text-primary-foreground">
              Save fabric
            </button>
          </form>
        </section>
        <form
          className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4"
          onSubmit={(e) =>
            void submit(e, createProductionOrder, (d) => {
              const tracker = trackers.find((t) => t._id === d.get("trackerId"));
              return {
                demandType: "preorder",
                demandReference: tracker?.orderNumber,
                productId: tracker?.productId,
                variantId: tracker?.variantId,
                sku: tracker?.sku,
                quantity: Number(d.get("quantity")),
                trackerIds: [d.get("trackerId")],
                vendorIds: d.getAll("vendorIds"),
                fabricInventoryId: d.get("fabricInventoryId") || undefined,
                fabricQuantityRequired: Number(d.get("fabricQuantityRequired")),
                sellingPricePerUnit: Number(d.get("sellingPricePerUnit")),
                costs: {
                  fabric: Number(d.get("fabricCost")),
                  labor: Number(d.get("labor")),
                  printing: Number(d.get("printing")),
                  packaging: Number(d.get("packaging")),
                  courier: Number(d.get("courier")),
                },
              };
            })
          }
        >
          <h2 className="font-semibold md:col-span-4">Create production order from pre-order</h2>
          <select className={`${inputClass} md:col-span-2`} name="trackerId" required>
            <option value="">Select pre-order</option>
            {trackers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.orderNumber} · {t.sku} · {t.productName}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            min="1"
            name="quantity"
            placeholder="Batch quantity"
            required
            type="number"
          />
          <input
            className={inputClass}
            min="0"
            name="sellingPricePerUnit"
            placeholder="Selling price/unit"
            required
            type="number"
          />
          <select className={inputClass} name="fabricInventoryId">
            <option value="">No fabric allocation</option>
            {fabric.map((f) => (
              <option key={f._id} value={f._id}>
                {f.sku} · {f.onHand - f.reserved} {f.unit}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            min="0"
            name="fabricQuantityRequired"
            placeholder="Fabric quantity"
            type="number"
          />
          <select className={`${inputClass} md:col-span-2`} multiple name="vendorIds">
            {vendors
              .filter((v) => v.active)
              .map((v) => (
                <option key={v._id} value={v._id}>
                  {v.type} · {v.name}
                </option>
              ))}
          </select>
          {["fabricCost", "labor", "printing", "packaging", "courier"].map((x) => (
            <input
              className={inputClass}
              key={x}
              min="0"
              name={x}
              placeholder={`${x} total`}
              required
              type="number"
            />
          ))}
          <button className="rounded-md bg-primary p-2 font-semibold text-primary-foreground md:col-span-3">
            Create & reserve fabric
          </button>
        </form>
        <section className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3">Production order</th>
                <th>Stage</th>
                <th>Cost / Revenue</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr className="border-b" key={o._id}>
                  <td className="p-3">
                    <b>{o.productionOrderNumber}</b>
                    <br />
                    {o.demandReference} · {o.sku} × {o.quantity}
                  </td>
                  <td>
                    <select
                      className="rounded border p-2"
                      value={o.stage}
                      onChange={async (e) => {
                        await updateProductionOrderStage(
                          o._id,
                          e.target.value as ProductionOrder["stage"],
                          token,
                        );
                        await load();
                      }}
                    >
                      {productionStages.map((s) => (
                        <option key={s} value={s}>
                          {s.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {money(o.totalCost)} / {money(o.projectedRevenue)}
                  </td>
                  <td className={o.grossMargin < 0 ? "text-red-700" : "text-emerald-700"}>
                    {money(o.grossMargin)} ({o.grossMarginPercent}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </ProtectedRoute>
  );
}

import { apiFetch } from "@/lib/api";
import type { ProductionStage } from "@/lib/preOrders";

export type VendorType = "fabric" | "tailor" | "printing" | "embroidery" | "packaging";
export type ManufacturingVendor = {
  _id: string;
  name: string;
  type: VendorType;
  phone?: string;
  active: boolean;
};
export type FabricStock = {
  _id: string;
  name: string;
  sku: string;
  unit: string;
  onHand: number;
  reserved: number;
  reorderThreshold: number;
  costPerUnit: number;
};
export type ProductionOrder = {
  _id: string;
  productionOrderNumber: string;
  demandReference: string;
  sku: string;
  quantity: number;
  stage: ProductionStage;
  totalCost: number;
  projectedRevenue: number;
  grossMargin: number;
  grossMarginPercent: number;
};

export async function fetchManufacturing(accessToken?: string) {
  return Promise.all([
    apiFetch<{ vendors: ManufacturingVendor[] }>("/manufacturing/vendors", { accessToken }),
    apiFetch<{ fabric: FabricStock[] }>("/manufacturing/fabric", { accessToken }),
    apiFetch<{ alerts: FabricStock[] }>("/manufacturing/fabric/alerts", { accessToken }),
    apiFetch<{ productionOrders: ProductionOrder[] }>("/manufacturing/production-orders", {
      accessToken,
    }),
  ]);
}
export function createVendor(body: unknown, accessToken?: string) {
  return apiFetch("/manufacturing/vendors", {
    accessToken,
    body: JSON.stringify(body),
    method: "POST",
  });
}
export function createFabric(body: unknown, accessToken?: string) {
  return apiFetch("/manufacturing/fabric", {
    accessToken,
    body: JSON.stringify(body),
    method: "POST",
  });
}
export function createProductionOrder(body: unknown, accessToken?: string) {
  return apiFetch("/manufacturing/production-orders", {
    accessToken,
    body: JSON.stringify(body),
    method: "POST",
  });
}
export function updateProductionOrderStage(
  id: string,
  stage: ProductionStage,
  accessToken?: string,
) {
  return apiFetch(`/manufacturing/production-orders/${id}/stage`, {
    accessToken,
    body: JSON.stringify({ stage }),
    method: "PATCH",
  });
}

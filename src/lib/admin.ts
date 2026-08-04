import { apiBaseUrl, apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export type AdminDashboardSummary = {
  activePreOrders: number;
  inventory: {
    available: number;
    damaged: number;
    incoming: number;
    reserved: number;
  };
  lowStockAlerts: number;
  paymentVerification: number;
  pendingOrders: number;
  productCount: number;
  returnsQueue: number;
};

export type AdminRevenueTrendPoint = {
  date: string;
  orders: number;
  revenue: number;
};

export type AdminOrderStatusBreakdownItem = {
  status: string;
  count: number;
};

export type AdminPaymentMethodBreakdownItem = {
  method: string;
  count: number;
  revenue: number;
};

export type AdminTopProduct = {
  sku: string;
  productName: string;
  quantity: number;
  revenue: number;
};

export type AdminTopTaxonomy = {
  name: string;
  quantity: number;
  revenue: number;
};

export type AdminTrafficSourceItem = {
  source: string;
  count: number;
  revenue: number;
};

export type AdminDashboardCharts = {
  abandonedCartRate: number;
  averageOrderValue30d: number;
  orderStatusBreakdown: AdminOrderStatusBreakdownItem[];
  paymentMethodBreakdown: AdminPaymentMethodBreakdownItem[];
  repeatCustomerRate: number;
  revenueTrend: AdminRevenueTrendPoint[];
  topCategories: AdminTopTaxonomy[];
  topCollections: AdminTopTaxonomy[];
  topProducts: AdminTopProduct[];
  totalOrders30d: number;
  totalRevenue30d: number;
  trafficSourceBreakdown: AdminTrafficSourceItem[];
};

export function fetchAdminDashboard(accessToken?: string) {
  return apiFetch<{ charts: AdminDashboardCharts; summary: AdminDashboardSummary }>(
    "/admin/dashboard",
    { accessToken },
  );
}

export async function downloadAdminDashboardCsv(rangeDays = 30) {
  const accessToken = useAuthStore.getState().accessToken;
  const response = await fetch(`${apiBaseUrl}/admin/dashboard/export.csv?range=${rangeDays}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Export failed");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `orders-export-${rangeDays}d.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

"use client";

import { LogOut, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/states/EmptyState";
import { Field } from "@/components/ui/Field";
import { errorMessage, useToast } from "@/components/ui/Toast";
import {
  deleteAddress,
  fetchAccountOverview,
  fetchAddresses,
  fetchPrivacyRequests,
  fetchRewards,
  fetchSessions,
  revokeSession,
  saveAddress,
  updatePreferences,
  updateProfile,
  type AccountAddress,
  type AccountOverview,
  type AuthSession,
  type PrivacyRequest,
  type RewardSummary,
} from "@/lib/account";
import { formatMoney } from "@/lib/commerce";
import { fetchMyOrders, type OrderRecord } from "@/lib/orders";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

const blankAddress: Omit<AccountAddress, "_id"> = {
  city: "",
  countryCode: "IN",
  fullName: "",
  isDefaultBilling: false,
  isDefaultShipping: false,
  label: "",
  line1: "",
  line2: "",
  phone: "",
  postalCode: "",
  region: "",
};

export function AccountClient({ view }: Readonly<{ view: "addresses" | "dashboard" | "orders" | "privacy" | "rewards" | "sessions" }>) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const toast = useToast();
  const [overview, setOverview] = useState<AccountOverview>();
  const [addresses, setAddresses] = useState<AccountAddress[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [rewards, setRewards] = useState<RewardSummary>();
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [privacy, setPrivacy] = useState<PrivacyRequest[]>([]);
  const [profile, setProfile] = useState({ firstName: "", lastName: "", phone: "" });
  const [addressForm, setAddressForm] = useState(blankAddress);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ firstName: user.firstName ?? "", lastName: user.lastName ?? "", phone: user.phone ?? "" });
    }
  }, [user]);

  useEffect(() => {
    if (!accessToken) return;
    async function load() {
      try {
        if (view === "dashboard") setOverview(await fetchAccountOverview(accessToken));
        if (view === "addresses") setAddresses((await fetchAddresses(accessToken)).addresses);
        if (view === "orders") setOrders((await fetchMyOrders(accessToken, 1)).data);
        if (view === "rewards") setRewards(await fetchRewards(accessToken));
        if (view === "sessions") setSessions((await fetchSessions(accessToken)).sessions);
        if (view === "privacy") setPrivacy((await fetchPrivacyRequests(accessToken)).requests);
      } catch (error) {
        toast.error(errorMessage(error, "Account data could not be loaded"));
      }
    }
    void load();
  }, [accessToken, toast, view]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await updateProfile(profile, accessToken);
      if (accessToken && refreshToken) setSession({ accessToken, refreshToken, user: result.user });
      toast.success("Profile saved");
    } catch (error) {
      toast.error(errorMessage(error, "Profile could not be saved"));
    } finally {
      setSaving(false);
    }
  }

  async function addAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await saveAddress(addressForm, undefined, accessToken);
      setAddresses(result.addresses);
      setAddressForm(blankAddress);
      toast.success("Address saved");
    } catch (error) {
      toast.error(errorMessage(error, "Address could not be saved"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="grid content-start gap-2 rounded-md border border-border bg-card p-3">
          {[
            ["/account", "Dashboard"],
            ["/account/addresses", "Addresses"],
            ["/account/orders", "Orders"],
            ["/account/rewards", "Rewards & credit"],
            ["/account/privacy", "Privacy & preferences"],
            ["/account/sessions", "Sessions"],
          ].map(([href, label]) => (
            <Link className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted" href={href} key={href}>
              {label}
            </Link>
          ))}
          <button className="mt-2 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold" onClick={clearSession} type="button">
            <LogOut size={15} /> Logout
          </button>
        </aside>

        <section className="min-w-0">
          {view === "dashboard" ? (
            <div className="grid gap-4">
              <h1 className="text-2xl font-semibold">My account</h1>
              <div className="grid gap-3 md:grid-cols-4">
                <Metric label="Orders" value={String(overview?.customer.lifetimeOrderValue ? "Active" : "New")} />
                <Metric label="Addresses" value={String(overview?.addressesCount ?? 0)} />
                <Metric label="Rewards" value={String(overview?.customer.rewardPointsBalance ?? 0)} />
                <Metric label="Gift cards" value={formatMoney(overview?.giftCardBalance ?? 0)} />
              </div>
              <form className="rounded-md border border-border bg-card p-4" onSubmit={saveProfile}>
                <h2 className="mb-3 text-lg font-semibold">Profile</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="First name" onChange={(value) => setProfile((current) => ({ ...current, firstName: value }))} value={profile.firstName} />
                  <Field label="Last name" onChange={(value) => setProfile((current) => ({ ...current, lastName: value }))} value={profile.lastName} />
                  <Field label="Phone" onChange={(value) => setProfile((current) => ({ ...current, phone: value }))} value={profile.phone} />
                </div>
                <button className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground" disabled={saving} type="submit">
                  <Save size={16} /> Save profile
                </button>
              </form>
            </div>
          ) : null}

          {view === "addresses" ? (
            <div className="grid gap-4">
              <h1 className="text-2xl font-semibold">Addresses</h1>
              <div className="grid gap-3 md:grid-cols-2">
                {addresses.map((address) => (
                  <div className="rounded-md border border-border bg-card p-4" key={address._id}>
                    <p className="font-semibold">{address.fullName}</p>
                    <p className="text-sm text-muted-foreground">{address.line1}, {address.city}, {address.region} {address.postalCode}</p>
                    <button className="mt-3 inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm font-semibold" onClick={async () => setAddresses((await deleteAddress(address._id, accessToken)).addresses)} type="button">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                ))}
              </div>
              <form className="rounded-md border border-border bg-card p-4" onSubmit={addAddress}>
                <h2 className="mb-3 text-lg font-semibold">Add address</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {(["fullName", "phone", "line1", "line2", "city", "region", "postalCode"] as const).map((key) => (
                    <Field key={key} label={key} onChange={(value) => setAddressForm((current) => ({ ...current, [key]: value }))} required={key !== "line2"} value={addressForm[key] ?? ""} />
                  ))}
                </div>
                <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" disabled={saving} type="submit">Save address</button>
              </form>
            </div>
          ) : null}

          {view === "orders" ? (
            <ListView title="Orders" empty="No orders yet.">
              {orders.map((order) => (
                <Link className="block rounded-md border border-border bg-card p-4 hover:bg-muted/40" href={`/checkout/confirmation/${order.orderNumber}`} key={order._id}>
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{order.status} · {formatMoney(order.totals?.grandTotal ?? 0)}</p>
                </Link>
              ))}
            </ListView>
          ) : null}

          {view === "rewards" ? (
            <ListView title="Rewards, store credit & gift cards" empty="No reward history yet.">
              <div className="grid gap-3 md:grid-cols-3">
                <Metric label="Reward points" value={String(rewards?.rewardPoints ?? 0)} />
                <Metric label="Store credit" value={formatMoney(rewards?.storeCredit ?? 0)} />
                <Metric label="Referral code" value={rewards?.referral.code ?? "-"} />
              </div>
            </ListView>
          ) : null}

          {view === "privacy" ? (
            <ListView title="Privacy & notification preferences" empty="No privacy requests yet.">
              <PreferenceForm accessToken={accessToken} setSessionUser={(next) => accessToken && refreshToken && setSession({ accessToken, refreshToken, user: next })} user={user} />
              {privacy.map((request) => <p className="rounded-md border border-border bg-card p-3 text-sm" key={request._id}>{request.requestNumber} · {request.type} · {request.status}</p>)}
            </ListView>
          ) : null}

          {view === "sessions" ? (
            <ListView title="Sessions" empty="No active sessions found.">
              {sessions.map((session) => (
                <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3" key={session._id}>
                  <p className="text-sm">{session.userAgent ?? "Unknown device"}<br /><span className="text-muted-foreground">{session.ipAddress ?? ""}</span></p>
                  <button className="rounded-md border border-border px-3 py-2 text-sm font-semibold" onClick={async () => { await revokeSession(session._id, accessToken); setSessions((await fetchSessions(accessToken)).sessions); }} type="button">Revoke</button>
                </div>
              ))}
            </ListView>
          ) : null}
        </section>
      </main>
    </ProtectedRoute>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return <div className="rounded-md border border-border bg-card p-4"><p className="text-xs font-bold uppercase text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>;
}

function ListView({ children, empty, title }: Readonly<{ children: React.ReactNode; empty: string; title: string }>) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <div className="grid gap-3"><h1 className="text-2xl font-semibold">{title}</h1>{hasChildren ? children : <EmptyState title={empty} message="Nothing is available here yet." />}</div>;
}

function PreferenceForm({ accessToken, setSessionUser, user }: Readonly<{ accessToken?: string; setSessionUser: (user: AuthUser) => void; user?: AuthUser }>) {
  const toast = useToast();
  const preferences = user?.notificationPreferences ?? {
    backInStock: true,
    marketingEmail: false,
    marketingWhatsapp: false,
    orderUpdatesEmail: true,
    orderUpdatesWhatsapp: Boolean(user?.whatsappOptIn),
    reviewRequests: true,
  };
  async function toggle(key: keyof typeof preferences) {
    try {
      const result = await updatePreferences({ ...preferences, [key]: !preferences[key], whatsappOptIn: key === "orderUpdatesWhatsapp" ? !preferences[key] : Boolean(user?.whatsappOptIn) }, accessToken);
      setSessionUser(result.user);
      toast.success("Preference updated");
    } catch (error) {
      toast.error(errorMessage(error, "Preference could not be saved"));
    }
  }
  return <div className="grid gap-2 rounded-md border border-border bg-card p-4">{Object.entries(preferences).map(([key, value]) => <label className="flex items-center justify-between gap-3 text-sm font-semibold" key={key}>{key}<input checked={value} onChange={() => void toggle(key as keyof typeof preferences)} type="checkbox" /></label>)}</div>;
}

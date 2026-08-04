"use client";

import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { commerceFetch, type Cart } from "@/lib/commerce";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";

export function AddToCartButton({
  afterAddPath,
  appearance = "primary",
  className = "",
  iconSize = 18,
  label = "Add to Cart",
  productId,
  purchaseMode = "regular",
  quantity = 1,
  variantId,
}: Readonly<{
  afterAddPath?: string;
  appearance?: "primary" | "secondary";
  className?: string;
  iconSize?: number;
  label?: string;
  productId: string;
  purchaseMode?: "regular" | "pre_order";
  quantity?: number;
  variantId: string;
}>) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const setCart = useCartStore((state) => state.setCart);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function addToCart() {
    setSubmitting(true);
    setMessage("");

    try {
      const payload = await commerceFetch<{ cart: Cart }>("/commerce/cart/items", {
        accessToken,
        body: JSON.stringify({ productId, purchaseMode, quantity, variantId }),
        method: "POST",
      });
      setCart(payload.cart);
      if (afterAddPath) {
        router.push(afterAddPath);
        return;
      }
      setMessage("Added to cart");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Add to cart failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        className={cn(
          "inline-flex h-12 items-center justify-center gap-2 rounded-md px-5 font-semibold transition-opacity hover:opacity-90 disabled:opacity-60",
          appearance === "secondary"
            ? "border border-primary bg-white text-primary"
            : "bg-primary text-primary-foreground",
          className,
        )}
        disabled={submitting}
        onClick={addToCart}
        type="button"
      >
        <ShoppingBag aria-hidden="true" size={iconSize} />
        <span className="truncate">
          {submitting ? (afterAddPath ? "Opening checkout" : "Adding") : label}
        </span>
      </button>
      {message ? <p className="mt-2 text-sm font-semibold text-accent">{message}</p> : null}
    </div>
  );
}

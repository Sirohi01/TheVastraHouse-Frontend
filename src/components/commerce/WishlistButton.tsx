"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { commerceFetch, type Wishlist } from "@/lib/commerce";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

export function WishlistButton({
  buttonClassName = "",
  className = "",
  iconOnly = true,
  productId,
  variantId,
}: Readonly<{
  buttonClassName?: string;
  className?: string;
  iconOnly?: boolean;
  productId: string;
  variantId: string;
}>) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [message, setMessage] = useState("");

  async function addToWishlist() {
    try {
      await commerceFetch<{ wishlist: Wishlist }>("/commerce/wishlist/items", {
        accessToken,
        body: JSON.stringify({ productId, variantId }),
        method: "POST",
      });
      setMessage("Saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Wishlist failed");
    }
  }

  return (
    <div className={className}>
      <button
        aria-label="Add to wishlist"
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card font-semibold hover:border-primary hover:text-primary",
          iconOnly ? "w-10 shrink-0 px-0" : "w-full px-3 text-sm",
          buttonClassName,
        )}
        onClick={addToWishlist}
        title="Add to wishlist"
        type="button"
      >
        <Heart aria-hidden="true" size={16} />
        {iconOnly ? null : "Wishlist"}
      </button>
      {message ? <p className="mt-2 text-xs font-semibold text-accent">{message}</p> : null}
    </div>
  );
}

"use client";

import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { TextInput } from "@/components/cms/HeroSlidesEditor";
import { MediaPicker, type MediaItem } from "@/components/media/MediaPicker";
import type { MediaReference } from "@/lib/catalog";
import type { CmsContent, CmsLink } from "@/lib/cms";

type Footer = NonNullable<CmsContent["footer"]>;

export function FooterEditor({
  footer,
  images,
  onChange,
}: Readonly<{
  footer: Footer;
  images: MediaItem[];
  onChange: (patch: Partial<Footer>) => void;
}>) {
  const [showLibrary, setShowLibrary] = useState(false);
  const logo = footer.brandLogo;

  function selectLogo(item: MediaItem) {
    const reference: MediaReference = {
      // Alt text is mandatory, so it stays empty (and flagged) until the admin writes it.
      altText: item.altText && item.altText.trim().length >= 3 ? item.altText.trim() : "",
      aspectRatio: (item.selectedAspectRatio || "1:1") as MediaReference["aspectRatio"],
      mediaId: item._id,
      objectFit: "contain",
      type: "image",
      url: item.originalUrl ?? item.secureUrl,
    };
    onChange({ brandLogo: reference });
    setShowLibrary(false);
  }

  const posts = footer.instagramPosts ?? [];

  return (
    <div className="grid gap-4">
      <Card title="Brand" hint="Logo and short line shown at the left of the footer.">
        <div className="grid gap-3">
          {logo?.url ? (
            <div className="flex flex-wrap items-start gap-4">
              <div className="grid size-28 place-items-center rounded-md border border-border bg-[#fffaf1] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={logo.altText ?? ""}
                  className="max-h-full max-w-full object-contain"
                  src={logo.url}
                />
              </div>
              <div className="grid min-w-[220px] flex-1 gap-2">
                <TextInput
                  label="Logo alt text (required)"
                  onChange={(value) => onChange({ brandLogo: { ...logo, altText: value } })}
                  placeholder="The Vastra House logo"
                  value={logo.altText ?? ""}
                />
                {(logo.altText ?? "").trim().length < 3 ? (
                  <p className="text-xs text-destructive">
                    Write at least 3 characters before saving.
                  </p>
                ) : null}
                <button
                  className="inline-flex h-9 w-fit items-center gap-2 rounded-md border border-destructive/40 px-3 text-xs font-semibold text-destructive"
                  onClick={() => onChange({ brandLogo: null })}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={14} />
                  Remove logo
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No logo selected. The footer shows the text logo.
            </p>
          )}
          <button
            className="inline-flex h-9 w-fit items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold"
            onClick={() => setShowLibrary((current) => !current)}
            type="button"
          >
            <ImagePlus aria-hidden="true" size={14} />
            {showLibrary ? "Hide library" : "Choose logo from library"}
          </button>
          {showLibrary ? (
            <div className="max-h-72 overflow-y-auto rounded-md border border-border p-2">
              <MediaPicker media={images} onSelect={selectLogo} pageSize={8} />
            </div>
          ) : null}
          <label className="text-sm font-medium">
            Tagline
            <textarea
              className="mt-1 min-h-20 w-full rounded-md border border-border px-3 py-2 text-sm leading-6"
              maxLength={240}
              onChange={(event) => onChange({ tagline: event.target.value })}
              value={footer.tagline ?? ""}
            />
          </label>
        </div>
      </Card>

      <Card
        title="Contact and social"
        hint="Shown under the tagline. Leave a field empty to hide it."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput
            label="Customer email"
            onChange={(value) => onChange({ email: value })}
            placeholder="hello@thevastrahouse.com"
            value={footer.email ?? ""}
          />
          <TextInput
            label="Phone number"
            onChange={(value) => onChange({ phone: value })}
            placeholder="+91 98765 43210"
            value={footer.phone ?? ""}
          />
          <div className="md:col-span-2">
            <TextInput
              label="Location / address"
              onChange={(value) => onChange({ location: value })}
              value={footer.location ?? ""}
            />
          </div>
          <TextInput
            label="Instagram profile URL"
            onChange={(value) => onChange({ instagramUrl: value })}
            placeholder="https://www.instagram.com/vastrahouse/"
            value={footer.instagramUrl ?? ""}
          />
          <TextInput
            label="WhatsApp URL"
            onChange={(value) => onChange({ whatsappUrl: value })}
            placeholder="https://wa.me/919876543210"
            value={footer.whatsappUrl ?? ""}
          />
        </div>
      </Card>

      <Card title="Newsletter band" hint="The maroon strip at the top of the footer.">
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput
            label="Heading"
            onChange={(value) => onChange({ newsletterTitle: value })}
            placeholder="Join the House"
            value={footer.newsletterTitle ?? ""}
          />
          <TextInput
            label="Short text"
            onChange={(value) => onChange({ newsletterText: value })}
            placeholder="New arrivals, festive edits and early access. No spam."
            value={footer.newsletterText ?? ""}
          />
        </div>
      </Card>

      <Card
        title="Link columns"
        hint="Policies column is automatic: it lists every published policy page."
      >
        <div className="grid gap-5">
          <LinkList
            links={footer.shopLinks ?? []}
            onChange={(links) => onChange({ shopLinks: links })}
            title="Shop column"
          />
          <LinkList
            links={footer.helpLinks ?? []}
            onChange={(links) => onChange({ helpLinks: links })}
            title="Help column"
          />
          <LinkList
            hint="Extra links added at the end of the Shop column."
            links={footer.links ?? []}
            onChange={(links) => onChange({ links })}
            title="Additional links"
          />
        </div>
      </Card>

      <Card title="Bottom bar" hint="Leave empty to show the default copyright line.">
        <TextInput
          label="Copyright text"
          onChange={(value) => onChange({ copyrightText: value })}
          placeholder="© 2026 The Vastra House. All rights reserved."
          value={footer.copyrightText ?? ""}
        />
      </Card>

      <Card title="Instagram posts" hint="Post URLs shown in the home page Instagram strip.">
        <div className="grid gap-2">
          {posts.map((url, index) => (
            <div className="flex items-end gap-2" key={index}>
              <div className="min-w-0 flex-1">
                <TextInput
                  label={`Post ${index + 1}`}
                  onChange={(value) =>
                    onChange({
                      instagramPosts: posts.map((item, i) => (i === index ? value : item)),
                    })
                  }
                  placeholder="https://www.instagram.com/p/..."
                  value={url}
                />
              </div>
              <button
                aria-label={`Remove post ${index + 1}`}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-destructive/40 text-destructive"
                onClick={() => onChange({ instagramPosts: posts.filter((_, i) => i !== index) })}
                type="button"
              >
                <Trash2 aria-hidden="true" size={15} />
              </button>
            </div>
          ))}
          <button
            className="inline-flex h-9 w-fit items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold disabled:opacity-50"
            disabled={posts.length >= 20}
            onClick={() => onChange({ instagramPosts: [...posts, ""] })}
            type="button"
          >
            <Plus aria-hidden="true" size={14} />
            Add post
          </button>
        </div>
      </Card>
    </div>
  );
}

function Card({
  children,
  hint,
  title,
}: Readonly<{ children: ReactNode; hint?: string; title: string }>) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-soft sm:p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {hint ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function LinkList({
  hint,
  links,
  onChange,
  title,
}: Readonly<{
  hint?: string;
  links: CmsLink[];
  onChange: (links: CmsLink[]) => void;
  title: string;
}>) {
  function patch(index: number, change: Partial<CmsLink>) {
    onChange(links.map((link, i) => (i === index ? { ...link, ...change } : link)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <button
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold disabled:opacity-50"
          disabled={links.length >= 12}
          onClick={() => onChange([...links, { enabled: true, href: "/shop", label: "New link" }])}
          type="button"
        >
          <Plus aria-hidden="true" size={13} />
          Add link
        </button>
      </div>
      <div className="mt-3 grid gap-3">
        {links.length ? null : (
          <p className="text-xs text-muted-foreground">No links. Add one to show this column.</p>
        )}
        {links.map((link, index) => (
          <div
            className="grid items-end gap-2 rounded-md bg-muted/40 p-2 md:grid-cols-[auto_1fr_1fr_auto]"
            key={index}
          >
            <label className="flex h-10 items-center gap-2 text-xs font-medium">
              <input
                checked={link.enabled !== false}
                className="size-4 accent-primary"
                onChange={(event) => patch(index, { enabled: event.target.checked })}
                type="checkbox"
              />
              Show
            </label>
            <TextInput
              label="Text"
              onChange={(value) => patch(index, { label: value })}
              value={link.label}
            />
            <TextInput
              label="Link"
              onChange={(value) => patch(index, { href: value })}
              value={link.href}
            />
            <div className="flex gap-1.5">
              <MiniButton disabled={index === 0} label="Move up" onClick={() => move(index, -1)}>
                <ArrowUp aria-hidden="true" size={14} />
              </MiniButton>
              <MiniButton
                disabled={index === links.length - 1}
                label="Move down"
                onClick={() => move(index, 1)}
              >
                <ArrowDown aria-hidden="true" size={14} />
              </MiniButton>
              <MiniButton
                danger
                label="Remove link"
                onClick={() => onChange(links.filter((_, i) => i !== index))}
              >
                <Trash2 aria-hidden="true" size={14} />
              </MiniButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniButton({
  children,
  danger = false,
  disabled,
  label,
  onClick,
}: Readonly<{
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      aria-label={label}
      className={`inline-flex size-10 items-center justify-center rounded-md border disabled:cursor-not-allowed disabled:opacity-40 ${
        danger ? "border-destructive/40 text-destructive" : "border-border"
      }`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

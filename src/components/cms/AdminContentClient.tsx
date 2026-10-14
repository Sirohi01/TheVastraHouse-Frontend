"use client";

import { ImagePlus, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FooterEditor } from "@/components/cms/FooterEditor";
import { HeroSlidesEditor } from "@/components/cms/HeroSlidesEditor";
import { MediaPicker, type MediaItem } from "@/components/media/MediaPicker";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { errorMessage, useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import type { MediaReference } from "@/lib/catalog";
import {
  defaultCmsContent,
  defaultProductTrustBadges,
  trustBadgeIcons,
  type CmsTrustBadge,
  defaultFooterHelpLinks,
  defaultFooterShopLinks,
  defaultNavigation,
  fetchAdminCmsContent,
  saveAdminCmsContent,
  type CmsCatalogPage,
  type CmsContent,
  type CmsHeroSlide,
  type CmsLink,
} from "@/lib/cms";
import { useAuthStore } from "@/stores/authStore";

export type ContentTab =
  | "home"
  | "about"
  | "shop"
  | "preOrder"
  | "navigation"
  | "productBadges"
  | "footer"
  | "testimonials"
  | "faqs"
  | "policies";
type CmsList = "headerNavigation" | "testimonials" | "faqs" | "policies" | "aboutValues";

export function AdminContentClient({ initialTab = "home" }: Readonly<{ initialTab?: ContentTab }>) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const toast = useToast();
  const [content, setContent] = useState<CmsContent>(defaultCmsContent);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<ContentTab>(initialTab);

  const storyMedia = content.home?.storyMedia;
  const imageMedia = useMemo(() => media.filter((item) => item.resourceType === "image"), [media]);

  useEffect(() => {
    if (accessToken) {
      void load();
      void loadMedia();
    }
  }, [accessToken]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  async function load() {
    try {
      const payload = await fetchAdminCmsContent("storefront-main", accessToken);
      const loaded = payload.content ?? defaultCmsContent;
      setContent(
        normalizeContent({
          ...loaded,
          // Show the live header menu so every button can be edited, even before the first save.
          headerNavigation: loaded.headerNavigation?.length
            ? loaded.headerNavigation
            : defaultNavigation,
          footer: {
            ...loaded.footer,
            helpLinks: loaded.footer?.helpLinks?.length
              ? loaded.footer.helpLinks
              : defaultFooterHelpLinks,
            shopLinks: loaded.footer?.shopLinks?.length
              ? loaded.footer.shopLinks
              : defaultFooterShopLinks,
          },
        }),
      );
      setMessage(payload.content ? "Content loaded" : "Using starter content");
    } catch (error) {
      toast.error(errorMessage(error, "Content load failed"));
      setMessage(error instanceof Error ? error.message : "Content load failed");
    }
  }

  async function loadMedia() {
    try {
      const payload = await apiFetch<{ media: MediaItem[] }>("/media", {
        accessToken,
      });
      setMedia(payload.media);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load media"));
    }
  }

  async function save() {
    const missingAlt = findMissingAltText(content);
    if (missingAlt.length) {
      const text = `Alt text is required for: ${missingAlt.join(", ")}`;
      toast.error(text);
      setMessage(text);
      return;
    }

    try {
      const payload = await saveAdminCmsContent(
        "storefront-main",
        normalizeContent(content),
        accessToken,
      );
      setContent(normalizeContent(payload.content));
      setMessage("Content saved");
      toast.success("Content saved");
    } catch (error) {
      toast.error(errorMessage(error, "Content save failed"));
      setMessage(error instanceof Error ? error.message : "Content save failed");
    }
  }

  function updateContent(updater: (current: CmsContent) => CmsContent) {
    setContent((current) => normalizeContent(updater(normalizeContent(current))));
  }

  function updateHome(field: "announcement" | "topBarText", value: string) {
    updateContent((current) => ({ ...current, home: { ...current.home, [field]: value } }));
  }

  function updateHomeStory(patch: Partial<CmsHeroSlide>) {
    updateContent((current) => ({
      ...current,
      home: {
        ...current.home,
        story: {
          contentPosition: "left",
          fontFamily: "serif",
          fontSize: "lg",
          primaryCta: { enabled: true, href: "/about", label: "Know More About Us" },
          ...current.home?.story,
          ...patch,
        },
      },
    }));
  }

  function updateCatalogPage(
    page: "preOrder" | "shop",
    field: Exclude<keyof CmsCatalogPage, "media" | "mobileMedia">,
    value: string | boolean,
  ) {
    updateContent((current) => ({
      ...current,
      [page]: {
        ...current[page],
        [field]: value,
      },
    }));
  }

  function updateCatalogPromo(page: "preOrder" | "shop", patch: Partial<CmsHeroSlide>) {
    updateContent((current) => ({
      ...current,
      [page]: {
        ...current[page],
        promo: {
          copyFontSize: "md",
          contentPosition: "left",
          fontFamily: "serif",
          fontSize: "lg",
          textColor: "#ffffff",
          title: "Explore Collection",
          ...current[page]?.promo,
          ...patch,
        },
      },
    }));
  }

  function setCatalogPageMedia(
    page: "preOrder" | "shop",
    item: MediaItem,
    slot: "media" | "mobileMedia" = "media",
  ) {
    updateContent((current) => ({
      ...current,
      [page]: {
        ...current[page],
        [slot]: toMediaReference(
          item,
          current[page]?.title ?? `${page === "shop" ? "Shop" : "Pre-order"} banner`,
          slot === "mobileMedia" ? "4:5" : "16:7",
        ),
      },
    }));
  }

  function clearCatalogPageMedia(
    page: "preOrder" | "shop",
    slot: "media" | "mobileMedia" = "media",
  ) {
    updateContent((current) => ({
      ...current,
      [page]: {
        ...current[page],
        [slot]: null,
      },
    }));
  }

  function updateAboutLink(key: keyof CmsLink, value: string | boolean) {
    updateContent((current) => ({
      ...current,
      about: {
        ...current.about,
        primaryCta: {
          enabled: true,
          href: "",
          label: "",
          ...current.about?.primaryCta,
          [key]: value,
        },
      },
    }));
  }

  function updateAboutContent(patch: Partial<NonNullable<CmsContent["about"]>>) {
    updateContent((current) => ({ ...current, about: { ...current.about, ...patch } }));
  }

  function setHomeStoryMedia(item: MediaItem) {
    updateContent((current) => ({
      ...current,
      home: {
        ...current.home,
        storyMedia: toMediaReference(item, "Home our story image", "16:7"),
      },
    }));
  }

  function clearHomeStoryMedia() {
    updateContent((current) => ({
      ...current,
      home: {
        ...current.home,
        storyMedia: null,
      },
    }));
  }

  function heroSlides(): CmsHeroSlide[] {
    if (content.home?.hero?.slides?.length) {
      return content.home.hero.slides;
    }

    // Older content kept a single hero in the top-level fields; show it as slide 1.
    return [
      {
        copy: content.home?.hero?.copy,
        enabled: true,
        eyebrow: content.home?.hero?.eyebrow,
        media: content.home?.hero?.media,
        overlay: "medium",
        primaryCta: content.home?.hero?.primaryCta,
        secondaryCta: content.home?.hero?.secondaryCta,
        showOutline: false,
        showTextOnMobile: true,
        textColor: "#ffffff",
        title: content.home?.hero?.title,
      },
    ];
  }

  function setHeroSlides(slides: CmsHeroSlide[]) {
    updateContent((current) => ({
      ...current,
      home: { ...current.home, hero: { ...current.home?.hero, slides } },
    }));
  }

  function updateLinkList(index: number, key: keyof CmsLink, value: string | boolean) {
    updateContent((current) => ({
      ...current,
      headerNavigation: (current.headerNavigation ?? []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function productBadges(current: CmsContent) {
    return current.productTrustBadges?.length
      ? current.productTrustBadges
      : defaultProductTrustBadges;
  }

  function updateTrustBadge(index: number, patch: Partial<CmsTrustBadge>) {
    updateContent((current) => ({
      ...current,
      productTrustBadges: productBadges(current).map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  function addTrustBadge() {
    updateContent((current) => ({
      ...current,
      productTrustBadges: [
        ...productBadges(current),
        { enabled: true, icon: "sparkles", title: "New promise" },
      ],
    }));
  }

  function removeTrustBadge(index: number) {
    updateContent((current) => ({
      ...current,
      productTrustBadges: productBadges(current).filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function addLink() {
    updateContent((current) => ({
      ...current,
      headerNavigation: [
        ...(current.headerNavigation ?? []),
        { enabled: true, href: "/shop", label: "New Link" },
      ],
    }));
  }

  function removeFromList(list: CmsList, index: number) {
    if (list === "aboutValues") {
      updateContent((current) => ({
        ...current,
        about: {
          ...current.about,
          values: (current.about?.values ?? []).filter((_, itemIndex) => itemIndex !== index),
        },
      }));
      return;
    }

    updateContent((current) => ({
      ...current,
      [list]: (current[list] ?? []).filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateTestimonial(index: number, key: "location" | "name" | "quote", value: string) {
    updateContent((current) => ({
      ...current,
      testimonials: (current.testimonials ?? []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function addTestimonial() {
    updateContent((current) => ({
      ...current,
      testimonials: [
        ...(current.testimonials ?? []),
        { location: "", name: "Customer", quote: "" },
      ],
    }));
  }

  function updateFaq(index: number, key: "answer" | "question", value: string) {
    updateContent((current) => ({
      ...current,
      faqs: (current.faqs ?? []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function addFaq() {
    updateContent((current) => ({
      ...current,
      faqs: [...(current.faqs ?? []), { answer: "", question: "New question" }],
    }));
  }

  function updatePolicy(index: number, key: "body" | "slug" | "title", value: string) {
    updateContent((current) => ({
      ...current,
      policies: (current.policies ?? []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function addPolicy() {
    updateContent((current) => ({
      ...current,
      policies: [
        ...(current.policies ?? []),
        { body: "", slug: "new-policy", title: "New Policy" },
      ],
    }));
  }

  return (
    <ProtectedRoute>
      <div className="min-w-0">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold sm:text-2xl">CMS Content</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Edit website text, CTAs, hero media, navigation, footer, FAQs, policies, and
              testimonials.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold"
              onClick={() => void load()}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Refresh
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
              onClick={() => void save()}
              type="button"
            >
              <Save aria-hidden="true" size={16} />
              Save
            </button>
          </div>
        </div>

        {message ? <p className="mb-3 text-sm text-muted-foreground">{message}</p> : null}

        <div className="mt-4">
          {tab === "home" ? (
            <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-soft sm:p-5">
                <div className="mb-5 rounded-md border border-border p-3">
                  <h2 className="text-sm font-semibold">Top announcement bar</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Thin strip above the menu, for example your free shipping offer.
                  </p>
                  <div className="mt-2">
                    <Field
                      label="Text"
                      onChange={(value) => updateHome("topBarText", value)}
                      value={content.home?.topBarText ?? ""}
                    />
                  </div>
                </div>
                <HeroSlidesEditor
                  accessToken={accessToken}
                  media={media}
                  onChange={setHeroSlides}
                  onDurationChange={(seconds) =>
                    updateContent((current) => ({
                      ...current,
                      home: {
                        ...current.home,
                        hero: { ...current.home?.hero, slideDuration: seconds },
                      },
                    }))
                  }
                  onMediaUploaded={() => void loadMedia()}
                  slideDuration={content.home?.hero?.slideDuration}
                  slides={heroSlides()}
                />
              </div>

              <aside className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-soft sm:p-5">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <ImagePlus aria-hidden="true" size={16} />
                    Home Our Story Image
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Used on the home page Our Story band. Recommended aspect ratio: 16:7.
                  </p>
                  {storyMedia?.url ? (
                    <div className="mt-3 grid gap-2">
                      <ResponsiveImage
                        alt={storyMedia.altText ?? "Home our story image"}
                        aspectRatio={storyMedia.aspectRatio?.replace(":", " / ") ?? "16 / 7"}
                        className="rounded-md border border-border"
                        objectFit={storyMedia.objectFit}
                        src={storyMedia.url}
                      />
                      <Field
                        label="Alt text (required)"
                        onChange={(value) =>
                          updateContent((current) => ({
                            ...current,
                            home: {
                              ...current.home,
                              storyMedia: current.home?.storyMedia
                                ? { ...current.home.storyMedia, altText: value }
                                : current.home?.storyMedia,
                            },
                          }))
                        }
                        value={storyMedia.altText ?? ""}
                      />
                      <button
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-destructive/40 text-sm font-semibold text-destructive"
                        onClick={clearHomeStoryMedia}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={14} />
                        Remove home story image
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 rounded-md border border-border p-3 text-sm text-muted-foreground">
                      No home story image selected.
                    </p>
                  )}
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold">Pick from media library</p>
                    <MediaPicker
                      media={imageMedia}
                      onSelect={setHomeStoryMedia}
                      upload={{
                        aspectRatio: "16:7",
                        onUploaded: () => void loadMedia(),
                        tags: "cms,home,story",
                      }}
                    />
                  </div>
                  <div className="mt-5 grid gap-3 border-t border-border pt-5">
                    <p className="text-sm font-semibold">Our Story Content</p>
                    <Field
                      label="Eyebrow"
                      onChange={(value) => updateHomeStory({ eyebrow: value })}
                      value={content.home?.story?.eyebrow ?? "Our Story"}
                    />
                    <Field
                      label="Title"
                      onChange={(value) => updateHomeStory({ title: value })}
                      value={content.home?.story?.title ?? "Crafted with Passion, Worn with Pride."}
                    />
                    <TextEditor
                      label="Description"
                      onChange={(value) => updateHomeStory({ copy: value })}
                      value={
                        content.home?.story?.copy ??
                        "We blend timeless tradition with contemporary designs to bring premium quality clothing that celebrates your individuality."
                      }
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm font-medium">
                        Content position
                        <select
                          className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                          onChange={(event) =>
                            updateHomeStory({
                              contentPosition: event.target.value as "left" | "right",
                            })
                          }
                          value={content.home?.story?.contentPosition ?? "left"}
                        >
                          <option value="left">Text left, image right</option>
                          <option value="right">Text right, image left</option>
                        </select>
                      </label>
                      <label className="text-sm font-medium">
                        Font family
                        <select
                          className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                          onChange={(event) =>
                            updateHomeStory({ fontFamily: event.target.value as "serif" | "sans" })
                          }
                          value={content.home?.story?.fontFamily ?? "serif"}
                        >
                          <option value="serif">Serif</option>
                          <option value="sans">Sans</option>
                        </select>
                      </label>
                      <label className="text-sm font-medium">
                        Title size
                        <select
                          className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                          onChange={(event) =>
                            updateHomeStory({ fontSize: event.target.value as "sm" | "md" | "lg" })
                          }
                          value={content.home?.story?.fontSize ?? "lg"}
                        >
                          <option value="sm">Small</option>
                          <option value="md">Medium</option>
                          <option value="lg">Large</option>
                        </select>
                      </label>
                      <label className="text-sm font-medium">
                        Body text size
                        <select
                          className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                          onChange={(event) =>
                            updateHomeStory({
                              copyFontSize: event.target.value as "sm" | "md" | "lg",
                            })
                          }
                          value={content.home?.story?.copyFontSize ?? "md"}
                        >
                          <option value="sm">Small</option>
                          <option value="md">Medium</option>
                          <option value="lg">Large</option>
                        </select>
                      </label>
                    </div>
                    <ColorField
                      label="Text colour"
                      onChange={(value) => updateHomeStory({ textColor: value })}
                      value={content.home?.story?.textColor ?? "#3d1620"}
                    />
                    <Field
                      label="Button label"
                      onChange={(value) =>
                        updateHomeStory({
                          primaryCta: {
                            enabled: true,
                            href: content.home?.story?.primaryCta?.href ?? "/about",
                            label: value,
                          },
                        })
                      }
                      value={content.home?.story?.primaryCta?.label ?? "Know More About Us"}
                    />
                    <Field
                      label="Button link"
                      onChange={(value) =>
                        updateHomeStory({
                          primaryCta: {
                            enabled: true,
                            href: value,
                            label: content.home?.story?.primaryCta?.label ?? "Know More About Us",
                          },
                        })
                      }
                      value={content.home?.story?.primaryCta?.href ?? "/about"}
                    />
                  </div>
                </div>
              </aside>
            </section>
          ) : null}

          {tab === "about" ? (
            <AboutEditor
              about={content.about ?? {}}
              media={imageMedia}
              onChange={updateAboutContent}
              onCtaChange={updateAboutLink}
              onMediaUploaded={() => void loadMedia()}
            />
          ) : null}

          {tab === "shop" ? (
            <CatalogPageContentEditor
              heading="Shop Page"
              media={imageMedia}
              onChange={(field, value) => updateCatalogPage("shop", field, value)}
              onPromoChange={(patch) => updateCatalogPromo("shop", patch)}
              onPromoSelectMedia={(item) =>
                updateCatalogPromo("shop", {
                  media: toMediaReference(item, "Shop promotional banner", "16:7"),
                })
              }
              onClearMedia={() => clearCatalogPageMedia("shop")}
              onClearMobileMedia={() => clearCatalogPageMedia("shop", "mobileMedia")}
              onMediaUploaded={() => void loadMedia()}
              onSelectMedia={(item) => setCatalogPageMedia("shop", item)}
              onSelectMobileMedia={(item) => setCatalogPageMedia("shop", item, "mobileMedia")}
              page={content.shop}
            />
          ) : null}

          {tab === "preOrder" ? (
            <CatalogPageContentEditor
              heading="Pre-Order Page"
              media={imageMedia}
              onChange={(field, value) => updateCatalogPage("preOrder", field, value)}
              onPromoChange={(patch) => updateCatalogPromo("preOrder", patch)}
              onPromoSelectMedia={(item) =>
                updateCatalogPromo("preOrder", {
                  media: toMediaReference(item, "Pre-order promotional banner", "16:7"),
                })
              }
              onClearMedia={() => clearCatalogPageMedia("preOrder")}
              onClearMobileMedia={() => clearCatalogPageMedia("preOrder", "mobileMedia")}
              onMediaUploaded={() => void loadMedia()}
              onSelectMedia={(item) => setCatalogPageMedia("preOrder", item)}
              onSelectMobileMedia={(item) => setCatalogPageMedia("preOrder", item, "mobileMedia")}
              page={content.preOrder}
            />
          ) : null}

          {tab === "navigation" ? (
            <EditorSection title="Navigation Links" onAdd={addLink}>
              <p className="mb-3 text-xs leading-5 text-muted-foreground">
                These are the header menu buttons (also used in the mobile menu). The first half
                appears on the left of the logo and the rest on the right. Untick Enabled to hide a
                button.
              </p>
              {(content.headerNavigation ?? []).map((link, index) => (
                <LinkRow
                  key={`${link.href}-${index}`}
                  link={link}
                  onChange={(key, value) => updateLinkList(index, key, value)}
                  onRemove={() => removeFromList("headerNavigation", index)}
                />
              ))}
            </EditorSection>
          ) : null}

          {tab === "productBadges" ? (
            <EditorSection title="Product Page Badges" onAdd={addTrustBadge}>
              <p className="mb-3 text-xs leading-5 text-muted-foreground">
                Icon strip shown under the Add to cart buttons on every product page (up to 8).
                Untick Enabled to hide one. If you remove every badge, the default set is shown.
              </p>
              <div className="grid gap-3">
                {productBadges(content).map((item, index) => (
                  <CardRow key={`${item.icon}-${index}`} onRemove={() => removeTrustBadge(index)}>
                    <div className="grid gap-3 md:grid-cols-[110px_150px_1fr_1fr]">
                      <label className="flex items-center gap-2 text-xs font-medium">
                        <input
                          checked={item.enabled !== false}
                          onChange={(event) =>
                            updateTrustBadge(index, { enabled: event.target.checked })
                          }
                          type="checkbox"
                        />
                        Enabled
                      </label>
                      <label className="text-sm font-medium">
                        Icon
                        <select
                          className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                          onChange={(event) =>
                            updateTrustBadge(index, {
                              icon: event.target.value as CmsTrustBadge["icon"],
                            })
                          }
                          value={item.icon}
                        >
                          {trustBadgeIcons.map((icon) => (
                            <option key={icon} value={icon}>
                              {icon}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Field
                        label="Title"
                        onChange={(value) => updateTrustBadge(index, { title: value })}
                        value={item.title}
                      />
                      <Field
                        label="Small text (optional)"
                        onChange={(value) => updateTrustBadge(index, { subtitle: value })}
                        value={item.subtitle ?? ""}
                      />
                    </div>
                  </CardRow>
                ))}
              </div>
            </EditorSection>
          ) : null}

          {tab === "footer" ? (
            <FooterEditor
              footer={content.footer ?? {}}
              images={imageMedia}
              onChange={(patch) =>
                updateContent((current) => ({
                  ...current,
                  footer: { ...current.footer, ...patch },
                }))
              }
              onMediaUploaded={() => void loadMedia()}
            />
          ) : null}

          {tab === "testimonials" ? (
            <EditorSection title="Testimonials" onAdd={addTestimonial}>
              <div className="grid gap-3">
                {(content.testimonials ?? []).map((item, index) => (
                  <CardRow
                    key={`${item.name}-${index}`}
                    onRemove={() => removeFromList("testimonials", index)}
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field
                        label="Name"
                        onChange={(value) => updateTestimonial(index, "name", value)}
                        value={item.name}
                      />
                      <Field
                        label="Location"
                        onChange={(value) => updateTestimonial(index, "location", value)}
                        value={item.location ?? ""}
                      />
                    </div>
                    <TextEditor
                      label="Quote"
                      onChange={(value) => updateTestimonial(index, "quote", value)}
                      value={item.quote}
                    />
                  </CardRow>
                ))}
              </div>
            </EditorSection>
          ) : null}

          {tab === "faqs" ? (
            <EditorSection title="FAQs" onAdd={addFaq}>
              <div className="grid gap-3">
                {(content.faqs ?? []).map((item, index) => (
                  <CardRow
                    key={`${item.question}-${index}`}
                    onRemove={() => removeFromList("faqs", index)}
                  >
                    <Field
                      label="Question"
                      onChange={(value) => updateFaq(index, "question", value)}
                      value={item.question}
                    />
                    <TextEditor
                      label="Answer"
                      onChange={(value) => updateFaq(index, "answer", value)}
                      value={item.answer}
                    />
                  </CardRow>
                ))}
              </div>
            </EditorSection>
          ) : null}

          {tab === "policies" ? (
            <EditorSection title="Policy Pages" onAdd={addPolicy}>
              <div className="grid gap-3">
                {(content.policies ?? []).map((item, index) => (
                  <CardRow
                    key={`${item.slug}-${index}`}
                    onRemove={() => removeFromList("policies", index)}
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field
                        label="Title"
                        onChange={(value) => updatePolicy(index, "title", value)}
                        value={item.title}
                      />
                      <Field
                        label="Slug"
                        onChange={(value) => updatePolicy(index, "slug", value)}
                        value={item.slug}
                      />
                    </div>
                    <TextEditor
                      label="Body"
                      minHeight="min-h-48"
                      onChange={(value) => updatePolicy(index, "body", value)}
                      value={item.body}
                    />
                  </CardRow>
                ))}
              </div>
            </EditorSection>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function CatalogPageContentEditor({
  heading,
  media,
  onChange,
  onClearMedia,
  onClearMobileMedia,
  onMediaUploaded,
  onPromoChange,
  onPromoSelectMedia,
  onSelectMedia,
  onSelectMobileMedia,
  page,
}: Readonly<{
  heading: string;
  media: MediaItem[];
  onChange: (
    field: Exclude<keyof CmsCatalogPage, "media" | "mobileMedia">,
    value: string | boolean,
  ) => void;
  onClearMedia: () => void;
  onClearMobileMedia: () => void;
  onMediaUploaded: () => void;
  onPromoChange: (patch: Partial<CmsHeroSlide>) => void;
  onPromoSelectMedia: (item: MediaItem) => void;
  onSelectMedia: (item: MediaItem) => void;
  onSelectMobileMedia: (item: MediaItem) => void;
  page?: CmsCatalogPage;
}>) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
        <h2 className="text-lg font-semibold">{heading} Content</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Controls the page banner text shown above the product catalog.
        </p>
        <div className="mt-4 grid gap-3">
          <Field
            label="Banner eyebrow"
            onChange={(value) => onChange("eyebrow", value)}
            value={page?.eyebrow ?? ""}
          />
          <Field
            label="Page title"
            onChange={(value) => onChange("title", value)}
            value={page?.title ?? ""}
          />
          <TextEditor
            label="Page description"
            onChange={(value) => onChange("description", value)}
            value={page?.description ?? ""}
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm font-medium">
              Content position
              <select
                className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                onChange={(event) => onChange("contentPosition", event.target.value)}
                value={page?.contentPosition ?? "left"}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Font family
              <select
                className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                onChange={(event) => onChange("fontFamily", event.target.value)}
                value={page?.fontFamily ?? "serif"}
              >
                <option value="serif">Serif</option>
                <option value="sans">Sans</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Title size
              <select
                className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                onChange={(event) => onChange("fontSize", event.target.value)}
                value={page?.fontSize ?? "lg"}
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Body text size
              <select
                className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                onChange={(event) => onChange("copyFontSize", event.target.value)}
                value={page?.copyFontSize ?? "md"}
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </label>
            <ColorField
              label="Text colour"
              onChange={(value) => onChange("textColor", value)}
              value={page?.textColor ?? "#ffffff"}
            />
            <label className="flex h-10 items-center gap-2 self-end rounded-md border border-border px-3 text-sm font-medium">
              <input
                checked={page?.showOutline !== false}
                className="size-4 accent-primary"
                onChange={(event) => onChange("showOutline", event.target.checked)}
                type="checkbox"
              />
              Show gold frame line on banner
            </label>
            <label className="text-sm font-medium">
              Colour overlay on image
              <select
                className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                onChange={(event) => onChange("overlay", event.target.value)}
                value={page?.overlay ?? "none"}
              >
                <option value="none">None (original photo)</option>
                <option value="soft">Soft dark tint</option>
                <option value="medium">Medium dark tint</option>
                <option value="strong">Strong dark tint</option>
              </select>
            </label>
          </div>
          <div className="mt-5 border-t border-border pt-5">
            <h3 className="text-base font-semibold">Lower Promotional Banner</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Controls the image and content shown below the product grid.
            </p>
            <div className="mt-3 grid gap-3">
              <Field
                label="Promo title"
                onChange={(value) => onPromoChange({ title: value })}
                value={page?.promo?.title ?? "Explore Collection"}
              />
              <TextEditor
                label="Promo description"
                onChange={(value) => onPromoChange({ copy: value })}
                value={page?.promo?.copy ?? "Explore our handpicked premium collection."}
              />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <label className="text-sm font-medium">
                  Position
                  <select
                    className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                    onChange={(event) =>
                      onPromoChange({
                        contentPosition: event.target.value as "left" | "center" | "right",
                      })
                    }
                    value={page?.promo?.contentPosition ?? "left"}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Font family
                  <select
                    className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                    onChange={(event) =>
                      onPromoChange({ fontFamily: event.target.value as "serif" | "sans" })
                    }
                    value={page?.promo?.fontFamily ?? "serif"}
                  >
                    <option value="serif">Serif</option>
                    <option value="sans">Sans</option>
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Title size
                  <select
                    className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                    onChange={(event) =>
                      onPromoChange({ fontSize: event.target.value as "sm" | "md" | "lg" })
                    }
                    value={page?.promo?.fontSize ?? "lg"}
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </label>
              </div>
              <ColorField
                label="Text colour"
                onChange={(value) => onPromoChange({ textColor: value })}
                value={page?.promo?.textColor ?? "#ffffff"}
              />
              <Field
                label="Button label"
                onChange={(value) =>
                  onPromoChange({
                    primaryCta: {
                      enabled: true,
                      href: page?.promo?.primaryCta?.href ?? "/shop",
                      label: value,
                    },
                  })
                }
                value={page?.promo?.primaryCta?.label ?? "Explore Collection"}
              />
              <Field
                label="Button link"
                onChange={(value) =>
                  onPromoChange({
                    primaryCta: {
                      enabled: true,
                      href: value,
                      label: page?.promo?.primaryCta?.label ?? "Explore Collection",
                    },
                  })
                }
                value={page?.promo?.primaryCta?.href ?? "/shop"}
              />
              <div>
                <p className="mb-2 text-xs font-semibold">Promo image</p>
                <MediaPicker
                  media={media}
                  onSelect={onPromoSelectMedia}
                  upload={{ aspectRatio: "16:5", onUploaded: onMediaUploaded, tags: "cms,promo" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="rounded-lg border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ImagePlus aria-hidden="true" size={16} />
          {heading} Banner Image
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Shown on laptop/desktop, same wide proportion as the home page hero. Recommended 2400 x
          660 px (about 16:4.4); it is cropped with cover fit.
        </p>
        {page?.media?.url ? (
          <div className="mt-3 grid gap-2">
            <ResponsiveImage
              alt={page.media.altText ?? `${heading} banner`}
              aspectRatio="16 / 4.4"
              className="rounded-md border border-border"
              objectFit={page.media.objectFit}
              src={page.media.url}
            />
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-destructive/40 text-sm font-semibold text-destructive"
              onClick={onClearMedia}
              type="button"
            >
              <Trash2 aria-hidden="true" size={14} />
              Remove banner image
            </button>
          </div>
        ) : (
          <p className="mt-3 rounded-md border border-border p-3 text-sm text-muted-foreground">
            No banner image selected. The default catalog image will be used.
          </p>
        )}
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold">Pick from media library</p>
          <MediaPicker
            media={media}
            onSelect={onSelectMedia}
            upload={{ aspectRatio: "16:4.4", onUploaded: onMediaUploaded, tags: "cms,banner" }}
          />
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ImagePlus aria-hidden="true" size={16} />
            {heading} Mobile Banner Image
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            4:5 portrait image shown on phones, same as the home page hero. Recommended 1080 x 1350
            px. If empty, the banner image above is used.
          </p>
          {page?.mobileMedia?.url ? (
            <div className="mx-auto mt-3 grid max-w-[220px] gap-2">
              <ResponsiveImage
                alt={page.mobileMedia.altText ?? `${heading} mobile banner`}
                aspectRatio="4 / 5"
                className="rounded-md border border-border"
                src={page.mobileMedia.url}
              />
              <button
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-destructive/40 text-sm font-semibold text-destructive"
                onClick={onClearMobileMedia}
                type="button"
              >
                <Trash2 aria-hidden="true" size={14} />
                Remove mobile image
              </button>
            </div>
          ) : (
            <p className="mt-3 rounded-md border border-border p-3 text-sm text-muted-foreground">
              No mobile image selected. The banner image is used on phones.
            </p>
          )}
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold">Pick from media library</p>
            <MediaPicker
              media={media}
              onSelect={onSelectMobileMedia}
              upload={{
                aspectRatio: "4:5",
                onUploaded: onMediaUploaded,
                tags: "cms,banner,mobile",
              }}
            />
          </div>
        </div>
      </aside>
    </section>
  );
}

type AboutContentValue = NonNullable<CmsContent["about"]>;
type AboutMediaKey = "media" | "mobileMedia" | "storyMedia";

function AboutEditor({
  about,
  media,
  onChange,
  onCtaChange,
  onMediaUploaded,
}: Readonly<{
  about: AboutContentValue;
  media: MediaItem[];
  onChange: (patch: Partial<AboutContentValue>) => void;
  onCtaChange: (key: keyof CmsLink, value: string | boolean) => void;
  onMediaUploaded: () => void;
}>) {
  const sections = about.sections ?? [];
  const values = about.values ?? [];

  function setMedia(key: AboutMediaKey, item: MediaItem, ratio: string) {
    onChange({
      [key]: toMediaReference(
        item,
        about.storyTitle ?? about.title ?? "The Vastra House about page",
        ratio,
      ),
    });
  }

  function patchMediaAlt(key: AboutMediaKey, altText: string) {
    const current = about[key];
    if (current?.url) onChange({ [key]: { ...current, altText } });
  }

  function updateSection(index: number, patch: { body?: string; heading?: string }) {
    onChange({
      sections: sections.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    });
  }

  function updateValue(index: number, patch: Partial<NonNullable<AboutContentValue["values"]>[0]>) {
    onChange({
      values: values.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    });
  }

  return (
    <div className="grid gap-4">
      <AboutCard
        description="The wide banner at the top of the About page. Same proportion as the home hero: 4:5 on phones, 16:4.4 on laptop/desktop."
        title="1. Hero banner"
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="grid content-start gap-3">
            <Field
              label="Eyebrow (small text above title)"
              onChange={(value) => onChange({ eyebrow: value })}
              value={about.eyebrow ?? ""}
            />
            <Field
              label="Title"
              onChange={(value) => onChange({ title: value })}
              value={about.title ?? ""}
            />
            <TextEditor
              label="Description (also used for SEO)"
              onChange={(value) => onChange({ description: value })}
              value={about.description ?? ""}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Text position
                <select
                  className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                  onChange={(event) =>
                    onChange({
                      contentPosition: event.target.value as "left" | "center" | "right",
                    })
                  }
                  value={about.contentPosition ?? "left"}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
              <ColorField
                label="Text colour"
                onChange={(value) => onChange({ textColor: value })}
                value={about.textColor ?? "#ffffff"}
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                checked={about.showOutline !== false}
                onChange={(event) => onChange({ showOutline: event.target.checked })}
                type="checkbox"
              />
              Show gold frame line on the banner
            </label>
            <label className="text-sm font-medium">
              Colour overlay on image
              <select
                className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                onChange={(event) =>
                  onChange({
                    overlay: event.target.value as "none" | "soft" | "medium" | "strong",
                  })
                }
                value={about.overlay ?? "none"}
              >
                <option value="none">None (original photo)</option>
                <option value="soft">Soft dark tint</option>
                <option value="medium">Medium dark tint</option>
                <option value="strong">Strong dark tint</option>
              </select>
            </label>
          </div>

          <div className="grid content-start gap-5">
            <AboutImageSlot
              altText={about.media?.altText}
              hint="Laptop/desktop banner. Recommended 2400 x 660 px (16:4.4)."
              label="Banner image (desktop)"
              media={media}
              onAltChange={(value) => patchMediaAlt("media", value)}
              onClear={() => onChange({ media: null })}
              onMediaUploaded={onMediaUploaded}
              onSelect={(item) => setMedia("media", item, "16:4.4")}
              previewRatio="16 / 4.4"
              uploadRatio="16:4.4"
              url={about.media?.url}
            />
            <AboutImageSlot
              altText={about.mobileMedia?.altText}
              hint="Phone banner, 4:5 portrait. Recommended 1080 x 1350 px. Empty = desktop banner is used."
              label="Banner image (mobile)"
              media={media}
              narrow
              onAltChange={(value) => patchMediaAlt("mobileMedia", value)}
              onClear={() => onChange({ mobileMedia: null })}
              onMediaUploaded={onMediaUploaded}
              onSelect={(item) => setMedia("mobileMedia", item, "4:5")}
              previewRatio="4 / 5"
              uploadRatio="4:5"
              url={about.mobileMedia?.url}
            />
          </div>
        </div>
      </AboutCard>

      <AboutCard
        description="The first block under the banner: text on one side, image on the other."
        title="2. Our story"
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="grid content-start gap-3">
            <Field
              label="Eyebrow"
              onChange={(value) => onChange({ storyEyebrow: value })}
              value={about.storyEyebrow ?? ""}
            />
            <Field
              label="Heading"
              onChange={(value) => onChange({ storyTitle: value })}
              value={about.storyTitle ?? ""}
            />
            <TextEditor
              label="Story text"
              minHeight="min-h-40"
              onChange={(value) => onChange({ storyCopy: value })}
              value={about.storyCopy ?? ""}
            />
            <label className="text-sm font-medium">
              Founded year (optional, shown as &quot;Since ...&quot;)
              <input
                className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                inputMode="numeric"
                onChange={(event) => {
                  const year = Number(event.target.value.replace(/\D/g, "").slice(0, 4));
                  onChange({ foundedYear: year >= 1800 && year <= 2100 ? year : undefined });
                }}
                value={about.foundedYear ?? ""}
              />
            </label>
            <CtaEditor
              label="Button (story + bottom band)"
              link={about.primaryCta}
              onChange={onCtaChange}
            />
          </div>
          <AboutImageSlot
            altText={about.storyMedia?.altText}
            hint="Shown beside the story text. Any ratio works, landscape 3:2 or 4:5 looks best."
            label="Story image"
            media={media}
            onAltChange={(value) => patchMediaAlt("storyMedia", value)}
            onClear={() => onChange({ storyMedia: null })}
            onMediaUploaded={onMediaUploaded}
            onSelect={(item) => setMedia("storyMedia", item, "4:5")}
            previewRatio="4 / 3"
            uploadRatio="4:5"
            url={about.storyMedia?.url}
          />
        </div>
      </AboutCard>

      <AboutCard
        action={
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold"
            onClick={() =>
              onChange({
                sections: [
                  ...sections,
                  { body: "Write the details here.", heading: "New section" },
                ],
              })
            }
            type="button"
          >
            <Plus aria-hidden="true" size={13} />
            Add section
          </button>
        }
        description="Text cards shown in two columns (who we are, what we sell, how orders work...)."
        title="3. Content sections"
      >
        <div className="grid gap-3">
          {sections.length ? null : (
            <p className="text-sm text-muted-foreground">No sections yet.</p>
          )}
          {sections.map((item, index) => (
            <CardRow
              key={`section-${index}`}
              onRemove={() =>
                onChange({ sections: sections.filter((_, itemIndex) => itemIndex !== index) })
              }
            >
              <Field
                label="Heading"
                onChange={(value) => updateSection(index, { heading: value })}
                value={item.heading}
              />
              <TextEditor
                label="Text"
                onChange={(value) => updateSection(index, { body: value })}
                value={item.body}
              />
            </CardRow>
          ))}
        </div>
      </AboutCard>

      <AboutCard
        description="Optional. Shown as a quote-style card only when a name is entered."
        title="4. Founder"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field
            label="Name"
            onChange={(value) => onChange({ founder: { ...about.founder, name: value } })}
            value={about.founder?.name ?? ""}
          />
          <Field
            label="Role"
            onChange={(value) => onChange({ founder: { ...about.founder, role: value } })}
            value={about.founder?.role ?? ""}
          />
        </div>
        <div className="mt-3">
          <TextEditor
            label="Bio"
            onChange={(value) => onChange({ founder: { ...about.founder, bio: value } })}
            value={about.founder?.bio ?? ""}
          />
        </div>
      </AboutCard>

      <AboutCard
        action={
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold"
            onClick={() =>
              onChange({
                values: [
                  ...values,
                  { icon: "sparkles", text: "Describe this brand value.", title: "New Value" },
                ],
              })
            }
            type="button"
          >
            <Plus aria-hidden="true" size={13} />
            Add value
          </button>
        }
        description="Icon cards, up to 4 fit best in one row."
        title="5. Brand values"
      >
        <div className="grid gap-3">
          <Field
            label="Section heading"
            onChange={(value) => onChange({ valuesTitle: value })}
            value={about.valuesTitle ?? ""}
          />
          {values.map((item, index) => (
            <CardRow
              key={`value-${index}`}
              onRemove={() =>
                onChange({ values: values.filter((_, itemIndex) => itemIndex !== index) })
              }
            >
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-sm font-medium">
                  Icon
                  <select
                    className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                    onChange={(event) =>
                      updateValue(index, {
                        icon: event.target.value as "award" | "care" | "shield" | "sparkles",
                      })
                    }
                    value={item.icon ?? "sparkles"}
                  >
                    <option value="sparkles">Sparkles</option>
                    <option value="award">Award</option>
                    <option value="shield">Shield</option>
                    <option value="care">Care</option>
                  </select>
                </label>
                <div className="md:col-span-2">
                  <Field
                    label="Title"
                    onChange={(value) => updateValue(index, { title: value })}
                    value={item.title}
                  />
                </div>
              </div>
              <TextEditor
                label="Text"
                onChange={(value) => updateValue(index, { text: value })}
                value={item.text}
              />
            </CardRow>
          ))}
        </div>
      </AboutCard>

      <AboutCard
        description="Dark band at the bottom with a button (uses the button from section 2)."
        title="6. Closing band"
      >
        <div className="grid gap-3">
          <Field
            label="Heading"
            onChange={(value) => onChange({ closingTitle: value })}
            value={about.closingTitle ?? ""}
          />
          <TextEditor
            label="Text"
            onChange={(value) => onChange({ closingCopy: value })}
            value={about.closingCopy ?? ""}
          />
        </div>
      </AboutCard>
    </div>
  );
}

function AboutCard({
  action,
  children,
  description,
  title,
}: Readonly<{
  action?: React.ReactNode;
  children: React.ReactNode;
  description?: string;
  title: string;
}>) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function AboutImageSlot({
  altText,
  hint,
  label,
  media,
  narrow = false,
  onAltChange,
  onClear,
  onMediaUploaded,
  onSelect,
  previewRatio,
  uploadRatio,
  url,
}: Readonly<{
  altText?: string;
  hint: string;
  label: string;
  media: MediaItem[];
  narrow?: boolean;
  onAltChange: (value: string) => void;
  onClear: () => void;
  onMediaUploaded: () => void;
  onSelect: (item: MediaItem) => void;
  previewRatio: string;
  uploadRatio: string;
  url?: string;
}>) {
  return (
    <div className="min-w-0 rounded-md border border-border p-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ImagePlus aria-hidden="true" size={16} />
        {label}
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>
      {url ? (
        <div className={`mt-3 grid gap-2 ${narrow ? "mx-auto max-w-[220px]" : ""}`}>
          <ResponsiveImage
            alt={altText || label}
            aspectRatio={previewRatio}
            className="rounded-md border border-border"
            src={url}
          />
          <Field
            label="Alt text (describe the image)"
            onChange={onAltChange}
            value={altText ?? ""}
          />
          <button
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-destructive/40 text-sm font-semibold text-destructive"
            onClick={onClear}
            type="button"
          >
            <Trash2 aria-hidden="true" size={14} />
            Remove image
          </button>
        </div>
      ) : (
        <p className="mt-3 rounded-md border border-border p-3 text-sm text-muted-foreground">
          No image selected.
        </p>
      )}
      <div className="mt-3">
        <MediaPicker
          media={media}
          onSelect={onSelect}
          pageSize={8}
          upload={{ aspectRatio: uploadRatio, onUploaded: onMediaUploaded, tags: "cms,about" }}
        />
      </div>
    </div>
  );
}

function EditorSection({
  children,
  onAdd,
  title,
}: Readonly<{ children: React.ReactNode; onAdd: () => void; title: string }>) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold"
          onClick={onAdd}
          type="button"
        >
          <Plus aria-hidden="true" size={15} />
          Add
        </button>
      </div>
      {children}
    </section>
  );
}

function CtaEditor({
  label,
  link,
  onChange,
}: Readonly<{
  label: string;
  link?: CmsLink;
  onChange: (key: keyof CmsLink, value: string | boolean) => void;
}>) {
  return (
    <div className="rounded-md border border-border p-3">
      <label className="flex items-center gap-2 text-xs font-semibold">
        <input
          checked={link?.enabled !== false}
          onChange={(event) => onChange("enabled", event.target.checked)}
          type="checkbox"
        />
        {label}
      </label>
      <div className="mt-3 grid gap-2">
        <Field
          label="Label"
          onChange={(value) => onChange("label", value)}
          value={link?.label ?? ""}
        />
        <Field
          label="Href"
          onChange={(value) => onChange("href", value)}
          value={link?.href ?? ""}
        />
      </div>
    </div>
  );
}

function LinkRow({
  link,
  onChange,
  onRemove,
}: Readonly<{
  link: CmsLink;
  onChange: (key: keyof CmsLink, value: string | boolean) => void;
  onRemove: () => void;
}>) {
  return (
    <CardRow onRemove={onRemove}>
      <div className="grid gap-3 md:grid-cols-[120px_1fr_1fr]">
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            checked={link.enabled !== false}
            onChange={(event) => onChange("enabled", event.target.checked)}
            type="checkbox"
          />
          Enabled
        </label>
        <Field label="Label" onChange={(value) => onChange("label", value)} value={link.label} />
        <Field label="Href" onChange={(value) => onChange("href", value)} value={link.href} />
      </div>
    </CardRow>
  );
}

function CardRow({
  children,
  onRemove,
}: Readonly<{ children: React.ReactNode; onRemove: () => void }>) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex justify-end">
        <button
          className="inline-flex h-8 items-center gap-1 rounded-md border border-destructive/40 px-2 text-xs font-semibold text-destructive"
          onClick={onRemove}
          type="button"
        >
          <Trash2 aria-hidden="true" size={13} />
          Remove
        </button>
      </div>
      <div className="mt-2 grid gap-3">{children}</div>
    </div>
  );
}

function ColorField({
  label,
  onChange,
  value,
}: Readonly<{ label: string; onChange: (value: string) => void; value: string }>) {
  const picker = /^#[0-9a-f]{6}$/i.test(value) ? value : "#ffffff";

  return (
    <div className="text-sm font-medium">
      {label}
      <div className="mt-1 flex items-center gap-2">
        <input
          aria-label={`${label} picker`}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-background p-1"
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={picker}
        />
        <input
          aria-label={label}
          className="h-10 min-w-0 flex-1 rounded-md border border-border px-3 text-sm"
          onChange={(event) => onChange(event.target.value)}
          placeholder="#ffffff"
          value={value}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  onChange,
  value,
}: Readonly<{ label: string; onChange: (value: string) => void; value: string }>) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function TextEditor({
  label,
  minHeight = "min-h-28",
  onChange,
  value,
}: Readonly<{
  label: string;
  minHeight?: string;
  onChange: (value: string) => void;
  value: string;
}>) {
  return (
    <label className="text-sm font-medium">
      {label}
      <textarea
        className={`mt-1 w-full rounded-md border border-border px-3 py-2 text-sm leading-6 ${minHeight}`}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function toMediaReference(
  item: MediaItem,
  fallbackAlt: string,
  aspectRatio = "1:1",
): MediaReference {
  return {
    altText: item.altText ?? fallbackAlt,
    aspectRatio: item.selectedAspectRatio || aspectRatio,
    mediaId: item._id,
    objectFit: "cover",
    type: item.resourceType === "video" ? "video" : "image",
    url: item.originalUrl ?? item.secureUrl,
  };
}

function cleanLink(link?: CmsLink): CmsLink | undefined {
  if (!link) {
    return undefined;
  }

  return {
    enabled: link.enabled !== false,
    href: link.href ?? "",
    label: link.label ?? "",
  };
}

function cleanMediaReference(
  mediaReference?: MediaReference | null,
): MediaReference | null | undefined {
  if (mediaReference === null) {
    return null;
  }

  if (!mediaReference?.url) {
    return undefined;
  }

  return {
    altText: mediaReference.altText,
    aspectRatio: mediaReference.aspectRatio,
    mediaId: mediaReference.mediaId,
    objectFit: mediaReference.objectFit,
    type: mediaReference.type,
    url: mediaReference.url,
  };
}

function cleanHeroSlide(slide: CmsHeroSlide): CmsHeroSlide {
  return {
    copy: slide.copy,
    copyFontSize: slide.copyFontSize ?? "md",
    contentPosition: slide.contentPosition ?? "left",
    enabled: slide.enabled !== false,
    endsAt: slide.endsAt || null,
    eyebrow: slide.eyebrow,
    fontFamily: slide.fontFamily ?? "serif",
    fontSize: slide.fontSize ?? "lg",
    media: cleanMediaReference(slide.media),
    mobileMedia: cleanMediaReference(slide.mobileMedia),
    overlay: slide.overlay ?? "medium",
    primaryCta: cleanLink(slide.primaryCta),
    secondaryCta: cleanLink(slide.secondaryCta),
    showOutline: slide.showOutline !== false,
    showTextOnMobile: slide.showTextOnMobile !== false,
    startsAt: slide.startsAt || null,
    textColor: slide.textColor ?? "#ffffff",
    title: slide.title,
  };
}

function findMissingAltText(content: CmsContent) {
  const missing: string[] = [];
  const check = (label: string, reference?: MediaReference | null) => {
    if (reference?.url && (reference.altText ?? "").trim().length < 3) {
      missing.push(label);
    }
  };

  (content.home?.hero?.slides ?? []).forEach((slide, index) => {
    check(`Hero slide ${index + 1} desktop media`, slide.media);
    check(`Hero slide ${index + 1} mobile media`, slide.mobileMedia);
  });
  check("Home story image", content.home?.storyMedia);
  check("About banner", content.about?.media);
  check("About mobile banner", content.about?.mobileMedia);
  check("About story image", content.about?.storyMedia);
  check("Shop banner", content.shop?.media);
  check("Pre-order banner", content.preOrder?.media);
  check("Shop mobile banner", content.shop?.mobileMedia);
  check("Pre-order mobile banner", content.preOrder?.mobileMedia);
  check("Footer logo", content.footer?.brandLogo);

  return missing;
}

function isPresent<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function normalizeContent(content: CmsContent): CmsContent {
  const homeHero = {
    ...defaultCmsContent.home?.hero,
    ...content.home?.hero,
  };
  const aboutPrimaryCta = {
    enabled: true,
    href: "/shop",
    label: "Explore Shop",
    ...defaultCmsContent.about?.primaryCta,
    ...content.about?.primaryCta,
  };
  const shop = { ...defaultCmsContent.shop, ...content.shop };
  const preOrder = { ...defaultCmsContent.preOrder, ...content.preOrder };

  return {
    title: content.title ?? defaultCmsContent.title,
    status: content.status ?? defaultCmsContent.status,
    footer: {
      brandLogo: cleanMediaReference(
        content.footer?.brandLogo ?? defaultCmsContent.footer?.brandLogo,
      ),
      copyrightText: content.footer?.copyrightText,
      email: content.footer?.email ?? defaultCmsContent.footer?.email,
      helpLinks: (content.footer?.helpLinks ?? []).map((link) => cleanLink(link)).filter(isPresent),
      newsletterText: content.footer?.newsletterText,
      newsletterTitle: content.footer?.newsletterTitle,
      shopLinks: (content.footer?.shopLinks ?? []).map((link) => cleanLink(link)).filter(isPresent),
      instagramPosts: (
        content.footer?.instagramPosts ??
        defaultCmsContent.footer?.instagramPosts ??
        []
      ).filter(Boolean),
      instagramUrl: content.footer?.instagramUrl ?? defaultCmsContent.footer?.instagramUrl,
      links: (content.footer?.links ?? defaultCmsContent.footer?.links ?? [])
        .map((link) => cleanLink(link))
        .filter(isPresent),
      location: content.footer?.location ?? defaultCmsContent.footer?.location,
      phone: content.footer?.phone ?? defaultCmsContent.footer?.phone,
      tagline: content.footer?.tagline ?? defaultCmsContent.footer?.tagline,
      whatsappUrl: content.footer?.whatsappUrl ?? defaultCmsContent.footer?.whatsappUrl,
    },
    home: {
      announcement: content.home?.announcement ?? defaultCmsContent.home?.announcement,
      topBarText: content.home?.topBarText,
      story: content.home?.story ? cleanHeroSlide(content.home.story) : undefined,
      storyMedia: cleanMediaReference(content.home?.storyMedia),
      hero: {
        copy: homeHero.copy,
        eyebrow: homeHero.eyebrow,
        media: cleanMediaReference(homeHero.media),
        primaryCta: cleanLink(homeHero.primaryCta),
        secondaryCta: cleanLink(homeHero.secondaryCta),
        slideDuration: homeHero.slideDuration,
        slides: (homeHero.slides ?? []).map((slide) => cleanHeroSlide(slide)),
        title: homeHero.title,
      },
    },
    about: {
      description: content.about?.description ?? defaultCmsContent.about?.description,
      eyebrow: content.about?.eyebrow ?? defaultCmsContent.about?.eyebrow,
      media: cleanMediaReference(content.about?.media ?? defaultCmsContent.about?.media),
      mobileMedia: cleanMediaReference(content.about?.mobileMedia),
      storyMedia: cleanMediaReference(content.about?.storyMedia),
      textColor: content.about?.textColor,
      contentPosition: content.about?.contentPosition,
      showOutline: content.about?.showOutline,
      overlay: content.about?.overlay,
      valuesTitle: content.about?.valuesTitle,
      closingTitle: content.about?.closingTitle,
      closingCopy: content.about?.closingCopy,
      sections: content.about?.sections,
      founder: content.about?.founder,
      foundedYear: content.about?.foundedYear,
      primaryCta: cleanLink(aboutPrimaryCta),
      storyCopy: content.about?.storyCopy ?? defaultCmsContent.about?.storyCopy,
      storyEyebrow: content.about?.storyEyebrow ?? defaultCmsContent.about?.storyEyebrow,
      storyTitle: content.about?.storyTitle ?? defaultCmsContent.about?.storyTitle,
      title: content.about?.title ?? defaultCmsContent.about?.title,
      values: (content.about?.values ?? defaultCmsContent.about?.values ?? []).map((item) => ({
        icon: item.icon ?? "sparkles",
        text: item.text,
        title: item.title,
      })),
    },
    shop: {
      contentPosition: shop.contentPosition ?? "left",
      copyFontSize: shop.copyFontSize ?? "md",
      description: shop.description,
      eyebrow: shop.eyebrow,
      fontFamily: shop.fontFamily ?? "serif",
      fontSize: shop.fontSize ?? "lg",
      media: cleanMediaReference(shop.media),
      mobileMedia: cleanMediaReference(shop.mobileMedia),
      overlay: shop.overlay,
      promo: shop.promo ? cleanHeroSlide(shop.promo) : undefined,
      showOutline: shop.showOutline !== false,
      textColor: shop.textColor ?? "#ffffff",
      title: shop.title,
    },
    preOrder: {
      contentPosition: preOrder.contentPosition ?? "left",
      copyFontSize: preOrder.copyFontSize ?? "md",
      description: preOrder.description,
      eyebrow: preOrder.eyebrow,
      fontFamily: preOrder.fontFamily ?? "serif",
      fontSize: preOrder.fontSize ?? "lg",
      media: cleanMediaReference(preOrder.media),
      mobileMedia: cleanMediaReference(preOrder.mobileMedia),
      overlay: preOrder.overlay,
      promo: preOrder.promo ? cleanHeroSlide(preOrder.promo) : undefined,
      showOutline: preOrder.showOutline !== false,
      textColor: preOrder.textColor ?? "#ffffff",
      title: preOrder.title,
    },
    navigation: (content.navigation ?? []).map((link) => cleanLink(link)).filter(isPresent),
    productTrustBadges: content.productTrustBadges,
    headerNavigation: (content.headerNavigation ?? [])
      .map((link) => cleanLink(link))
      .filter(isPresent),
    faqs: (content.faqs ?? []).map((item) => ({
      answer: item.answer,
      question: item.question,
    })),
    policies: (content.policies ?? []).map((item) => ({
      body: item.body,
      slug: item.slug,
      title: item.title,
    })),
    testimonials: (content.testimonials ?? []).map((item) => ({
      location: item.location,
      name: item.name,
      quote: item.quote,
    })),
  };
}

"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  ImagePlus,
  Loader2,
  Monitor,
  Plus,
  Smartphone,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { MediaPicker, type MediaItem } from "@/components/media/MediaPicker";
import { errorMessage, useToast } from "@/components/ui/Toast";
import { apiBaseUrl } from "@/lib/api";
import type { MediaReference } from "@/lib/catalog";
import type { CmsHeroSlide, CmsLink } from "@/lib/cms";

type SlideKey = "media" | "mobileMedia";
type Choice<T extends string> = ReadonlyArray<readonly [T, string]>;

const FONT_CHOICES: Choice<"serif" | "sans"> = [
  ["serif", "Elegant serif (Cormorant)"],
  ["sans", "Clean sans (Jost)"],
];
const SIZE_CHOICES: Choice<"sm" | "md" | "lg"> = [
  ["sm", "Small"],
  ["md", "Medium"],
  ["lg", "Large"],
];
const POSITION_CHOICES: Choice<"left" | "center" | "right"> = [
  ["left", "Left"],
  ["center", "Center"],
  ["right", "Right"],
];
const OVERLAY_CHOICES: Choice<"none" | "soft" | "medium" | "strong"> = [
  ["none", "None"],
  ["soft", "Soft"],
  ["medium", "Medium"],
  ["strong", "Strong (best for bright photos)"],
];

export function newHeroSlide(): CmsHeroSlide {
  return {
    copy: "",
    copyFontSize: "md",
    contentPosition: "left",
    enabled: true,
    eyebrow: "",
    fontFamily: "serif",
    fontSize: "lg",
    overlay: "medium",
    primaryCta: { enabled: true, href: "/shop", label: "Shop Now" },
    showOutline: false,
    showTextOnMobile: true,
    textColor: "#ffffff",
    title: "New Slide Title",
  };
}

export function HeroSlidesEditor({
  accessToken,
  media,
  onChange,
  onDurationChange,
  onMediaUploaded,
  slideDuration,
  slides,
}: Readonly<{
  accessToken?: string;
  media: MediaItem[];
  onChange: (slides: CmsHeroSlide[]) => void;
  onDurationChange: (seconds: number | undefined) => void;
  onMediaUploaded: () => void;
  slideDuration?: number;
  slides: CmsHeroSlide[];
}>) {
  function update(index: number, patch: Partial<CmsHeroSlide>) {
    onChange(slides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)));
  }

  function updateLink(
    index: number,
    field: "primaryCta" | "secondaryCta",
    patch: Partial<CmsLink>,
  ) {
    const current = slides[index]?.[field];
    update(index, { [field]: { enabled: true, href: "", label: "", ...current, ...patch } });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Home Hero Slides</h2>
          <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
            Each slide has its own desktop media, a 4:5 mobile media, text and buttons. Images or
            videos both work. Up to 8 slides, shown in this order.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <label className="text-xs font-medium">
            Seconds per slide
            <input
              className="mt-1 block h-9 w-24 rounded-md border border-border px-2 text-sm"
              max={30}
              min={3}
              onChange={(event) =>
                onDurationChange(event.target.value ? Number(event.target.value) : undefined)
              }
              placeholder="6"
              type="number"
              value={slideDuration ?? ""}
            />
          </label>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            disabled={slides.length >= 8}
            onClick={() => onChange([...slides, newHeroSlide()])}
            type="button"
          >
            <Plus aria-hidden="true" size={15} />
            Add Slide
          </button>
        </div>
      </div>

      {slides.map((slide, index) => (
        <article
          className="rounded-lg border border-border bg-background/40 p-3 sm:p-4"
          key={index}
        >
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <h3 className="text-sm font-semibold">
                {slide.title?.trim() || `Slide ${index + 1}`}
              </h3>
              {slide.enabled === false ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Hidden
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <label className="mr-1 flex items-center gap-1.5 text-xs font-medium">
                <input
                  checked={slide.enabled !== false}
                  className="size-4 accent-primary"
                  onChange={(event) => update(index, { enabled: event.target.checked })}
                  type="checkbox"
                />
                Visible
              </label>
              <IconButton disabled={index === 0} label="Move up" onClick={() => move(index, -1)}>
                <ArrowUp aria-hidden="true" size={14} />
              </IconButton>
              <IconButton
                disabled={index === slides.length - 1}
                label="Move down"
                onClick={() => move(index, 1)}
              >
                <ArrowDown aria-hidden="true" size={14} />
              </IconButton>
              <IconButton
                disabled={slides.length >= 8}
                label="Duplicate"
                onClick={() =>
                  onChange([
                    ...slides.slice(0, index + 1),
                    { ...slide },
                    ...slides.slice(index + 1),
                  ])
                }
              >
                <Copy aria-hidden="true" size={14} />
              </IconButton>
              <IconButton
                danger
                disabled={slides.length <= 1}
                label="Remove slide"
                onClick={() => onChange(slides.filter((_, i) => i !== index))}
              >
                <Trash2 aria-hidden="true" size={14} />
              </IconButton>
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-2">
            <MediaSlot
              accessToken={accessToken}
              altFallback={slide.title}
              hint="Wide image or video. Shown on laptop/desktop. Recommended 2400 x 600 px."
              icon={<Monitor aria-hidden="true" size={15} />}
              label="Desktop media"
              library={media}
              onMediaUploaded={onMediaUploaded}
              onSelect={(value) => update(index, { media: value })}
              slotKey="media"
              uploadAspect="21:9"
              value={slide.media}
            />
            <MediaSlot
              accessToken={accessToken}
              altFallback={slide.title}
              hint="4:5 portrait image or video. Shown on phones. Recommended 1080 x 1350 px."
              icon={<Smartphone aria-hidden="true" size={15} />}
              label="Mobile media (4:5)"
              library={media.filter(
                (item) => item.resourceType === "video" || item.selectedAspectRatio === "4:5",
              )}
              libraryNote="Only 4:5 images and videos are listed here."
              onMediaUploaded={onMediaUploaded}
              onSelect={(value) => update(index, { mobileMedia: value })}
              slotKey="mobileMedia"
              uploadAspect="4:5"
              value={slide.mobileMedia}
            />
          </div>

          <Section title="Text">
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput
                label="Small heading (eyebrow)"
                onChange={(value) => update(index, { eyebrow: value })}
                placeholder="Tradition meets tomorrow"
                value={slide.eyebrow ?? ""}
              />
              <TextInput
                label="Main title"
                onChange={(value) => update(index, { title: value })}
                placeholder="Indian roots. Modern form."
                value={slide.title ?? ""}
              />
            </div>
            <label className="mt-3 block text-sm font-medium">
              Description
              <textarea
                className="mt-1 min-h-20 w-full rounded-md border border-border px-3 py-2 text-sm leading-6"
                maxLength={500}
                onChange={(event) => update(index, { copy: event.target.value })}
                value={slide.copy ?? ""}
              />
            </label>
          </Section>

          <Section title="Buttons">
            <div className="grid gap-3 md:grid-cols-2">
              <ButtonEditor
                label="Primary button"
                link={slide.primaryCta}
                onChange={(patch) => updateLink(index, "primaryCta", patch)}
              />
              <ButtonEditor
                label="Secondary button"
                link={slide.secondaryCta}
                onChange={(patch) => updateLink(index, "secondaryCta", patch)}
              />
            </div>
          </Section>

          <Section title="Style">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                choices={FONT_CHOICES}
                label="Title font"
                onChange={(value) => update(index, { fontFamily: value })}
                value={slide.fontFamily ?? "serif"}
              />
              <Select
                choices={SIZE_CHOICES}
                label="Title size"
                onChange={(value) => update(index, { fontSize: value })}
                value={slide.fontSize ?? "lg"}
              />
              <Select
                choices={SIZE_CHOICES}
                label="Description size"
                onChange={(value) => update(index, { copyFontSize: value })}
                value={slide.copyFontSize ?? "md"}
              />
              <Select
                choices={POSITION_CHOICES}
                label="Text position"
                onChange={(value) => update(index, { contentPosition: value })}
                value={slide.contentPosition ?? "left"}
              />
              <Select
                choices={OVERLAY_CHOICES}
                label="Dark overlay"
                onChange={(value) => update(index, { overlay: value })}
                value={slide.overlay ?? "medium"}
              />
              <label className="text-sm font-medium">
                Text colour
                <span className="mt-1 flex h-10 items-center gap-2 rounded-md border border-border px-2">
                  <input
                    aria-label="Pick text colour"
                    className="size-6 cursor-pointer border-0 bg-transparent p-0"
                    onChange={(event) => update(index, { textColor: event.target.value })}
                    type="color"
                    value={
                      /^#[0-9a-f]{6}$/i.test(slide.textColor ?? "") ? slide.textColor : "#ffffff"
                    }
                  />
                  <input
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                    onChange={(event) => update(index, { textColor: event.target.value })}
                    value={slide.textColor ?? "#ffffff"}
                  />
                </span>
              </label>
              <Check
                checked={slide.showTextOnMobile !== false}
                label="Show text on mobile"
                onChange={(checked) => update(index, { showTextOnMobile: checked })}
              />
              <Check
                checked={slide.showOutline === true}
                label="Gold frame outline"
                onChange={(checked) => update(index, { showOutline: checked })}
              />
            </div>
          </Section>

          <Section title="Schedule (optional)">
            <div className="grid gap-3 sm:grid-cols-2">
              <DateInput
                label="Show from"
                onChange={(value) => update(index, { startsAt: value })}
                value={slide.startsAt}
              />
              <DateInput
                label="Hide after"
                onChange={(value) => update(index, { endsAt: value })}
                value={slide.endsAt}
              />
            </div>
          </Section>
        </article>
      ))}
    </div>
  );
}

function MediaSlot({
  accessToken,
  altFallback,
  hint,
  icon,
  label,
  library,
  libraryNote,
  onMediaUploaded,
  onSelect,
  slotKey,
  uploadAspect,
  value,
}: Readonly<{
  accessToken?: string;
  altFallback?: string;
  hint: string;
  icon: ReactNode;
  label: string;
  library: MediaItem[];
  libraryNote?: string;
  onMediaUploaded: () => void;
  onSelect: (value: MediaReference | null) => void;
  slotKey: SlideKey;
  uploadAspect: string;
  value?: MediaReference | null;
}>) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const alt =
    altFallback?.trim().length && altFallback.trim().length >= 3
      ? altFallback.trim()
      : "The Vastra House hero banner";

  function toReference(item: MediaItem): MediaReference {
    return {
      // Alt text is mandatory: left empty (and flagged) until the admin writes it.
      altText: item.altText && item.altText.trim().length >= 3 ? item.altText.trim() : "",
      aspectRatio: (item.selectedAspectRatio || uploadAspect) as MediaReference["aspectRatio"],
      mediaId: item._id,
      objectFit: "cover",
      type: item.resourceType === "video" ? "video" : "image",
      url: item.originalUrl ?? item.secureUrl,
    };
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("aspectRatio", uploadAspect);
      formData.set("context", "product-media");
      formData.set("objectFit", "cover");
      formData.set("altText", alt);
      formData.set("tags", `cms,hero,home,${slotKey === "mobileMedia" ? "mobile" : "desktop"}`);

      const response = await fetch(`${apiBaseUrl}/media/upload`, {
        body: formData,
        headers: { Authorization: `Bearer ${accessToken}` },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "Upload failed");
      }

      const payload = (await response.json()) as { media: MediaItem };
      onSelect(toReference(payload.media));
      onMediaUploaded();
      toast.success(`${label} uploaded`);
    } catch (error) {
      toast.error(errorMessage(error, "Upload failed"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="min-w-0 rounded-md border border-border p-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>

      <div
        className={`mt-3 overflow-hidden rounded-md border border-dashed border-border bg-muted/40 ${
          slotKey === "mobileMedia" ? "mx-auto aspect-[4/5] max-w-[220px]" : "aspect-[16/5]"
        }`}
      >
        {value?.url ? (
          value.type === "video" ? (
            <video
              aria-label={value.altText}
              className="size-full object-cover"
              controls
              muted
              playsInline
              preload="metadata"
              src={value.url}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={value.altText ?? ""} className="size-full object-cover" src={value.url} />
          )
        ) : (
          <div className="grid size-full place-items-center text-xs text-muted-foreground">
            {slotKey === "mobileMedia"
              ? "Not set - desktop media will be used on phones"
              : "No media selected"}
          </div>
        )}
      </div>

      {value?.url ? (
        <label className="mt-3 block text-xs font-medium">
          Alt text <span className="text-destructive">(required)</span>
          <input
            aria-invalid={(value.altText ?? "").trim().length < 3}
            className={`mt-1 h-10 w-full rounded-md border px-3 text-sm ${
              (value.altText ?? "").trim().length < 3 ? "border-destructive" : "border-border"
            }`}
            maxLength={160}
            onChange={(event) => onSelect({ ...value, altText: event.target.value })}
            placeholder={
              value.type === "video"
                ? "Describe the video for screen readers"
                : "Describe the image, e.g. Woman in a cream block-print kurta"
            }
            value={value.altText ?? ""}
          />
          {(value.altText ?? "").trim().length < 3 ? (
            <span className="mt-1 block text-destructive">
              Write at least 3 characters before saving.
            </span>
          ) : null}
        </label>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          accept="image/*,video/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
          ref={fileRef}
          type="file"
        />
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold disabled:opacity-60"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          type="button"
        >
          {uploading ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={14} />
          ) : (
            <Upload aria-hidden="true" size={14} />
          )}
          {uploading ? "Uploading..." : "Upload image / video"}
        </button>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold"
          onClick={() => setShowLibrary((current) => !current)}
          type="button"
        >
          <ImagePlus aria-hidden="true" size={14} />
          {showLibrary ? "Hide library" : "Choose from library"}
        </button>
        {value?.url ? (
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-destructive/40 px-3 text-xs font-semibold text-destructive"
            onClick={() => onSelect(null)}
            type="button"
          >
            <Trash2 aria-hidden="true" size={14} />
            Remove
          </button>
        ) : null}
      </div>

      {showLibrary ? (
        <div className="mt-3 max-h-80 overflow-y-auto rounded-md border border-border p-2">
          {libraryNote ? <p className="mb-2 text-xs text-muted-foreground">{libraryNote}</p> : null}
          <MediaPicker
            media={library}
            onSelect={(item) => {
              onSelect(toReference(item));
              setShowLibrary(false);
            }}
            pageSize={8}
          />
        </div>
      ) : null}
    </div>
  );
}

function Section({ children, title }: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <div className="mt-4 border-t border-border pt-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      {children}
    </div>
  );
}

function IconButton({
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
      className={`inline-flex size-8 items-center justify-center rounded-md border disabled:cursor-not-allowed disabled:opacity-40 ${
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

export function TextInput({
  label,
  onChange,
  placeholder,
  value,
}: Readonly<{
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}>) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function ButtonEditor({
  label,
  link,
  onChange,
}: Readonly<{ label: string; link?: CmsLink; onChange: (patch: Partial<CmsLink>) => void }>) {
  return (
    <div className="rounded-md border border-border p-3">
      <label className="flex items-center gap-2 text-xs font-semibold">
        <input
          checked={link?.enabled !== false}
          className="size-4 accent-primary"
          onChange={(event) => onChange({ enabled: event.target.checked })}
          type="checkbox"
        />
        {label}
      </label>
      <div className="mt-3 grid gap-2">
        <TextInput
          label="Button text"
          onChange={(value) => onChange({ label: value })}
          placeholder="Explore the collection"
          value={link?.label ?? ""}
        />
        <TextInput
          label="Link (page or URL)"
          onChange={(value) => onChange({ href: value })}
          placeholder="/shop"
          value={link?.href ?? ""}
        />
      </div>
    </div>
  );
}

function Select<T extends string>({
  choices,
  label,
  onChange,
  value,
}: Readonly<{
  choices: Choice<T>;
  label: string;
  onChange: (value: T) => void;
  value: T;
}>) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select
        className="mt-1 h-10 w-full rounded-md border border-border bg-background px-2 text-sm"
        onChange={(event) => onChange(event.target.value as T)}
        value={value}
      >
        {choices.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function Check({
  checked,
  label,
  onChange,
}: Readonly<{ checked: boolean; label: string; onChange: (checked: boolean) => void }>) {
  return (
    <label className="flex h-10 items-center gap-2 self-end rounded-md border border-border px-3 text-sm font-medium">
      <input
        checked={checked}
        className="size-4 accent-primary"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function DateInput({
  label,
  onChange,
  value,
}: Readonly<{
  label: string;
  onChange: (value: string | null) => void;
  value?: string | null;
}>) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
        onChange={(event) =>
          onChange(event.target.value ? new Date(event.target.value).toISOString() : null)
        }
        type="datetime-local"
        value={toLocalInput(value)}
      />
    </label>
  );
}

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

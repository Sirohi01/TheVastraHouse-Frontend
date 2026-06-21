"use client";

export function Textarea({
  helperText,
  label,
  maxLength,
  onChange,
  required,
  rows = 4,
  value,
}: Readonly<{
  helperText?: string;
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
  value: string;
}>) {
  return (
    <label className="block text-xs font-medium">
      <span className="flex items-center justify-between gap-2">
        <span>{label}</span>
        {maxLength ? (
          <span className="font-normal text-muted-foreground">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </span>
      <textarea
        className="mt-1 w-full rounded-md border border-border px-2.5 py-2 text-sm"
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        rows={rows}
        value={value}
      />
      {helperText ? (
        <span className="mt-1 block font-normal text-muted-foreground">{helperText}</span>
      ) : null}
    </label>
  );
}

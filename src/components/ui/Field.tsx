"use client";

export function Field({
  helperText,
  label,
  maxLength,
  onChange,
  required,
  type = "text",
  value,
}: Readonly<{
  helperText?: string;
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
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
      <input
        className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
      {helperText ? (
        <span className="mt-1 block font-normal text-muted-foreground">{helperText}</span>
      ) : null}
    </label>
  );
}

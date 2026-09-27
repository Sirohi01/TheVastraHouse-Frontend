"use client";

import { useState } from "react";
import { submitContact } from "@/lib/content";

export function ContactForm() {
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setMessage("Sending...");
    const response = await submitContact({
      category: String(formData.get("category") ?? "other"),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
      name: String(formData.get("name") ?? ""),
      orderNumber: String(formData.get("orderNumber") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      website: String(formData.get("website") ?? ""),
    });
    setMessage(response.ok ? "Thanks. Your enquiry has been saved." : "We could not save your enquiry. Please check the form.");
  }

  return (
    <form action={submit} className="grid gap-3 rounded-md border border-[#e5dac7] bg-[#fffaf1] p-5">
      <input className="hidden" name="website" tabIndex={-1} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Name" name="name" required />
        <Input label="Email" name="email" required type="email" />
        <Input label="Phone" name="phone" />
        <Input label="Order number" name="orderNumber" />
      </div>
      <label className="text-sm font-semibold">
        Category
        <select className="mt-2 h-10 w-full rounded-md border border-border px-3" name="category">
          {["other", "order", "return", "payment", "shipping", "wholesale", "privacy"].map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </label>
      <Input label="Subject" name="subject" required />
      <label className="text-sm font-semibold">
        Message
        <textarea className="mt-2 min-h-32 w-full rounded-md border border-border p-3" name="message" required />
      </label>
      <button className="h-11 rounded-md bg-primary px-4 font-semibold text-primary-foreground" type="submit">Send enquiry</button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}

function Input({ label, ...props }: Readonly<React.InputHTMLAttributes<HTMLInputElement> & { label: string }>) {
  return <label className="text-sm font-semibold">{label}<input className="mt-2 h-10 w-full rounded-md border border-border px-3" {...props} /></label>;
}

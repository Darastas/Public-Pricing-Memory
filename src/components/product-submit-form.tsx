"use client";

import { FormEvent, useState } from "react";
import { Plus, Send } from "lucide-react";

type SubmitState =
  | { status: "idle"; message: string }
  | { status: "pending"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function ProductSubmitForm() {
  const [state, setState] = useState<SubmitState>({
    status: "idle",
    message: ""
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setState({ status: "pending", message: "Submitting product..." });

    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(formData.get("adminToken")
          ? { authorization: `Bearer ${formData.get("adminToken")}` }
          : {})
      },
      body: JSON.stringify({
        name: formData.get("name"),
        websiteUrl: formData.get("websiteUrl"),
        pricingUrl: formData.get("pricingUrl"),
        category: formData.get("category")
      })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setState({
        status: "error",
        message: payload.error ?? "Product submission failed"
      });
      return;
    }

    form.reset();
    setState({
      status: "success",
      message: "Product is now tracked. Refresh to see it in the archive."
    });
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="field" name="name" placeholder="Product name" required />
        <input className="field" name="category" placeholder="Category" />
      </div>
      <input className="field" name="websiteUrl" placeholder="https://example.com" required />
      <input
        className="field"
        name="pricingUrl"
        placeholder="https://example.com/pricing"
        required
      />
      <input
        className="field"
        name="adminToken"
        placeholder="Admin token for local write access"
        type="password"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className={`text-sm ${
            state.status === "error"
              ? "text-[var(--red)]"
              : state.status === "success"
                ? "text-[var(--green)]"
                : "text-[var(--muted)]"
          }`}
        >
          {state.message || "Production writes require ADMIN_TOKEN."}
        </p>
        <button className="button button-primary" disabled={state.status === "pending"}>
          {state.status === "pending" ? <Send size={16} /> : <Plus size={16} />}
          Track URL
        </button>
      </div>
    </form>
  );
}

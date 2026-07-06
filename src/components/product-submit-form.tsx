"use client";

import { FormEvent, useState } from "react";
import { Plus, Send } from "lucide-react";
import type { Locale } from "@/lib/i18n";

type SubmitState =
  | { status: "idle"; message: string }
  | { status: "pending"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function ProductSubmitForm({ locale = "en" }: { locale?: Locale }) {
  const copy = locale === "zh" ? zhCopy : enCopy;
  const [state, setState] = useState<SubmitState>({
    status: "idle",
    message: ""
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setState({ status: "pending", message: copy.submitting });

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
        message: payload.error ?? copy.failed
      });
      return;
    }

    form.reset();
    setState({
      status: "success",
      message: copy.success
    });
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="field" name="name" placeholder={copy.productName} required />
        <input className="field" name="category" placeholder={copy.category} />
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
        placeholder={copy.adminToken}
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
          {state.message || copy.requiresToken}
        </p>
        <button className="button button-primary" disabled={state.status === "pending"}>
          {state.status === "pending" ? <Send size={16} /> : <Plus size={16} />}
          {copy.trackUrl}
        </button>
      </div>
    </form>
  );
}

const enCopy = {
  adminToken: "Admin token for local write access",
  category: "Category",
  failed: "Product submission failed",
  productName: "Product name",
  requiresToken: "Production writes require ADMIN_TOKEN.",
  submitting: "Submitting product...",
  success: "Product is now tracked. Refresh to see it in the archive.",
  trackUrl: "Track URL"
};

const zhCopy = {
  adminToken: "本地写入用 Admin Token",
  category: "类别",
  failed: "产品提交失败",
  productName: "产品名称",
  requiresToken: "生产写入需要 ADMIN_TOKEN。",
  submitting: "正在提交产品...",
  success: "产品已加入追踪。刷新页面后可在档案中查看。",
  trackUrl: "追踪 URL"
};

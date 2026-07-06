"use client";

import { FormEvent, useState } from "react";
import { Play, Plus, RotateCcw } from "lucide-react";

type ProductOption = {
  id: string;
  name: string;
  slug: string;
};

type ActionState = {
  status: "idle" | "pending" | "success" | "error";
  message: string;
};

export function AdminActions({ products }: { products: ProductOption[] }) {
  const [token, setToken] = useState("");
  const [state, setState] = useState<ActionState>({
    status: "idle",
    message: "Write actions use ADMIN_TOKEN."
  });

  async function crawlProduct(productId: string) {
    setState({ status: "pending", message: "Running crawl..." });
    const response = await fetch(`/api/crawl/${productId}`, {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : {}
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState({ status: "error", message: payload.error ?? "Crawl failed" });
      return;
    }
    setState({
      status: payload.result?.status === "failed" ? "error" : "success",
      message: `Crawl ${payload.result?.status ?? "finished"}: ${
        payload.result?.planCount ?? 0
      } plans, ${payload.result?.changeCount ?? 0} changes`
    });
  }

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setState({ status: "pending", message: "Creating product..." });
    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
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
      setState({ status: "error", message: payload.error ?? "Create failed" });
      return;
    }
    form.reset();
    setState({ status: "success", message: "Product created. Refresh to see it." });
  }

  async function crawlFirstBatch() {
    setState({ status: "pending", message: "Running cron batch..." });
    const response = await fetch("/api/cron/crawl?limit=3&cooldownHours=1", {
      method: "POST",
      headers: token ? { "x-cron-secret": token } : {}
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState({ status: "error", message: payload.error ?? "Cron batch failed" });
      return;
    }
    setState({
      status: "success",
      message: `Cron batch processed ${payload.processed ?? 0} product(s).`
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="panel p-5 sm:p-6">
        <h2 className="text-xl font-[800]">Protected controls</h2>
        <div className="mt-4 grid gap-3">
          <input
            className="field"
            onChange={(event) => setToken(event.target.value)}
            placeholder="ADMIN_TOKEN or CRON_SECRET"
            type="password"
            value={token}
          />
          <button className="button button-secondary justify-self-start" onClick={crawlFirstBatch}>
            <RotateCcw size={16} />
            Run cron batch
          </button>
          <p
            className={`text-sm ${
              state.status === "error"
                ? "text-[var(--red)]"
                : state.status === "success"
                  ? "text-[var(--green)]"
                  : "text-[var(--muted)]"
            }`}
          >
            {state.message}
          </p>
        </div>
        <div className="mt-5 grid gap-2">
          {products.map((product) => (
            <div
              className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--border)] bg-white px-3 py-2"
              key={product.id}
            >
              <span>
                <span className="block text-sm font-semibold">{product.name}</span>
                <span className="block text-xs text-[var(--muted)]">{product.slug}</span>
              </span>
              <button className="button button-secondary" onClick={() => crawlProduct(product.id)}>
                <Play size={15} />
                Crawl
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <h2 className="text-xl font-[800]">Add product</h2>
        <form className="mt-4 grid gap-3" onSubmit={addProduct}>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="field" name="name" placeholder="Product name" required />
            <input className="field" name="category" placeholder="Category" />
          </div>
          <input className="field" name="websiteUrl" placeholder="Website URL" required />
          <input className="field" name="pricingUrl" placeholder="Pricing URL" required />
          <button className="button button-primary justify-self-start">
            <Plus size={16} />
            Add tracked product
          </button>
        </form>
      </section>
    </div>
  );
}

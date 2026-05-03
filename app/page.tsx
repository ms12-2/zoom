"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [zoomUrl, setZoomUrl] = useState("");
  const [title, setTitle] = useState("Class session");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoom_url: zoomUrl.trim(),
          title: title.trim() || "Class session",
          source: "vercel_relay_web",
          message: zoomUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error || `HTTP ${res.status}`);
        return;
      }
      router.push(`/job/${data.relay_job_id}`);
    } catch (c) {
      setErr(c instanceof Error ? c.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.35rem", fontWeight: 600 }}>Nexus Zoom relay</h1>
      <p style={{ color: "#8b98a5", fontSize: "0.95rem", lineHeight: 1.5 }}>
        Paste a Zoom link here. Your PC runs a small poller that picks it up and calls your local runner
        (<code style={{ color: "#8899a6" }}>127.0.0.1:8099/start</code>). Vercel never joins Zoom; it only
        holds the queue.
      </p>
      <form onSubmit={submit} style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#8b98a5" }}>Zoom URL</span>
          <input
            value={zoomUrl}
            onChange={(e) => setZoomUrl(e.target.value)}
            placeholder="https://us02web.zoom.us/j/..."
            required
            style={{
              padding: "0.65rem 0.75rem",
              borderRadius: 8,
              border: "1px solid #38444d",
              background: "#16181c",
              color: "#e7e9ea",
              fontSize: "1rem",
            }}
          />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#8b98a5" }}>Title (optional)</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              padding: "0.65rem 0.75rem",
              borderRadius: 8,
              border: "1px solid #38444d",
              background: "#16181c",
              color: "#e7e9ea",
            }}
          />
        </label>
        {err ? (
          <p style={{ color: "#f4212e", margin: 0, fontSize: "0.9rem" }}>{err}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: 9999,
            border: "none",
            background: busy ? "#38444d" : "#1d9bf0",
            color: "#fff",
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
          }}
        >
          {busy ? "Queueing…" : "Queue for local runner"}
        </button>
      </form>
    </main>
  );
}

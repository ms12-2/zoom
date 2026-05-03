"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Job = {
  id: string;
  zoom_url: string;
  title: string;
  status: string;
  local_job_id?: string;
  summary?: string;
  error?: string;
  updated_at: number;
};

function formatErr(data: unknown, status: number): string {
  if (data && typeof data === "object" && "error" in data) {
    const e = (data as { error: unknown }).error;
    if (typeof e === "string") return e;
    if (e != null && typeof e === "object") {
      try {
        return JSON.stringify(e);
      } catch {
        return `HTTP ${status}`;
      }
    }
  }
  return `HTTP ${status}`;
}

function formatJobText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export default function JobPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [job, setJob] = useState<Job | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch(`/api/jobs/${id}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setErr(formatErr(data, res.status));
          return;
        }
        setJob(data.job);
        setErr("");
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Poll failed");
      }
    }
    tick();
    const t = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [id]);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
      <Link href="/" style={{ fontSize: "0.9rem" }}>
        ← New link
      </Link>
      <h1 style={{ fontSize: "1.2rem", marginTop: "1rem" }}>Job status</h1>
      <p style={{ color: "#8b98a5", fontSize: "0.85rem", wordBreak: "break-all" }}>{id}</p>
      {err ? <p style={{ color: "#f4212e" }}>{err}</p> : null}
      {job ? (
        <div style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}>
          <div>
            <strong>Status</strong>: {job.status}
          </div>
          {job.local_job_id ? (
            <div style={{ fontSize: "0.9rem" }}>
              <strong>Local runner job</strong>: {job.local_job_id}
            </div>
          ) : null}
          {job.error ? (
            <pre
              style={{
                background: "#2f1216",
                padding: "1rem",
                borderRadius: 8,
                overflow: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {formatJobText(job.error)}
            </pre>
          ) : null}
          {job.summary ? (
            <div>
              <h2 style={{ fontSize: "1rem" }}>Summary</h2>
              <pre
                style={{
                  background: "#16181c",
                  padding: "1rem",
                  borderRadius: 8,
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                  fontSize: "0.9rem",
                }}
              >
                {job.summary}
              </pre>
            </div>
          ) : null}
        </div>
      ) : !err ? (
        <p style={{ color: "#8b98a5" }}>Loading…</p>
      ) : null}
    </main>
  );
}

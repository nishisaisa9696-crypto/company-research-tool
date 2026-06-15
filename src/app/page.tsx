"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function handleResearch(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;

    setLoading(true);
    setReport("");
    setError("");
    setSavedId("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim() }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("サーバーエラーが発生しました");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = JSON.parse(line.slice(6));
          if (json.chunk) setReport((prev) => prev + json.chunk);
          if (json.error) setError(json.error);
          if (json.done) setSavedId(json.reportId);
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message || "不明なエラーが発生しました");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>企業調査レポートツール</h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.3rem" }}>
          企業名を入力するだけで、AIがWeb検索して詳細な調査レポートを自動生成・保存します
        </p>
        <div style={{ marginTop: "0.8rem" }}>
          <Link href="/reports">過去のレポート一覧 →</Link>
        </div>
      </header>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <form onSubmit={handleResearch} style={{ display: "flex", gap: "0.75rem" }}>
          <input
            type="text"
            placeholder="例：トヨタ自動車、Apple、ソフトバンク"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={loading}
          />
          {loading ? (
            <button type="button" className="btn btn-secondary" onClick={handleStop}>
              停止
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={!companyName.trim()}>
              調査開始
            </button>
          )}
        </form>
      </div>

      {loading && !report && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)" }}>
          <div className="spinner" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "var(--primary)" }} />
          AIがWeb検索中です...しばらくお待ちください
        </div>
      )}

      {error && <div className="error-box" style={{ marginBottom: "1rem" }}>{error}</div>}

      {report && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>{companyName} 調査レポート</h2>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {loading && <div className="spinner" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "var(--primary)" }} />}
              {savedId && (
                <Link href={`/reports/${savedId}`} className="btn btn-secondary" style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}>
                  保存済み →
                </Link>
              )}
            </div>
          </div>
          <div className="report-body">{report}</div>
        </div>
      )}
    </div>
  );
}

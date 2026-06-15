"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

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

      if (!res.ok || !res.body) throw new Error("サーバーエラーが発生しました");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        for (const line of text.split("\n")) {
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

  // AIの思考プロセス部分を除いてレポート本文だけ抽出
  const reportBody = report.replace(/^[\s\S]*?(#|\*\*)/m, (_, m) => m) || report;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8" }}>
      {/* ヘッダー */}
      <header style={{ background: "#1e3a5f", color: "#fff", padding: "1.2rem 0", marginBottom: "2rem" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>企業調査レポートツール</h1>
            <p style={{ fontSize: "0.85rem", opacity: 0.8, margin: "0.2rem 0 0" }}>
              AIがWeb検索して詳細な調査レポートを自動生成・保存
            </p>
          </div>
          <Link href="/reports" style={{ color: "#93c5fd", fontSize: "0.9rem" }}>
            過去のレポート一覧 →
          </Link>
        </div>
      </header>

      <div className="container" style={{ paddingBottom: "3rem" }}>
        {/* 検索フォーム */}
        <div className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
          <form onSubmit={handleResearch} style={{ display: "flex", gap: "0.75rem" }}>
            <input
              type="text"
              placeholder="例：トヨタ自動車、Apple、ソフトバンク"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={loading}
            />
            {loading ? (
              <button type="button" className="btn btn-secondary" onClick={() => abortRef.current?.abort()}>
                停止
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={!companyName.trim()}>
                調査開始
              </button>
            )}
          </form>
        </div>

        {/* ローディング */}
        {loading && !report && (
          <div className="card" style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)" }}>
            <div className="spinner" style={{ borderColor: "rgba(0,0,0,0.15)", borderTopColor: "var(--primary)" }} />
            AIがWeb検索中です...しばらくお待ちください（1〜2分）
          </div>
        )}

        {error && <div className="error-box" style={{ marginBottom: "1rem" }}>{error}</div>}

        {/* レポート */}
        {report && (
          <div>
            {/* レポートヘッダー */}
            <div style={{
              background: "#1e3a5f",
              color: "#fff",
              borderRadius: "8px 8px 0 0",
              padding: "1.2rem 1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>{companyName} 調査レポート</h2>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", opacity: 0.7 }}>
                  作成日: {new Date().toLocaleDateString("ja-JP")}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {loading && <div className="spinner" />}
                {savedId && (
                  <Link
                    href={`/reports/${savedId}`}
                    style={{
                      background: "#fff",
                      color: "#1e3a5f",
                      padding: "0.4rem 0.9rem",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    保存済み →
                  </Link>
                )}
              </div>
            </div>

            {/* レポート本文 */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "1.5rem" }}>
              <div className="markdown-body">
                <ReactMarkdown>{reportBody}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

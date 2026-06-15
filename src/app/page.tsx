"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

const SECTION_COLORS = ["#1e3a5f", "#7c3aed", "#0e7490", "#b45309", "#15803d", "#be185d", "#1d4ed8"];

function parseSections(md: string) {
  const sections: { title: string; content: string }[] = [];
  let current: { title: string; lines: string[] } | null = null;
  for (const line of md.split("\n")) {
    if (line.startsWith("## ")) {
      if (current) sections.push({ title: current.title, content: current.lines.join("\n").trim() });
      current = { title: line.replace(/^## /, "").trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push({ title: current.title, content: current.lines.join("\n").trim() });
  return sections;
}

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState("");
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});
  const [activeSection, setActiveSection] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  async function handleResearch(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;
    setLoading(true);
    setReport("");
    setError("");
    setSavedId("");
    setOpenSections({});
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
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const json = JSON.parse(line.slice(6));
          if (json.chunk) setReport((prev) => prev + json.chunk);
          if (json.error) setError(json.error);
          if (json.done) { setSavedId(json.reportId); setOpenSections({ 0: true }); }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message || "不明なエラー");
    } finally {
      setLoading(false);
    }
  }

  const cleanReport = report.replace(/^[\s\S]*?(#)/m, "$1") || report;
  const sections = parseSections(cleanReport);

  function toggle(i: number) { setOpenSections((p) => ({ ...p, [i]: !p[i] })); }
  function expandAll() { const a: Record<number, boolean> = {}; sections.forEach((_, i) => (a[i] = true)); setOpenSections(a); }
  function collapseAll() { setOpenSections({}); }
  function copyAll() { navigator.clipboard.writeText(cleanReport); }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa" }}>
      {/* ヘッダー */}
      <header style={{ background: "#1e3a5f", color: "#fff", padding: "0.9rem 0", marginBottom: "1.5rem" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0 }}>企業調査レポートツール</h1>
          <Link href="/reports" style={{ color: "#93c5fd", fontSize: "0.85rem" }}>過去のレポート一覧 →</Link>
        </div>
      </header>

      {/* ヒーローセクション（結果がない時だけ表示） */}
      {!report && !loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "2rem 1rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🔍</div>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#1e3a5f", margin: "0 0 0.5rem", textAlign: "center" }}>企業を調査する</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem", textAlign: "center", fontSize: "1rem" }}>
            企業名を入力するだけで、AIがWeb検索して詳細なレポートを自動生成します
          </p>
          <form onSubmit={handleResearch} style={{ width: "100%", maxWidth: "560px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: "12px", overflow: "hidden", background: "#fff", border: "2px solid transparent", outline: "none" }}>
              <input
                type="text"
                placeholder="例：トヨタ自動車、Apple、ソフトバンク..."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{ border: "none", borderRadius: 0, fontSize: "1.05rem", padding: "0.9rem 1.2rem", boxShadow: "none", flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={!companyName.trim()}
                style={{ borderRadius: 0, padding: "0 1.5rem", fontSize: "1rem" }}>
                調査開始
              </button>
            </div>
          </form>
          {/* クイック例 */}
          <div style={{ marginTop: "1.2rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            {["トヨタ自動車", "Apple", "ソフトバンク", "任天堂", "Sony"].map((name) => (
              <button key={name} onClick={() => setCompanyName(name)}
                style={{ background: "#f0f4f8", border: "1px solid #e5e7eb", borderRadius: "20px", padding: "0.3rem 0.9rem", fontSize: "0.85rem", cursor: "pointer", color: "#1e3a5f", fontWeight: 500 }}>
                {name}
              </button>
            ))}
          </div>
          <Link href="/reports" style={{ marginTop: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            過去のレポートを見る →
          </Link>
        </div>
      )}

      <div className="container" style={{ paddingBottom: "3rem" }}>
        {/* 検索フォーム（結果表示中） */}
        {(report || loading) && (
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <form onSubmit={handleResearch} style={{ display: "flex", gap: "0.75rem" }}>
              <input type="text" placeholder="企業名を入力（例：任天堂、Apple、ソフトバンク）"
                value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={loading} />
              {loading
                ? <button type="button" className="btn btn-secondary" onClick={() => abortRef.current?.abort()}>停止</button>
                : <button type="submit" className="btn btn-primary" disabled={!companyName.trim()}>調査開始</button>}
            </form>
          </div>
        )}

        {loading && !report && (
          <div className="card" style={{ display: "flex", gap: "0.75rem", alignItems: "center", color: "var(--text-muted)" }}>
            <div className="spinner" style={{ borderColor: "rgba(0,0,0,0.15)", borderTopColor: "var(--primary)" }} />
            AIがWeb検索中です...しばらくお待ちください（1〜2分）
          </div>
        )}

        {error && <div className="error-box" style={{ marginBottom: "1rem" }}>{error}</div>}

        {sections.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "1.5rem", alignItems: "start" }}>
            {/* メイン */}
            <div>
              {/* タイトルバー */}
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "1rem", overflow: "hidden" }}>
                <div style={{ background: "#1e3a5f", color: "#fff", padding: "0.9rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>{companyName}</h2>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => window.print()} style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "none", borderRadius: "6px", padding: "0.35rem 0.75rem", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}>
                      🖨 印刷
                    </button>
                    <button onClick={copyAll} style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "none", borderRadius: "6px", padding: "0.35rem 0.75rem", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}>
                      📋 全体コピー
                    </button>
                    {savedId && (
                      <Link href={`/reports/${savedId}`} style={{ background: "rgba(255,255,255,0.18)", color: "#fff", borderRadius: "6px", padding: "0.35rem 0.75rem", fontSize: "0.8rem", textDecoration: "none", fontWeight: 600 }}>
                        保存済み →
                      </Link>
                    )}
                  </div>
                </div>
                <div style={{ padding: "0.4rem 1rem 0", borderBottom: "1px solid #e5e7eb", display: "flex" }}>
                  <div style={{ padding: "0.5rem 0.8rem", fontSize: "0.88rem", fontWeight: 700, borderBottom: "2px solid #1e3a5f", color: "#1e3a5f" }}>
                    📄 企業調査レポート
                  </div>
                </div>
                <div style={{ padding: "0.5rem 1rem", display: "flex", gap: "1rem", fontSize: "0.82rem" }}>
                  <button onClick={expandAll} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", padding: 0 }}>すべて展開</button>
                  <span style={{ color: "#d1d5db" }}>|</span>
                  <button onClick={collapseAll} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", padding: 0 }}>すべて折りたたむ</button>
                </div>
              </div>

              {/* セクション */}
              {sections.map((sec, i) => (
                <div key={i} style={{ marginBottom: "0.6rem", borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                  <button
                    onClick={() => { toggle(i); setActiveSection(i); }}
                    style={{
                      width: "100%", textAlign: "left", padding: "0.85rem 1.2rem",
                      background: openSections[i] ? SECTION_COLORS[i % SECTION_COLORS.length] : "#fff",
                      color: openSections[i] ? "#fff" : "#1e3a5f",
                      border: "none", cursor: "pointer",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      fontWeight: 700, fontSize: "0.92rem",
                    }}
                  >
                    <span>{i + 1}. {sec.title}</span>
                    <span>{openSections[i] ? "▲" : "▼"}</span>
                  </button>
                  {openSections[i] && (
                    <div style={{ padding: "1.2rem 1.4rem", background: "#fff" }}>
                      <div className="markdown-body">
                        <ReactMarkdown>{sec.content}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && report && (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "var(--text-muted)", padding: "0.5rem" }}>
                  <div className="spinner" style={{ borderColor: "rgba(0,0,0,0.15)", borderTopColor: "var(--primary)" }} />
                  生成中...
                </div>
              )}
            </div>

            {/* サイドバー */}
            <div style={{ position: "sticky", top: "1rem" }}>
              <div className="card" style={{ padding: "1rem" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 0.75rem", letterSpacing: "0.05em" }}>セクション</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {sections.map((sec, i) => (
                    <li key={i} style={{ marginBottom: "0.45rem" }}>
                      <button
                        onClick={() => { setActiveSection(i); setOpenSections((p) => ({ ...p, [i]: true })); }}
                        style={{
                          background: "none", border: "none", cursor: "pointer", padding: "0.15rem 0",
                          display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", textAlign: "left",
                          fontSize: "0.82rem",
                          color: activeSection === i ? SECTION_COLORS[i % SECTION_COLORS.length] : "var(--text-muted)",
                          fontWeight: activeSection === i ? 700 : 400,
                        }}
                      >
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: SECTION_COLORS[i % SECTION_COLORS.length], flexShrink: 0 }} />
                        {sec.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

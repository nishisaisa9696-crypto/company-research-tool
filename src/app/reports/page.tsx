import { supabase, type Report } from "@/lib/supabase";
import Link from "next/link";

export const revalidate = 0;

async function getReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("id, company_name, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return [];
  return data as Report[];
}

export default async function ReportsPage() {
  const reports = await getReports();

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
      <header style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800 }}>過去のレポート一覧</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.2rem" }}>
            合計 {reports.length} 件
          </p>
        </div>
        <Link href="/" className="btn btn-primary">
          新規調査
        </Link>
      </header>

      {reports.length === 0 ? (
        <div className="card" style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>
          まだレポートがありません。トップページから企業を調査してください。
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {reports.map((r) => (
            <Link
              key={r.id}
              href={`/reports/${r.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                className="card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "box-shadow 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
              >
                <span style={{ fontWeight: 600 }}>{r.company_name}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  {new Date(r.created_at).toLocaleString("ja-JP")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

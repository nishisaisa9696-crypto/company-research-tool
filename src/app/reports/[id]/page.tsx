import { supabase, type Report } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getReport(id: string): Promise<Report | null> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Report;
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) notFound();

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
        <Link href="/">トップへ</Link>
        <Link href="/reports">一覧へ</Link>
      </div>

      <div className="card">
        <div style={{ marginBottom: "1.2rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800 }}>{report.company_name} 調査レポート</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
            作成日時: {new Date(report.created_at).toLocaleString("ja-JP")}
          </p>
        </div>
        <div className="report-body">{report.report_content}</div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "企業調査レポートツール",
  description: "企業名を入力するだけで、AIがWeb検索して詳細な調査レポートを自動生成します",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

-- 企業調査レポートテーブル
-- Supabase の SQL エディターで実行してください

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  report_content text not null,
  created_at timestamptz not null default now()
);

-- 作成日時で降順インデックス（一覧取得を高速化）
create index if not exists reports_created_at_idx on reports (created_at desc);

-- Row Level Security を有効化（必要に応じて認証ポリシーを追加）
alter table reports enable row level security;

-- 全員が読み書きできるポリシー（開発用）
-- 本番では認証ユーザーのみに制限することを推奨
create policy "Allow all" on reports for all using (true) with check (true);

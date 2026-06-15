import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import { NextRequest } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const { companyName } = await req.json();

  if (!companyName || typeof companyName !== "string") {
    return Response.json({ error: "企業名を入力してください" }, { status: 400 });
  }

  const prompt = `
以下の企業について、Web検索を使って詳細に調査し、日本語で構造化されたレポートを作成してください。

企業名: ${companyName}

レポートには以下の項目を含めてください：

## 1. 企業概要
- 正式名称、設立年、本社所在地
- 事業内容・主要サービス/製品
- 従業員数、グループ会社

## 2. 財務・決算情報
- 直近の売上高・営業利益・純利益
- 時価総額（上場企業の場合）
- 財務の主なトレンド

## 3. 最新ニュース・動向
- 直近6ヶ月の主要ニュース
- 新製品・新サービス・M&A情報

## 4. 競合・業界ポジション
- 主要競合他社
- 市場シェア・業界内の位置付け

## 5. 今後の展望
- 中期経営計画・成長戦略
- リスク要因

可能な限り具体的な数値やデータを含めてください。情報が見つからない場合はその旨を記載してください。
  `.trim();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullReport = "";

      try {
        const response = await anthropic.messages.create({
          model: "claude-opus-4-8",
          max_tokens: 8000,
          tools: [
            {
              type: "web_search_20250305" as const,
              name: "web_search",
            },
          ],
          messages: [{ role: "user", content: prompt }],
        });

        for (const block of response.content) {
          if (block.type === "text") {
            fullReport += block.text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk: block.text })}\n\n`)
            );
          }
        }

        // Supabaseに保存
        const { data, error } = await supabase
          .from("reports")
          .insert({ company_name: companyName, report_content: fullReport })
          .select("id")
          .single();

        if (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "保存に失敗しました: " + error.message })}\n\n`
            )
          );
        } else {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, reportId: data.id })}\n\n`)
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "不明なエラー";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

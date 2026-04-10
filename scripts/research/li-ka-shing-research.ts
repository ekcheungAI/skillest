#!/usr/bin/env tsx
/**
 * li-ka-shing-research.ts
 *
 * 专门针对李嘉诚的深度研究脚本：
 * 1. CK Hutchison 2025 年报 + 分析师会议全文
 * 2. Li Ka Shing Foundation 官网
 * 3. Shantou 毕业典礼演讲全文
 * 4. Victor Li 相关内容
 * 5. 长江商学院相关讲话
 */

try {
  const { readFileSync } = await import("fs");
  const { resolve, dirname } = await import("path");
  const { fileURLToPath } = await import("url");
  const thisFile = fileURLToPath(import.meta.url);
  const envPath = resolve(dirname(thisFile), "../../.env");
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* no .env */ }

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

// ─── Firecrawl 工具函数 ──────────────────────��─────────────────────────────────

async function scrapePage(
  apiKey: string,
  url: string,
  formats: ("markdown" | "html" | "json" | "extract")[] = ["markdown"]
): Promise<{ url: string; title: string; markdown: string; statusCode: number; creditsUsed: number }> {
  const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats,
      onlyMainContent: true,
      timeout: 60000,
    }),
  });

  const data = await res.json();

  if (!data.success) {
    return {
      url,
      title: "",
      markdown: "",
      statusCode: data.statusCode || 0,
      creditsUsed: 0,
    };
  }

  return {
    url,
    title: data.data?.metadata?.title || "",
    markdown: data.data?.markdown || "",
    statusCode: data.data?.metadata?.statusCode || 200,
    creditsUsed: data.data?.metadata?.creditsUsed || 0,
  };
}

async function deepResearch(
  apiKey: string,
  topic: string,
  options: { recencyDays?: number; limit?: number } = {}
): Promise<any> {
  const { recencyDays = 365, limit = 20 } = options;

  const res = await fetch(`${FIRECRAWL_BASE}/deep-research`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      recencyDays,
      limit,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firecrawl deep-research error ${res.status}: ${text}`);
  }

  return res.json();
}

// ─── 研究目标列表 ──────────────────────────────────────────────────────────────

interface ResearchTarget {
  url: string;
  label: string;
  priority: "high" | "medium" | "low";
  reason: string;
}

const targets: ResearchTarget[] = [
  // 高优先级：CK Hutchison 官方文件
  {
    url: "https://www.ckh.com.hk/en/investors/financial-results.php",
    label: "CK Hutchison 财务业绩页面",
    priority: "high",
    reason: "2025全年业绩公告 + 分析师会议记录"
  },
  {
    url: "https://seekingalpha.com/article/4884947-ck-hutchison-holdings-limited-ckhuy-q4-2025-earnings-call-transcript",
    label: "CK Hutchison Q4 2025 分析师会议全文",
    priority: "high",
    reason: "Victor Li 原话决策风格分析第一手来源"
  },
  {
    url: "https://www.ckh.com.hk/en/esg/esg_message.php",
    label: "CK Hutchison ESG 主席致辞",
    priority: "high",
    reason: "李嘉诚本人撰写的 ESG 理念，框架核心文本"
  },

  // 高优先级：Li Ka Shing Foundation
  {
    url: "https://www.lksf.org/?lang=en",
    label: "Li Ka Shing Foundation 官网",
    priority: "high",
    reason: "慈善哲学 + 第三儿子概念 + 各司法管辖区项目分布"
  },
  {
    url: "https://www.lksf.org/speech-by-mr-li-ka-shing-shantou-university-commencement-ceremony-2013/",
    label: "Shantou 2013 演讲全文",
    priority: "high",
    reason: "Practical Dreamer — 框架形成期关键演讲"
  },
  {
    url: "https://www.lksf.org/to-do-and-to-be/",
    label: "Shantou 2017 演讲全文",
    priority: "high",
    reason: "To Do and To Be — 退休前最后一次重要公开发言"
  },

  // 中优先级：Victor Li 相关
  {
    url: "https://www.ckh.com.hk/en/about/leadership.php",
    label: "CK Hutchison 领导团队页面",
    priority: "medium",
    reason: "Victor Li 独立决策风格 + 与父亲的分工"
  },
  {
    url: "https://www.scmp.com/business/article/3347168/hong-kongs-ck-hutchison-reports-7-gain-underlying-profit-amid-unforeseen-challenges",
    label: "SCMP CK Hutchison 2026 业绩报道",
    priority: "medium",
    reason: "Victor Li 在实际压力下的决策记录"
  },
  {
    url: "https://asia.nikkei.com/business/companies/ck-hutchison-vows-to-use-great-war-chest-of-cash-as-profits-show-strain",
    label: "Nikkei Asia 战争基金报道",
    priority: "medium",
    reason: "Victor Li 'great war chest' 话术原文"
  },

  // 中优先级：历史关键节点
  {
    url: "https://en.wikipedia.org/wiki/Li_Ka-shing",
    label: "Wikipedia 李嘉诚页面",
    priority: "medium",
    reason: "历史时间线交叉验证 + 早年关键决策"
  },
  {
    url: "https://en.wikipedia.org/wiki/CK_Hutchison_Holdings",
    label: "Wikipedia CK Hutchison 页面",
    priority: "medium",
    reason: "公司历史 + 主要收购时间线"
  },

  // 低优先级：补充来源
  {
    url: "https://medium.com/@GlobalTimesSingapore/superman-traitor-or-visionary-the-enduring-enigma-of-li-ka-shing-d0b59aba0f22",
    label: "Global Times 李嘉诚传记文章",
    priority: "low",
    reason: "中期综合评估视角"
  },
];

// ─── 主函数 ──────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.VITE_FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error("❌ VITE_FIRECRAWL_API_KEY 未设置");
    process.exit(1);
  }

  const { writeFileSync, mkdirSync } = await import("fs");
  mkdirSync("scripts/research/data", { recursive: true });
  mkdirSync("scripts/research/output", { recursive: true });

  console.log("🚀 Li Ka-shing 深度研究开始");
  console.log(`📊 目标数量: ${targets.length}`);
  console.log("");

  const results: any[] = [];
  let totalCredits = 0;

  // 按优先级分组并行抓取
  for (const target of targets) {
    const start = Date.now();
    console.log(`[${target.priority.toUpperCase()}] ${target.label}`);
    console.log(`  URL: ${target.url}`);

    try {
      const result = await scrapePage(apiKey, target.url);
      const elapsed = Date.now() - start;

      results.push({
        ...result,
        label: target.label,
        priority: target.priority,
        reason: target.reason,
      });

      totalCredits += result.creditsUsed;

      if (result.statusCode === 200) {
        const chars = result.markdown.length;
        const words = result.markdown.split(/\s+/).length;
        console.log(`  ✅ ${result.statusCode} | ${chars.toLocaleString()} chars / ~${words.toLocaleString()} words | ${result.creditsUsed} credits | ${elapsed}ms`);
        // 打印前80个字符预览
        const preview = result.markdown.replace(/\n+/g, " ").trim().slice(0, 100);
        if (preview) console.log(`  📄 预览: ${preview}...`);
      } else {
        console.log(`  ❌ ${result.statusCode}`);
      }
    } catch (e: any) {
      console.log(`  ❌ 错误: ${e.message}`);
      results.push({
        url: target.url,
        label: target.label,
        priority: target.priority,
        reason: target.reason,
        markdown: "",
        statusCode: 0,
        creditsUsed: 0,
        error: e.message,
      });
    }

    // 避免 API 限流
    await new Promise((r) => setTimeout(r, 500));
    console.log("");
  }

  // 保存原始结果
  const timestamp = new Date().toISOString().slice(0, 10);
  writeFileSync(
    `scripts/research/data/li-ka-shing-corporate-research-${timestamp}.json`,
    JSON.stringify(results, null, 2)
  );

  console.log("═".repeat(60));
  console.log("📊 抓取结果汇总");
  console.log("═".repeat(60));

  const highPriority = results.filter((r) => r.priority === "high" && r.statusCode === 200);
  const mediumPriority = results.filter((r) => r.priority === "medium" && r.statusCode === 200);
  const lowPriority = results.filter((r) => r.priority === "low" && r.statusCode === 200);

  console.log(`\n高优先级: ${highPriority.length}/${targets.filter((t) => t.priority === "high").length} 成功`);
  console.log(`中优先级: ${mediumPriority.length}/${targets.filter((t) => t.priority === "medium").length} 成功`);
  console.log(`低优先级: ${lowPriority.length}/${targets.filter((t) => t.priority === "low").length} 成功`);
  console.log(`总消耗 credits: ~${totalCredits}`);
  console.log(`\n💾 数据保存至: scripts/research/data/li-ka-shing-corporate-research-${timestamp}.json`);

  // 打印关键内容预览
  console.log("\n" + "─".repeat(60));
  console.log("🔍 关键内容预览");
  console.log("─".repeat(60));

  for (const r of results) {
    if (r.statusCode === 200 && r.markdown.length > 200) {
      console.log(`\n📄 ${r.label}`);
      // 提取第一个有意义的段落
      const paragraphs = r.markdown.split(/\n\n+/).filter((p: string) => p.trim().length > 80);
      const firstPara = paragraphs[0]?.trim() || "";
      console.log(`   ${firstPara.slice(0, 200)}...`);
    }
  }
}

main().catch(console.error);

/**
 * Lightweight API test functions — used by Settings page to verify keys.
 * These are minimal calls just to confirm auth + connectivity.
 */

/** Platform options for Kimi */
export const KIMI_PLATFORMS = [
  { id: "international", label: "International", baseUrl: "https://api.moonshot.ai/v1" },
  { id: "china", label: "China (.cn)", baseUrl: "https://api.moonshot.cn/v1" },
];

export interface ApiTestResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
  errorDetail?: string;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const start = performance.now();
  const result = await fn();
  return { result, ms: performance.now() - start };
}

/** Test a Kimi API key by sending a simple 1-turn chat completion. */
export async function testKimiKey(apiKey: string, platform: string = "international"): Promise<ApiTestResult> {
  if (!apiKey.trim()) {
    return { ok: false, message: "No API key provided" };
  }

  const platformConfig = KIMI_PLATFORMS.find((p) => p.id === platform) ?? KIMI_PLATFORMS[0];
  const baseUrl = platformConfig.baseUrl;

  try {
    const { result, ms } = await timed(() =>
      fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: "kimi-k2.6",
          messages: [
            { role: "user", content: "Reply with just the word OK." },
          ],
          max_tokens: 10,
          temperature: 0.1,
        }),
      })
    );

    if (!result.ok) {
      let detail = "";
      try {
        const err = await result.json();
        detail = err.error?.message || err.error?.type || "";
      } catch {
        detail = `HTTP ${result.status}`;
      }
      return {
        ok: false,
        message: `Kimi returned HTTP ${result.status}`,
        latencyMs: Math.round(ms),
        errorDetail: detail,
      };
    }

    const data = await result.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return { ok: false, message: "Kimi returned an empty response", latencyMs: Math.round(ms) };
    }

    return { ok: true, message: `Connected! Model responded: "${content}"`, latencyMs: Math.round(ms) };
  } catch (err) {
    return {
      ok: false,
      message: "Could not reach Kimi API",
      errorDetail: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Test a MiniMax API key by sending a simple 1-turn chat completion. */
export async function testMinimaxKey(apiKey: string): Promise<ApiTestResult> {
  if (!apiKey.trim()) {
    return { ok: false, message: "No API key provided" };
  }

  try {
    const { result, ms } = await timed(() =>
      fetch("https://api.minimax.io/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: "MiniMax-M2.7",
          messages: [
            { role: "user", content: "Reply with just the word OK." },
          ],
          max_tokens: 10,
          temperature: 1.0,
        }),
      })
    );

    if (!result.ok) {
      let detail = "";
      try {
        const err = await result.json();
        detail = err.error?.message || err.error?.type || "";
      } catch {
        detail = `HTTP ${result.status}`;
      }
      return {
        ok: false,
        message: `MiniMax returned HTTP ${result.status}`,
        latencyMs: Math.round(ms),
        errorDetail: detail,
      };
    }

    const data = await result.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return { ok: false, message: "MiniMax returned an empty response", latencyMs: Math.round(ms) };
    }

    return { ok: true, message: `Connected! Model responded: "${content}"`, latencyMs: Math.round(ms) };
  } catch (err) {
    return {
      ok: false,
      message: "Could not reach MiniMax API",
      errorDetail: err instanceof Error ? err.message : String(err),
    };
  }
}

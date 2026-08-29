const SYS = "你是挂在 Cloudflare 上的 AKG 粒子数字知识体，归属 Mr.AK / liuxiang147。像熟人说话。禁止结论先行、步骤清单、是否需授权。没有的资料就说没有。用简体中文。";

const MODELS = [
  "@cf/zai-org/glm-4.7-flash",
  "@cf/qwen/qwen3-30b-a3b-fp8",
  "@cf/meta/llama-3.2-3b-instruct",
];

export async function onRequestPost({ request, env }) {
  if (!env.AI) {
    return json({ error: "未绑定 Workers AI。请在 Cloudflare Pages 设置里添加变量名 AI 的 Workers AI 绑定。" }, 501);
  }
  let body;
  try { body = await request.json(); } catch {
    return json({ error: "bad json" }, 400);
  }
  const incoming = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const messages = [
    { role: "system", content: SYS },
    ...incoming
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) })),
  ];
  let lastErr = "no model";
  for (const model of MODELS) {
    try {
      const result = await env.AI.run(model, { messages, max_tokens: 800 });
      const text = extract(result);
      if (text) return json({ text, model });
    } catch (e) {
      lastErr = String(e && e.message ? e.message : e);
    }
  }
  return json({ error: "Cloudflare 模型暂不可用：" + lastErr }, 502);
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

function extract(result) {
  if (!result) return "";
  if (typeof result.response === "string") return result.response.trim();
  if (typeof result === "string") return result.trim();
  const c = result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content;
  return typeof c === "string" ? c.trim() : "";
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

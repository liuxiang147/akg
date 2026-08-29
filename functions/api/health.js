export async function onRequestGet({ env }) {
  return new Response(JSON.stringify({
    ok: true,
    engine: "cloudflare-workers-ai",
    bound: Boolean(env && env.AI),
  }), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

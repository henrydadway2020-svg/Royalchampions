// GET /api/players
// Devuelve la lista completa de jugadores registrados y si el registro está cerrado.

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

export async function onRequestGet(context) {
  const { env } = context;

  if (!env.RUMBLE_KV) {
    return json({ error: "El almacenamiento (KV) no está configurado en este proyecto de Cloudflare." }, 500);
  }

  const list = await env.RUMBLE_KV.list({ prefix: "player:" });
  const players = [];
  for (const key of list.keys) {
    const val = await env.RUMBLE_KV.get(key.name);
    if (val) {
      try { players.push(JSON.parse(val)); } catch (e) { /* ignore corrupt entry */ }
    }
  }
  players.sort(function (a, b) { return a.createdAt - b.createdAt; });

  const locked = (await env.RUMBLE_KV.get("meta:locked")) === "true";

  return json({ players: players, locked: locked, total: players.length });
}

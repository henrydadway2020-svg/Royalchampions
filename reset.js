// POST /api/reset
// Header: x-admin-token: <RUMBLE_ADMIN_TOKEN>
// Borra todos los jugadores registrados en el servidor y reabre el registro.

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RUMBLE_KV) {
    return json({ error: "El almacenamiento (KV) no está configurado en este proyecto de Cloudflare." }, 500);
  }
  if (!env.RUMBLE_ADMIN_TOKEN) {
    return json({ error: "No se configuró RUMBLE_ADMIN_TOKEN en las variables de entorno." }, 500);
  }

  const token = request.headers.get("x-admin-token") || "";
  if (token !== env.RUMBLE_ADMIN_TOKEN) {
    return json({ error: "No autorizado." }, 401);
  }

  const list = await env.RUMBLE_KV.list({ prefix: "player:" });
  for (const key of list.keys) {
    await env.RUMBLE_KV.delete(key.name);
  }
  await env.RUMBLE_KV.put("meta:locked", "false");

  return json({ ok: true, deleted: list.keys.length });
}

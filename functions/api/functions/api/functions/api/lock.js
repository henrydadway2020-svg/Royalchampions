// POST /api/lock
// Header: x-admin-token: <RUMBLE_ADMIN_TOKEN>
// Body: { locked: true|false }
// Abre o cierra el registro público.

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

  let body;
  try { body = await request.json(); } catch (e) { body = {}; }
  const locked = !!body.locked;

  await env.RUMBLE_KV.put("meta:locked", locked ? "true" : "false");
  return json({ ok: true, locked: locked });
}

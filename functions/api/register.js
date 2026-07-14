// POST /api/register
// Body: { nick: string, whatsapp: string, website?: string (honeypot) }
// Guarda al jugador en Cloudflare KV bajo la clave "player:<id>"

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

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "Solicitud inválida." }, 400);
  }

  const honeypot = (body.website || "").trim();
  if (honeypot) {
    return json({ error: "Solicitud inválida." }, 400);
  }

  const nick = (body.nick || "").trim().slice(0, 30);
  const whatsapp = (body.whatsapp || "").trim().slice(0, 30);

  if (!nick || !whatsapp) {
    return json({ error: "Nick y número de WhatsApp son obligatorios." }, 400);
  }
  if (nick.length < 2) {
    return json({ error: "El nick es demasiado corto." }, 400);
  }
  if (whatsapp.replace(/\D/g, "").length < 8) {
    return json({ error: "El número de WhatsApp no parece válido." }, 400);
  }

  const locked = await env.RUMBLE_KV.get("meta:locked");
  if (locked === "true") {
    return json({ error: "El registro está cerrado. El bracket ya fue generado." }, 403);
  }

  const list = await env.RUMBLE_KV.list({ prefix: "player:" });
  if (list.keys.length >= 64) {
    return json({ error: "Ya se alcanzó el máximo de 64 jugadores." }, 403);
  }

  const nickLower = nick.toLowerCase();
  for (const key of list.keys) {
    const val = await env.RUMBLE_KV.get(key.name);
    if (val) {
      const existing = JSON.parse(val);
      if (existing.nick.toLowerCase() === nickLower) {
        return json({ error: "Ese nick ya está registrado." }, 409);
      }
    }
  }

  const id = crypto.randomUUID();
  const player = { id: id, nick: nick, whatsapp: whatsapp, createdAt: Date.now() };
  await env.RUMBLE_KV.put("player:" + id, JSON.stringify(player));

  return json({ ok: true, player: player, total: list.keys.length + 1 });
}

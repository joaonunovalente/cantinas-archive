export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    if (request.method !== "GET") {
      return withCors(new Response("Method Not Allowed", { status: 405 }));
    }

    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const today = todayISODate();

    if (!date) {
      return withCors(
        new Response(
          `Parâmetro "date" em falta. Usa: ?date=yyyy-mm-dd\nExemplo: ?date=${today}`,
          {
            status: 400,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          }
        )
      );
    }

    if (date === "yyyy-mm-dd") {
      return withCors(
        new Response(
          `Substitui "yyyy-mm-dd" pela data real no formato correto. Exemplo: ?date=${today}`,
          {
            status: 400,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          }
        )
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return withCors(
        new Response(
          `Formato inválido. Usa: ?date=yyyy-mm-dd\nExemplo: ?date=${today}`,
          {
            status: 400,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          }
        )
      );
    }


    const cache = caches.default;
    const cacheKey = new Request(`https://cache.cantinas/${date}`);

    const cached = await cache.match(cacheKey);
    if (cached) {
      return withCors(cached);
    }

    // API da UA exige datetime completo
    const isoDate = `${date}T00:00:00`;

    const upstreamUrl =
      `https://wso2-gw.ua.pt/mysas_mysas/v1/Refeicoes/GetAgendaMenusEntreDatas` +
      `?inicio=${encodeURIComponent(isoDate)}` +
      `&fim=${encodeURIComponent(isoDate)}`;

    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" }
    });

    if (!upstream.ok) {
      return withCors(
        new Response(await upstream.text(), { status: upstream.status })
      );
    }

    const body = await upstream.text();

    // Falha cedo se vier lixo
    try {
      JSON.parse(body);
    } catch {
      return withCors(
        new Response("Invalid JSON from upstream", { status: 502 })
      );
    }

    const response = new Response(body, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400"
      }
    });

    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return withCors(response);
  }
};

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
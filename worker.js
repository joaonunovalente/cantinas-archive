export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors()
      });
    }

    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    if (!date) {
      return withCors(new Response("Missing date", { status: 400 }));
    }

    const target =
      `https://wso2-gw.ua.pt/mysas_mysas/v1/Refeicoes/GetAgendaMenusEntreDatas?inicio=${date}&fim=${date}`;

    const cache = caches.default;
    const cacheKey = new Request(`https://cache.cantinas/${date}`);

    let response = await cache.match(cacheKey);
    if (response) {
      response.headers.set("X-Cache", "HIT");
      return withCors(response);
    }

    response = await fetch(target, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      return withCors(
        new Response("Erro ao buscar menus", { status: response.status })
      );
    }

    const cached = new Response(response.body, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=604800"
      }
    });

    await cache.put(cacheKey, cached.clone());
    cached.headers.set("X-Cache", "MISS");

    return withCors(cached);
  }
};

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept"
  };
}

function withCors(res) {
  const headers = new Headers(res.headers);
  Object.entries(cors()).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
}

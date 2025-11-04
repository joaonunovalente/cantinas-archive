export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    if (!date) return new Response("Missing date", { status: 400 });

    const target = `https://wso2-gw.ua.pt/mysas_mysas/v1/Refeicoes/GetAgendaMenusEntreDatas?inicio=${date}&fim=${date}`;
    const cache = caches.default;
    const cacheKey = new Request(target);

    // Try cache
    let response = await cache.match(cacheKey);
    if (response) {
      response.headers.set("X-Cache", "HIT");
      return response;
    }

    // Fetch from API
    response = await fetch(target);
    if (!response.ok)
      return new Response("Erro ao buscar menus", { status: response.status });

    // Cache for 7 days
    const newRes = new Response(response.body, response);
    newRes.headers.set("Cache-Control", "public, max-age=604800");
    await cache.put(cacheKey, newRes.clone());

    newRes.headers.set("X-Cache", "MISS");
    return newRes;
  },
};

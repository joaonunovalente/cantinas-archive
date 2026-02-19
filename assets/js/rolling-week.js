document.addEventListener("DOMContentLoaded", () => {
  let selectedCanteen = "Santiago";

  const canteenMap = {
    "tab-santiago": "Santiago",
    "tab-crasto": "Crasto",
    "tab-grelhados": "Grelhados",
    "tab-estga": "ESTGA",
    "tab-restaurante": "Restaurante Universitário",
  };

  const weekdayNames = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  function formatDate(date) {
    return date.toISOString().split("T")[0];
  }

  function getRollingDate(offset) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d;
  }

  function getDayLabel(date) {
    return weekdayNames[date.getDay()];
  }

  function groupByPeriod(data) {
    return data.reduce((acc, item) => {
      if (!acc[item.Periodo]) acc[item.Periodo] = [];
      acc[item.Periodo].push(item);
      return acc;
    }, {});
  }

  function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
  }

  function normalizeString(str) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function generateMenuHTML(items) {
    if (!items || items.length === 0) return "";

    let html = "";
    const soups = new Set();

    items.forEach((i) =>
      i.Componentes.forEach((c) => {
        if (c.TipoString === "Sopa") soups.add(capitalize(c.Nome));
      }),
    );

    if (soups.size) {
      html += `<p><strong>Sopa</strong>: ${[...soups].join("; ")}</p>`;
    }

    items.forEach((item) => {
      const pratos = item.Componentes.filter((c) => c.TipoString === "Prato");
      if (!pratos.length) return;

      let label = "Prato";
      const n = item.Nome.toUpperCase();
      let isOpcao = n.includes("(OPÇÃO)");

      if (n.includes("CARNE")) label = "Carne";
      else if (n.includes("PEIXE")) label = "Peixe";
      else if (n.includes("DIETA")) label = "Dieta";
      else if (n.includes("VEGETARIANO")) label = "Vegetariano";

      if (isOpcao) label += " (opção)";

      html += `<p><strong>${label}</strong>: ${pratos.map((p) => capitalize(p.Nome)).join("; ")}</p>`;
    });

    return html;
  }

  async function loadWeek() {
    const blocks = [...document.querySelectorAll(".day-block")];
    const normalizedSelected = normalizeString(selectedCanteen);

    let offset = 0;
    let stopLoading = false;

    for (let block of blocks) {
      if (stopLoading) {
        block.style.display = "none";
        continue;
      }

      const lunchEl = block.querySelector(".lunch");
      const dinnerEl = block.querySelector(".dinner");
      const titleEl = block.querySelector(".section-title");

      const date = getRollingDate(offset);
      titleEl.textContent = getDayLabel(date);

      try {
        const response = await fetch(
          `https://api.cantinas.pt/?date=${formatDate(date)}`,
        );
        const data = await response.json();

        // Se não existir qualquer ementa para nenhuma cantina → parar tudo
        if (!data || data.length === 0) {
          stopLoading = true;
          block.style.display = "none";
          continue;
        }

        block.style.display = "";

        // Filtrar refeições da cantina selecionada
        const meals = data.filter((m) =>
          m.Refeitorios.some((r) => normalizeString(r) === normalizedSelected),
        );

        const grouped = groupByPeriod(meals);

        // Almoço
        lunchEl.innerHTML = grouped["Almoço"]
          ? generateMenuHTML(grouped["Almoço"])
          : "<p>Encontra-se encerrado.</p>";

        // Jantar
        dinnerEl.innerHTML = grouped["Jantar"]
          ? generateMenuHTML(grouped["Jantar"])
          : "<p>Encontra-se encerrado.</p>";
      } catch (err) {
        block.style.display = "none";
        stopLoading = true;
      }

      offset++;
    }
  }

  // Mudança de separador
  document.querySelectorAll('[data-bs-toggle="pill"]').forEach((tab) => {
    tab.addEventListener("shown.bs.tab", (e) => {
      selectedCanteen = canteenMap[e.target.id] || "Santiago";
      loadWeek();
    });
  });

  loadWeek();
});

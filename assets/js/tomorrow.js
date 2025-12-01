document.addEventListener("DOMContentLoaded", () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = tomorrow.toISOString().split("T")[0];
  const url = `https://little-lab-21a3.long-wildflower-846d.workers.dev/?date=${date}`;

  const canteenMap = {
    "Santiago": "Santiago",
    "ESTGA": "ESTGA",
    "Crasto": "Crasto",
    "Restaurante Universitário": "Restaurante Universitário",
    "Grelhados": "Grelhados"
  };

  // Animate only while loading
  const loadingIntervals = new Map();

  document.querySelectorAll(".item-desc").forEach(el => {
    if (el.textContent.includes("A carregar a ementa de amanhã")) {
      let dots = 1;
      const interval = setInterval(() => {
        el.textContent = "A carregar a ementa de amanhã" + ".".repeat(dots);
        dots = (dots % 3) + 1;
      }, 800);
      loadingIntervals.set(el, interval);
    }
  });

  function stopLoadingAnimation(el) {
    if (loadingIntervals.has(el)) {
      clearInterval(loadingIntervals.get(el));
      loadingIntervals.delete(el);
    }
  }

  function groupByPeriod(data) {
    return data.reduce((acc, item) => {
      const key = item.Periodo;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }

  function capitalizeFirstLetter(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  function generateMenuHTML(items) {
    if (!items || items.length === 0) {
      return "<p class='item-desc mb-0'>Não existem dados disponíveis.</p>";
    }

    const groupedByNome = items.reduce((acc, item) => {
      acc[item.Nome] = item.Componentes;
      return acc;
    }, {});

    let html = "";

    const allSoups = [];
    Object.values(groupedByNome).forEach(componentes => {
      componentes.forEach(c => {
        if (c.TipoString === "Sopa") {
          const soupName = capitalizeFirstLetter(c.Nome);
          if (!allSoups.includes(soupName)) {
            allSoups.push(soupName);
          }
        }
      });
    });

    if (allSoups.length > 0) {
      html += `<p><strong>Sopa</strong>: ${allSoups.join("; ")}</p>`;
    }

    Object.entries(groupedByNome).forEach(([nome, componentes]) => {
      let typeLabel;
      const nomeUpper = nome.toUpperCase();

      let isOpcao = nomeUpper.includes("(OPÇÃO)");

      if (nomeUpper.includes("CARNE")) typeLabel = "Carne";
      else if (nomeUpper.includes("PEIXE")) typeLabel = "Peixe";
      else if (nomeUpper.includes("DIETA")) typeLabel = "Dieta";
      else if (nomeUpper.includes("VEGETARIANO")) typeLabel = "Vegetariano";
      else typeLabel = "Prato";

      if (isOpcao) typeLabel += " (opção)";


      const pratos = componentes.filter(c => c.TipoString === "Prato");
      if (pratos.length > 0) {
        html += `<p><strong>${typeLabel}</strong>: ${pratos.map(p => capitalizeFirstLetter(p.Nome)).join("; ")}</p>`;
      }
    });

    return html;
  }

  fetch(url)
    .then(res => res.json())
    .then(data => {
      // Handle empty or invalid data
      if (!Array.isArray(data) || data.length === 0) {
        document.querySelectorAll(".item-desc").forEach(el => {
          stopLoadingAnimation(el);
          el.textContent = "Não existem dados disponíveis.";
        });
        console.warn("Sem dados recebidos da API.");
        return;
      }

      Object.entries(canteenMap).forEach(([tabName, refeitorio]) => {
        // Filter meals belonging to this canteen
        const canteenMeals = data.filter(entry => entry.Refeitorios.includes(refeitorio));

        // Group by "Almoço" and "Jantar"
        const grouped = groupByPeriod(canteenMeals);

        // Determine correct pane id
        const paneId = (tabName === "Restaurante Universitário") ? "restaurante" : tabName.toLowerCase();

        // Selectors for lunch and dinner
        const lunchDiv = document.querySelector(`#pane-${paneId} .col-md-6:first-child .item-desc`);
        const dinnerDiv = document.querySelector(`#pane-${paneId} .col-md-6:last-child .item-desc`);

        // Fill lunch section
        if (lunchDiv) {
          stopLoadingAnimation(lunchDiv);
          lunchDiv.innerHTML = generateMenuHTML(grouped["Almoço"]);
        }

        // Fill dinner section
        if (dinnerDiv) {
          stopLoadingAnimation(dinnerDiv);
          dinnerDiv.innerHTML = generateMenuHTML(grouped["Jantar"]);
        }
      });
    })
    .catch(err => {
      console.error("Erro ao carregar as ementas:", err);
      document.querySelectorAll(".item-desc").forEach(el => {
        stopLoadingAnimation(el);
        el.textContent = "Erro ao carregar os dados.";
      });
    });
});

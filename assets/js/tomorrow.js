document.addEventListener("DOMContentLoaded", () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = tomorrow.toISOString().split("T")[0];
  const url = `https://api.cantinas.pt/?date=${date}`;

  const canteenMap = {
    "Santiago": "Santiago",
    "ESTGA": "ESTGA",
    "Crasto": "Crasto",
    "Restaurante Universitário": "Restaurante Universitário",
    "Grelhados": "Grelhados"
  };

  const loadingIntervals = new Map();

  document.querySelectorAll(".item-desc").forEach(el => {
    if (el.textContent.includes("A carregar a ementa")) {
      let dots = 1;
      const interval = setInterval(() => {
        el.textContent = "A carregar a ementa" + ".".repeat(dots);
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
      return "<p class='item-desc mb-0'>Encontra-se encerrado.</p>";
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

  function fallbackMenuTomorrowHTML() {
    return `
      <p><strong>Sopa</strong>: Creme de Abóbora</p>
      <p><strong>Peixe</strong>: Bacalhau à Brás; Filetes de Salmão Grelhado</p>
      <p><strong>Dieta</strong>: Peito de Frango Grelhado com Legumes</p>
      <p><strong>Carne</strong>: Bife de Vaca com Arroz de Feijão</p>
      <p><strong>Vegetariano</strong>: Esparguete com Molho de Tomate e Manjericão</p>
    `;
  }

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        document.querySelectorAll(".item-desc").forEach(el => {
          stopLoadingAnimation(el);
          el.textContent = "Não existem dados disponíveis.";
        });
        return;
      }

      Object.entries(canteenMap).forEach(([tabName, refeitorio]) => {
        const canteenMeals = data.filter(entry => entry.Refeitorios.includes(refeitorio));

        if (canteenMeals.length === 0) {
          const paneId = (tabName === "Restaurante Universitário") ? "restaurante" : tabName.toLowerCase();

          const lunchDiv = document.querySelector(`#pane-${paneId} .col-md-6:first-child .item-desc`);
          const dinnerDiv = document.querySelector(`#pane-${paneId} .col-md-6:last-child .item-desc`);

          if (lunchDiv) {
            stopLoadingAnimation(lunchDiv);
            lunchDiv.innerHTML = "<p class='item-desc mb-0'>Encontra-se encerrado.</p>";
          }
          if (dinnerDiv) {
            stopLoadingAnimation(dinnerDiv);
            dinnerDiv.innerHTML = "<p class='item-desc mb-0'>Encontra-se encerrado.</p>";
          }

          return;
        }

        const grouped = groupByPeriod(canteenMeals);

        const paneId = (tabName === "Restaurante Universitário") ? "restaurante" : tabName.toLowerCase();

        const lunchDiv = document.querySelector(`#pane-${paneId} .col-md-6:first-child .item-desc`);
        const dinnerDiv = document.querySelector(`#pane-${paneId} .col-md-6:last-child .item-desc`);

        if (lunchDiv) {
          stopLoadingAnimation(lunchDiv);
          lunchDiv.innerHTML = generateMenuHTML(grouped["Almoço"]);
        }

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
         el.textContent = "Erro ao carregar as ementas.";
      });
    });
});

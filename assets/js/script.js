document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split("T")[0];
    const url = `https://little-lab-21a3.long-wildflower-846d.workers.dev/?date=${today}`;

    const canteenMap = {
        "Santiago": "Santiago",
        "ESTGA": "ESTGA",
        "Crasto": "Crasto",
        "Restaurante Universitário": "Restaurante Universitário",
        "Grelhados": "Grelhados"
    };

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
            return "<p class='item-desc mb-0'>Não existes dados disponíveis.</p>";
        }

        // Group by Nome (e.g., PRATO CARNE, PRATO PEIXE, etc.)
        const groupedByNome = items.reduce((acc, item) => {
            acc[item.Nome] = item.Componentes;
            return acc;
        }, {});

        let html = "";

        // Collect all soups once from all groups, capitalize first letter and unique
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

        // Output soups once at the top if any
        if (allSoups.length > 0) {
            html += `<p><strong>Sopa</strong>: ${allSoups.join("; ")}</p>`;
        }

        // Then output other categories grouped by Nome
        Object.entries(groupedByNome).forEach(([nome, componentes]) => {
            let typeLabel = null;
            const nomeUpper = nome.toUpperCase();

            if (nomeUpper.includes("CARNE")) typeLabel = "Carne";
            else if (nomeUpper.includes("PEIXE")) typeLabel = "Peixe";
            else if (nomeUpper.includes("DIETA")) typeLabel = "Dieta";
            else if (nomeUpper.includes("VEGETARIANO")) typeLabel = "Vegetariano";
            else typeLabel = "Prato";

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
            Object.entries(canteenMap).forEach(([tabName, refeitorio]) => {
                // Filter meals belonging to this canteen
                const canteenMeals = data.filter(entry => entry.Refeitorios.includes(refeitorio));

                // Group by "Almoço" and "Jantar"
                const grouped = groupByPeriod(canteenMeals);

                // Special case for Restaurante Universitário pane ID
                const paneId = (tabName === "Restaurante Universitário") ? "restaurante" : tabName.toLowerCase();

                // Fill in the Lunch section
                const lunchDiv = document.querySelector(`#pane-${paneId} .col-md-6:first-child .item-desc`);
                if (lunchDiv) lunchDiv.innerHTML = generateMenuHTML(grouped["Almoço"]);

                // Fill in the Dinner section
                const dinnerDiv = document.querySelector(`#pane-${paneId} .col-md-6:last-child .item-desc`);
                if (dinnerDiv) dinnerDiv.innerHTML = generateMenuHTML(grouped["Jantar"]);
            });
        })
        .catch(err => {
            console.error("Erro a carregar os ménus:", err);
        });
});

document.addEventListener("DOMContentLoaded", () => {

	let selectedCanteen = "Santiago";

	const canteenMap = {
		"tab-santiago": "Santiago",
		"tab-crasto": "Crasto",
		"tab-grelhados": "Grelhados",
		"tab-estga": "ESTGA",
		"tab-restaurante": "Restaurante Universitário"
	};

	const loadingIntervals = new Map();

	function startLoadingAnimation(el) {
		let dots = 1;
		if (loadingIntervals.has(el)) return; // já a animar
		const interval = setInterval(() => {
			el.textContent = "A carregar a ementa de amanhã" + ".".repeat(dots);
			dots = (dots % 3) + 1;
		}, 800);
		loadingIntervals.set(el, interval);
	}

	function stopLoadingAnimation(el) {
		if (loadingIntervals.has(el)) {
			clearInterval(loadingIntervals.get(el));
			loadingIntervals.delete(el);
		}
	}

	function getMonday(date) {
		const d = new Date(date);
		const day = (d.getDay() + 6) % 7;
		d.setDate(d.getDate() - day);
		d.setHours(0, 0, 0, 0);
		return d;
	}

	function formatDate(date) {
		return date.toISOString().split("T")[0];
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

	function generateMenuHTML(items) {
		if (!items || items.length === 0) {
			return "<p>Encontra-se encerrado.</p>";
		}

		let html = "";
		const soups = new Set();

		items.forEach(i =>
			i.Componentes.forEach(c => {
				if (c.TipoString === "Sopa") soups.add(capitalize(c.Nome));
			})
		);

		if (soups.size) {
			html += `<p><strong>Sopa</strong>: ${[...soups].join("; ")}</p>`;
		}

		items.forEach(item => {
			const pratos = item.Componentes.filter(c => c.TipoString === "Prato");
			if (!pratos.length) return;

			let label = "Prato";
			const n = item.Nome.toUpperCase();

			if (n.includes("CARNE")) label = "Carne";
			else if (n.includes("PEIXE")) label = "Peixe";
			else if (n.includes("DIETA")) label = "Dieta";
			else if (n.includes("VEGETARIANO")) label = "Vegetariano";

			html += `<p><strong>${label}</strong>: ${pratos.map(p => capitalize(p.Nome)).join("; ")}</p>`;
		});

		return html;
	}

	function normalizeString(str) {
		return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
	}

	function loadWeek() {
		const monday = getMonday(new Date());

		document.querySelectorAll(".day-block").forEach(block => {

			const lunchEl = block.querySelector(".lunch");
			const dinnerEl = block.querySelector(".dinner");

			// Começar animação
			startLoadingAnimation(lunchEl);
			startLoadingAnimation(dinnerEl);

			lunchEl.style.display = "";
			dinnerEl.style.display = "";

			const dayOffset = Number(block.dataset.day);
			const date = new Date(monday);
			date.setDate(monday.getDate() + dayOffset);

			fetch(`https://api.cantinas.pt/?date=${formatDate(date)}`)
				.then(r => r.json())
				.then(data => {

					const normalizedSelected = normalizeString(selectedCanteen);

					const meals = data.filter(m =>
						m.Refeitorios.some(r => normalizeString(r) === normalizedSelected)
					);

					stopLoadingAnimation(lunchEl);
					stopLoadingAnimation(dinnerEl);

					if (!meals.length) {
						lunchEl.innerHTML = "<p>Encontra-se encerrado.</p>";
						dinnerEl.innerHTML = "<p>Encontra-se encerrado.</p>";
						return;
					}

					const grouped = groupByPeriod(meals);

					// Almoço
					if (grouped["Almoço"] && grouped["Almoço"].length > 0) {
						lunchEl.innerHTML = generateMenuHTML(grouped["Almoço"]);
					} else {
						lunchEl.innerHTML = "<p>Encontra-se encerrado.</p>";
					}

					// Jantar
					if (grouped["Jantar"] && grouped["Jantar"].length > 0) {
						dinnerEl.innerHTML = generateMenuHTML(grouped["Jantar"]);
					} else {
						dinnerEl.innerHTML = "<p>Encontra-se encerrado.</p>";
					}

				})
				.catch(() => {
					stopLoadingAnimation(lunchEl);
					stopLoadingAnimation(dinnerEl);
					lunchEl.textContent = "Erro ao carregar as ementas.";
					dinnerEl.textContent = "Erro ao carregar as ementas.";
				});
		});
	}

	document.querySelectorAll('[data-bs-toggle="pill"]').forEach(tab => {
		tab.addEventListener("shown.bs.tab", e => {
			const id = e.target.id;
			selectedCanteen = canteenMap[id] || "Santiago";
			loadWeek();
		});
	});

	loadWeek();
});

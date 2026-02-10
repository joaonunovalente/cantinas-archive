document.addEventListener("DOMContentLoaded", () => {

	let selectedCanteen = "Santiago";

	const canteenMap = {
		"tab-santiago": "Santiago",
		"tab-crasto": "Crasto",
		"tab-grelhados": "Grelhados",
		"tab-estga": "ESTGA",
		"tab-restaurante": "Restaurante Universitário"
	};

	const weekdayNames = [
		"Domingo",
		"Segunda-feira",
		"Terça-feira",
		"Quarta-feira",
		"Quinta-feira",
		"Sexta-feira",
		"Sábado"
	];

	const loadingIntervals = new Map();

	function startLoadingAnimation(el) {
		if (loadingIntervals.has(el)) return;
		let dots = 1;
		const i = setInterval(() => {
			el.textContent = "A carregar a ementa" + ".".repeat(dots);
			dots = (dots % 3) + 1;
		}, 800);
		loadingIntervals.set(el, i);
	}

	function stopLoadingAnimation(el) {
		if (!loadingIntervals.has(el)) return;
		clearInterval(loadingIntervals.get(el));
		loadingIntervals.delete(el);
	}

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

	function loadWeek() {

		const blocks = [...document.querySelectorAll(".day-block")];

		blocks.forEach(b => (b.style.display = "none"));

		blocks.forEach((block, index) => {

			const lunchEl = block.querySelector(".lunch");
			const dinnerEl = block.querySelector(".dinner");
			const titleEl = block.querySelector(".section-title");

			const date = getRollingDate(index);
			titleEl.textContent = getDayLabel(date);

			startLoadingAnimation(lunchEl);
			startLoadingAnimation(dinnerEl);

			fetch(`https://api.cantinas.pt/?date=${formatDate(date)}`)
				.then(r => r.json())
				.then(data => {

					const normalizedSelected = normalizeString(selectedCanteen);

					const meals = data.filter(m =>
						m.Refeitorios.some(r => normalizeString(r) === normalizedSelected)
					);

					stopLoadingAnimation(lunchEl);
					stopLoadingAnimation(dinnerEl);

					// 🔑 Só mostra o dia se houver dados
					if (!meals.length) return;

					block.style.display = "";

					const grouped = groupByPeriod(meals);

					lunchEl.innerHTML = grouped["Almoço"]
						? generateMenuHTML(grouped["Almoço"])
						: "<p>Encontra-se encerrado.</p>";

					dinnerEl.innerHTML = grouped["Jantar"]
						? generateMenuHTML(grouped["Jantar"])
						: "<p>Encontra-se encerrado.</p>";
				})
				.catch(() => {
					stopLoadingAnimation(lunchEl);
					stopLoadingAnimation(dinnerEl);
				});
		});
	}

	document.querySelectorAll('[data-bs-toggle="pill"]').forEach(tab => {
		tab.addEventListener("shown.bs.tab", e => {
			selectedCanteen = canteenMap[e.target.id] || "Santiago";
			loadWeek();
		});
	});

	loadWeek();
});

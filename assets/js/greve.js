document.addEventListener("DOMContentLoaded", function () {
    const banner = document.getElementById("alerta-greve");
    const closeBtn = document.getElementById("fechar-alerta");

    // Só mostra se o utilizador ainda não o tiver fechado
    if (localStorage.getItem("greve-fechado") !== "1") {
        banner.style.display = "block";
    }

    closeBtn.addEventListener("click", () => {
        banner.style.display = "none";
        localStorage.setItem("greve-fechado", "1");
    });
});
(function () {
  const target = new Date("2026-05-19T23:00:00Z").getTime();
  const pads = (n) => String(Math.max(0, n)).padStart(2, "0");
  function tick() {
    const diff = Math.max(0, target - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    document.querySelectorAll("[data-countdown]").forEach((el) => {
      el.querySelector("[data-days]").textContent = days;
      el.querySelector("[data-hours]").textContent = pads(hours);
      el.querySelector("[data-minutes]").textContent = pads(minutes);
      el.querySelector("[data-seconds]").textContent = pads(seconds);
    });
  }
  tick();
  setInterval(tick, 1000);

  document.querySelectorAll("[data-open-modal]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      document.querySelector("#open-popup")?.classList.add("open");
    });
  });
  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      document.querySelector("#open-popup")?.classList.remove("open");
    });
  });

  document.querySelector("#open-popup")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) {
      event.currentTarget.classList.remove("open");
    }
  });

  document.querySelectorAll("[data-lead-form]").forEach((form) => {
    form.addEventListener("submit", () => {
      try {
        const data = new FormData(form);
        sessionStorage.setItem("mm101_lead", JSON.stringify(Object.fromEntries(data.entries())));
      } catch (_) {}
    });
  });
})();

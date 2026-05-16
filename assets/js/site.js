(function () {
  const target = new Date("2026-05-19T23:00:00Z").getTime();
  const trackingKeys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid"
  ];
  const pads = (n) => String(Math.max(0, n)).padStart(2, "0");

  function setTimeZoneValue(form) {
    const timeZoneInput = form.querySelector('input[name="time_zone"]');
    if (!timeZoneInput) {
      return;
    }
    try {
      timeZoneInput.value = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch (_) {
      timeZoneInput.value = "";
    }
  }

  function buildPayload(form) {
    const data = new FormData(form);
    const params = new URLSearchParams(window.location.search);
    const firstName = String(data.get("contact[first_name]") || "");
    const email = String(data.get("contact[email]") || "");
    const phoneNumber = String(data.get("contact[phone_number]") || "");
    const timeZone = String(data.get("time_zone") || "");
    const payload = {
      first_name: firstName,
      email,
      phone_number: phoneNumber,
      time_zone: timeZone,
      source: "fbmasterclass",
      page_url: window.location.href,
      page_path: window.location.pathname,
      confirmation_url: form.dataset.successUrl || form.action,
      submitted_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
      "contact[first_name]": firstName,
      "contact[email]": email,
      "contact[phone_number]": phoneNumber
    };

    trackingKeys.forEach((key) => {
      payload[key] = params.get(key) || "";
    });

    return payload;
  }

  function ensureWebhookFrame() {
    let frame = document.querySelector('[data-webhook-frame]');
    if (frame) {
      return frame;
    }

    frame = document.createElement("iframe");
    frame.name = "zapier-webhook-target";
    frame.setAttribute("data-webhook-frame", "true");
    frame.hidden = true;
    frame.tabIndex = -1;
    document.body.appendChild(frame);
    return frame;
  }

  function submitLeadViaForm(webhookUrl, payload) {
    const frame = ensureWebhookFrame();
    const transportForm = document.createElement("form");

    transportForm.action = webhookUrl;
    transportForm.method = "POST";
    transportForm.target = frame.name;
    transportForm.hidden = true;

    Object.entries(payload).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value == null ? "" : String(value);
      transportForm.appendChild(input);
    });

    document.body.appendChild(transportForm);
    transportForm.submit();
    transportForm.remove();
  }
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
    setTimeZoneValue(form);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const webhookUrl = form.dataset.webhookUrl;
      const successUrl = form.dataset.successUrl || form.action;
      const submitButton = form.querySelector('button[type="submit"]');
      const status = form.querySelector("[data-form-status]");
      const originalButtonText = submitButton?.textContent || "";

      if (!webhookUrl) {
        window.location.assign(successUrl);
        return;
      }

      setTimeZoneValue(form);
      const payload = buildPayload(form);

      try {
        sessionStorage.setItem("mm101_lead", JSON.stringify(payload));
      } catch (_) {}

      if (status) {
        status.textContent = "Submitting your registration...";
        status.classList.add("is-pending");
      }
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
      }

      try {
        submitLeadViaForm(webhookUrl, payload);
      } catch (_) {
        if (status) {
          status.textContent = "We couldn't submit your registration. Please try again.";
          status.classList.remove("is-pending");
        }
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
        return;
      }

      window.setTimeout(() => {
        window.location.assign(successUrl);
      }, 600);
    });
  });
})();

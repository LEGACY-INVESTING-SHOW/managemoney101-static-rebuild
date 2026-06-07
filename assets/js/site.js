(function () {
  const target = new Date("2026-06-09T23:00:00Z").getTime();
  const phoneInputInstances = new WeakMap();
  const trackingKeys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid"
  ];
  const trackingStorageKey = "mm101_tracking_params";
  const pads = (n) => String(Math.max(0, n)).padStart(2, "0");

  function readStoredTracking() {
    try {
      const raw = window.localStorage.getItem(trackingStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function writeStoredTracking(values) {
    try {
      window.localStorage.setItem(trackingStorageKey, JSON.stringify(values));
    } catch (_) {}
  }

  function persistTrackingFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const stored = readStoredTracking();
    let hasUpdates = false;

    trackingKeys.forEach((key) => {
      const value = params.get(key);
      if (value) {
        stored[key] = value;
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      stored.landing_page_url = window.location.href;
      stored.landing_page_path = window.location.pathname;
      stored.captured_at = new Date().toISOString();
      writeStoredTracking(stored);
    }

    return stored;
  }

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

  function getInitialCountryFromLocale() {
    const locales = [navigator.language].concat(navigator.languages || []);
    for (const locale of locales) {
      const match = String(locale || "").match(/-([a-z]{2})$/i);
      if (match) {
        return match[1].toLowerCase();
      }
    }
    return "";
  }

  function waitForIntlTelInput(attempts = 20) {
    return new Promise((resolve) => {
      if (typeof window.intlTelInput === "function") {
        resolve(true);
        return;
      }

      if (attempts <= 0) {
        resolve(false);
        return;
      }

      window.setTimeout(() => {
        waitForIntlTelInput(attempts - 1).then(resolve);
      }, 150);
    });
  }

  function setupPhoneInput(form) {
    const phoneInput = form.querySelector("[data-phone-display]");
    if (!phoneInput || typeof window.intlTelInput !== "function") {
      return null;
    }

    const existing = phoneInputInstances.get(phoneInput);
    if (existing) {
      return existing;
    }

    const iti = window.intlTelInput(phoneInput, {
      initialCountry: getInitialCountryFromLocale() || "us",
      separateDialCode: true,
      strictMode: true,
      dropdownParent: document.body
    });

    phoneInputInstances.set(phoneInput, iti);
    return iti;
  }

  function buildPayload(form) {
    const data = new FormData(form);
    const params = new URLSearchParams(window.location.search);
    const storedTracking = readStoredTracking();
    const firstName = String(data.get("contact[first_name]") || "");
    const email = String(data.get("contact[email]") || "");
    const phoneInput = form.querySelector("[data-phone-display]");
    const phoneInstance = phoneInput ? phoneInputInstances.get(phoneInput) : null;
    let phoneNumber = String(data.get("contact[phone_number]") || "");
    const timeZone = String(data.get("time_zone") || "");

    if (phoneNumber && phoneInstance) {
      try {
        if (typeof phoneInstance.isValidNumber === "function" && phoneInstance.isValidNumber()) {
          phoneNumber = phoneInstance.getNumber();
        }
      } catch (_) {}
    }

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
      landing_page_url: storedTracking.landing_page_url || window.location.href,
      landing_page_path: storedTracking.landing_page_path || window.location.pathname,
      tracking_captured_at: storedTracking.captured_at || "",
      "contact[first_name]": firstName,
      "contact[email]": email,
      "contact[phone_number]": phoneNumber
    };

    trackingKeys.forEach((key) => {
      payload[key] = params.get(key) || storedTracking[key] || "";
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
    window.setTimeout(() => {
      transportForm.remove();
    }, 3000);
  }

  function submitLeadViaBeacon(webhookUrl, payload) {
    if (typeof navigator.sendBeacon !== "function") {
      return false;
    }

    const body = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      body.append(key, value == null ? "" : String(value));
    });

    const blob = new Blob([body.toString()], {
      type: "application/x-www-form-urlencoded;charset=UTF-8"
    });

    return navigator.sendBeacon(webhookUrl, blob);
  }

  function storeLeadForTracking(payload) {
    const name = payload.first_name || "";
    const email = payload.email || "";
    const phone = payload.phone_number || "";
    const values = {
      mm101_lead: JSON.stringify(payload),
      name,
      firstName: name,
      firstNameLead: name,
      email,
      emailLead: email,
      phone
    };

    Object.entries(values).forEach(([key, value]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch (_) {}
      try {
        window.sessionStorage.setItem(key, value);
      } catch (_) {}
    });
  }

  function pushRegistrationEvent(payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "mm101_registration_submit",
      first_name: payload.first_name || "",
      email: payload.email || "",
      phone: payload.phone_number || "",
      source: payload.source || "fbmasterclass",
      page_path: payload.page_path || window.location.pathname
    });
  }
  persistTrackingFromUrl();

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
      const hiddenPhoneInput = form.querySelector('input[name="contact[phone_number]"]');
      const phoneInput = form.querySelector("[data-phone-display]");
      const intlReady = await waitForIntlTelInput();
      if (intlReady) {
        setupPhoneInput(form);
      }
      const phoneInstance = phoneInput ? phoneInputInstances.get(phoneInput) : null;

      if (!webhookUrl) {
        window.location.assign(successUrl);
        return;
      }

      setTimeZoneValue(form);

      if (phoneInstance?.promise) {
        try {
          await phoneInstance.promise;
        } catch (_) {}
      }

      if (phoneInput && phoneInput.value.trim() && phoneInstance) {
        let isValidPhone = true;
        try {
          isValidPhone = phoneInstance.isValidNumber();
        } catch (_) {}

        if (!isValidPhone) {
          if (status) {
            status.textContent = "Please enter a valid phone number with the correct country code.";
            status.classList.remove("is-pending");
          }
          phoneInput.focus();
          return;
        }
      }

      if (hiddenPhoneInput) {
        let formattedPhone = phoneInput?.value.trim() || "";
        if (formattedPhone && phoneInstance) {
          try {
            formattedPhone = phoneInstance.getNumber() || formattedPhone;
          } catch (_) {}
        }
        hiddenPhoneInput.value = formattedPhone;
      }

      const payload = buildPayload(form);

      storeLeadForTracking(payload);
      pushRegistrationEvent(payload);

      if (status) {
        status.textContent = "Submitting your registration...";
        status.classList.add("is-pending");
      }
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
      }

      try {
        const sentWithBeacon = submitLeadViaBeacon(webhookUrl, payload);
        if (!sentWithBeacon) {
          submitLeadViaForm(webhookUrl, payload);
        }
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
      }, 1200);
    });
  });

  waitForIntlTelInput().then((isReady) => {
    if (!isReady) {
      return;
    }
    document.querySelectorAll("[data-lead-form]").forEach((form) => {
      setupPhoneInput(form);
    });
  });
})();

(function () {
  const target = new Date("2026-09-06T18:00:00Z").getTime();
  const trackingKeys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
    "gbraid",
    "wbraid"
  ];
  const trackingStorageKey = "mm101_tracking_params";
  const phoneCountryOptions = [
    { iso2: "us", label: "United States", dialCode: "+1" },
    { iso2: "ca", label: "Canada", dialCode: "+1" },
    { iso2: "gb", label: "United Kingdom", dialCode: "+44" },
    { iso2: "au", label: "Australia", dialCode: "+61" },
    { iso2: "nz", label: "New Zealand", dialCode: "+64" },
    { iso2: "ie", label: "Ireland", dialCode: "+353" },
    { iso2: "in", label: "India", dialCode: "+91" },
    { iso2: "sg", label: "Singapore", dialCode: "+65" },
    { iso2: "ae", label: "United Arab Emirates", dialCode: "+971" },
    { iso2: "sa", label: "Saudi Arabia", dialCode: "+966" },
    { iso2: "qa", label: "Qatar", dialCode: "+974" },
    { iso2: "kw", label: "Kuwait", dialCode: "+965" },
    { iso2: "za", label: "South Africa", dialCode: "+27" },
    { iso2: "ng", label: "Nigeria", dialCode: "+234" },
    { iso2: "ke", label: "Kenya", dialCode: "+254" },
    { iso2: "mx", label: "Mexico", dialCode: "+52" },
    { iso2: "br", label: "Brazil", dialCode: "+55" },
    { iso2: "ar", label: "Argentina", dialCode: "+54" },
    { iso2: "cl", label: "Chile", dialCode: "+56" },
    { iso2: "co", label: "Colombia", dialCode: "+57" },
    { iso2: "de", label: "Germany", dialCode: "+49" },
    { iso2: "fr", label: "France", dialCode: "+33" },
    { iso2: "es", label: "Spain", dialCode: "+34" },
    { iso2: "it", label: "Italy", dialCode: "+39" },
    { iso2: "nl", label: "Netherlands", dialCode: "+31" },
    { iso2: "be", label: "Belgium", dialCode: "+32" },
    { iso2: "bg", label: "Bulgaria", dialCode: "+359" },
    { iso2: "se", label: "Sweden", dialCode: "+46" },
    { iso2: "no", label: "Norway", dialCode: "+47" },
    { iso2: "dk", label: "Denmark", dialCode: "+45" },
    { iso2: "ch", label: "Switzerland", dialCode: "+41" },
    { iso2: "pl", label: "Poland", dialCode: "+48" },
    { iso2: "pt", label: "Portugal", dialCode: "+351" },
    { iso2: "gr", label: "Greece", dialCode: "+30" },
    { iso2: "tr", label: "Turkey", dialCode: "+90" },
    { iso2: "jp", label: "Japan", dialCode: "+81" },
    { iso2: "kr", label: "South Korea", dialCode: "+82" },
    { iso2: "cn", label: "China", dialCode: "+86" },
    { iso2: "hk", label: "Hong Kong", dialCode: "+852" },
    { iso2: "tw", label: "Taiwan", dialCode: "+886" },
    { iso2: "my", label: "Malaysia", dialCode: "+60" },
    { iso2: "th", label: "Thailand", dialCode: "+66" },
    { iso2: "id", label: "Indonesia", dialCode: "+62" },
    { iso2: "ph", label: "Philippines", dialCode: "+63" }
  ];
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

  function getCookieValue(name) {
    const cookies = document.cookie ? document.cookie.split(";") : [];
    const prefix = `${name}=`;

    for (const cookie of cookies) {
      const value = cookie.trim();
      if (value.startsWith(prefix)) {
        return decodeURIComponent(value.slice(prefix.length));
      }
    }

    return "";
  }

  function getMetaTimestamp(storedTracking) {
    const capturedAt = Date.parse(storedTracking.captured_at || "");
    return Number.isFinite(capturedAt) ? capturedAt : Date.now();
  }

  function createFbpValue(storedTracking) {
    const timestamp = getMetaTimestamp(storedTracking);
    const randomValue = Math.floor(Math.random() * 2147483647);
    return `fb.1.${timestamp}.${randomValue}`;
  }

  function createFbcValue(storedTracking) {
    const fbclid = storedTracking.fbclid || new URLSearchParams(window.location.search).get("fbclid") || "";
    if (!fbclid) {
      return "";
    }

    return `fb.1.${getMetaTimestamp(storedTracking)}.${fbclid}`;
  }

  function getMetaCookiePayload(storedTracking) {
    return {
      fbp: getCookieValue("_fbp") || storedTracking.fbp || createFbpValue(storedTracking),
      fbc: getCookieValue("_fbc") || storedTracking.fbc || createFbcValue(storedTracking)
    };
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

  function setupPhoneField(form) {
    const countrySelect = form.querySelector("[data-phone-country]");
    if (!countrySelect || countrySelect.options.length) {
      return;
    }

    const initialCountry = getInitialCountryFromLocale() || "us";
    phoneCountryOptions.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.dialCode;
      option.textContent = `${country.label} (${country.dialCode})`;
      option.selected = country.iso2 === initialCountry;
      countrySelect.appendChild(option);
    });
  }

  function buildPayload(form) {
    const data = new FormData(form);
    const params = new URLSearchParams(window.location.search);
    const storedTracking = readStoredTracking();
    const firstName = String(data.get("contact[first_name]") || "");
    const email = String(data.get("contact[email]") || "");
    let phoneNumber = String(data.get("contact[phone_number]") || "");
    const timeZone = String(data.get("time_zone") || "");
    const transactionalSmsConsent = data.get("transactional_sms_consent") === "yes" ? "yes" : "no";
    const metaCookies = getMetaCookiePayload(storedTracking);

    const payload = {
      first_name: firstName,
      email,
      phone_number: phoneNumber,
      time_zone: timeZone,
      transactional_sms_consent: transactionalSmsConsent,
      source: "taxtraining",
      page_url: window.location.href,
      page_path: window.location.pathname,
      confirmation_url: form.dataset.successUrl || form.action,
      submitted_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
      landing_page_url: storedTracking.landing_page_url || window.location.href,
      landing_page_path: storedTracking.landing_page_path || window.location.pathname,
      tracking_captured_at: storedTracking.captured_at || "",
      fbp: metaCookies.fbp,
      fbc: metaCookies.fbc,
      "contact[first_name]": firstName,
      "contact[email]": email,
      "contact[phone_number]": phoneNumber,
      "contact[transactional_sms_consent]": transactionalSmsConsent
    };

    trackingKeys.forEach((key) => {
      payload[key] = params.get(key) || storedTracking[key] || "";
    });

    if (metaCookies.fbp || metaCookies.fbc) {
      writeStoredTracking({
        ...storedTracking,
        ...metaCookies
      });
    }

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
      source: payload.source || "taxtraining",
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
    setupPhoneField(form);
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
      const countrySelect = form.querySelector("[data-phone-country]");

      if (!webhookUrl) {
        window.location.assign(successUrl);
        return;
      }

      setTimeZoneValue(form);

      if (hiddenPhoneInput) {
        const dialCode = String(countrySelect?.value || "");
        const rawPhone = String(phoneInput?.value || "");
        const cleanedPhone = rawPhone.replace(/[^\d]/g, "");

        if (cleanedPhone.length < 6) {
          if (status) {
            status.textContent = "Please enter a valid phone number.";
            status.classList.remove("is-pending");
          }
          phoneInput?.focus();
          return;
        }

        hiddenPhoneInput.value = cleanedPhone ? `${dialCode}${cleanedPhone}` : "";
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

})();

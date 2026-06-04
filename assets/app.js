function clearInlineErrors(form) {
  form.querySelectorAll("[data-field]").forEach((wrap) => {
    const err = wrap.querySelector(".field-error");
    if (err) {
      err.textContent = "";
      err.classList.add("hidden");
    }
    wrap.querySelectorAll(".input-light").forEach((el) => el.classList.remove("is-invalid"));
  });
}

function setInlineError(form, fieldKey, message) {
  const wrap = form.querySelector(`[data-field="${fieldKey}"]`);
  if (!wrap) return;
  const err = wrap.querySelector(".field-error");
  const input = wrap.querySelector("input, textarea, select");
  if (err) {
    err.textContent = message;
    err.classList.remove("hidden");
  }
  input?.classList.add("is-invalid");
}

function phoneDigits(phone) {
  return String(phone).replace(/\D/g, "");
}

function isValidPhone(phone) {
  const digits = phoneDigits(phone);
  return digits.length >= 8 && digits.length <= 15;
}

function validateContactForm(form) {
  clearInlineErrors(form);
  const errors = {};
  if (!form.nom?.value.trim()) errors.nom = "Veuillez indiquer votre nom.";
  if (!form.prenom?.value.trim()) errors.prenom = "Veuillez indiquer votre prénom.";
  const email = form.email?.value.trim() ?? "";
  if (!email) errors.email = "Veuillez indiquer votre e-mail.";
  else if (!email.includes("@") || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Adresse e-mail incorrecte.";
  }
  const tel = form.telephone?.value.trim() ?? "";
  if (tel && !isValidPhone(tel)) {
    errors.telephone = "Numéro de téléphone incorrect.";
  }
  if (!form.description?.value.trim()) {
    errors.description = "Veuillez saisir votre message.";
  }
  Object.entries(errors).forEach(([key, msg]) => setInlineError(form, key, msg));
  if (Object.keys(errors).length) {
    form
      .querySelector(`[data-field="${Object.keys(errors)[0]}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return false;
  }
  return true;
}

function getContactConfig() {
  const el = document.getElementById("contact-config");
  if (!el) return {};
  try {
    return JSON.parse(el.textContent);
  } catch {
    return {};
  }
}

function createAjaxFormHandlers(opts = {}) {
  return {
    feedbackText: "",
    feedbackVisible: false,
    feedbackClass: "hidden rounded-lg px-3 py-2.5 text-center text-sm",
    submitting: false,

    successMessage:
      opts.successMessage ??
      "Message envoyé. Merci — nous revenons vers vous rapidement.",
    invalidMessage: "Merci de compléter les champs obligatoires.",
    submitBusyLabel: opts.submitBusyLabel ?? "Envoi…",
    feedbackSuccess:
      "block rounded-lg border border-brand-green/30 bg-brand-green-light px-3 py-2.5 text-center text-sm text-brand-green",
    feedbackError:
      "block rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-center text-sm text-red-400",

    get formAction() {
      const contact = getContactConfig();
      const email = opts.formEmail ?? contact.formEmail ?? contact.email;
      return "https://formsubmit.co/ajax/" + email;
    },

    get contactEmail() {
      return getContactConfig().email ?? "";
    },

    showError(text) {
      this.feedbackText = text;
      this.feedbackClass = this.feedbackError;
      this.feedbackVisible = true;
    },

    showSuccess(text) {
      this.feedbackText = text;
      this.feedbackClass = this.feedbackSuccess;
      this.feedbackVisible = true;
    },

    onSubmit(event) {
      event.preventDefault();
      const form = event.target;
      this.feedbackVisible = false;
      if (!validateContactForm(form)) {
        return;
      }
      const honey = form.querySelector('[name="_honey"]');
      if (honey?.value) return;
      if (location.protocol === "file:") {
        this.showError(
          "Ouvrez le site avec Live Server (adresse http://), pas en double-cliquant le fichier HTML."
        );
        return;
      }
      this.submitting = true;
      this.feedbackVisible = false;
      htmx.ajax("POST", this.formAction, {
        source: form,
        swap: "none",
        headers: { Accept: "application/json" },
      });
    },

    onHtmxAfterRequest(event) {
      this.submitting = false;
      const form = event.detail.elt;
      if (event.detail.failed || !event.detail.successful) {
        this.showError(
          "Envoi impossible. Vérifiez votre connexion, activez le formulaire via l'e-mail FormSubmit, ou écrivez-nous à " +
            this.contactEmail
        );
        return;
      }
      let data = {};
      try {
        data = JSON.parse(event.detail.xhr.responseText);
      } catch {
        /* non-JSON response */
      }
      if (data.success !== "true" && data.success !== true) {
        this.showError(
          "Envoi impossible. Vérifiez votre connexion, activez le formulaire via l'e-mail FormSubmit, ou écrivez-nous à " +
            this.contactEmail
        );
        return;
      }
      this.showSuccess(this.successMessage);
      form.reset();
      if (typeof this.resetWizard === "function") this.resetWizard();
    },
  };
}

document.addEventListener("alpine:init", () => {
  Alpine.data("contactInfo", () => {
    const contact = getContactConfig();
    return {
      adresse: contact.adresse ?? "",
      ville: contact.ville ?? "",
      email: contact.email ?? "",
      telephone: contact.telephone ?? "",
      telephone2: contact.telephone2 ?? "",
      year: new Date().getFullYear(),
      phoneHref(phone) {
        return "tel:" + String(phone).replace(/\s/g, "");
      },
      get mailHref() {
        return "mailto:" + this.email;
      },
    };
  });

  Alpine.data("ajaxForm", (opts = {}) => createAjaxFormHandlers(opts));
});

document.addEventListener("DOMContentLoaded", () => {
  const tel = document.getElementById("tel");
  tel?.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^\d\s+\-]/g, "");
  });
});

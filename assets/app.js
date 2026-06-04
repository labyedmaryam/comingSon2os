function getContactConfig() {
  const el = document.getElementById("contact-config");
  if (!el) return {};
  try {
    return JSON.parse(el.textContent);
  } catch {
    return {};
  }
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

  Alpine.data("ajaxForm", (opts = {}) => ({
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
      if (!form.checkValidity()) {
        this.showError(this.invalidMessage);
        form.reportValidity();
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
    },
  }));
});

/**
 * Multi-step Devis form — vanilla JS state, validation & routing
 */
(function () {
  const STEP_LABELS = {
    1: "Informations client",
    2: "Nature de la demande",
    3: "Orientation du projet",
    4: "Détails du projet",
    5: "Message",
  };

  const state = {
    step: 1,
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    natureDemande: "",
    structureType: "",
    domaineEtude: "",
    typeBatimentCoord: [],
    coordBatimentDetails: {},
    surfaceGlobaleDuSolCoordBat: "",
    typeLotissementCoord: [],
    coordLotissementDetails: {},
    surfaceGlobaleDuSolCoordLot: "",
    typeProjetMoCg: [],
    moCgDetails: {},
    surfaceGlobaleDuSolMoCg: "",
    typeBienVrd: [],
    vrdDetails: {},
    surfaceGlobaleDuSolVrd: "",
    typeStructure: "",
    typeProjet: [],
    projetDetails: {},
    surfaceGlobaleDuSolProjet: "",
    nombreEtages: "",
    hauteurMetres: "",
    message: "",
  };

  const els = {};

  /** Ordre unique — source de vérité pour les listes déroulantes */
  const SELECT_OPTIONS = {
    vrdTypeBien: ["Villa", "Immeuble", "Lot économique", "Usine"],
    typeBatiment: ["Villa", "Immeuble", "Lot économique", "Bungalow", "Usine", "Hôtel"],
    typeProjetEtude: ["Villa", "Immeuble", "Lot économique", "Bungalow", "Usine", "Hôtel"],
  };

  const NATURE_DEMANDE_LABELS = {
    etude: "Étude",
    structure: "Structure",
    mo: "Maître d'Ouvrage",
    cg: "Contractant Général",
  };

  function getNatureDemandeLabel() {
    return NATURE_DEMANDE_LABELS[state.natureDemande] ?? "";
  }

  const SURFACE_SOL_ERROR =
    "La surface globale du sol doit être au moins 1 m².";

  /** Config champs par type (VRD et tous les parcours multi-types) */
  const TYPE_DETAILS_CONFIG = {
    Villa: {
      uniteLabel: "Nombre de villas",
      unitePlaceholder: "Ex. 2",
      surfaceLabel: "Surface moyenne (m²)",
      surfaceHint: "Surface moyenne par villa, pas la surface totale du projet.",
      surfacePlaceholder: "Ex. 350",
      surfaceKind: "moyenne",
      surfaceError: "La surface moyenne doit être au moins 1 m².",
    },
    Immeuble: {
      uniteLabel: "Nombre d'immeubles",
      unitePlaceholder: "Ex. 1",
      surfaceLabel: "Surface globale / totale (m²)",
      surfaceHint: "Surface cumulée de l'ensemble du projet.",
      surfacePlaceholder: "Ex. 4500",
      surfaceKind: "totale",
      surfaceError: "La surface globale doit être au moins 1 m².",
    },
    "Lot économique": {
      uniteLabel: "Nombre de lots",
      unitePlaceholder: "Ex. 24",
      surfaceLabel: "Surface globale / totale (m²)",
      surfaceHint: "Surface totale du lotissement.",
      surfacePlaceholder: "Ex. 12000",
      surfaceKind: "totale",
      surfaceError: "La surface globale doit être au moins 1 m².",
    },
    Usine: {
      uniteLabel: "Nombre d'usines",
      unitePlaceholder: "Ex. 1",
      surfaceLabel: "Surface globale / totale (m²)",
      surfaceHint: "Surface totale du site industriel.",
      surfacePlaceholder: "Ex. 8000",
      surfaceKind: "totale",
      surfaceError: "La surface globale doit être au moins 1 m².",
    },
    Bungalow: {
      uniteLabel: "Nombre de bungalows",
      unitePlaceholder: "Ex. 4",
      surfaceLabel: "Surface moyenne (m²)",
      surfaceHint: "Surface moyenne par bungalow.",
      surfacePlaceholder: "Ex. 280",
      surfaceKind: "moyenne",
      surfaceError: "La surface moyenne doit être au moins 1 m².",
    },
    Hôtel: {
      uniteLabel: "Nombre d'hôtels",
      unitePlaceholder: "Ex. 1",
      surfaceLabel: "Surface globale / totale (m²)",
      surfaceHint: "Surface cumulée de l'ensemble du projet.",
      surfacePlaceholder: "Ex. 6000",
      surfaceKind: "totale",
      surfaceError: "La surface globale doit être au moins 1 m².",
    },
  };

  const TYPE_DETAILS_DEFAULT = {
    uniteLabel: "Nombre d'unités",
    unitePlaceholder: "Ex. 2",
    surfaceLabel: "Surface globale / totale (m²)",
    surfaceHint: "",
    surfacePlaceholder: "Ex. 1500",
    surfaceKind: "totale",
    surfaceError: "La surface doit être au moins 1 m².",
  };

  function $(id) {
    return document.getElementById(id);
  }

  function phoneDigits(phone) {
    return String(phone).replace(/\D/g, "");
  }

  function isValidPhone(phone) {
    const digits = phoneDigits(phone);
    return digits.length >= 8 && digits.length <= 15;
  }

  const FLOW_META = {
    typeBienVrd: {
      scope: "vrd",
      options: SELECT_OPTIONS.vrdTypeBien,
      detailsKey: "vrdDetails",
      selectedKey: "typeBienVrd",
      containerEl: "vrdDetailsFields",
    },
    typeProjetMoCg: {
      scope: "mocg",
      options: SELECT_OPTIONS.typeProjetEtude,
      detailsKey: "moCgDetails",
      selectedKey: "typeProjetMoCg",
      containerEl: "moCgDetailsFields",
    },
    typeProjet: {
      scope: "projet",
      options: SELECT_OPTIONS.typeProjetEtude,
      detailsKey: "projetDetails",
      selectedKey: "typeProjet",
      containerEl: "projetDetailsFields",
    },
    typeBatimentCoord: {
      scope: "coordbat",
      options: SELECT_OPTIONS.typeBatiment,
      detailsKey: "coordBatimentDetails",
      selectedKey: "typeBatimentCoord",
      containerEl: "coordBatimentDetailsFields",
    },
    typeLotissementCoord: {
      scope: "coordlot",
      options: SELECT_OPTIONS.typeBatiment,
      detailsKey: "coordLotissementDetails",
      selectedKey: "typeLotissementCoord",
      containerEl: "coordLotissementDetailsFields",
    },
  };

  function getTypeDetailsConfig(type) {
    return TYPE_DETAILS_CONFIG[type] ?? TYPE_DETAILS_DEFAULT;
  }

  function getVrdConfigForType(type) {
    return getTypeDetailsConfig(type);
  }

  function typeSlug(type) {
    return type.replace(/\s+/g, "-");
  }

  function vrdTypeSlug(type) {
    return typeSlug(type);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function updateMultiChoiceCards(stateKey) {
    if (!Array.isArray(state[stateKey])) return;
    document.querySelectorAll(`[data-multi-choice-group="${stateKey}"]`).forEach((group) => {
      group.querySelectorAll("[data-multi-value]").forEach((btn) => {
        const value = btn.dataset.multiValue;
        const selected = state[stateKey].includes(value);
        btn.classList.toggle("is-selected", selected);
        btn.setAttribute("aria-pressed", selected ? "true" : "false");
      });
    });
  }

  function toggleMultiChoice(stateKey, value, onAfter) {
    if (!Array.isArray(state[stateKey])) return;
    const idx = state[stateKey].indexOf(value);
    if (idx >= 0) state[stateKey].splice(idx, 1);
    else state[stateKey].push(value);
    clearFieldError(stateKey);
    updateMultiChoiceCards(stateKey);
    if (onAfter) onAfter();
  }

  function renderTypeDetailsForFlow(flowKey) {
    const meta = FLOW_META[flowKey];
    if (!meta) return;
    const container = els[meta.containerEl];
    if (!container) return;

    const details = state[meta.detailsKey];
    const selected = meta.options.filter((t) => state[meta.selectedKey].includes(t));

    Object.keys(details).forEach((type) => {
      if (!state[meta.selectedKey].includes(type)) delete details[type];
    });

    selected.forEach((type) => {
      if (!details[type]) details[type] = { nombreUnites: "", surface: "" };
    });

    if (!selected.length) {
      container.innerHTML = "";
      container.classList.add("hidden");
      return;
    }

    container.classList.remove("hidden");
    container.innerHTML = selected
      .map((type) => {
        const cfg = getTypeDetailsConfig(type);
        const d = details[type];
        const slug = typeSlug(type);
        const hint = cfg.surfaceHint
          ? `<p class="text-xs text-slate-500">${escapeHtml(cfg.surfaceHint)}</p>`
          : "";
        return `
          <div class="space-y-3 rounded-xl border border-brand-wine/12 bg-brand-wine-light/30 p-4">
            <p class="text-sm font-bold text-brand-wine">${escapeHtml(type)}</p>
            <div class="flex flex-col gap-1.5" data-field="${meta.scope}-nombre-${slug}">
              <label class="text-xs font-semibold uppercase tracking-wider text-slate-500">${escapeHtml(cfg.uniteLabel)} <span class="text-brand-wine">*</span></label>
              <input type="number" min="1" step="1" data-type-detail-input data-detail-scope="${meta.scope}" data-detail-type="${escapeHtml(type)}" data-detail-field="nombreUnites" value="${escapeHtml(d.nombreUnites)}" placeholder="${escapeHtml(cfg.unitePlaceholder)}"
                class="input-light w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400" />
              <p class="field-error hidden" role="alert"></p>
            </div>
            <div class="flex flex-col gap-1.5" data-field="${meta.scope}-surface-${slug}">
              <label class="text-xs font-semibold uppercase tracking-wider text-slate-500">${escapeHtml(cfg.surfaceLabel)} <span class="text-brand-wine">*</span></label>
              <input type="number" min="1" step="0.01" data-type-detail-input data-detail-scope="${meta.scope}" data-detail-type="${escapeHtml(type)}" data-detail-field="surface" value="${escapeHtml(d.surface)}" placeholder="${escapeHtml(cfg.surfacePlaceholder)}"
                class="input-light w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400" />
              ${hint}
              <p class="field-error hidden" role="alert"></p>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function readTypeDetailsForFlow(flowKey) {
    const meta = FLOW_META[flowKey];
    if (!meta) return;
    const container = els[meta.containerEl];
    if (!container) return;
    const details = state[meta.detailsKey];
    container.querySelectorAll("[data-type-detail-input]").forEach((input) => {
      const type = input.dataset.detailType;
      const field = input.dataset.detailField;
      if (!type || !field || !details[type]) return;
      details[type][field] = input.value;
    });
  }

  function validateTypeDetailsForFlow(flowKey, errors) {
    const meta = FLOW_META[flowKey];
    if (!meta) return;
    const selected = state[meta.selectedKey];
    const details = state[meta.detailsKey];
    selected.forEach((type) => {
      const cfg = getTypeDetailsConfig(type);
      const d = details[type] || {};
      const slug = typeSlug(type);
      const n = Number(d.nombreUnites);
      const s = Number(d.surface);
      if (!d.nombreUnites || n < 1) {
        errors[`${meta.scope}-nombre-${slug}`] =
          "Le nombre d'unités doit être au moins 1.";
      }
      if (!d.surface || s < 1) {
        errors[`${meta.scope}-surface-${slug}`] = cfg.surfaceError;
      }
    });
  }

  function mapDetailsToBiens(selected, detailsKey) {
    return selected.map((type) => {
      const cfg = getTypeDetailsConfig(type);
      const d = state[detailsKey][type] || {};
      const entry = { type, nombreUnites: Number(d.nombreUnites) };
      if (cfg.surfaceKind === "moyenne") {
        entry.surfaceMoyenneM2 = Number(d.surface);
      } else {
        entry.surfaceGlobaleTotaleM2 = Number(d.surface);
      }
      return entry;
    });
  }

  function validateSurfaceGlobaleDuSol(value, fieldKey, errors) {
    const sol = Number(value);
    if (!value || sol < 1) errors[fieldKey] = SURFACE_SOL_ERROR;
  }

  function resetFlowDetails(flowKey, surfaceEl, surfaceStateKey) {
    const meta = FLOW_META[flowKey];
    if (!meta) return;
    state[meta.selectedKey] = [];
    state[meta.detailsKey] = {};
    if (surfaceStateKey) state[surfaceStateKey] = "";
    if (surfaceEl) surfaceEl.value = "";
    updateMultiChoiceCards(meta.selectedKey);
    renderTypeDetailsForFlow(flowKey);
  }

  function toggleTypeBienVrd(value) {
    toggleMultiChoice("typeBienVrd", value, () => renderTypeDetailsForFlow("typeBienVrd"));
  }

  function resetTypeBienVrd() {
    resetFlowDetails(
      "typeBienVrd",
      els.surfaceGlobaleDuSolVrd,
      "surfaceGlobaleDuSolVrd"
    );
  }

  function renderVrdDetailFields() {
    renderTypeDetailsForFlow("typeBienVrd");
  }

  function readVrdInputs() {
    readTypeDetailsForFlow("typeBienVrd");
    state.surfaceGlobaleDuSolVrd =
      els.surfaceGlobaleDuSolVrd?.value ?? state.surfaceGlobaleDuSolVrd;
  }

  function isStructure() {
    return state.natureDemande === "structure";
  }

  function isEtude() {
    return state.natureDemande === "etude";
  }

  function isMoCg() {
    return state.natureDemande === "mo" || state.natureDemande === "cg";
  }

  function resetMoCgFields() {
    resetFlowDetails(
      "typeProjetMoCg",
      els.surfaceGlobaleDuSolMoCg,
      "surfaceGlobaleDuSolMoCg"
    );
  }

  function isVrd() {
    return isEtude() && state.domaineEtude === "vrd";
  }

  function isEtudeConstruction() {
    return isEtude() && state.domaineEtude === "construction";
  }

  function isStructureConstruction() {
    return isStructure() && state.structureType === "construction";
  }

  function isStructureLotissement() {
    return isStructure() && state.structureType === "lotissement";
  }

  function resetStructureFields() {
    state.structureType = "";
    state.typeBatimentCoord = [];
    state.coordBatimentDetails = {};
    state.surfaceGlobaleDuSolCoordBat = "";
    state.typeLotissementCoord = [];
    state.coordLotissementDetails = {};
    state.surfaceGlobaleDuSolCoordLot = "";
    updateMultiChoiceCards("typeBatimentCoord");
    updateMultiChoiceCards("typeLotissementCoord");
    renderTypeDetailsForFlow("typeBatimentCoord");
    renderTypeDetailsForFlow("typeLotissementCoord");
    if (els.surfaceGlobaleDuSolCoordBat) els.surfaceGlobaleDuSolCoordBat.value = "";
    if (els.surfaceGlobaleDuSolCoordLot) els.surfaceGlobaleDuSolCoordLot.value = "";
  }

  function isBetonArme() {
    return isEtudeConstruction() && state.typeStructure === "ba";
  }

  function isCharpenteMetallique() {
    return isEtudeConstruction() && state.typeStructure === "cm";
  }

  function resetConstructionFields() {
    state.typeStructure = "";
    state.typeProjet = [];
    state.projetDetails = {};
    state.surfaceGlobaleDuSolProjet = "";
    state.nombreEtages = "";
    state.hauteurMetres = "";
    updateMultiChoiceCards("typeProjet");
    renderTypeDetailsForFlow("typeProjet");
    if (els.surfaceGlobaleDuSolProjet) els.surfaceGlobaleDuSolProjet.value = "";
    if (els.nombreEtages) els.nombreEtages.value = "";
    if (els.hauteurCm) els.hauteurCm.value = "";
  }

  function updateConstructionPanels() {
    if (!els.panelConstructionBa) return;
    const hasStructure = !!state.typeStructure;
    els.panelConstructionProjet?.classList.toggle("hidden", !hasStructure);
    els.panelConstructionBa.classList.toggle(
      "hidden",
      !hasStructure || !isBetonArme()
    );
    els.panelConstructionCm.classList.toggle(
      "hidden",
      !hasStructure || !isCharpenteMetallique()
    );
  }

  function getTotalSteps() {
    return isMoCg() ? 4 : 5;
  }

  function isMessageStep() {
    return state.step === getTotalSteps();
  }

  function getStepTitle() {
    if (isMessageStep()) return "Message";
    if (isMoCg() && state.step === 3) return "Détails du projet";
    return STEP_LABELS[state.step] ?? "";
  }

  function getProgressPercent() {
    return Math.round((state.step / getTotalSteps()) * 100);
  }

  function isLastFormStep() {
    return state.step === getTotalSteps();
  }

  function hideFieldErrors() {
    els.form?.querySelectorAll("[data-field]").forEach((wrap) => {
      const err = wrap.querySelector(".field-error");
      if (err) {
        err.textContent = "";
        err.classList.add("hidden");
      }
      wrap.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
    });
  }

  function clearFieldError(fieldKey) {
    const wraps = Array.from(document.querySelectorAll(`[data-field="${fieldKey}"]`));
    wraps.forEach((wrap) => {
      const err = wrap.querySelector(".field-error");
      if (err) err.classList.add("hidden");
      wrap.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
    });
  }

  function setFieldError(fieldKey, message) {
    const wraps = Array.from(document.querySelectorAll(`[data-field="${fieldKey}"]`));
    const wrap = wraps.find((w) => !w.closest(".hidden")) ?? wraps[0];
    if (!wrap || !message) return;
    const err = wrap.querySelector(".field-error");
    const input = wrap.querySelector("input, select, textarea");
    const cardGroup = wrap.querySelector("[data-choice-group], [data-multi-choice-group]");
    if (err) {
      err.textContent = message;
      err.classList.remove("hidden");
    }
    input?.classList.add("is-invalid");
    cardGroup?.querySelectorAll(".choice-card").forEach((c) => c.classList.add("is-invalid"));
  }

  function applyFieldErrors(errors) {
    hideFieldErrors();
    const keys = Object.keys(errors);
    keys.forEach((k) => setFieldError(k, errors[k]));
    if (keys.length) {
      const wrap = Array.from(
        document.querySelectorAll(`[data-field="${keys[0]}"]`)
      ).find((w) => !w.closest(".hidden"));
      wrap?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return false;
    }
    return true;
  }

  function validateStep(step) {
    const errors = {};
    switch (step) {
      case 1: {
        if (!state.prenom.trim()) errors.prenom = "Veuillez indiquer votre prénom.";
        if (!state.nom.trim()) errors.nom = "Veuillez indiquer votre nom.";
        if (!state.email.trim()) {
          errors.email = "Veuillez indiquer votre e-mail.";
        } else if (
          !state.email.includes("@") ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())
        ) {
          errors.email = "Adresse e-mail incorrecte.";
        }
        if (!state.telephone.trim()) {
          errors.telephone = "Veuillez indiquer votre téléphone.";
        } else if (!isValidPhone(state.telephone)) {
          errors.telephone = "Numéro de téléphone incorrect.";
        }
        break;
      }
      case 2:
        if (!state.natureDemande) {
          errors.natureDemande = "Veuillez sélectionner une nature de demande.";
        }
        break;
      case 3:
        if (isMoCg()) {
          if (!state.typeProjetMoCg.length) {
            errors.typeProjetMoCg = "Veuillez sélectionner au moins un type de projet.";
          }
          validateTypeDetailsForFlow("typeProjetMoCg", errors);
          validateSurfaceGlobaleDuSol(
            state.surfaceGlobaleDuSolMoCg,
            "surfaceGlobaleDuSolMoCg",
            errors
          );
        } else if (isStructure() && !state.structureType) {
          errors.structureType = "Veuillez choisir Construction ou Lotissement.";
        } else if (isEtude() && !state.domaineEtude) {
          errors.domaineEtude = "Veuillez choisir VRD ou Construction.";
        }
        break;
      case 4:
        if (isMoCg()) break;
        if (isStructureConstruction()) {
          if (!state.typeBatimentCoord.length) {
            errors.typeBatimentCoord =
              "Veuillez sélectionner au moins un type de bâtiment.";
          }
          validateTypeDetailsForFlow("typeBatimentCoord", errors);
          validateSurfaceGlobaleDuSol(
            state.surfaceGlobaleDuSolCoordBat,
            "surfaceGlobaleDuSolCoordBat",
            errors
          );
        } else if (isStructureLotissement()) {
          if (!state.typeLotissementCoord.length) {
            errors.typeLotissementCoord =
              "Veuillez sélectionner au moins un type de lotissement.";
          }
          validateTypeDetailsForFlow("typeLotissementCoord", errors);
          validateSurfaceGlobaleDuSol(
            state.surfaceGlobaleDuSolCoordLot,
            "surfaceGlobaleDuSolCoordLot",
            errors
          );
        } else if (isVrd()) {
          if (!state.typeBienVrd.length) {
            errors.typeBienVrd = "Veuillez sélectionner au moins un type de bien.";
          }
          validateTypeDetailsForFlow("typeBienVrd", errors);
          validateSurfaceGlobaleDuSol(
            state.surfaceGlobaleDuSolVrd,
            "surfaceGlobaleDuSolVrd",
            errors
          );
        } else if (isEtudeConstruction()) {
          if (!state.typeStructure) {
            errors.typeStructure = "Veuillez sélectionner un type de structure (BA ou CM).";
          }
          if (!state.typeProjet.length) {
            errors.typeProjet = "Veuillez sélectionner au moins un type de projet.";
          }
          validateTypeDetailsForFlow("typeProjet", errors);
          validateSurfaceGlobaleDuSol(
            state.surfaceGlobaleDuSolProjet,
            "surfaceGlobaleDuSolProjet",
            errors
          );
          if (isBetonArme() && !state.nombreEtages) {
            errors.nombreEtages = "Veuillez sélectionner le nombre d'étages.";
          }
          if (isCharpenteMetallique()) {
            const h = Number(state.hauteurMetres);
            if (!state.hauteurMetres || h <= 0) {
              errors.hauteurMetres = "La hauteur doit être supérieure à 0 m.";
            }
          }
        }
        break;
      case 5:
        break;
      default:
        break;
    }
    return errors;
  }

  function collectPayload() {
    const base = {
      client: {
        prenom: state.prenom.trim(),
        nom: state.nom.trim(),
        email: state.email.trim(),
        telephone: state.telephone.trim(),
      },
      natureDemande: state.natureDemande,
      natureDemandeLabel: getNatureDemandeLabel(),
      message: state.message.trim(),
    };

    if (isMoCg()) {
      return {
        ...base,
        projet: {
          typesProjet: [...state.typeProjetMoCg],
          ...(state.typeProjetMoCg.length === 1
            ? { typeProjet: state.typeProjetMoCg[0] }
            : {}),
          surfaceGlobaleDuSolM2: Number(state.surfaceGlobaleDuSolMoCg),
          projets: mapDetailsToBiens(state.typeProjetMoCg, "moCgDetails"),
        },
      };
    }

    if (isStructure()) {
      const structure = {
        type: state.structureType,
        typeLabel:
          state.structureType === "construction"
            ? "Construction"
            : state.structureType === "lotissement"
              ? "Lotissement"
              : "",
      };
      if (isStructureConstruction()) {
        structure.construction = {
          typesBatiment: [...state.typeBatimentCoord],
          ...(state.typeBatimentCoord.length === 1
            ? { typeBatiment: state.typeBatimentCoord[0] }
            : {}),
          surfaceGlobaleDuSolM2: Number(state.surfaceGlobaleDuSolCoordBat),
          batiments: mapDetailsToBiens(
            state.typeBatimentCoord,
            "coordBatimentDetails"
          ),
        };
      }
      if (isStructureLotissement()) {
        structure.lotissement = {
          typesLotissement: [...state.typeLotissementCoord],
          ...(state.typeLotissementCoord.length === 1
            ? { typeLotissement: state.typeLotissementCoord[0] }
            : {}),
          surfaceGlobaleDuSolM2: Number(state.surfaceGlobaleDuSolCoordLot),
          lots: mapDetailsToBiens(
            state.typeLotissementCoord,
            "coordLotissementDetails"
          ),
        };
      }
      return { ...base, structure };
    }

    if (isVrd()) {
      const biens = mapDetailsToBiens(state.typeBienVrd, "vrdDetails");
      const vrd = {
        typesBien: [...state.typeBienVrd],
        surfaceGlobaleDuSolM2: Number(state.surfaceGlobaleDuSolVrd),
        biens,
      };
      if (state.typeBienVrd.length === 1) {
        vrd.typeBien = state.typeBienVrd[0];
        Object.assign(vrd, biens[0]);
      }
      return {
        ...base,
        domaineEtude: "vrd",
        domaineEtudeLabel: "Voirie et Réseau Divers (VRD)",
        vrd,
      };
    }

    if (isEtudeConstruction()) {
      const construction = {
        typeStructure: state.typeStructure,
        typeStructureLabel:
          state.typeStructure === "ba"
            ? "Béton Armé (BA)"
            : state.typeStructure === "cm"
              ? "Charpente Métallique (CM)"
              : "",
      };
      const typesProjetPayload = {
        typesProjet: [...state.typeProjet],
        ...(state.typeProjet.length === 1 ? { typeProjet: state.typeProjet[0] } : {}),
        surfaceGlobaleDuSolM2: Number(state.surfaceGlobaleDuSolProjet),
        projets: mapDetailsToBiens(state.typeProjet, "projetDetails"),
      };
      if (isBetonArme()) {
        construction.betonArme = {
          ...typesProjetPayload,
          nombreEtages: state.nombreEtages,
        };
      }
      if (isCharpenteMetallique()) {
        construction.charpenteMetallique = {
          ...typesProjetPayload,
          hauteurM: Number(state.hauteurMetres),
        };
      }
      return {
        ...base,
        domaineEtude: "construction",
        domaineEtudeLabel: "Construction",
        construction,
      };
    }

    return base;
  }

  function readConstructionInputs() {
    readTypeDetailsForFlow("typeProjet");
    state.surfaceGlobaleDuSolProjet =
      els.surfaceGlobaleDuSolProjet?.value ?? state.surfaceGlobaleDuSolProjet;
    if (isBetonArme()) {
      state.nombreEtages = els.nombreEtages?.value ?? state.nombreEtages;
      state.hauteurMetres = "";
    } else if (isCharpenteMetallique()) {
      state.hauteurMetres = els.hauteurCm?.value ?? state.hauteurMetres;
      state.nombreEtages = "";
    }
  }

  function readStructureInputs() {
    if (isStructureConstruction()) {
      readTypeDetailsForFlow("typeBatimentCoord");
      state.surfaceGlobaleDuSolCoordBat =
        els.surfaceGlobaleDuSolCoordBat?.value ?? state.surfaceGlobaleDuSolCoordBat;
    } else if (isStructureLotissement()) {
      readTypeDetailsForFlow("typeLotissementCoord");
      state.surfaceGlobaleDuSolCoordLot =
        els.surfaceGlobaleDuSolCoordLot?.value ?? state.surfaceGlobaleDuSolCoordLot;
    }
  }

  function readMoCgInputs() {
    readTypeDetailsForFlow("typeProjetMoCg");
    state.surfaceGlobaleDuSolMoCg =
      els.surfaceGlobaleDuSolMoCg?.value ?? state.surfaceGlobaleDuSolMoCg;
  }

  function readInputsToState() {
    state.prenom = els.prenom?.value ?? state.prenom;
    state.nom = els.nom?.value ?? state.nom;
    state.email = els.email?.value ?? state.email;
    state.telephone = els.telephone?.value ?? state.telephone;
    state.message = els.message?.value ?? state.message;
    if (isVrd()) readVrdInputs();
    if (isMoCg()) readMoCgInputs();
    if (isStructure()) readStructureInputs();
    if (isEtudeConstruction()) readConstructionInputs();
  }

  function updateCardSelection() {
    document.querySelectorAll("[data-choice-group]").forEach((group) => {
      const key = group.dataset.choiceGroup;
      const value = state[key];
      group.querySelectorAll("[data-choice-value]").forEach((btn) => {
        const selected = btn.dataset.choiceValue === value;
        btn.classList.toggle("is-selected", selected);
        btn.setAttribute("aria-pressed", selected ? "true" : "false");
      });
    });
  }

  function setChoice(key, value) {
    state[key] = value;
    if (key === "natureDemande") {
      state.domaineEtude = "";
      resetTypeBienVrd();
      resetConstructionFields();
      resetStructureFields();
      resetMoCgFields();
      if (state.step > getTotalSteps()) {
        state.step = getTotalSteps();
      }
    }
    if (key === "structureType") {
      state.typeBatimentCoord = [];
      state.coordBatimentDetails = {};
      state.surfaceGlobaleDuSolCoordBat = "";
      state.typeLotissementCoord = [];
      state.coordLotissementDetails = {};
      state.surfaceGlobaleDuSolCoordLot = "";
      updateMultiChoiceCards("typeBatimentCoord");
      updateMultiChoiceCards("typeLotissementCoord");
      renderTypeDetailsForFlow("typeBatimentCoord");
      renderTypeDetailsForFlow("typeLotissementCoord");
      if (els.surfaceGlobaleDuSolCoordBat) els.surfaceGlobaleDuSolCoordBat.value = "";
      if (els.surfaceGlobaleDuSolCoordLot) els.surfaceGlobaleDuSolCoordLot.value = "";
    }
    if (key === "domaineEtude") {
      resetTypeBienVrd();
      resetConstructionFields();
    }
    if (key === "typeStructure") {
      state.typeProjet = [];
      state.projetDetails = {};
      state.surfaceGlobaleDuSolProjet = "";
      state.nombreEtages = "";
      state.hauteurMetres = "";
      updateMultiChoiceCards("typeProjet");
      renderTypeDetailsForFlow("typeProjet");
      if (els.surfaceGlobaleDuSolProjet) els.surfaceGlobaleDuSolProjet.value = "";
      if (els.nombreEtages) els.nombreEtages.value = "";
      if (els.hauteurCm) els.hauteurCm.value = "";
    }
    clearFieldError(key);
    updateCardSelection();
    render();
  }

  function render() {
    const total = getTotalSteps();
    els.stepCurrent.textContent = String(state.step);
    els.stepTotal.textContent = String(total);
    els.stepTitle.textContent = getStepTitle();
    els.progressBar.style.width = getProgressPercent() + "%";

    els.panels.forEach((panel) => {
      const isMessagePanel = panel.id === "panel-message";
      const visible = isMessagePanel
        ? isMessageStep()
        : Number(panel.dataset.step) === state.step;
      panel.classList.toggle("hidden", !visible);
      panel.setAttribute("aria-hidden", visible ? "false" : "true");
    });

    if (state.step === 3) {
      els.panelMoCg?.classList.toggle("hidden", !isMoCg());
      els.panelStructure.classList.toggle("hidden", !isStructure());
      els.panelEtudeDomaine.classList.toggle("hidden", !isEtude());
      if (els.moCgTitle && isMoCg()) {
        els.moCgTitle.textContent = getNatureDemandeLabel() + " — détails du projet";
      }
    } else {
      els.panelMoCg?.classList.add("hidden");
      els.panelStructure.classList.add("hidden");
      els.panelEtudeDomaine.classList.add("hidden");
    }

    if (state.step === 4) {
      els.panelVrd.classList.toggle("hidden", !isVrd());
      els.panelConstruction.classList.toggle("hidden", !isEtudeConstruction());
      if (els.panelStructureConstruction) {
        els.panelStructureConstruction.classList.toggle("hidden", !isStructureConstruction());
      }
      if (els.panelStructureLotissement) {
        els.panelStructureLotissement.classList.toggle("hidden", !isStructureLotissement());
      }
    } else {
      els.panelVrd.classList.add("hidden");
      els.panelConstruction.classList.add("hidden");
      els.panelStructureConstruction?.classList.add("hidden");
      els.panelStructureLotissement?.classList.add("hidden");
    }

    els.formStepToolbar?.classList.toggle("hidden", state.step <= 1);
    els.btnBack.classList.toggle("hidden", state.step <= 1);
    els.btnNext.classList.toggle("hidden", isLastFormStep());
    els.btnSubmit.classList.toggle("hidden", !isLastFormStep());

    updateMultiChoiceCards("typeBienVrd");
    updateMultiChoiceCards("typeProjetMoCg");
    updateMultiChoiceCards("typeProjet");
    updateMultiChoiceCards("typeBatimentCoord");

    if (state.step === 3 && isMoCg()) renderTypeDetailsForFlow("typeProjetMoCg");
    if (state.step === 4) {
      if (isVrd()) renderTypeDetailsForFlow("typeBienVrd");
      if (isEtudeConstruction()) {
        updateConstructionPanels();
        updateCardSelection();
        renderTypeDetailsForFlow("typeProjet");
      }
      if (isStructureConstruction()) {
        renderTypeDetailsForFlow("typeBatimentCoord");
      }
      if (isStructureLotissement()) {
        renderTypeDetailsForFlow("typeLotissementCoord");
      }
    }

    els.formWrapper.classList.remove("hidden");
    els.successScreen.classList.add("hidden");
  }

  function showSuccess() {
    const payload = collectPayload();
    console.log("Demande de devis — données complètes:", payload);
    console.log(JSON.stringify(payload, null, 2));

    els.formWrapper.classList.add("hidden");
    els.progressWrapper.classList.add("hidden");
    els.successScreen.classList.remove("hidden");
    els.successScreen.scrollIntoView({ behavior: "smooth", block: "start" });
    hideFieldErrors();
  }

  function goNext() {
    readInputsToState();
    const errors = validateStep(state.step);
    if (Object.keys(errors).length) {
      applyFieldErrors(errors);
      return;
    }
    hideFieldErrors();

    if (isLastFormStep()) return;

    state.step = Math.min(state.step + 1, getTotalSteps());
    render();
  }

  function goBack() {
    hideFieldErrors();
    if (state.step <= 1) return;
    state.step -= 1;
    if (state.step === 2 && isEtude()) {
      /* keep domaine for UX or clear - clear on back to 2 is ok via nature change only */
    }
    render();
  }

  function handleSubmit(e) {
    e.preventDefault();
    readInputsToState();
    const errors = validateStep(state.step);
    if (Object.keys(errors).length) {
      applyFieldErrors(errors);
      return;
    }
    showSuccess();
  }

  function bindChoices() {
    document.querySelectorAll("[data-choice-group]").forEach((group) => {
      const key = group.dataset.choiceGroup;
      group.querySelectorAll("[data-choice-value]").forEach((btn) => {
        btn.addEventListener("click", () => {
          setChoice(key, btn.dataset.choiceValue);
        });
      });
    });

    document.querySelectorAll("[data-multi-choice-group]").forEach((group) => {
      const key = group.dataset.multiChoiceGroup;
      group.querySelectorAll("[data-multi-value]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const value = btn.dataset.multiValue;
          if (key === "typeBienVrd") toggleTypeBienVrd(value);
          else if (FLOW_META[key]) {
            toggleMultiChoice(key, value, () => renderTypeDetailsForFlow(key));
          } else toggleMultiChoice(key, value);
        });
      });
    });
  }

  function bindInputs() {
    ["prenom", "nom", "email"].forEach((field) => {
      els[field]?.addEventListener("input", (e) => {
        state[field] = e.target.value;
      });
    });

    els.telephone?.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^\d\s+\-]/g, "");
      state.telephone = e.target.value;
    });

    els.message?.addEventListener("input", (e) => {
      state.message = e.target.value;
    });

    const surfaceSolBindings = [
      ["surfaceGlobaleDuSolVrd", "surfaceGlobaleDuSolVrd"],
      ["surfaceGlobaleDuSolMoCg", "surfaceGlobaleDuSolMoCg"],
      ["surfaceGlobaleDuSolProjet", "surfaceGlobaleDuSolProjet"],
      ["surfaceGlobaleDuSolCoordBat", "surfaceGlobaleDuSolCoordBat"],
      ["surfaceGlobaleDuSolCoordLot", "surfaceGlobaleDuSolCoordLot"],
    ];
    surfaceSolBindings.forEach(([elKey, stateKey]) => {
      ["input", "change"].forEach((evt) => {
        els[elKey]?.addEventListener(evt, (e) => {
          state[stateKey] = e.target.value;
          clearFieldError(stateKey);
        });
      });
    });

    els.form?.addEventListener("input", (e) => {
      const input = e.target.closest("[data-type-detail-input]");
      if (!input) return;
      const scope = input.dataset.detailScope;
      const type = input.dataset.detailType;
      const field = input.dataset.detailField;
      const flowKey = Object.keys(FLOW_META).find(
        (k) => FLOW_META[k].scope === scope
      );
      if (!flowKey || !type || !field) return;
      const details = state[FLOW_META[flowKey].detailsKey];
      if (!details[type]) return;
      details[type][field] = input.value;
      const slug = typeSlug(type);
      clearFieldError(
        field === "nombreUnites"
          ? `${scope}-nombre-${slug}`
          : `${scope}-surface-${slug}`
      );
    });

    const constructionFields = [
      ["nombreEtages", "nombreEtages"],
      ["hauteurCm", "hauteurMetres"],
    ];
    constructionFields.forEach(([elKey, stateKey]) => {
      const input = els[elKey];
      if (!input) return;
      const sync = (e) => {
        state[stateKey] = e.target.value;
      };
      input.addEventListener("change", sync);
      input.addEventListener("input", sync);
    });

    els.form?.querySelectorAll("[data-field] input, [data-field] select, [data-field] textarea").forEach((input) => {
      const wrap = input.closest("[data-field]");
      const key = wrap?.dataset?.field;
      if (!key) return;
      const clear = () => clearFieldError(key);
      input.addEventListener("input", clear);
      input.addEventListener("change", clear);
    });
  }

  function init() {
    els.form = $("devis-form");
    els.formWrapper = $("devis-form-wrapper");
    els.progressWrapper = $("devis-progress");
    els.formStepToolbar = $("form-step-toolbar");
    els.formBackTop = $("form-back-top");
    els.successScreen = $("devis-success");
    els.stepCurrent = $("step-current");
    els.stepTotal = $("step-total");
    els.stepTitle = $("step-title");
    els.progressBar = $("progress-bar");
    els.btnBack = $("btn-back");
    els.btnNext = $("btn-next");
    els.btnSubmit = $("btn-submit");
    els.panels = document.querySelectorAll("[data-step]");
    els.panelStructure = $("panel-structure");
    els.panelEtudeDomaine = $("panel-etude-domaine");
    els.panelMoCg = $("panel-mo-cg");
    els.moCgTitle = $("mo-cg-title");
    els.moCgDetailsFields = $("mo-cg-details-fields");
    els.surfaceGlobaleDuSolMoCg = $("surface-globale-du-sol-mo-cg");
    els.panelVrd = $("panel-vrd");
    els.panelConstruction = $("panel-construction");
    els.panelConstructionProjet = $("panel-construction-projet");
    els.projetDetailsFields = $("construction-projet-details-fields");
    els.surfaceGlobaleDuSolProjet = $("surface-globale-du-sol-projet");
    els.panelStructureConstruction = $("panel-structure-construction");
    els.panelStructureLotissement = $("panel-structure-lotissement");
    els.coordBatimentDetailsFields = $("coord-construction-details-fields");
    els.surfaceGlobaleDuSolCoordBat = $("surface-globale-du-sol-coord-bat");
    els.coordLotissementDetailsFields = $("coord-lotissement-details-fields");
    els.surfaceGlobaleDuSolCoordLot = $("surface-globale-du-sol-coord-lot");

    els.prenom = $("prenom");
    els.nom = $("nom");
    els.email = $("email");
    els.telephone = $("telephone");
    els.messagePanel = $("panel-message");
    els.message = $("devis-message");
    els.vrdDetailsFields = $("vrd-details-fields");
    els.surfaceGlobaleDuSolVrd = $("surface-globale-du-sol-vrd");
    els.panelConstructionBa = $("panel-construction-ba");
    els.panelConstructionCm = $("panel-construction-cm");
    els.nombreEtages = $("nombre-etages-ba");
    els.hauteurCm = $("hauteur-cm");

    const yearEl = $("footer-year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    bindChoices();
    bindInputs();
    els.btnNext.addEventListener("click", goNext);
    els.btnBack.addEventListener("click", goBack);
    els.formBackTop?.addEventListener("click", goBack);
    els.form.addEventListener("submit", handleSubmit);

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

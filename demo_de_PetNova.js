const dashboardView = document.querySelector("#dashboardView");
const dashboardPanels = document.querySelectorAll("[data-dashboard-panel]");
const dashboardDialog = document.querySelector("#dashboardDialog");
const dashboardActionForm = document.querySelector("#dashboardActionForm");
const dashboardDialogFields = document.querySelector("#dashboardDialogFields");
const dashboardDialogTitle = document.querySelector("#dashboardDialogTitle");
const dashboardDialogFeedback = document.querySelector("#dashboardDialogFeedback");
const communityForm = document.querySelector("#communityForm");
const communityMessage = document.querySelector("#communityMessage");
const sessionNotice = document.querySelector("#sessionNotice");
function consumeTransientHandoff(storageKey, namePrefix) {
  try {
    const storedValue = sessionStorage.getItem(storageKey);
    if (storedValue !== null) {
      sessionStorage.removeItem(storageKey);
      if (window.name.startsWith(namePrefix)) window.name = "";
      return JSON.parse(storedValue);
    }
  } catch (error) { console.error("No se pudo leer el traspaso temporal de PETNOVA desde sessionStorage.", error); }
  if (window.name.startsWith(namePrefix)) {
    const storedValue = window.name.slice(namePrefix.length);
    window.name = "";
    try { return JSON.parse(storedValue); }
    catch (error) { console.error("El traspaso temporal de PETNOVA en esta pesta\u00f1a no es v\u00e1lido.", error); }
  }
  return null;
}
function storeTransientHandoff(storageKey, namePrefix, payload) {
  const serialized = JSON.stringify(payload);
  try { sessionStorage.setItem(storageKey, serialized); }
  catch (error) { console.error("No se pudo guardar el traspaso temporal de PETNOVA en sessionStorage; se usar\u00e1 la pesta\u00f1a actual.", error); }
  window.name = namePrefix + serialized;
  if (!window.name.startsWith(namePrefix)) throw new Error("El navegador no permiti\u00f3 preparar el traspaso temporal de PETNOVA.");
}
const handoff = consumeTransientHandoff("petnovaDemoHandoff", "PETNOVA_DEMO:");
const isValidHandoff = Boolean(handoff && handoff.profile && typeof handoff.profile.ownerEmail === "string");
if (!handoff) {
  window.location.replace("index.html?session=expired");
} else if (!isValidHandoff) {
  console.error("No se encontr\u00f3 un perfil v\u00e1lido para iniciar la demostraci\u00f3n PETNOVA.");
  window.location.replace("index.html?session=transfer-error");
}
let demoProfile = isValidHandoff ? handoff.profile : null;
let activeDashboardAction = "";
const contactConsultations = isValidHandoff && Array.isArray(handoff.contactConsultations)
  ? handoff.contactConsultations
  : [];

const revealTargets = document.querySelectorAll([
  ".dashboard-banner-inner", ".dashboard-pet-summary", ".dashboard-panel > .dashboard-heading",
  ".dashboard-stat", ".dashboard-action-card", ".dashboard-list-section",
  ".pet-profile-card", ".profile-details-grid article", ".dashboard-note-card",
  ".dashboard-health-grid", ".community-post-form", ".community-posts"
].join(","));

if (
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
  "IntersectionObserver" in window
) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          scheduleScrollEffects();
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -36px 0px" }
  );
  const revealDelays = new WeakMap();
  let scrollEffectFrame = 0;

  function updateScrollEffects() {
    scrollEffectFrame = 0;
    const viewportHeight = window.innerHeight;
    if (!viewportHeight) return;

    revealTargets.forEach((element) => {
      if (!element.classList.contains("is-visible")) return;

      const rect = element.getBoundingClientRect();
      if (rect.height === 0) {
        element.classList.remove("is-exiting");
        element.style.removeProperty("--scroll-exit-progress");
        element.style.removeProperty("--scroll-exit-opacity");
        element.style.removeProperty("--scroll-exit-offset");
        element.style.removeProperty("--scroll-exit-scale");
        element.style.removeProperty("--scroll-image-scale");
        return;
      }

      const previousScale =
        Number(element.style.getPropertyValue("--scroll-exit-scale")) || 1;
      const previousOffset =
        Number.parseFloat(element.style.getPropertyValue("--scroll-exit-offset")) || 0;
      const layoutTop =
        rect.top - previousOffset - ((previousScale - 1) * rect.height) / 2;
      const exitDistance = Math.min(rect.height, viewportHeight) * 0.72;
      const progress = Math.min(1, Math.max(0, -layoutTop / exitDistance));
      const previousProgress = Number(
        element.style.getPropertyValue("--scroll-exit-progress")
      ) || 0;

      if (Math.abs(progress - previousProgress) < 0.005) return;

      element.style.setProperty("--scroll-exit-progress", progress.toFixed(3));
      element.style.setProperty(
        "--scroll-exit-opacity",
        (1 - progress).toFixed(3)
      );
      element.style.setProperty(
        "--scroll-exit-offset",
        `${(-54 * progress).toFixed(1)}px`
      );
      element.style.setProperty(
        "--scroll-exit-scale",
        (1 - 0.04 * progress).toFixed(3)
      );
      element.style.setProperty(
        "--scroll-image-scale",
        (1 - 0.08 * progress).toFixed(3)
      );
      element.classList.toggle("is-exiting", progress > 0);
    });
  }

  function scheduleScrollEffects() {
    if (scrollEffectFrame) return;

    scrollEffectFrame = window.requestAnimationFrame(updateScrollEffects);
  }

  window.addEventListener("scroll", scheduleScrollEffects, { passive: true });
  window.addEventListener("resize", scheduleScrollEffects);

  revealTargets.forEach((element) => {
    const parent = element.parentElement;
    const delay = revealDelays.get(parent) || 0;

    element.classList.add("scroll-reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(delay, 4) * 75}ms`);
    revealDelays.set(parent, delay + 1);
    revealObserver.observe(element);
  });
}


const dashboardData = {
  appointments: [],
  vaccines: [],
  alerts: [],
  todos: [],
  posts: []
};
const petBreeds = {
  Dog: ["Labrador Retriever", "Poodle", "German Shepherd", "Mixed breed"],
  Cat: ["Persian", "Siamese", "Maine Coon", "Domestic Shorthair"],
  Bird: ["Parakeet", "Cockatiel", "Canary", "Lovebird"],
  Rabbit: ["Holland Lop", "Lionhead", "Mini Rex", "Dutch"],
  "Guinea pig": ["American", "Abyssinian", "Peruvian", "Teddy"],
  Hamster: ["Syrian", "Dwarf", "Roborovski", "Chinese"],
  Other: ["Mixed / unknown", "Domestic", "Mixed breed", "Not listed"]
};
function revealVisibleDashboardContent() {
  if (!dashboardView) return;

  window.requestAnimationFrame(() => {
    dashboardView.querySelectorAll(".scroll-reveal:not(.is-visible)").forEach((element) => {
      const bounds = element.getBoundingClientRect();
      if (bounds.top < window.innerHeight && bounds.bottom > 0) {
        element.classList.add("is-visible");
      }
    });
  });
}

function formatDashboardDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-PA", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function renderDashboardList(containerId, entries, emptyMessage, itemType) {
  const container = document.querySelector(`#${containerId}`);
  if (!container) return;

  container.replaceChildren();
  if (entries.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "dashboard-empty";
    emptyState.textContent = emptyMessage;
    container.append(emptyState);
    return;
  }

  entries.forEach((entry, index) => {
    const row = document.createElement("article");
    row.className = "dashboard-entry";

    const copy = document.createElement("div");
    if (itemType === "alert") {
      const badge = document.createElement("small");
      badge.className = "dashboard-entry-tag";
      badge.textContent = "PAW ALERT · DEMO";
      copy.append(badge);
    }

    const title = document.createElement("b");
    title.textContent = entry.title;
    copy.append(title);

    if (entry.detail) {
      const detail = document.createElement("small");
      detail.textContent = entry.detail;
      copy.append(detail);
    }

    row.append(copy);
    if (entry.date) {
      const date = document.createElement("span");
      date.className = "dashboard-entry-date";
      date.textContent = itemType === "alert"
        ? `Perdido: ${formatDashboardDate(entry.date)}`
        : formatDashboardDate(entry.date);
      row.append(date);
    }

    const removeButton = document.createElement("button");
    removeButton.className = "dashboard-entry-remove";
    removeButton.type = "button";
    removeButton.dataset.removeType = itemType;
    removeButton.dataset.removeIndex = String(index);
    removeButton.setAttribute("aria-label", itemType === "todo"
      ? `Completar: ${entry.title}`
      : itemType === "alert"
        ? `Retirar Paw Alert de ${entry.petName}`
        : `Quitar: ${entry.title}`);
    removeButton.textContent = itemType === "todo"
      ? "Hecho"
      : itemType === "alert"
        ? "Retirar"
        : "×";
    row.append(removeButton);
    container.append(row);
  });
}

function renderContactConsultations() {
  const container = document.querySelector("#contactConsultations");
  if (!container) return;

  const ownerEmail = (demoProfile?.ownerEmail || "").trim().toLowerCase();
  const matchingConsultations = contactConsultations.filter(
    (consultation) => consultation.email === ownerEmail
  );

  container.replaceChildren();
  if (matchingConsultations.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "dashboard-empty";
    emptyState.textContent = "No hay consultas guardadas para este correo en esta sesión.";
    container.append(emptyState);
    return;
  }

  matchingConsultations.forEach((consultation) => {
    const card = document.createElement("article");
    card.className = "dashboard-consultation";

    const heading = document.createElement("div");
    heading.className = "dashboard-consultation-heading";
    const title = document.createElement("b");
    title.textContent = `Consulta de ${consultation.name}`;
    const date = document.createElement("small");
    date.textContent = new Intl.DateTimeFormat("es-PA", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(consultation.submittedAt));
    heading.append(title, date);

    const message = document.createElement("p");
    message.className = "dashboard-consultation-message";
    message.textContent = consultation.message;

    const note = document.createElement("small");
    note.className = "dashboard-consultation-note";
    note.textContent = "Guardada en esta demostración; no se envió ni recibió respuesta.";

    card.append(heading, message, note);
    container.append(card);
  });
}

function renderDashboard() {
  if (!demoProfile) return;

  const petName = demoProfile.petName || "Tu mascota";
  const ownerName = demoProfile.ownerName || "Familia PETNOVA";
  const ownerFirstName = ownerName.trim().split(/\s+/)[0] || ownerName;
  const breed = demoProfile.breed || "Raza no especificada";
  const age = demoProfile.age ? `${demoProfile.age} años` : "Edad no especificada";
  const species = demoProfile.species || "No especificada";

  document.querySelector("#dashboardPetName").textContent = petName;
  document.querySelector("#dashboardWelcome").textContent = `¡Hola, ${ownerFirstName}!`;
  document.querySelector("#dashboardEmail").textContent =
    "Este es el resumen de bienestar de tu compañero.";
  document.querySelector("#summaryBreed").textContent = breed;
  document.querySelector("#summaryAge").textContent = age;
  document.querySelector("#summarySpecies").textContent = species;
  document.querySelector("#profilePetName").textContent = petName;
  document.querySelector("#profileOwnerName").textContent = ownerName;
  document.querySelector("#profileSpecies").textContent = species;
  document.querySelector("#profileBreed").textContent = breed;
  document.querySelector("#profileAge").textContent = age;
  document.querySelector("#profileWeight").textContent =
    demoProfile.weight ? `${demoProfile.weight} ${demoProfile.unit || "kg"}` : "No especificado";
  document.querySelector("#profileVaccination").textContent =
    demoProfile.vaccination || "Pendiente de registrar";
  document.querySelector("#profileCondition").textContent =
    demoProfile.specialCondition === "Yes"
      ? demoProfile.conditionDescription || "Sí, sin descripción"
      : "No";
  document.querySelector("#profileCity").textContent = demoProfile.city || "No especificada";
  const medicalNotes = [
    demoProfile.medicalNotes,
    demoProfile.specialCondition === "Yes" ? demoProfile.conditionDescription : ""
  ].filter(Boolean).join(" · ");
  document.querySelector("#profileMedicalNotes").textContent =
    medicalNotes || "Añade notas y datos médicos desde la sección Salud.";
  document.querySelector("#healthMedicalNotes").textContent =
    medicalNotes || "Todavía no hay notas médicas para esta mascota.";

  [document.querySelector("#dashboardAvatar"), document.querySelector("#petProfileAvatar")].forEach((avatar) => {
    avatar.replaceChildren();
    if (demoProfile.photo) {
      const image = document.createElement("img");
      image.src = demoProfile.photo;
      image.alt = `Foto de ${petName}`;
      avatar.append(image);
    } else {
      const image = document.createElement("img");
      image.className = "avatar-placeholder-image";
      image.src = "assets/pet-paw-photo.jpg";
      image.alt = "";
      avatar.append(image);
    }
  });

  document.querySelector("#appointmentCount").textContent = String(dashboardData.appointments.length);
  document.querySelector("#vaccineCount").textContent = String(dashboardData.vaccines.length);
  document.querySelector("#alertCount").textContent = String(dashboardData.alerts.length);
  document.querySelector("#todoCount").textContent = String(dashboardData.todos.length);

  renderDashboardList("homeAppointments", dashboardData.appointments, "No hay citas programadas.", "appointment");
  renderDashboardList("healthAppointments", dashboardData.appointments, "Todavía no has agendado citas.", "appointment");
  renderDashboardList("homeVaccines", dashboardData.vaccines, "Todavía no hay vacunas registradas.", "vaccine");
  renderDashboardList("healthVaccines", dashboardData.vaccines, "Todavía no hay vacunas registradas.", "vaccine");
  renderDashboardList("homeTodos", dashboardData.todos, "No tienes cuidados pendientes.", "todo");
  renderDashboardList(
    "homeAlerts",
    dashboardData.alerts,
    "Todavía no hay mascotas reportadas como perdidas.",
    "alert"
  );
  renderContactConsultations();

  const postsContainer = document.querySelector("#communityPosts");
  postsContainer.replaceChildren();
  if (dashboardData.posts.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "dashboard-empty";
    emptyState.textContent = "Aún no has compartido publicaciones en esta sesión.";
    postsContainer.append(emptyState);
  } else {
    dashboardData.posts.forEach((post) => {
      const card = document.createElement("article");
      card.className = "community-post";
      const author = document.createElement("small");
      author.textContent = `${petName.toUpperCase()} · PET MOMENT`;
      const message = document.createElement("div");
      message.textContent = post;
      card.append(author, message);
      postsContainer.append(card);
    });
  }
}

function selectDashboardView(view) {
  dashboardPanels.forEach((panel) => {
    panel.hidden = panel.dataset.dashboardPanel !== view;
  });
  document.querySelectorAll(".dashboard-nav-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.dashboardView === view);
  });
  document.querySelector("#dashboardView").scrollIntoView({ block: "start" });
  revealVisibleDashboardContent();
}

function addDashboardDialogField(labelText, name, type, value, options, required) {
  const label = document.createElement("label");
  label.textContent = labelText;

  let input;
  if (type === "textarea") {
    input = document.createElement("textarea");
  } else if (type === "select") {
    input = document.createElement("select");
    options.forEach((optionValue) => {
      input.add(new Option(optionValue, optionValue));
    });
  } else {
    input = document.createElement("input");
    input.type = type;
    if (type === "number") {
      input.min = "0";
      input.step = "any";
    }
  }

  input.name = name;
  if (required) input.required = true;
  if (value) input.value = value;
  label.append(input);
  dashboardDialogFields.append(label);
  return input;
}

function openDashboardAction(actionType) {
  activeDashboardAction = actionType;
  dashboardDialogFields.replaceChildren();
  dashboardDialogFeedback.textContent = "";

  const titles = {
    appointment: "Agendar una cita",
    vaccine: "Registrar una vacuna",
    todo: "Añadir un cuidado",
    alert: "Paw Alert · Reportar mascota perdida",
    profile: "Editar perfil de mascota"
  };
  dashboardDialogTitle.textContent = titles[actionType];

  if (actionType === "profile") {
    addDashboardDialogField("Nombre de la mascota", "petName", "text", demoProfile.petName, null, true);
    addDashboardDialogField("Especie", "species", "select", demoProfile.species, Object.keys(petBreeds), true);
    addDashboardDialogField("Raza", "breed", "text", demoProfile.breed, null, false);
    addDashboardDialogField("Edad (años)", "age", "number", demoProfile.age, null, false);
    addDashboardDialogField("Peso", "weight", "number", demoProfile.weight, null, false);
  } else if (actionType === "alert") {
    const speciesLabels = {
      Dog: "Perro",
      Cat: "Gato",
      Bird: "Ave",
      Rabbit: "Conejo"
    };
    addDashboardDialogField(
      "Nombre de la mascota",
      "petName",
      "text",
      demoProfile.petName,
      null,
      true
    );
    addDashboardDialogField(
      "Especie",
      "species",
      "select",
      speciesLabels[demoProfile.species] || "Otro",
      ["Perro", "Gato", "Ave", "Conejo", "Otro"],
      true
    );
    addDashboardDialogField("Última ubicación donde fue vista", "location", "text", "", null, true);
    addDashboardDialogField("Fecha en que se perdió", "date", "date", "", null, true);
    addDashboardDialogField(
      "Teléfono de contacto",
      "contactPhone",
      "tel",
      demoProfile.ownerPhone,
      null,
      true
    );
    addDashboardDialogField("Descripción o señas particulares (opcional)", "detail", "textarea", "", null, false);
  } else {
    const labels = {
      appointment: "Motivo o lugar de la cita",
      vaccine: "Nombre de la vacuna",
      todo: "Cuidado pendiente"
    };
    addDashboardDialogField(labels[actionType], "title", "text", "", null, true);
    addDashboardDialogField(
      actionType === "vaccine" ? "Fecha de aplicación" : "Fecha",
      "date",
      "date",
      "",
      null,
      false
    );
    addDashboardDialogField(
      actionType === "appointment" ? "Notas (opcional)" : "Detalles (opcional)",
      "detail",
      "textarea",
      "",
      null,
      false
    );
  }

  dashboardDialog.showModal();
  const firstField = dashboardDialogFields.querySelector("input, select, textarea");
  if (firstField) firstField.focus();
}
function returnToWebsite() {
  try { storeTransientHandoff("petnovaPublicHandoff", "PETNOVA_PUBLIC:", { contactConsultations }); }
  catch (error) { console.error("No se pudieron devolver las consultas a la p\u00e1gina principal.", error); }
  window.location.replace("index.html?session=ended");
}
document.querySelectorAll("[data-dashboard-view]").forEach((button) => {
  button.addEventListener("click", () => {
    selectDashboardView(button.dataset.dashboardView);
  });
});

document.querySelectorAll("[data-dashboard-action]").forEach((button) => {
  button.addEventListener("click", () => {
    openDashboardAction(button.dataset.dashboardAction);
  });
});

document.querySelectorAll("[data-dashboard-close]").forEach((button) => {
  button.addEventListener("click", () => {
    dashboardDialog.close();
  });
});

document.querySelectorAll("[data-dashboard-logout]").forEach((button) => {
  button.addEventListener("click", returnToWebsite);
});

document.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-remove-type]");
  if (!actionButton) return;

  const collection = dashboardData[`${actionButton.dataset.removeType}s`];
  if (!collection) return;

  collection.splice(Number(actionButton.dataset.removeIndex), 1);
  renderDashboard();
});

if (dashboardActionForm) {
  dashboardActionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(dashboardActionForm);

    if (activeDashboardAction === "profile") {
      demoProfile = {
        ...demoProfile,
        petName: String(formData.get("petName") || "").trim(),
        species: String(formData.get("species") || ""),
        breed: String(formData.get("breed") || "").trim(),
        age: String(formData.get("age") || ""),
        weight: String(formData.get("weight") || "")
      };
    } else {
      const collection = dashboardData[`${activeDashboardAction}s`];
      if (!collection) return;

      if (activeDashboardAction === "alert") {
        const petName = String(formData.get("petName") || "").trim();
        const location = String(formData.get("location") || "").trim();
        const contactPhone = String(formData.get("contactPhone") || "").trim();
        const extraDetail = String(formData.get("detail") || "").trim();
        const detailParts = [
          `Última vez vista: ${location}`,
          `Contacto: ${contactPhone}`,
          extraDetail
        ].filter(Boolean);

        collection.push({
          title: `${petName} · ${String(formData.get("species") || "")}`,
          petName,
          date: String(formData.get("date") || ""),
          detail: detailParts.join(" · ")
        });
      } else {
        collection.push({
          title: String(formData.get("title") || "").trim(),
          date: String(formData.get("date") || ""),
          detail: String(formData.get("detail") || "").trim()
        });
      }
    }

    renderDashboard();
    dashboardDialog.close();
  });
}

if (communityForm) {
  communityForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = communityMessage.value.trim();
    if (!message) {
      communityMessage.reportValidity();
      return;
    }

    dashboardData.posts.unshift(message);
    communityMessage.value = "";
    renderDashboard();
  });
}


if (isValidHandoff && dashboardView) {
  dashboardView.hidden = false;
  renderDashboard();
  selectDashboardView("home");
  if (sessionNotice && typeof handoff.noticeText === "string") {
    sessionNotice.textContent = handoff.noticeText;
    sessionNotice.hidden = false;
    window.setTimeout(() => { sessionNotice.hidden = true; }, 6000);
  }
}

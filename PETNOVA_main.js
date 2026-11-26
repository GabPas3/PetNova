
/* =========================================================
   PET NOVA — Funcionalidad principal
   ========================================================= */

/* 1. MENÚ DE NAVEGACIÓN MÓVIL */

const menuToggle = document.querySelector("#menuButton");
const navMenu = document.querySelector("#nav");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("active");

    navMenu.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.classList.toggle("active", isOpen);
  });

  // Cerrar el menú al seleccionar una sección
  navMenu.querySelectorAll("a, button").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      navMenu.classList.remove("open");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}


/* 2. RESALTAR LA SECCIÓN ACTIVA EN LA NAVEGACIÓN */

const sections = document.querySelectorAll("section[id]");
const navigationLinks = document.querySelectorAll(
  '.nav a.nav-link[href^="#"]'
);

if ("IntersectionObserver" in window && sections.length > 0) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const currentId = entry.target.getAttribute("id");

          navigationLinks.forEach((link) => {
            const isActive =
              link.getAttribute("href") === `#${currentId}`;

            link.classList.toggle("active", isActive);
          });
        }
      });
    },
    {
      rootMargin: "-35% 0px -55% 0px",
      threshold: 0
    }
  );

  sections.forEach((section) => {
    sectionObserver.observe(section);
  });
}

const revealTargets = document.querySelectorAll([
  ".hero-copy", ".hero-art", ".hero-bottom > *", ".intro-grid > *", ".value",
  ".feature-card", ".map-text", ".map-visual", ".mission-card",
  ".moments-head > *", ".gallery figure", ".contact-copy", ".contact-form", ".privacy-card"
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


/* 3. MODALES DE INFORMACIÓN */

const modalTriggers = document.querySelectorAll("[data-modal]");
const modalCloseButtons = document.querySelectorAll("[data-close-modal]");

function openModal(modalId) {
  const modal = document.getElementById(modalId);

  if (!modal) return;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal(modal) {
  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

modalTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();

    const modalType = trigger.dataset.modal;

    const modalContent = {
      paw: {
        title: "Paw Alert · Mascota perdida",
        text: "Desde el panel de demostración puedes registrar a tu mascota, dónde y cuándo fue vista por última vez y un teléfono de contacto. El aviso solo aparecerá en tu panel; no se publicará ni enviará notificaciones reales."
      },
      premium: {
        title: "Pet Nova Premium",
        text: "Una experiencia ampliada con herramientas adicionales para acompañar el cuidado de tu mascota. Explora la demostración y conoce cómo se organizarían sus funciones."
      }
    };

    const content = modalContent[modalType];

    if (!content) return;

    document.querySelector("#modalTitle").textContent = content.title;
    document.querySelector("#modalText").textContent = content.text;
    openModal("infoModal");
  });
});

// Cerrar mediante botones
modalCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeModal(button.closest(".modal"));
  });
});

// Cerrar al hacer clic fuera del contenido
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
});

// Cerrar con la tecla Escape
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal.open").forEach((modal) => {
      closeModal(modal);
    });
  }
});


/* 4. FILTROS DEMOSTRATIVOS DE MAPA PET */

const mapSearch = document.querySelector("#placeSearch");
const mapSearchButton = document.querySelector("#searchButton");
const mapFilters = document.querySelectorAll(".chip[data-filter]");
const searchFeedback = document.querySelector("#searchFeedback");
const mapCanvas = document.querySelector("#mapCanvas");
const mapUserPin = document.querySelector("#mapUserPin");
const mapYouLabel = document.querySelector("#mapYouLabel");
const mapInteractionHint = document.querySelector("#mapInteractionHint");
const mapCategoryLabels = {
  todos: "todos los lugares",
  veterinaria: "veterinarias",
  parques: "lugares pet-friendly",
  servicios: "servicios para mascotas"
};
const mapSearchCategories = {
  veterinaria: ["veterinaria", "veterinarias"],
  parques: ["pet-friendly", "pet friendly", "parque", "parques"],
  servicios: ["servicio", "servicios"]
};
const mapFilterPositions = {
  todos: { x: 50, y: 46, label: "Tu ubicación" },
  veterinaria: { x: 41, y: 35, label: "Zona veterinaria" },
  parques: { x: 69, y: 42, label: "Zona pet-friendly" },
  servicios: { x: 52, y: 68, label: "Zona de servicios" }
};
let mapUserPosition = { x: 50, y: 46 };
let isDraggingMapPin = false;

function updateMapSearchFeedback(searchTerm) {
  const term = searchTerm ?? (mapSearch ? mapSearch.value.trim() : "");
  const activeFilter = document.querySelector(".chip[data-filter].active");
  const filter = activeFilter ? activeFilter.dataset.filter : "todos";
  const category = mapCategoryLabels[filter] || mapCategoryLabels.todos;

  if (searchFeedback) {
    searchFeedback.textContent = term
      ? `Búsqueda de demostración: “${term}” en ${category}. El mapa es conceptual y no muestra resultados reales.`
      : `Filtro seleccionado: ${category}. El pin se movió a una zona de muestra; las ubicaciones no son reales.`;
  }
}

function moveMapPin(x, y) {
  mapUserPosition = {
    x: Math.max(8, Math.min(92, x)),
    y: Math.max(10, Math.min(90, y))
  };
  mapUserPin.style.left = `${mapUserPosition.x}%`;
  mapUserPin.style.top = `${mapUserPosition.y}%`;
}

function applyMapFilter(filter, searchTerm) {
  const target = mapFilterPositions[filter];
  if (!target || !mapUserPin) return;

  mapFilters.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  document.querySelectorAll(".map-marker[data-map-category]").forEach((marker) => {
    marker.hidden = filter !== "todos" && marker.dataset.mapCategory !== filter;
  });

  moveMapPin(target.x, target.y);
  if (mapYouLabel) mapYouLabel.textContent = target.label;
  mapUserPin.setAttribute(
    "aria-label",
    `${target.label}. Arrastra el pin o usa las flechas para moverlo.`
  );
  if (mapInteractionHint) {
    mapInteractionHint.textContent =
      `Explorando ${mapCategoryLabels[filter]}. El pin se movió a una zona conceptual, no a una dirección real.`;
  }
  updateMapSearchFeedback(searchTerm);
}

function findMapCategory(searchTerm) {
  const normalizedTerm = searchTerm.toLowerCase();
  return Object.entries(mapSearchCategories).find(([, terms]) =>
    terms.some((term) => normalizedTerm.includes(term))
  )?.[0];
}

function handleMapSearch() {
  const searchTerm = mapSearch ? mapSearch.value.trim() : "";
  const matchingCategory = findMapCategory(searchTerm);

  if (matchingCategory) {
    applyMapFilter(matchingCategory, searchTerm);
  } else {
    updateMapSearchFeedback(searchTerm);
    if (searchTerm && mapInteractionHint) {
      mapInteractionHint.textContent =
        "Búsqueda de demostración: no hay resultados reales conectados; puedes mover el pin manualmente.";
    }
  }
}

function setManualMapPosition(clientX, clientY) {
  if (!mapCanvas) return;

  const bounds = mapCanvas.getBoundingClientRect();
  const x = ((clientX - bounds.left) / bounds.width) * 100;
  const y = ((clientY - bounds.top) / bounds.height) * 100;
  moveMapPin(x, y);
}

function announceManualMapPosition() {
  if (mapYouLabel) mapYouLabel.textContent = "Ubicación elegida";
  if (mapUserPin) {
    mapUserPin.setAttribute(
      "aria-label",
      "Ubicación elegida. Arrastra el pin o usa las flechas para moverlo."
    );
  }
  if (mapInteractionHint) {
    mapInteractionHint.textContent =
      "Ubicación de demostración movida manualmente. No representa una dirección real.";
  }
  if (searchFeedback) {
    searchFeedback.textContent =
      "Marcador movido a una ubicación conceptual. El mapa no está conectado a resultados reales.";
  }
}

if (mapSearch) {
  mapSearch.addEventListener("input", handleMapSearch);
  mapSearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleMapSearch();
    }
  });
}

if (mapSearchButton) {
  mapSearchButton.addEventListener("click", handleMapSearch);
}

mapFilters.forEach((filter) => {
  filter.addEventListener("click", () => {
    applyMapFilter(filter.dataset.filter);
  });
});

document.querySelectorAll(".moment-like").forEach((button) => {
  button.addEventListener("click", () => {
    const isLiked = button.getAttribute("aria-pressed") !== "true";
    const momentTitle = button.dataset.momentTitle;

    button.setAttribute("aria-pressed", String(isLiked));
    button.setAttribute(
      "aria-label",
      `${isLiked ? "Quitar me gusta" : "Me gusta"}: ${momentTitle}`
    );
    button.classList.toggle("is-liked", isLiked);
    button.classList.toggle("heart-beat", isLiked);
    button.textContent = isLiked ? "♥" : "♡";
  });
});

const momentsCarousel = document.querySelector("#momentsCarousel");
const momentsTrack = document.querySelector("#momentsTrack");
const momentsPrev = document.querySelector("#momentsPrev");
const momentsNext = document.querySelector("#momentsNext");
const momentsPause = document.querySelector("#momentsPause");
const momentsCounter = document.querySelector("#momentsCounter");

if (
  momentsCarousel &&
  momentsTrack &&
  momentsPrev &&
  momentsNext &&
  momentsPause &&
  momentsCounter
) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const totalSlides = momentsTrack.children.length;
  let currentIndex = 0;
  let activeDirection = 1;
  let isTransitioning = false;
  let isInViewport = false;
  let isControlFocused = false;
  let isManuallyPaused = false;
  let autoplayTimer = 0;
  let transitionFallback = 0;
  let transitionEndHandler;

  function getVisibleSlideCount() {
    const firstSlide = momentsTrack.firstElementChild;
    if (!firstSlide) return 1;

    const gap = Number.parseFloat(getComputedStyle(momentsTrack).columnGap) || 0;
    const slideWidth = firstSlide.getBoundingClientRect().width;

    return Math.max(
      1,
      Math.round((momentsTrack.parentElement.clientWidth + gap) / (slideWidth + gap))
    );
  }

  function updateSlideAccessibility() {
    const visibleCount = getVisibleSlideCount();

    Array.from(momentsTrack.children).forEach((slide, index) => {
      const isVisible = index < visibleCount;
      const likeButton = slide.querySelector(".moment-like");

      slide.setAttribute("aria-hidden", String(!isVisible));
      if (likeButton) likeButton.tabIndex = isVisible ? 0 : -1;
    });
  }

  function clearAutoplay() {
    window.clearTimeout(autoplayTimer);
    autoplayTimer = 0;
  }

  function scheduleAutoplay() {
    clearAutoplay();
    if (
      reducedMotion.matches ||
      isManuallyPaused ||
      isControlFocused ||
      !isInViewport ||
      document.hidden
    ) {
      return;
    }

    autoplayTimer = window.setTimeout(() => moveSlide(1), 2300);
  }

  function resetTrackPosition() {
    momentsTrack.style.transition = "none";
    momentsTrack.style.transform = "translate3d(0,0,0)";
    momentsTrack.offsetWidth;
    window.requestAnimationFrame(() => {
      momentsTrack.style.transition = "";
    });
  }

  function finishMove() {
    if (!isTransitioning) return;

    window.clearTimeout(transitionFallback);
    momentsTrack.removeEventListener("transitionend", transitionEndHandler);
    if (activeDirection > 0) {
      momentsTrack.append(momentsTrack.firstElementChild);
    }

    currentIndex = (currentIndex + activeDirection + totalSlides) % totalSlides;
    momentsCounter.textContent =
      `${String(currentIndex + 1).padStart(2, "0")} / ${String(totalSlides).padStart(2, "0")}`;
    resetTrackPosition();
    isTransitioning = false;
    updateSlideAccessibility();
    scheduleAutoplay();
  }

  function moveSlide(direction) {
    if (isTransitioning || totalSlides < 2) return;

    clearAutoplay();
    activeDirection = direction;
    isTransitioning = true;

    const firstSlide = momentsTrack.firstElementChild;
    const gap = Number.parseFloat(getComputedStyle(momentsTrack).columnGap) || 0;
    const step = firstSlide.getBoundingClientRect().width + gap;

    if (reducedMotion.matches || !step) {
      if (direction > 0) {
        momentsTrack.append(firstSlide);
      } else {
        momentsTrack.prepend(momentsTrack.lastElementChild);
      }

      currentIndex = (currentIndex + direction + totalSlides) % totalSlides;
      momentsCounter.textContent =
        `${String(currentIndex + 1).padStart(2, "0")} / ${String(totalSlides).padStart(2, "0")}`;
      isTransitioning = false;
      updateSlideAccessibility();
      scheduleAutoplay();
      return;
    }

    if (direction < 0) {
      momentsTrack.style.transition = "none";
      momentsTrack.prepend(momentsTrack.lastElementChild);
      momentsTrack.style.transform = `translate3d(-${step}px,0,0)`;
      momentsTrack.offsetWidth;
    }

    transitionEndHandler = (event) => {
      if (event.propertyName === "transform") finishMove();
    };
    momentsTrack.addEventListener("transitionend", transitionEndHandler);
    transitionFallback = window.setTimeout(finishMove, 520);
    momentsTrack.style.transition = "";

    if (direction > 0) {
      momentsTrack.style.transform = `translate3d(-${step}px,0,0)`;
    } else {
      window.requestAnimationFrame(() => {
        momentsTrack.style.transform = "translate3d(0,0,0)";
      });
    }
  }

  momentsPrev.addEventListener("click", () => moveSlide(-1));
  momentsNext.addEventListener("click", () => moveSlide(1));
  momentsPause.hidden = reducedMotion.matches;
  momentsPause.addEventListener("click", () => {
    isManuallyPaused = !isManuallyPaused;
    if (!isManuallyPaused) isControlFocused = false;
    momentsPause.setAttribute("aria-pressed", String(isManuallyPaused));
    momentsPause.setAttribute(
      "aria-label",
      isManuallyPaused ? "Reanudar carrusel" : "Pausar carrusel"
    );
    momentsPause.textContent = isManuallyPaused ? "▶" : "Ⅱ";
    scheduleAutoplay();
  });

  momentsCarousel.addEventListener("focusin", (event) => {
    if (event.target === momentsPause) return;
    isControlFocused = true;
    scheduleAutoplay();
  });
  momentsCarousel.addEventListener("focusout", (event) => {
    if (
      !momentsCarousel.contains(event.relatedTarget) ||
      event.relatedTarget === momentsPause
    ) {
      isControlFocused = false;
      scheduleAutoplay();
    }
  });
  document.addEventListener("visibilitychange", scheduleAutoplay);
  window.addEventListener("resize", () => {
    if (isTransitioning) finishMove();
    updateSlideAccessibility();
    scheduleAutoplay();
  });

  if ("IntersectionObserver" in window) {
    const momentsObserver = new IntersectionObserver(([entry]) => {
      isInViewport = entry.isIntersecting;
      scheduleAutoplay();
    }, { threshold: 0.15 });

    momentsObserver.observe(momentsCarousel);
  } else {
    isInViewport = true;
  }

  updateSlideAccessibility();
  scheduleAutoplay();
}

if (mapCanvas && mapUserPin) {
  mapUserPin.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    isDraggingMapPin = true;
    mapUserPin.classList.add("is-dragging");
    mapUserPin.setPointerCapture(event.pointerId);
  });

  mapUserPin.addEventListener("pointermove", (event) => {
    if (isDraggingMapPin) {
      setManualMapPosition(event.clientX, event.clientY);
    }
  });

  const finishMapPinDrag = () => {
    if (!isDraggingMapPin) return;
    isDraggingMapPin = false;
    mapUserPin.classList.remove("is-dragging");
    announceManualMapPosition();
  };

  mapUserPin.addEventListener("pointerup", finishMapPinDrag);
  mapUserPin.addEventListener("pointercancel", finishMapPinDrag);
  mapUserPin.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 8 : 3;
    const offsets = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step]
    };
    const offset = offsets[event.key];
    if (!offset) return;

    event.preventDefault();
    moveMapPin(mapUserPosition.x + offset[0], mapUserPosition.y + offset[1]);
    announceManualMapPosition();
  });
}


/* 5. FORMULARIO DE CONTACTO */

const contactForm = document.querySelector("#contactForm");
const contactFields = document.querySelector("#contactFields");
const contactSuccess = document.querySelector("#contactSuccess");
const contactFeedback = document.querySelector("#formFeedback");
const contactLoginButton = document.querySelector("#contactLoginButton");
const contactConsultations = [];
function consumeTransientHandoff(storageKey, namePrefix) {
  try {
    const storedValue = sessionStorage.getItem(storageKey);
    if (storedValue !== null) {
      sessionStorage.removeItem(storageKey);
      if (window.name.startsWith(namePrefix)) window.name = "";
      return JSON.parse(storedValue);
    }
  } catch (error) {
    console.error("No se pudo leer el traspaso temporal de PETNOVA desde sessionStorage.", error);
  }
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

const returnedPublicHandoff = consumeTransientHandoff("petnovaPublicHandoff", "PETNOVA_PUBLIC:");
if (returnedPublicHandoff && Array.isArray(returnedPublicHandoff.contactConsultations)) {
  returnedPublicHandoff.contactConsultations.forEach((consultation) => {
    if (consultation && typeof consultation.name === "string" && typeof consultation.email === "string" &&
        typeof consultation.message === "string" && typeof consultation.submittedAt === "string") {
      contactConsultations.push(consultation);
    }
  });
}


if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = contactForm.querySelector('[name="name"]')?.value.trim();
    const email = contactForm.querySelector('[name="email"]')?.value.trim();
    const message = contactForm.querySelector('[name="message"]')?.value.trim();

    if (!name || !email || !message) {
      contactForm.reportValidity();
      return;
    }

    contactConsultations.unshift({
      name,
      email: email.toLowerCase(),
      message,
      submittedAt: new Date().toISOString()
    });

    if (contactFeedback) {
      contactFeedback.textContent =
        `Gracias, ${name}. En la plataforma completa, uno de nuestros especialistas se pondrá en contacto contigo. ` +
        "Esta versión de prueba no envía la consulta ni genera una respuesta; quedó guardada temporalmente. " +
        "Inicia sesión en la demostración con el mismo correo para verla en Salud y cuidados.";
    }

    if (contactFields) contactFields.hidden = true;
    if (contactSuccess) contactSuccess.hidden = false;
    contactForm.reset();
  });
}

if (contactLoginButton) {
  contactLoginButton.addEventListener("click", () => {
    const latestConsultation = contactConsultations[0];
    if (latestConsultation && loginEmail) {
      loginEmail.value = latestConsultation.email;
    }
  });
}


/* 6. AÑO AUTOMÁTICO DEL PIE DE PÁGINA */

const yearElement = document.querySelector("#currentYear");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}


/* 7. ACCESO Y REGISTRO DE DEMOSTRACIÓN */

const authOverlay = document.querySelector("#authOverlay");
const authFeedback = document.querySelector("#authFeedback");
const loginForm = document.querySelector("#loginForm");
const loginEmail = document.querySelector("#loginEmail");
const rememberEmail = document.querySelector('[name="remember"]');
const loginNavButton = document.querySelector("#loginNavButton");
const sessionNotice = document.querySelector("#sessionNotice");
const signupForm = document.querySelector("#signupForm");
const signupPanels = document.querySelectorAll("[data-signup-step]");
const signupIndicators = document.querySelectorAll("[data-step-indicator]");
const signupBack = document.querySelector("#signupBack");
const signupNext = document.querySelector("#signupNext");
const signupSubmit = document.querySelector("#signupSubmit");
const petSpecies = document.querySelector("#petSpecies");
const petBreed = document.querySelector("#petBreed");
const petBreedOther = document.querySelector("#petBreedOther");
const breedOtherField = document.querySelector("#breedOtherField");
const specialCondition = document.querySelector("#specialCondition");
const conditionDescriptionField = document.querySelector("#conditionDescriptionField");
const conditionDescription = document.querySelector("#conditionDescription");
const ownerPassword = document.querySelector("#ownerPassword");
const confirmPassword = document.querySelector("#confirmPassword");
const petPhoto = document.querySelector("#petPhoto");
const petPhotoPreview = document.querySelector("#petPhotoPreview");
const photoPlaceholder = document.querySelector("#photoPlaceholder");
let activeSignupStep = 0;
let petPhotoUrl = "";
let lastAuthTrigger = null;

if (loginEmail && rememberEmail) {
  try {
    const savedEmail = localStorage.getItem("petnovaRememberedEmail");
    if (savedEmail) {
      loginEmail.value = savedEmail;
      rememberEmail.checked = true;
    }
  } catch (error) {
    console.error("No se pudo leer el correo guardado para PETNOVA.", error);
  }
}


const petBreeds = {
  Dog: ["Labrador Retriever", "Poodle", "German Shepherd", "Mixed breed"],
  Cat: ["Persian", "Siamese", "Maine Coon", "Domestic Shorthair"],
  Bird: ["Parakeet", "Cockatiel", "Canary", "Lovebird"],
  Rabbit: ["Holland Lop", "Lionhead", "Mini Rex", "Dutch"],
  "Guinea pig": ["American", "Abyssinian", "Peruvian", "Teddy"],
  Hamster: ["Syrian", "Dwarf", "Roborovski", "Chinese"],
  Other: ["Mixed / unknown", "Domestic", "Mixed breed", "Not listed"]
};
function setAuthFeedback(message, isError) {
  if (!authFeedback) return;
  authFeedback.textContent = message;
  authFeedback.classList.toggle("is-error", Boolean(isError));
}
function setAuthMode(mode) {
  const isSignup = mode === "signup";

  if (loginForm) loginForm.hidden = isSignup;
  if (signupForm) signupForm.hidden = !isSignup;

  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    const isActive = button.dataset.authMode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  const welcomeTitle = document.querySelector("#authTitle");
  if (welcomeTitle) {
    welcomeTitle.textContent = isSignup
      ? "Cada mascota merece su propio espacio"
      : "Qué bueno tenerte de vuelta";
  }

  setAuthFeedback("", false);
  if (isSignup) setSignupStep(0);
}
function openAuth(mode, trigger) {
  if (!authOverlay) return;

  lastAuthTrigger = trigger;
  authOverlay.classList.add("is-open");
  authOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("auth-open");
  setAuthMode(mode);

  const firstField = mode === "signup"
    ? document.querySelector("#petName")
    : document.querySelector("#loginEmail");
  if (firstField) firstField.focus();
}
function closeAuth() {
  if (!authOverlay) return;
  const canRestoreTrigger = lastAuthTrigger && !lastAuthTrigger.hidden && lastAuthTrigger.offsetParent !== null;
  const focusTarget = canRestoreTrigger ? lastAuthTrigger : loginNavButton;
  if (authOverlay.contains(document.activeElement)) document.activeElement.blur();
  authOverlay.classList.remove("is-open");
  authOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("auth-open");
  setAuthFeedback("", false);
  if (focusTarget) window.setTimeout(() => focusTarget.focus(), 0);
}
function setSignupStep(step) {
  activeSignupStep = step;

  signupPanels.forEach((panel) => {
    panel.hidden = Number(panel.dataset.signupStep) !== step;
  });

  signupIndicators.forEach((indicator) => {
    const indicatorStep = Number(indicator.dataset.stepIndicator);
    indicator.classList.toggle("is-active", indicatorStep === step);
    indicator.classList.toggle("is-complete", indicatorStep < step);
  });

  if (signupBack) signupBack.hidden = step === 0;
  if (signupNext) signupNext.hidden = step === signupPanels.length - 1;
  if (signupSubmit) signupSubmit.hidden = step !== signupPanels.length - 1;
  setAuthFeedback("", false);
}
function validateSignupStep(step) {
  const panel = document.querySelector(`[data-signup-step="${step}"]`);
  if (!panel) return false;

  const requiredFields = panel.querySelectorAll("[required]");
  for (const field of requiredFields) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }

  if (step === 2 && ownerPassword && confirmPassword &&
      ownerPassword.value !== confirmPassword.value) {
    confirmPassword.setCustomValidity("Las contraseñas no coinciden.");
    confirmPassword.reportValidity();
    return false;
  }

  return true;
}
function makeDefaultDemoProfile(email) {
  const firstName = email.split("@")[0].split(/[._-]/)[0];
  return {
    ownerName: firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : "Familia PETNOVA",
    ownerEmail: email, ownerPhone: "", city: "Panam\u00e1", petName: "Luna", species: "Dog",
    breed: "Labrador Retriever", age: "3", weight: "8.5", unit: "kg",
    vaccination: "Pendiente de registrar", specialCondition: "No", conditionDescription: "",
    medicalNotes: "", photo: ""
  };
}
function startDemoSession(profile, noticeText) {
  try {
    storeTransientHandoff("petnovaDemoHandoff", "PETNOVA_DEMO:", { profile, contactConsultations, noticeText });
    window.location.assign("demo.html");
  } catch (error) {
    console.error("No se pudo iniciar el panel demo de PETNOVA.", error);
    setAuthFeedback("No se pudo abrir la demostraci\u00f3n. Int\u00e9ntalo de nuevo o elimina una foto muy grande.", true);
  }
}
function readPhotoDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("No se pudo leer la foto.")), { once: true });
    reader.addEventListener("error", () => reject(reader.error || new Error("No se pudo leer la foto.")), { once: true });
    reader.readAsDataURL(file);
  });
}

document.querySelectorAll("[data-auth-open]").forEach((button) => {
  button.addEventListener("click", () => {
    openAuth(button.dataset.authOpen, button);
  });
});

document.querySelectorAll("[data-auth-close]").forEach((button) => {
  button.addEventListener("click", closeAuth);
});

document.querySelectorAll("[data-auth-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    setAuthMode(button.dataset.authMode);
  });
});

if (authOverlay) {
  authOverlay.addEventListener("click", (event) => {
    if (event.target === authOverlay) closeAuth();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && authOverlay?.classList.contains("is-open")) {
    closeAuth();
  }
});

if (petSpecies && petBreed) {
  petSpecies.addEventListener("change", () => {
    const breeds = petBreeds[petSpecies.value] || [];
    petBreed.replaceChildren(new Option("Seleccionar raza", ""));
    breeds.forEach((breed) => petBreed.add(new Option(breed, breed)));
    petBreed.add(new Option("Other", "Other"));
    petBreed.disabled = breeds.length === 0;
    petBreedOther.required = false;
    petBreedOther.value = "";
    breedOtherField.hidden = true;
  });
}

if (petBreed) {
  petBreed.addEventListener("change", () => {
    const showOther = petBreed.value === "Other";
    breedOtherField.hidden = !showOther;
    petBreedOther.required = showOther;
  });
}

if (specialCondition) {
  specialCondition.addEventListener("change", () => {
    const hasCondition = specialCondition.value === "Yes";
    conditionDescriptionField.hidden = !hasCondition;
    conditionDescription.required = hasCondition;
    if (!hasCondition) conditionDescription.value = "";
  });
}

if (ownerPassword && confirmPassword) {
  [ownerPassword, confirmPassword].forEach((field) => {
    field.addEventListener("input", () => {
      confirmPassword.setCustomValidity("");
    });
  });
}

if (signupNext) {
  signupNext.addEventListener("click", () => {
    if (validateSignupStep(activeSignupStep)) {
      setSignupStep(Math.min(activeSignupStep + 1, signupPanels.length - 1));
    }
  });
}

if (signupBack) {
  signupBack.addEventListener("click", () => {
    setSignupStep(Math.max(activeSignupStep - 1, 0));
  });
}

if (petPhoto && petPhotoPreview && photoPlaceholder) {
  petPhoto.addEventListener("change", () => {
    if (petPhotoUrl) URL.revokeObjectURL(petPhotoUrl);
    const file = petPhoto.files && petPhoto.files[0];

    if (!file) {
      petPhotoPreview.hidden = true;
      photoPlaceholder.hidden = false;
      petPhotoUrl = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      petPhoto.value = "";
      setAuthFeedback("Selecciona un archivo de imagen para la foto.", true);
      return;
    }

    petPhotoUrl = URL.createObjectURL(file);
    petPhotoPreview.src = petPhotoUrl;
    petPhotoPreview.hidden = false;
    photoPlaceholder.hidden = true;
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateSignupStep(activeSignupStep)) return;
    let photo = "";
    const selectedPhoto = petPhoto.files && petPhoto.files[0];
    if (selectedPhoto) {
      try { photo = await readPhotoDataUrl(selectedPhoto); }
      catch (error) {
        console.error("No se pudo preparar la foto para la demostraci\u00f3n.", error);
        setAuthFeedback("No se pudo preparar la foto. Prueba con otra imagen.", true);
        return;
      }
    }
    const profile = {
      ownerName: document.querySelector("#ownerName").value.trim(),
      ownerEmail: document.querySelector("#ownerEmail").value.trim(),
      ownerPhone: document.querySelector("#ownerPhone").value.trim(),
      city: document.querySelector("#ownerCity").value,
      petName: document.querySelector("#petName").value.trim(),
      species: document.querySelector("#petSpecies").value,
      breed: petBreed.value === "Other" ? petBreedOther.value.trim() : petBreed.value,
      age: document.querySelector("#petAge").value,
      weight: document.querySelector("#petWeight").value,
      unit: document.querySelector("#weightUnit").value,
      vaccination: document.querySelector("#petVaccination").value,
      specialCondition: specialCondition.value,
      conditionDescription: conditionDescription.value.trim(),
      medicalNotes: document.querySelector("#medicalNotes").value.trim(), photo
    };
    startDemoSession(profile, "Perfil creado para esta demostraci\u00f3n. La informaci\u00f3n solo se conserva durante esta sesi\u00f3n y no se env\u00eda a un servidor.");
  });
}
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    for (const field of loginForm.querySelectorAll("[required]")) {
      if (!field.checkValidity()) { field.reportValidity(); return; }
    }
    let rememberEmailError = false;
    try {
      if (rememberEmail.checked) localStorage.setItem("petnovaRememberedEmail", loginEmail.value.trim());
      else localStorage.removeItem("petnovaRememberedEmail");
    } catch (error) {
      console.error("No se pudo guardar la preferencia de correo de PETNOVA.", error);
      rememberEmailError = true;
    }
    startDemoSession(
      makeDefaultDemoProfile(loginEmail.value.trim()),
      rememberEmailError
        ? "Entraste en modo demostraci\u00f3n, pero no se pudo recordar el correo en este navegador. La cuenta no se valida contra un servidor."
        : "Entraste al panel PETNOVA en modo demostraci\u00f3n. La cuenta a\u00fan no se valida contra un servidor."
    );
  });
}

const latestReturnedConsultation = contactConsultations[0];
if (latestReturnedConsultation && contactFields && contactSuccess) {
  contactFields.hidden = true;
  contactSuccess.hidden = false;
  if (contactFeedback) contactFeedback.textContent = `La consulta de ${latestReturnedConsultation.name} sigue disponible en esta sesi\u00f3n de demostraci\u00f3n.`;
}
if (sessionNotice) {
  const state = new URLSearchParams(window.location.search).get("session");
  if (state) {
    sessionNotice.textContent = state === "ended"
      ? "Se cerr\u00f3 la sesi\u00f3n de demostraci\u00f3n. La informaci\u00f3n temporal se borrar\u00e1 al recargar la p\u00e1gina."
      : state === "expired"
        ? "La sesi\u00f3n de demostraci\u00f3n termin\u00f3 al recargar la p\u00e1gina; los datos temporales se borraron."
        : "No se pudo completar el traspaso a la demostraci\u00f3n. Int\u00e9ntalo de nuevo desde el acceso.";
    sessionNotice.hidden = false;
    window.history.replaceState({}, "", window.location.pathname + window.location.hash);
    window.setTimeout(() => { sessionNotice.hidden = true; }, 6000);
  }
}

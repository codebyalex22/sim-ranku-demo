const DESKTOP_QUERY = window.matchMedia("(min-width: 1024px)");
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
const REQUEST_TIMEOUT_MS = 15000;

const siteHeader = document.querySelector(".site-header");
const logoLink = document.querySelector(".site-header .logo");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");
const form = document.querySelector("#contact-form");
const submitButton = form.querySelector('button[type="submit"]');
const submitLabel = submitButton.querySelector(".button__label");
const formFields = form.querySelector(".contact-form__fields");
const formStatus = document.querySelector("#form-status");
const yearElement = document.querySelector("#year");

const SUBMIT_TEXT = submitLabel.textContent;

// Тексти інтерфейсу для обох мов; мова береться з <html lang="…">.
const MESSAGES = {
  uk: {
    nameEmpty: "Вкажіть, як до вас звертатися.",
    nameShort: "Ім'я має містити щонайменше 2 символи.",
    contactEmpty: "Вкажіть телефон або email, щоб ми могли відповісти.",
    emailInvalid: "Перевірте email, наприклад name@mail.com.",
    phoneInvalid: "Перевірте номер, наприклад +380 67 123 45 67.",
    messageEmpty: "Опишіть, що бажаєте замовити.",
    messageShort: "Додайте трохи деталей — щонайменше 10 символів.",
    sending: "Надсилаємо…",
    demo: "Демо-режим: заявку не надіслано. Форма заповнена правильно, але реальне надсилання на цьому сайті не підключене. Для справжнього бізнесу тут підключається сервер або сервіс форм.",
    success: "Дякуємо! Заявку отримано. Ми зв'яжемося з вами протягом робочого дня.",
    error: "Не вдалося надіслати заявку. Перевірте з'єднання та спробуйте ще раз або зателефонуйте за номером ",
  },
  en: {
    nameEmpty: "Please tell us your name.",
    nameShort: "Your name should be at least 2 characters long.",
    contactEmpty: "Please enter a phone number or email so we can reply.",
    emailInvalid: "Please check your email, e.g. name@mail.com.",
    phoneInvalid: "Please check the number, e.g. +380 67 123 45 67.",
    messageEmpty: "Please tell us what you'd like to order.",
    messageShort: "Please add a few more details (at least 10 characters).",
    sending: "Sending…",
    demo: "Demo mode: your request was not sent. The form is filled in correctly, but real sending isn't connected on this site. A live business site would connect a server or a form service here.",
    success: "Thank you! We've received your request and will get back to you within one business day.",
    error: "We couldn't send your request. Check your connection and try again, or call us at ",
  },
};
const T = document.documentElement.lang.startsWith("en") ? MESSAGES.en : MESSAGES.uk;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[\d\s()-]{10,20}$/;

const validators = {
  name(value) {
    if (!value) return T.nameEmpty;
    if (value.length < 2) return T.nameShort;
    return "";
  },
  contact(value) {
    if (!value) return T.contactEmpty;
    if (value.includes("@")) {
      return EMAIL_PATTERN.test(value) ? "" : T.emailInvalid;
    }
    const digits = value.replace(/\D/g, "");
    if (!PHONE_PATTERN.test(value) || digits.length < 10 || digits.length > 13) {
      return T.phoneInvalid;
    }
    return "";
  },
  message(value) {
    if (!value) return T.messageEmpty;
    if (value.length < 10) return T.messageShort;
    return "";
  },
};

let submitAttempted = false;

/* Мобільне меню */
function updateNavHeight() {
  const headerBottom = siteHeader.getBoundingClientRect().bottom;
  siteNav.style.setProperty("--nav-height", `${window.innerHeight - headerBottom}px`);
}

function setMenuOpen(isOpen, { returnFocus = false } = {}) {
  if (isOpen) {
    updateNavHeight();
  }

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  siteNav.classList.toggle("is-open", isOpen);
  document.documentElement.classList.toggle("menu-open", isOpen);

  if (!isOpen && returnFocus) {
    menuToggle.focus();
  }
}

function isMenuOpen() {
  return menuToggle.getAttribute("aria-expanded") === "true";
}

// Поки мобільне меню відкрите, Tab не виходить за межі шапки.
function trapFocusInHeader(event) {
  const focusable = [...siteHeader.querySelectorAll("a[href], button:not([disabled])")];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

menuToggle.addEventListener("click", () => {
  setMenuOpen(!isMenuOpen());
});

siteNav.addEventListener("click", (event) => {
  if (event.target.closest("a") && !DESKTOP_QUERY.matches) {
    setMenuOpen(false);
  }
});

// Логотип веде нагору, тому відкрите меню теж має закриватися.
logoLink.addEventListener("click", () => {
  if (isMenuOpen()) setMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (!isMenuOpen()) return;

  if (event.key === "Escape") {
    setMenuOpen(false, { returnFocus: true });
  } else if (event.key === "Tab") {
    trapFocusInHeader(event);
  }
});

document.addEventListener("click", (event) => {
  if (isMenuOpen() && !event.target.closest(".site-header")) {
    setMenuOpen(false);
  }
});

window.addEventListener("resize", () => {
  if (isMenuOpen()) updateNavHeight();
});

DESKTOP_QUERY.addEventListener("change", () => setMenuOpen(false));

/* Тінь шапки після початку прокручування */
function updateHeaderShadow() {
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 8);
}

window.addEventListener("scroll", updateHeaderShadow, { passive: true });
updateHeaderShadow();

/* Поява блоків під час прокручування */
function revealOnScroll() {
  const items = document.querySelectorAll("[data-reveal]");

  const finish = (element) => {
    element.classList.add("is-visible");
    // Після появи прибираємо атрибут, щоб hover-ефекти працювали без затримки.
    window.setTimeout(() => {
      element.removeAttribute("data-reveal");
      element.classList.remove("is-visible");
    }, 1200);
  };

  const showAll = () => items.forEach((element) => element.removeAttribute("data-reveal"));

  if (!("IntersectionObserver" in window) || REDUCED_MOTION.matches) {
    showAll();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          finish(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );

  items.forEach((element) => observer.observe(element));
}

try {
  revealOnScroll();
} catch (error) {
  document.documentElement.classList.remove("js");
  console.error("Анімацію появи вимкнено:", error);
}
// Сигнал для запобіжника в <head>: скрипт запустився, анімацію можна залишити.
document.documentElement.setAttribute("data-ready", "");

/* Форма */
function getValue(name) {
  return form.elements[name].value.trim();
}

function showFieldError(name, message) {
  const field = form.elements[name];
  const error = document.querySelector(`#${name}-error`);

  error.textContent = message;
  error.hidden = !message;

  if (message) {
    field.setAttribute("aria-invalid", "true");
  } else {
    field.removeAttribute("aria-invalid");
  }
}

function validateField(name) {
  const message = validators[name](getValue(name));
  showFieldError(name, message);
  return !message;
}

function validateForm() {
  const invalidNames = Object.keys(validators).filter((name) => !validateField(name));

  if (invalidNames.length > 0) {
    form.elements[invalidNames[0]].focus();
  }

  return invalidNames.length === 0;
}

function setStatus(type, content) {
  formStatus.className = `form-status form-status--${type}`;
  formStatus.replaceChildren(...content);
  formStatus.hidden = false;
}

function clearStatus() {
  formStatus.hidden = true;
  formStatus.replaceChildren();
}

function setLoading(isLoading) {
  form.setAttribute("aria-busy", String(isLoading));
  submitButton.classList.toggle("is-loading", isLoading);
  submitLabel.textContent = isLoading ? T.sending : SUBMIT_TEXT;

  formFields.disabled = isLoading;
}

function getPayload() {
  return {
    name: getValue("name"),
    contact: getValue("contact"),
    message: getValue("message"),
  };
}

function createLink(href, text) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = text;
  return link;
}

/*
  Демо-режим: серверного обробника немає, тому дані нікуди не передаються.
  Відвідувач чесно бачить, що заявку не надіслано, а введене залишається у формі.
*/
function handleDemoSubmit() {
  setStatus("info", [
    T.demo,
  ]);
}

async function sendToEndpoint(endpoint, payload) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    form.reset();
    submitAttempted = false;
    setStatus("success", [
      T.success,
    ]);
  } catch (error) {
    console.error("Не вдалося надіслати заявку:", error);
    setStatus("error", [
      T.error,
      createLink("tel:+380000000000", "+380 00 000 00 00"),
      ".",
    ]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitAttempted = true;
  clearStatus();

  if (!validateForm()) {
    return;
  }

  const endpoint = form.dataset.endpoint.trim();

  if (!endpoint) {
    handleDemoSubmit();
    return;
  }

  setLoading(true);
  await sendToEndpoint(endpoint, getPayload());
  setLoading(false);
  submitButton.focus();
});

form.addEventListener("input", (event) => {
  const { name } = event.target;

  if (name in validators && (submitAttempted || event.target.hasAttribute("aria-invalid"))) {
    validateField(name);
  }
});

form.addEventListener("focusout", (event) => {
  const { name } = event.target;

  if (name in validators && getValue(name)) {
    validateField(name);
  }
});

// Поля вимкнені в HTML, щоб без JavaScript форму не можна було відправити.
formFields.disabled = false;

yearElement.textContent = String(new Date().getFullYear());

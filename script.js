(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* =========================
     Header: Links dropdown
     ========================= */
  function initLinksDropdown() {
    const btn = $("#linksBtn");
    const menu = $("#linksMenu");
    if (!btn || !menu) return;

    const close = () => {
      btn.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-open");
    };

    const open = () => {
      btn.setAttribute("aria-expanded", "true");
      menu.classList.add("is-open");
    };

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const expanded = btn.getAttribute("aria-expanded") === "true";
      expanded ? close() : open();
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !btn.contains(e.target)) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  /* =========================
     Theme toggle (skulls swap via CSS)
     + system theme match (auto, live)
     ========================= */
  function initThemeToggle() {
    const btn = $("#themeBtn");
    if (!btn) return;

    const root = document.documentElement;
    const icon = btn.querySelector(".themeBtn__icon");

    // Keys
    const THEME_KEY = "theme";       // "light" | "dark"
    const PREF_KEY = "themePref";    // "system" | "manual"

    // System preference
    const mq = window.matchMedia?.("(prefers-color-scheme: light)");

    const setUI = (theme) => {
      // helps browser-native UI (form controls, etc.) match the theme
      root.style.colorScheme = theme;

      // accessibility + keeps state explicit
      btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
      btn.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");

      if (icon) icon.textContent = theme === "light" ? "☀" : "☾";
    };

    // System-follow apply: does NOT write THEME_KEY
    const applySystem = (theme) => {
      root.setAttribute("data-theme", theme);
      setUI(theme);
    };

    // Manual apply: writes THEME_KEY
    const applyManual = (theme) => {
      root.setAttribute("data-theme", theme);
      localStorage.setItem(THEME_KEY, theme);
      setUI(theme);
    };

    // Determine mode
    const pref = localStorage.getItem(PREF_KEY);
    const savedTheme = localStorage.getItem(THEME_KEY);

    // If pref is missing (older version), default to SYSTEM mode so OS changes work.
    const mode = pref === "manual" ? "manual" : "system";

    const systemTheme = () => (mq?.matches ? "light" : "dark");

    if (mode === "manual" && (savedTheme === "light" || savedTheme === "dark")) {
      applyManual(savedTheme);
    } else {
      // SYSTEM MODE (default)
      localStorage.setItem(PREF_KEY, "system");
      applySystem(systemTheme());
    }

    // Live sync when in system mode
    const onSystemChange = (e) => {
      const curPref = localStorage.getItem(PREF_KEY);
      if (curPref === "manual") return;

      applySystem(e.matches ? "light" : "dark");
    };

    if (mq) {
      // modern browsers
      if (typeof mq.addEventListener === "function") mq.addEventListener("change", onSystemChange);
      // older safari
      else if (typeof mq.addListener === "function") mq.addListener(onSystemChange);
    }

    // Manual toggle (locks preference)
    btn.addEventListener("click", () => {
      localStorage.setItem(PREF_KEY, "manual");

      const cur = root.getAttribute("data-theme") || "dark";
      applyManual(cur === "dark" ? "light" : "dark");
    });
  }

  /* =========================
     Twitch iframe src builder (required "parent=")
     ========================= */
  function initTwitchEmbed() {
    const iframe = $("#twitchEmbed");
    if (!iframe) return;

    const channel = iframe.getAttribute("data-channel") || "D3LTANIN3ttv";
    const parent = window.location.hostname || "localhost";

    if (!iframe.getAttribute("src")) {
      const src =
        `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}` +
        `&parent=${encodeURIComponent(parent)}` +
        `&muted=true`;

      iframe.setAttribute("src", src);
    }
  }

  /* =========================
     Footer helpers
     ========================= */
  function initFooterBits() {
    const year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());

    const toTop = $("#toTopBtn");
    if (toTop) {
      toTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  /* =========================
     Pixel dissolve intro overlay
     (pure overlay, removed after)
     ========================= */
  function runPixelDissolve() {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduce) return;

  const overlay = document.createElement("div");
  overlay.className = "pixelOverlay";
  overlay.innerHTML = `<div class="pixelOverlay__grid" aria-hidden="true"></div>`;
  document.body.appendChild(overlay);

  const grid = overlay.querySelector(".pixelOverlay__grid");
  if (!grid) return;

  const cols = 24;
  const rows = 14;
  const total = cols * rows;

  grid.style.setProperty("--cols", String(cols));
  grid.style.setProperty("--rows", String(rows));

  const frag = document.createDocumentFragment();
  for (let i = 0; i < total; i++) {
    const px = document.createElement("span");
    px.className = "px";
    frag.appendChild(px);
  }
  grid.appendChild(frag);

  const pixels = $$(".px", grid);
  pixels.sort(() => Math.random() - 0.5);

  requestAnimationFrame(() => overlay.classList.add("is-on"));

  // shuffle pixel order for retro-style dissolve
  const shuffled = [...pixels].sort(() => Math.random() - 0.5);

  shuffled.forEach((px, i) => {
    px.style.setProperty("--d", `${i * 7}ms`);

    // slight per-pixel brightness variation for retro depth
    const alpha = (0.82 + Math.random() * 0.16).toFixed(2);
    px.style.setProperty("--px-a", alpha);
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      grid.classList.add("go");
    });
  });

  const end = total * 7 + 650;
  setTimeout(() => overlay.remove(), end);
}

function runPixelExit(onDone) {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduce) {
    onDone?.();
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "pixelOverlay pixelOverlay--exit is-on";
  overlay.innerHTML = `<div class="pixelOverlay__grid" aria-hidden="true"></div>`;
  document.body.appendChild(overlay);

  const grid = overlay.querySelector(".pixelOverlay__grid");
  if (!grid) {
    onDone?.();
    return;
  }

  const cols = 24;
  const rows = 14;
  const total = cols * rows;

  grid.style.setProperty("--cols", String(cols));
  grid.style.setProperty("--rows", String(rows));

  const frag = document.createDocumentFragment();
  for (let i = 0; i < total; i++) {
    const px = document.createElement("span");
    px.className = "px";
    frag.appendChild(px);
  }
  grid.appendChild(frag);

  const pixels = $$(".px", grid);
  const shuffled = [...pixels].sort(() => Math.random() - 0.5);

  shuffled.forEach((px, i) => {
    px.style.setProperty("--d", `${i * 5}ms`);
    const alpha = (0.82 + Math.random() * 0.16).toFixed(2);
    px.style.setProperty("--px-a", alpha);
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      grid.classList.add("go");
    });
  });

  const end = total * 5 + 400;
  setTimeout(() => {
    onDone?.();
    overlay.remove();
  }, end);
}
  /* =========================
     Highlight cards -> external links
     ========================= */
  function initHighlightCards() {
    const map = {
      crypts: "https://www.instagram.com/d3ltanin3ttv/?__pwa=1",
      haunted: "https://www.youtube.com/@D3LTANIN3ttv",
      darkworlds: "https://x.com/",
    };

    const cards = $$(".card[data-open]");
    if (!cards.length) return;

    const open = (key) => {
  const url = map[key];
  if (!url) return;

  runPixelExit(() => {
    window.location.href = url;
  });
};

    cards.forEach((card) => {
      const key = card.getAttribute("data-open");
      if (!key) return;

      card.addEventListener("click", () => open(key));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(key);
        }
      });
    });
  }

  /* =========================
     Games section (mount-only; no section injection)
     ========================= */
  function initGamesMount() {
    const mount = $("#gamesMount");
    if (!mount) return;

    const FLAVORS = [
      {
        key: "horror",
        label: "💀 Horror",
        theme: "green",
        games: [
          { title: "Resident Evil (series)", desc: "Classic horror + tension", img: "./assets/scenes/card-haunted.jpg", badge: "Horror" },
          { title: "Outlast", desc: "Run, hide, panic", img: "./assets/scenes/card-dark-worlds.jpg", badge: "Chase" },
          { title: "Phasmophobia", desc: "Ghost hunting chaos", img: "./assets/scenes/card-crypts.jpg", badge: "Co-op" },
          { title: "Dead by Daylight", desc: "1v4 terror with the crew", img: "./assets/scenes/card-haunted.jpg", badge: "PvP" },
        ],
      },
      {
        key: "survival",
        label: "🪓 Survival",
        theme: "gold",
        games: [
          { title: "The Long Dark", desc: "Cold, quiet, brutal survival", img: "./assets/scenes/bg-crypts.jpg", badge: "Hardcore" },
          { title: "Subnautica", desc: "Deep ocean dread + crafting", img: "./assets/scenes/card-dark-worlds.jpg", badge: "Explore" },
          { title: "Project Zomboid", desc: "Zombie sandbox chaos", img: "./assets/scenes/card-crypts.jpg", badge: "Sandbox" },
          { title: "Sons of the Forest", desc: "Crafting + cannibals + screams", img: "./assets/scenes/card-haunted.jpg", badge: "Co-op" },
        ],
      },
      {
        key: "indie",
        label: "🧪 Indie",
        theme: "blue",
        games: [
          { title: "Lethal Company", desc: "Comedy terror with friends", img: "./assets/scenes/card-crypts.jpg", badge: "Co-op" },
          { title: "SIGNALIS", desc: "Retro sci-fi horror masterpiece", img: "./assets/scenes/card-dark-worlds.jpg", badge: "Story" },
          { title: "Iron Lung", desc: "Claustrophobic submarine nightmare", img: "./assets/scenes/bg-crypts.jpg", badge: "Short" },
          { title: "Inscryption", desc: "Card game… until it isn’t", img: "./assets/scenes/card-haunted.jpg", badge: "Twist" },
        ],
      },
      {
        key: "grunge",
        label: "🧱 Grunge",
        theme: "pink",
        games: [
          { title: "Darkwood", desc: "Top-down dread", img: "./assets/scenes/bg-crypts.jpg", badge: "Atmosphere" },
          { title: "The Forest", desc: "Crash-landed nightmares", img: "./assets/scenes/card-crypts.jpg", badge: "Craft" },
          { title: "DREDGE", desc: "Cozy fishing… with teeth", img: "./assets/scenes/card-dark-worlds.jpg", badge: "Creepy" },
          { title: "S.T.A.L.K.E.R. (modded)", desc: "Ruin + paranoia", img: "./assets/scenes/bg-crypts.jpg", badge: "Grit" },
        ],
      },
      {
        key: "neon",
        label: "✨ Neon",
        theme: "purple",
        games: [
          { title: "Observer: System Redux", desc: "Cyberpunk horror noir", img: "./assets/scenes/card-dark-worlds.jpg", badge: "Noir" },
          { title: "Ghostrunner", desc: "Neon speed chaos", img: "./assets/scenes/card-crypts.jpg", badge: "Action" },
          { title: "Cyberpunk 2077", desc: "Night City stories", img: "./assets/scenes/card-dark-worlds.jpg", badge: "RPG" },
          { title: "Katana ZERO", desc: "Violence + neon time", img: "./assets/scenes/card-haunted.jpg", badge: "Indie" },
        ],
      },
    ];

    mount.innerHTML = `
      <div class="games">
        <div class="gameTags" id="gameTags"></div>
        <div class="gameGrid" id="gameGrid"></div>
      </div>
    `;

    const tagWrap = $("#gameTags", mount);
    const grid = $("#gameGrid", mount);
    if (!tagWrap || !grid) return;

    const cardHTML = (g) => {
      const img = g.img || "./assets/scenes/card-dark-worlds.jpg";
      const badge = g.badge ? `<span class="miniCard__badge">${g.badge}</span>` : "";
      return `
        <article class="miniCard" tabindex="0">
          <div class="miniCard__bg" style="background-image:url('${img}')"></div>
          <div class="miniCard__shade"></div>
          ${badge}
          <h4 class="miniCard__title">${g.title}</h4>
          <p class="miniCard__desc">${g.desc || ""}</p>
        </article>
      `;
    };

    const renderTags = () => {
      tagWrap.innerHTML = FLAVORS.map((f, idx) => {
        const active = idx === 0 ? "is-active" : "";
        return `<button class="gameTag ${active}" type="button" data-key="${f.key}" data-theme="${f.theme}">${f.label}</button>`;
      }).join("");
    };

    const renderGrid = (key) => {
      const flavor = FLAVORS.find((f) => f.key === key) || FLAVORS[0];
      grid.setAttribute("data-theme", flavor.theme || "");
      grid.innerHTML = flavor.games.map(cardHTML).join("");
    };

    renderTags();
    renderGrid(FLAVORS[0].key);

    tagWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".gameTag");
      if (!btn) return;

      $$(".gameTag", tagWrap).forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      const key = btn.getAttribute("data-key");
      if (key) renderGrid(key);
    });
  }

  /* =========================
     Boot
     ========================= */
  document.addEventListener("DOMContentLoaded", () => {
    initLinksDropdown();
    initThemeToggle();
    initTwitchEmbed();
    initFooterBits();
    initHighlightCards();
    initGamesMount();

    // run intro LAST so it overlays everything cleanly
    runPixelDissolve();
  });

})();








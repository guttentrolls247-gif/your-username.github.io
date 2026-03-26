(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  async function getCurrentlyPlayingStatus() {
    const fallback = {
      live: false,
      game: "DARK SOULS II",
      note: "Currently grinding through Drangleic.",
      title: "",
      viewer_count: 0,
      url: "https://www.twitch.tv/D3LTANIN3ttv",
      last_updated: "",
    };

    try {
      const res = await fetch("./currently-playing.json", {
        cache: "no-store",
      });
      if (!res.ok) return fallback;

      const data = await res.json();

      return {
        live: Boolean(data.live),
        game: data.game || fallback.game,
        note: data.note || fallback.note,
        title: data.title || "",
        viewer_count: Number(data.viewer_count) || 0,
        url: data.url || fallback.url,
        last_updated: data.last_updated || fallback.last_updated,
      };
    } catch {
      return fallback;
    }
  }

  function initCursorGlow() {
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;
    const finePointer = window.matchMedia?.("(pointer: fine)")?.matches;

    if (reduce || !finePointer) return;

    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    const update = () => {
      document.body.style.setProperty("--glow-x", `${x}px`);
      document.body.style.setProperty("--glow-y", `${y}px`);
      raf = 0;
    };

    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;

      if (!document.body.classList.contains("is-glow-active")) {
        document.body.classList.add("is-glow-active");
      }

      if (!raf) raf = requestAnimationFrame(update);
    };

    const onLeave = () => {
      document.body.classList.remove("is-glow-active");
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget) onLeave();
    });
  }

  function initDropdown(
    btnSelector,
    menuSelector,
    { closeOnLink = false } = {},
  ) {
    const btn = $(btnSelector);
    const menu = $(menuSelector);
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

    if (closeOnLink) {
      menu.addEventListener("click", (e) => {
        if (e.target.closest("a")) close();
      });
    }
  }

  function initLinksDropdown() {
    initDropdown("#linksBtn", "#linksMenu", { closeOnLink: true });
  }

  function initMobileNav() {
    initDropdown("#mobileNavBtn", "#mobileNavMenu", { closeOnLink: true });
  }

  function initThemeToggle() {
    const btn = $("#themeBtn");
    if (!btn) return;

    const root = document.documentElement;
    const icon = btn.querySelector(".themeBtn__icon");

    const THEME_KEY = "theme";
    const PREF_KEY = "themePref";

    const mq = window.matchMedia?.("(prefers-color-scheme: light)");

    const setUI = (theme) => {
      root.style.colorScheme = theme;
      btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
      btn.setAttribute(
        "aria-label",
        theme === "light" ? "Switch to dark theme" : "Switch to light theme",
      );
      if (icon) icon.textContent = theme === "light" ? "☀" : "☾";
    };

    const applySystem = (theme) => {
      root.setAttribute("data-theme", theme);
      setUI(theme);
    };

    const applyManual = (theme) => {
      root.setAttribute("data-theme", theme);
      localStorage.setItem(THEME_KEY, theme);
      setUI(theme);
    };

    const pref = localStorage.getItem(PREF_KEY);
    const savedTheme = localStorage.getItem(THEME_KEY);
    const mode = pref === "manual" ? "manual" : "system";
    const systemTheme = () => (mq?.matches ? "light" : "dark");

    if (
      mode === "manual" &&
      (savedTheme === "light" || savedTheme === "dark")
    ) {
      applyManual(savedTheme);
    } else {
      localStorage.setItem(PREF_KEY, "system");
      applySystem(systemTheme());
    }

    const onSystemChange = (e) => {
      const curPref = localStorage.getItem(PREF_KEY);
      if (curPref === "manual") return;
      applySystem(e.matches ? "light" : "dark");
    };

    if (mq) {
      if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", onSystemChange);
      } else if (typeof mq.addListener === "function") {
        mq.addListener(onSystemChange);
      }
    }

    btn.addEventListener("click", () => {
      localStorage.setItem(PREF_KEY, "manual");
      const cur = root.getAttribute("data-theme") || "dark";
      applyManual(cur === "dark" ? "light" : "dark");
    });
  }

  function initTwitchEmbed() {
    const iframe = $("#twitchEmbed");
    const loader = $("#twitchLoader");
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

    iframe.addEventListener("load", () => {
      if (loader) loader.classList.add("is-hidden");
    });
  }

  function initYouTubeLiteEmbeds() {
    const thumbs = $$(".clipThumb[data-youtube-id]");
    if (!thumbs.length) return;

    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const videoId = thumb.getAttribute("data-youtube-id");
        if (!videoId) return;

        const iframe = document.createElement("iframe");
        iframe.className = "clipFrame";
        iframe.title = "YouTube Clip";
        iframe.loading = "lazy";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;

        thumb.replaceWith(iframe);
      });
    });
  }

  function initFooterBits() {
    const year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function runPixelDissolve() {
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;
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
    const delayStep = 7;
    const pxDuration = 550;

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

    requestAnimationFrame(() => overlay.classList.add("is-on"));

    shuffled.forEach((px, i) => {
      px.style.setProperty("--d", `${i * delayStep}ms`);
      const alpha = (0.82 + Math.random() * 0.16).toFixed(2);
      px.style.setProperty("--px-a", alpha);
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        grid.classList.add("go");
      });
    });

    const end = total * delayStep + pxDuration;
    setTimeout(() => overlay.classList.add("fade-out"), Math.max(end - 200, 0));
    setTimeout(() => overlay.remove(), end + 60);
  }

  function initHighlightCards() {
    const map = {
      crypts: "https://www.instagram.com/d3ltanin3ManicGaming/",
      haunted: "https://www.youtube.com/@D3LTANIN3ManicGaming",
      darkworlds: "https://x.com/D3LTANIN3MG",
    };

    const cards = $$(".card[data-open]");
    if (!cards.length) return;

    const open = (key) => {
      const url = map[key];
      if (!url) return;
      window.open(url, "_blank", "noopener,noreferrer");
    };

    cards.forEach((card) => {
      const key = card.getAttribute("data-open");
      if (!key) return;

      card.addEventListener("click", (e) => {
        e.preventDefault();
        open(key);
      });

      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(key);
        }
      });
    });
  }

  async function getCurrentlyPlayingStatus() {
    const fallback = {
      game: "DARK SOULS II",
      note: "Currently grinding through Drangleic.",
    };

    try {
      const res = await fetch("./currently-playing.json", {
        cache: "no-store",
      });
      if (!res.ok) return fallback;

      const data = await res.json();
      return {
        game:
          typeof data.game === "string" && data.game.trim()
            ? data.game.trim()
            : fallback.game,
        note:
          typeof data.note === "string" && data.note.trim()
            ? data.note.trim()
            : fallback.note,
      };
    } catch {
      return fallback;
    }
  }

  async function initGamesMount() {
    const mount = $("#gamesMount");
    if (!mount) return;

    const STREAM_STATUS = await getCurrentlyPlayingStatus();

    const WIKI = {
      "Dead Space 3": "https://en.wikipedia.org/wiki/Dead_Space_3",
      "Dying Light": "https://en.wikipedia.org/wiki/Dying_Light",
      "Project Zomboid": "https://en.wikipedia.org/wiki/Project_Zomboid",
      "State of Decay": "https://en.wikipedia.org/wiki/State_of_Decay",

      DayZ: "https://en.wikipedia.org/wiki/DayZ_(video_game)",
      Rust: "https://en.wikipedia.org/wiki/Rust_(video_game)",
      Subnautica: "https://en.wikipedia.org/wiki/Subnautica",
      "Stranded Deep": "https://en.wikipedia.org/wiki/Stranded_Deep",

      Moonlighter: "https://en.wikipedia.org/wiki/Moonlighter",
      Terraria: "https://en.wikipedia.org/wiki/Terraria",
      "Hollow Knight": "https://en.wikipedia.org/wiki/Hollow_Knight",
      Starbound: "https://en.wikipedia.org/wiki/Starbound",

      "DARK SOULS II": "https://en.wikipedia.org/wiki/Dark_Souls_II",
      "DARK SOULS III": "https://en.wikipedia.org/wiki/Dark_Souls_III",
      "Mortal Shell": "https://en.wikipedia.org/wiki/Mortal_Shell",
      "Lords of the Fallen":
        "https://en.wikipedia.org/wiki/Lords_of_the_Fallen",

      "Cyberpunk 2077": "https://en.wikipedia.org/wiki/Cyberpunk_2077",
      "Deus Ex: Mankind Divided":
        "https://en.wikipedia.org/wiki/Deus_Ex:_Mankind_Divided",
      "Watch Dogs 2": "https://en.wikipedia.org/wiki/Watch_Dogs_2",
      Splitgate: "https://en.wikipedia.org/wiki/Splitgate",
    };

    const FLAVORS = [
      {
        key: "horror",
        label: "💀 Horror",
        theme: "green",
        games: [
          {
            title: "Dead Space 3",
            desc: "Co-op sci-fi horror and necromorph chaos",
            img: "./assets/games/dead-space-3.jpg",
            badge: "Sci-fi",
          },
          {
            title: "Dying Light",
            desc: "Parkour, infected nights, and pressure",
            img: "./assets/games/dying-light.jpg",
            badge: "Action",
          },
          {
            title: "Project Zomboid",
            desc: "Slow-burn zombie survival sandbox",
            img: "./assets/games/project-zomboid.jpg",
            badge: "Sandbox",
          },
          {
            title: "State of Decay",
            desc: "Community survival in a dead world",
            img: "./assets/games/state-of-decay.jpg",
            badge: "Survival",
          },
        ],
      },
      {
        key: "survival",
        label: "🪓 Survival",
        theme: "gold",
        games: [
          {
            title: "DayZ",
            desc: "Open-ended survival with constant tension",
            img: "./assets/games/dayz.jpg",
            badge: "Hardcore",
          },
          {
            title: "Rust",
            desc: "Build, raid, survive, repeat",
            img: "./assets/games/rust.jpg",
            badge: "PvP",
          },
          {
            title: "Subnautica",
            desc: "Deep ocean exploration and survival",
            img: "./assets/games/subnautica.jpg",
            badge: "Explore",
          },
          {
            title: "Stranded Deep",
            desc: "Island survival with a rough edge",
            img: "./assets/games/stranded-deep.jpg",
            badge: "Craft",
          },
        ],
      },
      {
        key: "indie",
        label: "🧪 Indie",
        theme: "blue",
        games: [
          {
            title: "Moonlighter",
            desc: "Dungeon crawling by night, shopkeeping by day",
            img: "./assets/games/moonlighter.jpg",
            badge: "Action RPG",
          },
          {
            title: "Terraria",
            desc: "Build, explore, and fight through chaos",
            img: "./assets/games/terraria.jpg",
            badge: "Sandbox",
          },
          {
            title: "Hollow Knight",
            desc: "Tight combat in a haunting world",
            img: "./assets/games/hollow-knight.jpg",
            badge: "Metroidvania",
          },
          {
            title: "Starbound",
            desc: "Space sandbox with a weird indie vibe",
            img: "./assets/games/starbound.jpg",
            badge: "Adventure",
          },
        ],
      },
      {
        key: "grunge",
        label: "🧱 Grunge",
        theme: "pink",
        games: [
          {
            title: "DARK SOULS II",
            desc: "Punishing fights and bleak atmosphere",
            img: "./assets/games/dark-souls-2.jpg",
            badge: "Soulslike",
          },
          {
            title: "DARK SOULS III",
            desc: "Fast, brutal combat in a dying world",
            img: "./assets/games/dark-souls-3.jpg",
            badge: "Bosses",
          },
          {
            title: "Mortal Shell",
            desc: "Heavy, grim, and built on pressure",
            img: "./assets/games/mortal-shell.jpg",
            badge: "Dark",
          },
          {
            title: "Lords of the Fallen",
            desc: "Dark fantasy with weight and grit",
            img: "./assets/games/lords-of-the-fallen.jpg",
            badge: "Fantasy",
          },
        ],
      },
      {
        key: "neon",
        label: "✨ Neon",
        theme: "purple",
        games: [
          {
            title: "Cyberpunk 2077",
            desc: "Night City stories under neon lights",
            img: "./assets/games/cyberpunk-2077.jpg",
            badge: "RPG",
          },
          {
            title: "Deus Ex: Mankind Divided",
            desc: "Stealth, augmentation, and cyberpunk style",
            img: "./assets/games/deus-ex-mankind-divided.jpg",
            badge: "Stealth",
          },
          {
            title: "Watch Dogs 2",
            desc: "Hacking chaos with a brighter neon edge",
            img: "./assets/games/watch-dogs-2.jpg",
            badge: "Open World",
          },
          {
            title: "Splitgate",
            desc: "Arena chaos with sci-fi energy",
            img: "./assets/games/splitgate.jpg",
            badge: "FPS",
          },
        ],
      },
    ];

    mount.innerHTML = `
  <div class="gamesStatus panel panel--wide">
    <div class="gamesStatus__pill ${STREAM_STATUS.live ? "is-live" : "is-offline"}">
      ${STREAM_STATUS.live ? "LIVE NOW" : "CURRENTLY PLAYING"}
    </div>
    <div class="gamesStatus__body">
      <h3 class="gamesStatus__title">${STREAM_STATUS.game}</h3>
      <p class="gamesStatus__text">
        ${
          STREAM_STATUS.live
            ? `${STREAM_STATUS.title || STREAM_STATUS.note}${
                STREAM_STATUS.viewer_count > 0
                  ? ` • ${STREAM_STATUS.viewer_count} viewers`
                  : ""
              }`
            : STREAM_STATUS.note
        }
      </p>
      <div style="margin-top:10px;">
        <a
          class="btn btn-ghost"
          href="${STREAM_STATUS.url}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${STREAM_STATUS.live ? "Watch live on Twitch" : "Visit Twitch channel"}
        </a>
      </div>
    </div>
  </div>

  <div class="games">
    <div class="gameTags" id="gameTags"></div>
    <div class="gameGrid" id="gameGrid"></div>
  </div>
`;

    const tagWrap = $("#gameTags", mount);
    const grid = $("#gameGrid", mount);
    if (!tagWrap || !grid) return;

    const cardHTML = (g) => {
      const img = g.img || "./assets/games/card-dark-worlds.jpg";
      const badge = g.badge
        ? `<span class="miniCard__badge">${g.badge}</span>`
        : "";

      const wiki = WIKI[g.title];

      return `
    <article class="miniCard" tabindex="0">
      <div class="miniCard__bg" style="background-image:url('${img}')"></div>
      <div class="miniCard__shade"></div>

      ${badge}

      ${
        wiki
          ? `<a class="miniCard__wiki" href="${wiki}" target="_blank" rel="noopener noreferrer">ℹ</a>`
          : ""
      }

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

  document.addEventListener("DOMContentLoaded", () => {
    runPixelDissolve();
    initCursorGlow();
    initLinksDropdown();
    initMobileNav();
    initThemeToggle();
    initTwitchEmbed();
    initYouTubeLiteEmbeds();
    initHighlightCards();
    initGamesMount();
    initFooterBits();
  });
})();

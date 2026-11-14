(() => {
  const serviceNames = {
    youtube: "YouTube / YouTube Music",
    spotify: "Spotify",
    soundcloud: "SoundCloud",
  };
  const storageKey = "cork7-music-service";
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch {
    saved = {};
  }
  if (!saved || typeof saved !== "object") saved = {};
  let selectedService = serviceNames[saved.service] ? saved.service : "youtube";
  let savedLink = typeof saved.link === "string" ? saved.link : "";

  const styles = document.createElement("style");
  styles.textContent = `
    .music-player.c7mp-service-player.is-music .pocket-screen{height:360px!important}
    .music-player.c7mp-service-player.is-music .pocket-screen.is-spotify-playlist{height:560px!important}
    .music-player.c7mp-service-player .pocket-device{max-height:calc(100dvh - 40px)}
    .music-player.c7mp-service-player.is-music .pocket-screen>:not(.pocket-top):not(.c7mp-panel){display:none!important}
    .music-player.c7mp-service-player.is-music .pocket-wheel,
    .music-player.c7mp-service-player .music-tray,
    .music-player.c7mp-service-player .music-error,
    .game-menu-music{display:none!important}
    .c7mp-panel{position:absolute;inset:43px 0 0;z-index:20;display:flex;flex-direction:column;gap:7px;padding:8px 10px 10px;background:#101114;color:#f5f5f7;font:12px/1.35 var(--pk-font);box-sizing:border-box;overflow-y:auto}
    .c7mp-panel[hidden]{display:none!important}
    .c7mp-panel.is-detached{position:fixed;inset:0 auto auto -10000px;width:320px;height:352px;padding:0;gap:0;opacity:.01;overflow:hidden;pointer-events:none}
    .c7mp-panel.is-detached .c7mp-header,.c7mp-panel.is-detached form,.c7mp-panel.is-detached .c7mp-status,.c7mp-panel.is-detached .c7mp-external{display:none!important}
    .c7mp-header{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;font-weight:700}
    .c7mp-panel select,.c7mp-panel input{height:30px;min-width:0;border:1px solid #ffffff24;border-radius:7px;padding:0 8px;background:#25262a;color:#fff;font:inherit;box-sizing:border-box}
    .c7mp-row{display:flex;gap:6px}
    .c7mp-panel select{width:48%}
    .c7mp-panel input{width:100%}
    .c7mp-panel button.c7mp-load{height:30px;flex:1;border:0;border-radius:7px;background:#ff9d6e;color:#171311;font:600 12px var(--pk-font)}
    .c7mp-panel button:focus-visible,.c7mp-panel input:focus-visible,.c7mp-panel select:focus-visible{outline:2px solid #ff9d6e;outline-offset:1px}
    .c7mp-hint{margin:0;color:#ebebf599;font-size:10px}
    .c7mp-status{min-height:14px;color:#ebebf5b0;font-size:10px}
    .c7mp-status.is-error{color:#ff8c84}
    .c7mp-frame-wrap{min-height:90px;flex:1;overflow:hidden;border-radius:8px;background:#18191c}
    .c7mp-frame-wrap.is-spotify-playlist{min-height:352px;flex:none}
    .c7mp-panel.is-detached .c7mp-frame-wrap{position:absolute;inset:0;min-height:0}
    .c7mp-frame{width:100%;height:100%;min-height:90px;border:0;display:block}
    .c7mp-panel.is-detached .c7mp-frame{min-height:0}
    .c7mp-placeholder{height:100%;min-height:90px;display:grid;place-items:center;padding:10px;box-sizing:border-box;text-align:center;color:#ebebf599}
    .c7mp-external{color:#ffb18e;font-size:10px;text-decoration:none}
    .c7mp-external:hover{text-decoration:underline}
    @media(max-height:620px){.music-player.c7mp-service-player.is-music .pocket-screen{height:min(360px,calc(100dvh - 120px))!important}.music-player.c7mp-service-player.is-music .pocket-screen.is-spotify-playlist{height:min(560px,calc(100dvh - 120px))!important}.music-player.c7mp-service-player .pocket-device{max-height:calc(100dvh - 24px)}}
  `;
  document.head.appendChild(styles);

  function youtubeEmbed(url) {
    const hosts = new Set([
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "music.youtube.com",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com",
      "youtu.be",
      "www.youtu.be",
    ]);
    if (!hosts.has(url.hostname.toLowerCase())) return null;

    const list = url.searchParams.get("list");
    const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})$/);
    const video = url.hostname.endsWith("youtu.be")
      ? url.pathname.split("/").filter(Boolean)[0]?.match(/^[A-Za-z0-9_-]{11}$/)?.[0]
      : url.searchParams.get("v") || match?.[1];
    if (video && !/^[A-Za-z0-9_-]{11}$/.test(video)) return null;
    if (!video && !list) return null;
    if (list && !/^[A-Za-z0-9_-]+$/.test(list)) return null;

    const embed = new URL(video ? `/embed/${video}` : "/embed/videoseries", "https://www.youtube-nocookie.com");
    embed.searchParams.set("playsinline", "1");
    embed.searchParams.set("rel", "0");
    if (list) embed.searchParams.set("list", list);
    return embed.href;
  }

  function spotifyEmbed(input, url) {
    const uri = input.match(/^spotify:(track|album|playlist|episode|show):([A-Za-z0-9]+)$/i);
    if (uri) return `https://open.spotify.com/embed/${uri[1].toLowerCase()}/${uri[2]}?utm_source=generator&theme=0`;
    if (url.hostname.toLowerCase() !== "open.spotify.com") return null;
    const match = url.pathname.match(/^\/(?:intl-[a-z]{2}\/)?(?:embed\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]+)\/?$/i);
    if (!match) return null;
    return `https://open.spotify.com/embed/${match[1].toLowerCase()}/${match[2]}?utm_source=generator&theme=0`;
  }

  function soundcloudEmbed(url) {
    const host = url.hostname.toLowerCase();
    if (!["soundcloud.com", "www.soundcloud.com", "m.soundcloud.com", "on.soundcloud.com"].includes(host)) return null;
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length < 2 && !(host === "on.soundcloud.com" && segments.length === 1)) return null;
    const player = new URL("https://w.soundcloud.com/player/");
    player.searchParams.set("url", url.href);
    player.searchParams.set("visual", "true");
    player.searchParams.set("color", "#ff9d6e");
    return player.href;
  }

  function parseLink(input, service) {
    const value = input.trim();
    if (!value) return null;
    if (service === "spotify" && /^spotify:/i.test(value)) {
      return spotifyEmbed(value, new URL("https://open.spotify.com/"));
    }

    let url;
    try {
      url = new URL(value);
    } catch {
      return null;
    }
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (service === "youtube") return youtubeEmbed(url);
    if (service === "spotify") return spotifyEmbed(value, url);
    if (service === "soundcloud") return soundcloudEmbed(url);
    return null;
  }

  function makePlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.className = "c7mp-placeholder";
    placeholder.textContent = "Choose a service and paste your own music link to get started.";
    return placeholder;
  }

  function setEmbed(frameWrap, external, embedUrl, link, service) {
    const playlist = service === "spotify" && /\/embed\/playlist\//.test(embedUrl);
    frameWrap.classList.toggle("is-spotify-playlist", playlist);
    const screen = frameWrap.closest(".pocket-screen") || document.querySelector(".pocket-screen");
    screen?.classList.toggle("is-spotify-playlist", playlist);
    const panel = frameWrap.closest(".c7mp-panel");
    const player = document.querySelector("[data-music-player]");
    if (panel && player) {
      requestAnimationFrame(() => positionPanel(panel, player, document.querySelector(".pocket-screen")));
    }
    const frame = document.createElement("iframe");
    frame.className = "c7mp-frame";
    frame.title = `${serviceNames[service]} music player`;
    frame.src = embedUrl;
    frame.allow = "autoplay; encrypted-media; picture-in-picture; web-share";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.loading = "eager";
    frameWrap.replaceChildren(frame);
    external.href = link;
    external.hidden = false;
  }

  function saveChoice(service, link) {
    selectedService = service;
    savedLink = link;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ service, link }));
    } catch (error) {
      console.warn("Could not save the selected music service.", error);
    }
  }

  function positionPanel(panel, player, screen) {
    if (!screen || !player.classList.contains("is-open") || !player.classList.contains("is-music")) {
      panel.classList.add("is-detached");
      for (const property of ["position", "inset", "top", "left", "width", "height"]) {
        panel.style.removeProperty(property);
      }
      return;
    }

    panel.classList.remove("is-detached");
    const bounds = screen.getBoundingClientRect();
    panel.style.position = "fixed";
    panel.style.inset = "auto";
    panel.style.top = `${bounds.top + 43}px`;
    panel.style.left = `${bounds.left}px`;
    panel.style.width = `${bounds.width}px`;
    panel.style.height = `${Math.max(0, bounds.height - 43)}px`;
  }

  function installPanel(screen, player) {
    if (document.querySelector(".c7mp-panel")) return;
    const panel = document.createElement("section");
    panel.className = "c7mp-panel";
    panel.setAttribute("aria-label", "Play music from another service");

    const header = document.createElement("div");
    header.className = "c7mp-header";
    header.textContent = "Play your own music";

    const form = document.createElement("form");
    form.className = "c7mp-form";
    const controls = document.createElement("div");
    controls.className = "c7mp-row";
    const select = document.createElement("select");
    select.setAttribute("aria-label", "Music service");
    for (const [value, label] of Object.entries(serviceNames)) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    }
    select.value = selectedService;
    select.addEventListener("change", () => {
      selectedService = select.value;
    });
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "c7mp-load";
    submit.textContent = "Load link";
    controls.append(select, submit);

    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "url";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = "Paste a song, video, or playlist URL";
    input.setAttribute("aria-label", "Music link");
    input.value = savedLink;
    const hint = document.createElement("p");
    hint.className = "c7mp-hint";
    hint.textContent = "Official embeds need no API key. Spotify may require sign-in, and its playback limits still apply.";
    form.append(controls, input, hint);

    const status = document.createElement("div");
    status.className = "c7mp-status";
    status.setAttribute("role", "status");
    const frameWrap = document.createElement("div");
    frameWrap.className = "c7mp-frame-wrap";
    const external = document.createElement("a");
    external.className = "c7mp-external";
    external.target = "_blank";
    external.rel = "noopener noreferrer";
    external.hidden = true;
    external.textContent = "Open in service";
    frameWrap.appendChild(makePlaceholder());

    if (savedLink) {
      const embedUrl = parseLink(savedLink, selectedService);
      if (embedUrl) setEmbed(frameWrap, external, embedUrl, savedLink, selectedService);
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const link = input.value.trim();
      const embedUrl = parseLink(link, select.value);
      if (!embedUrl) {
        status.textContent = `Enter a valid ${serviceNames[select.value]} link.`;
        status.classList.add("is-error");
        return;
      }
      saveChoice(select.value, link);
      status.textContent = `Loaded ${serviceNames[select.value]}. Use its player below to start playback.`;
      status.classList.remove("is-error");
      setEmbed(frameWrap, external, embedUrl, link, select.value);
    });

    panel.append(header, form, status, frameWrap, external);
    document.body.appendChild(panel);
    positionPanel(panel, player, screen);
  }

  let observedPlayer = null;
  let playerObserver = null;

  function install() {
    const player = document.querySelector("[data-music-player]");
    if (!player) return;
    player.classList.add("c7mp-service-player");
    if (player !== observedPlayer) {
      playerObserver?.disconnect();
      observedPlayer = player;
      playerObserver = new MutationObserver(install);
      playerObserver.observe(player, {
        attributes: true,
        attributeFilter: ["class"],
        childList: true,
      });
    }
    const screen = player.querySelector(".pocket-screen");
    let panel = document.querySelector(".c7mp-panel");
    if (screen && !panel) {
      installPanel(screen, player);
      panel = document.querySelector(".c7mp-panel");
    }
    if (panel) {
      screen?.classList.toggle(
        "is-spotify-playlist",
        Boolean(panel.querySelector(".c7mp-frame-wrap.is-spotify-playlist")),
      );
      positionPanel(panel, player, screen);
    }

    const pocketButton = document.querySelector(".top-pocket");
    if (pocketButton) {
      pocketButton.setAttribute("aria-label", "Music and chat Pocket");
      pocketButton.setAttribute("title", "Music and chat");
    }
  }

  new MutationObserver((records) => {
    if (observedPlayer?.isConnected) return;
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (
          node.nodeType === 1 &&
          (node.matches("[data-music-player]") || node.querySelector("[data-music-player]"))
        ) {
          install();
          return;
        }
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("resize", install);
  install();
})();

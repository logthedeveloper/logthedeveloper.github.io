(() => {
  const serviceNames = {
    youtube: "YouTube / YouTube Music",
    spotify: "Spotify",
    soundcloud: "SoundCloud",
  };
  let selectedService = "youtube";
  let lastLink = "";
  let lastService = "youtube";
  let panelOpen = false;

  const styles = document.createElement("style");
  styles.textContent = `
    .music-player.c7mp-expanded .pocket-screen{height:360px!important}
    .music-player.c7mp-expanded .pocket-device{max-height:calc(100dvh - 40px)}
    .c7mp-trigger{width:26px;height:26px;flex-shrink:0;border-radius:50%;background:var(--pk-fill)!important;color:var(--pk-label2);font-size:17px!important;line-height:1}
    .c7mp-trigger:hover,.c7mp-trigger[aria-expanded=true]{background:var(--pk-fill2)!important;color:var(--pk-label)}
    .c7mp-panel{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;gap:7px;padding:10px;background:#101114;color:#f5f5f7;font:12px/1.35 var(--pk-font);box-sizing:border-box}
    .c7mp-panel[hidden]{display:none!important}
    .c7mp-header{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;font-weight:700}
    .c7mp-close{width:24px;height:24px;flex-shrink:0;border-radius:50%;background:#ffffff18!important;color:#ebebf5!important}
    .c7mp-row{display:flex;gap:6px}
    .c7mp-panel select,.c7mp-panel input{height:29px;min-width:0;border:1px solid #ffffff24;border-radius:7px;padding:0 8px;background:#25262a;color:#fff;font:inherit;box-sizing:border-box}
    .c7mp-panel select{width:48%}
    .c7mp-panel input{width:100%}
    .c7mp-panel button.c7mp-load{height:29px;flex:1;border-radius:7px;background:#ff9d6e!important;color:#171311;font-weight:700}
    .c7mp-panel button:focus-visible,.c7mp-panel input:focus-visible,.c7mp-panel select:focus-visible{outline:2px solid #ff9d6e;outline-offset:1px}
    .c7mp-hint{margin:0;color:#ebebf599;font-size:10px}
    .c7mp-status{min-height:14px;color:#ebebf5b0;font-size:10px}
    .c7mp-status.is-error{color:#ff8c84}
    .c7mp-frame-wrap{min-height:90px;flex:1;overflow:hidden;border-radius:8px;background:#18191c}
    .c7mp-frame{width:100%;height:100%;min-height:90px;border:0;display:block}
    .c7mp-placeholder{height:100%;min-height:90px;display:grid;place-items:center;padding:10px;box-sizing:border-box;text-align:center;color:#ebebf599}
    .c7mp-external{color:#ffb18e;font-size:10px;text-decoration:none}
    .c7mp-external:hover{text-decoration:underline}
    @media(max-height:500px){.music-player.c7mp-expanded .pocket-screen{height:min(360px,calc(100dvh - 120px))!important}.music-player.c7mp-expanded .pocket-device{max-height:calc(100dvh - 24px)}}
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

    const path = video
      ? `/embed/${video}`
      : "/embed/videoseries";
    const embed = new URL(path, "https://www.youtube-nocookie.com");
    embed.searchParams.set("autoplay", "1");
    embed.searchParams.set("playsinline", "1");
    embed.searchParams.set("rel", "0");
    if (list) embed.searchParams.set("list", list);
    return embed.href;
  }

  function spotifyEmbed(input, url) {
    const uri = input.match(/^spotify:(track|album|playlist|episode|show):([A-Za-z0-9]+)$/i);
    if (uri) return `https://open.spotify.com/embed/${uri[1].toLowerCase()}/${uri[2]}?utm_source=generator&theme=0`;
    if (url.hostname.toLowerCase() !== "open.spotify.com") return null;
    const match = url.pathname.match(/^\/(?:intl-[a-z]{2}\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]+)\/?$/i);
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
    player.searchParams.set("auto_play", "true");
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

  function pauseCorkMusic() {
    const pauseButton = document.querySelector('[data-music-player] button[aria-label="Pause music"]');
    if (pauseButton) pauseButton.click();
  }

  function setExpanded(player, expanded) {
    player.classList.toggle("c7mp-expanded", expanded);
  }

  function makePanel(screen, player) {
    const panel = document.createElement("section");
    panel.className = "c7mp-panel";
    panel.setAttribute("aria-label", "Play music from another service");
    panel.hidden = !panelOpen;

    const header = document.createElement("div");
    header.className = "c7mp-header";
    const title = document.createElement("span");
    title.textContent = "Play your own music";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "c7mp-close";
    close.setAttribute("aria-label", "Close music services");
    close.textContent = "×";
    close.addEventListener("click", () => {
      panelOpen = false;
      panel.hidden = true;
      setExpanded(player, false);
      screen.querySelector(".c7mp-trigger")?.setAttribute("aria-expanded", "false");
    });
    header.append(title, close);

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
    submit.textContent = "Play link";
    controls.append(select, submit);

    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "url";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = "Paste a song, video, or playlist URL";
    input.setAttribute("aria-label", "Music link");
    input.value = lastLink;
    const hint = document.createElement("p");
    hint.className = "c7mp-hint";
    hint.textContent = "Official embeds need no API key. Playback, login, and availability rules depend on each service.";
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

    if (lastLink) {
      const embedUrl = parseLink(lastLink, lastService);
      if (embedUrl) {
        addEmbed(frameWrap, external, embedUrl, lastLink, lastService);
      }
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
      selectedService = select.value;
      lastService = select.value;
      lastLink = link;
      status.textContent = `Loading ${serviceNames[lastService]}…`;
      status.classList.remove("is-error");
      pauseCorkMusic();
      addEmbed(frameWrap, external, embedUrl, link, lastService);
      status.textContent = "Use the embedded player to choose and control your music.";
    });

    panel.append(header, form, status, frameWrap, external);
    screen.appendChild(panel);
    setExpanded(player, panelOpen);
    return panel;
  }

  function makePlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.className = "c7mp-placeholder";
    placeholder.textContent = "Choose a service and paste your own music link to get started.";
    return placeholder;
  }

  function addEmbed(frameWrap, external, embedUrl, link, service) {
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

  function install() {
    const player = document.querySelector("[data-music-player]");
    const screen = player?.querySelector(".pocket-screen");
    const top = screen?.querySelector(".pocket-top");
    if (!player || !screen || !top) return;

    let trigger = top.querySelector(".c7mp-trigger");
    if (!trigger) {
      trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "c7mp-trigger";
      trigger.textContent = "♫";
      trigger.setAttribute("aria-label", "Choose music from YouTube, Spotify, or SoundCloud");
      trigger.setAttribute("aria-expanded", String(panelOpen));
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        panelOpen = !panelOpen;
        const currentScreen = trigger.closest(".pocket-screen");
        const currentPlayer = trigger.closest("[data-music-player]");
        const panel = currentScreen?.querySelector(".c7mp-panel") || (currentScreen && currentPlayer && makePanel(currentScreen, currentPlayer));
        if (panel) panel.hidden = !panelOpen;
        if (currentPlayer) setExpanded(currentPlayer, panelOpen);
        trigger.setAttribute("aria-expanded", String(panelOpen));
      });
      const closeButton = top.querySelector(".pocket-close");
      top.insertBefore(trigger, closeButton || null);
    }
    trigger.setAttribute("aria-expanded", String(panelOpen));

    if (!screen.querySelector(".c7mp-panel")) makePanel(screen, player);
    setExpanded(player, panelOpen);
  }

  const observer = new MutationObserver(() => install());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  install();
})();

import { mountHermesOrb } from "./family-orb.js";

const family = [
  { id: "papa", name: "Papa", short: "PA", color: "#54a6ff", status: "Auto-Wechsel vorbereitet" },
  { id: "mama", name: "Mama", short: "MA", color: "#ff6da7", status: "2 Entscheidungen offen" },
  { id: "zelda", name: "Zelda", short: "ZE", color: "#9b7cff", status: "Mathe-Test" },
  { id: "goku", name: "Goku", short: "GO", color: "#ff9b54", status: "Sachkunde-Test" }
];

const contexts = {
  idle: {
    label: "Standby",
    title: "Alles ruhig.",
    text: "Zwei Dinge brauchen heute deine Freigabe.",
    intent: "Bereit",
    prompts: ["Heute", "Zelda", "Goku", "Auto", "Zahnarzt"]
  },
  today: {
    label: "Heute",
    title: "Der Tag ist sortiert.",
    text: "Lernrunden am Morgen, Regen am Nachmittag und zwei offene Entscheidungen.",
    intent: "Tageslage",
    lines: ["07:45 · Zelda · Mathe", "08:00 · Goku · Sachkunde", "11:30 · Zahnarzt-Freigabe", "16:30 · Auto-Agent"]
  },
  zelda: {
    label: "Zelda",
    title: "Mathe ohne Druck.",
    text: "Eine kurze Lernrunde, drei Aufgaben und danach sichtbar fertig.",
    intent: "Kinder-Agent",
    lines: ["Test · Mathe", "Dauer · 15 Minuten", "Thema · Brüche", "Ton · ruhig und ermutigend"]
  },
  goku: {
    label: "Goku",
    title: "Sachkunde, dann frei.",
    text: "Wetter, Wasserkreislauf und drei Karteikarten reichen heute.",
    intent: "Kinder-Agent",
    lines: ["Test · Sachkunde", "Dauer · 12 Minuten", "Material · 3 Karten", "Ziel · sicherer Einstieg"]
  },
  car: {
    label: "Auto",
    title: "Wechsel in 8 Wochen.",
    text: "Hermes kann FINN und Alternativen nach eurem echten Bedarf vergleichen.",
    intent: "Auto-Agent",
    lines: ["Budgetrahmen klären", "Lieferzeit prüfen", "Familienbedarf erfassen", "Noch keine Buchung"]
  },
  dentist: {
    label: "Zahnarzt",
    title: "Soll ich Termine suchen?",
    text: "Drei passende Slots für beide Kinder, möglichst am selben Nachmittag.",
    intent: "Termin-Agent",
    lines: ["Kurze Wege", "Nach Schulschluss", "Kinder nacheinander", "Freigabe vor Anfrage"]
  }
};

const state = {
  mode: "idle",
  phase: "idle",
  approved: false,
  transcript: "",
  voiceProvider: "browser",
  elevenLabsConfigured: null,
  commandText: ""
};

const app = document.querySelector("#family-dashboard");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let activeAudio = null;
let microphoneStream = null;
let orbController = null;

function render() {
  orbController?.destroy();
  orbController = null;

  const context = contexts[state.mode];
  app.innerHTML = `
    <section class="jarvis-frame phase-${state.phase}">
      <div class="frame-grid" aria-hidden="true"></div>

      <header class="jarvis-topbar">
        <div class="system-mark">
          <span class="system-monogram">H</span>
          <div>
            <strong>Hermes Family</strong>
            <small>Mittwoch, 10. Juni&nbsp;&nbsp;·&nbsp;&nbsp;14°&nbsp;&nbsp;·&nbsp;&nbsp;Regen ab 15 Uhr</small>
          </div>
        </div>
        <div class="system-state">
          <i></i>
          ${phaseLabel(state.phase)}
        </div>
      </header>

      <aside class="family-rail" aria-label="Familie">
        ${family.map((person) => `
          <button class="family-person" style="--person:${person.color}" data-mode="${person.id === "papa" ? "car" : person.id}" type="button">
            <span class="person-avatar">${person.short}</span>
            <span class="person-copy">
              <strong>${person.name}</strong>
              <small>${person.status}</small>
            </span>
          </button>
        `).join("")}
      </aside>

      <main class="voice-stage" aria-live="polite">
        <button class="orb-hitarea" data-voice type="button" aria-label="Mit Hermes sprechen" aria-pressed="${state.phase === "listening"}">
          <span class="orb-canvas" data-orb></span>
          <span class="orb-action">${orbActionLabel(state.phase)}</span>
        </button>

        <div class="voice-copy">
          <span>${context.label}</span>
          <h1>${context.title}</h1>
          <p>${context.text}</p>
        </div>

        <nav class="command-row" aria-label="Schnellbefehle">
          ${(context.prompts || ["Heute", "Zelda", "Goku", "Auto", "Zahnarzt"]).map((prompt) => `
            <button data-command="${prompt.toLowerCase()}" type="button">${prompt}</button>
          `).join("")}
        </nav>
      </main>

      <aside class="context-panel">
        <div class="panel-heading">
          <span>${context.intent}</span>
          <strong>${state.mode === "idle" ? "2 Freigaben" : context.label}</strong>
        </div>
        ${renderContextBody(context)}
      </aside>

      <footer class="command-dock">
        <div class="transcript">
          <span>${statusMeta()}</span>
          <strong>${escapeHtml(state.transcript) || defaultTranscript()}</strong>
        </div>
        <form class="command-input" data-command-form>
          <input name="command" autocomplete="off" aria-label="Befehl eingeben" placeholder="Befehl eingeben" value="${escapeHtml(state.commandText)}" />
          <button type="submit">Senden</button>
        </form>
      </footer>
    </section>
  `;

  const orbHost = document.querySelector("[data-orb]");
  if (orbHost) {
    orbController = mountHermesOrb(orbHost, {
      getPhase: () => state.phase
    });
    if (microphoneStream && state.phase === "listening") {
      orbController.attachStream(microphoneStream);
    }
    if (activeAudio && state.phase === "speaking") {
      orbController.attachAudioElement(activeAudio);
    }
  }

  wireEvents();
}

function renderContextBody(context) {
  if (state.mode === "idle") {
    return `
      <div class="approval-stack">
        ${renderApproval("Zahnarzttermin vorbereiten?", "Drei passende Slots für beide Kinder suchen.", "dentist")}
        ${renderApproval("Auto-Wechsel analysieren", "FINN und Alternativen vergleichen.", "car")}
      </div>
    `;
  }

  return `
    <ul class="signal-list">
      ${context.lines.map((line) => `<li><i></i><span>${line}</span></li>`).join("")}
    </ul>
    ${state.mode === "dentist" ? `
      <div class="approval-action">
        <button data-approve type="button">${state.approved ? "Freigegeben" : "Terminsuche freigeben"}</button>
        <small>${state.approved ? "Hermes bereitet Optionen vor." : "Keine externe Aktion ohne Bestätigung."}</small>
      </div>
    ` : ""}
  `;
}

function renderApproval(title, text, mode) {
  return `
    <button class="approval-card" data-mode="${mode}" type="button">
      <span>Agent fragt</span>
      <strong>${title}</strong>
      <p>${text}</p>
      <i aria-hidden="true">›</i>
    </button>
  `;
}

function wireEvents() {
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => handleCommand(transcriptFor(button.dataset.mode), button.dataset.mode));
  });

  document.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("click", () => handleCommand(button.textContent || "", modeFromCommand(button.dataset.command)));
  });

  document.querySelector("[data-voice]")?.addEventListener("click", () => {
    if (state.phase === "listening") stopListening();
    else startListening();
  });

  document.querySelector("[data-command-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const command = String(formData.get("command") || "").trim();
    if (!command) return;
    state.commandText = command;
    handleCommand(command);
  });

  document.querySelector("[data-approve]")?.addEventListener("click", async () => {
    state.approved = true;
    state.transcript = "Freigabe erteilt: Zahnarztoptionen vorbereiten.";
    render();
    await speak("Okay. Ich bereite drei passende Zahnarztoptionen vor und melde mich dann wieder.");
  });
}

async function startListening() {
  if (!SpeechRecognition) {
    state.transcript = "Spracherkennung ist in diesem Browser nicht verfügbar. Auf dem iPad bitte Safari über die Tailscale-HTTPS-Adresse nutzen.";
    render();
    await speak("Ich kann in diesem Browser noch nicht zuhören. Du kannst den Befehl unten eingeben.");
    return;
  }

  stopCurrentSpeech();
  stopMicrophone();

  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
  } catch (error) {
    state.transcript = micErrorMessage(error?.name || "not-allowed");
    state.phase = "idle";
    render();
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "de-DE";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    state.phase = "listening";
    state.transcript = "Ich höre zu …";
    render();
  };

  recognition.onresult = (event) => {
    const text = Array.from(event.results)
      .map((result) => result[0]?.transcript || "")
      .join(" ")
      .trim();
    updateTranscript(text || "Ich höre zu …");

    if (event.results[event.results.length - 1]?.isFinal && text) {
      handleCommand(text);
    }
  };

  recognition.onerror = (event) => {
    stopMicrophone();
    state.phase = "idle";
    state.transcript = micErrorMessage(event.error);
    render();
  };

  recognition.onend = () => {
    if (state.phase === "listening") {
      stopMicrophone();
      state.phase = "idle";
      render();
    }
  };

  try {
    recognition.start();
  } catch (_error) {
    stopMicrophone();
    state.phase = "idle";
    state.transcript = "Der Mikrofonstart wurde blockiert. Bitte die Mikrofonfreigabe prüfen.";
    render();
  }
}

function stopListening() {
  if (recognition) {
    recognition.onend = null;
    recognition.stop();
    recognition = null;
  }
  stopMicrophone();
  state.phase = "idle";
  state.transcript = "Spracheingabe pausiert.";
  render();
}

async function handleCommand(text, explicitMode = "") {
  if (!text) return;
  if (recognition) {
    recognition.onend = null;
    recognition.stop();
    recognition = null;
  }
  stopMicrophone();

  const mode = explicitMode || modeFromCommand(text.toLowerCase());
  state.transcript = text;
  state.phase = "thinking";
  render();
  await delay(620);

  state.mode = mode;
  state.phase = "idle";
  render();
  await speak(replyForMode(mode));
}

async function speak(text) {
  stopCurrentSpeech();
  state.phase = "speaking";
  render();

  try {
    const response = await fetch("/api/elevenlabs-tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (response.ok) {
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      activeAudio = new Audio(audioUrl);
      activeAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        activeAudio = null;
        state.phase = "idle";
        state.voiceProvider = "elevenlabs";
        render();
      };
      activeAudio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        activeAudio = null;
        speakWithBrowser(text);
      };
      state.voiceProvider = "elevenlabs";
      render();
      await activeAudio.play();
      return;
    }
  } catch (_error) {
    // Browser speech keeps the prototype usable before ElevenLabs is configured.
  }

  speakWithBrowser(text);
}

function speakWithBrowser(text) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    state.phase = "idle";
    state.voiceProvider = "none";
    render();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.94;
  utterance.pitch = 0.94;
  utterance.onend = finishBrowserSpeech;
  utterance.onerror = finishBrowserSpeech;
  state.voiceProvider = "browser";
  window.speechSynthesis.speak(utterance);
}

function finishBrowserSpeech() {
  state.phase = "idle";
  state.voiceProvider = "browser";
  render();
}

function stopCurrentSpeech() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
  window.speechSynthesis?.cancel();
  if (state.phase === "speaking") state.phase = "idle";
}

function stopMicrophone() {
  microphoneStream?.getTracks().forEach((track) => track.stop());
  microphoneStream = null;
}

function updateTranscript(text) {
  state.transcript = text;
  const element = document.querySelector(".transcript strong");
  if (element) element.textContent = text;
}

function modeFromCommand(command) {
  if (command.includes("zelda") || command.includes("mathe")) return "zelda";
  if (command.includes("goku") || command.includes("sachkunde")) return "goku";
  if (command.includes("auto") || command.includes("finn") || command.includes("wagen")) return "car";
  if (command.includes("zahn") || command.includes("arzt") || command.includes("termin")) return "dentist";
  if (command.includes("zurück") || command.includes("ruhig") || command.includes("standby")) return "idle";
  return "today";
}

function replyForMode(mode) {
  return {
    idle: "Ich bin da. Alles ist ruhig.",
    today: "Heute ist der Tag sortiert. Zelda und Goku haben kurze Lernrunden. Zahnarzt und Auto brauchen noch eine Entscheidung.",
    zelda: "Für Zelda steht Mathe an. Fünfzehn Minuten Brüche, drei Aufgaben, dann ist es geschafft.",
    goku: "Für Goku steht Sachkunde an. Zwölf Minuten zu Wetter und Wasserkreislauf reichen heute.",
    car: "Der Auto-Wechsel ist in acht Wochen. Ich kann FINN und Alternativen nach Budget, Lieferzeit und Familienbedarf vergleichen.",
    dentist: "Der Zahnarzttermin ist fällig. Ich kann drei passende Slots für beide Kinder vorbereiten."
  }[mode];
}

function transcriptFor(mode) {
  return {
    idle: "Zurück in Standby.",
    today: "Zeig mir heute.",
    zelda: "Was steht für Zelda an?",
    goku: "Was steht für Goku an?",
    car: "Was ist mit dem neuen Auto?",
    dentist: "Bereite den Zahnarzttermin vor."
  }[mode];
}

function phaseLabel(phase) {
  return {
    idle: "Standby",
    listening: "Hört zu",
    thinking: "Denkt nach",
    speaking: "Spricht"
  }[phase];
}

function orbActionLabel(phase) {
  return {
    idle: "Antippen und sprechen",
    listening: "Ich höre zu",
    thinking: "Einen Moment",
    speaking: "Hermes antwortet"
  }[phase];
}

function statusMeta() {
  const mic = SpeechRecognition ? "Mic bereit" : "Mic nicht verfügbar";
  const elevenLabs = state.elevenLabsConfigured === null ? "ElevenLabs prüfe" : state.elevenLabsConfigured ? "ElevenLabs bereit" : "ElevenLabs fehlt";
  return `${phaseLabel(state.phase)} · ${mic} · ${elevenLabs}`;
}

function defaultTranscript() {
  if (state.phase === "listening") return "Ich höre zu …";
  if (state.phase === "thinking") return "Ich ordne das kurz ein …";
  if (state.phase === "speaking") return "Hermes antwortet …";
  return "Sag zum Beispiel: Was steht heute an?";
}

function micErrorMessage(error) {
  if (error === "NotAllowedError" || error === "not-allowed" || error === "service-not-allowed") {
    return "Mikrofon blockiert. Bitte in Safari den Mikrofonzugriff für diese Seite erlauben.";
  }
  if (error === "NotFoundError" || error === "audio-capture") return "Kein Mikrofon gefunden.";
  if (error === "no-speech") return "Ich habe nichts gehört. Tippe den Orb erneut an.";
  return `Mikrofonfehler: ${error || "unbekannt"}`;
}

async function loadVoiceStatus() {
  try {
    const response = await fetch("/api/voice-status");
    const voiceStatus = await response.json();
    state.elevenLabsConfigured = Boolean(voiceStatus.elevenLabsConfigured);
  } catch (_error) {
    state.elevenLabsConfigured = false;
  }
  render();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

render();
loadVoiceStatus();

const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 240;
const FRAMEBUFFER_SIZE = SCREEN_WIDTH * SCREEN_HEIGHT;
const PLAYER_ONE = 1;
const DEFAULT_ROM_FILE = "超级玛莉.nes";
const GAME_LIST_PATH = "./static/game-list.json?v=1";
const SAVE_KEY_PREFIX = "rw-pocket:save:";
const SAVE_SCHEMA_VERSION = 1;
const SPEED_STORAGE_KEY = "rw-pocket:speed-percent:v2";
const DEFAULT_SPEED_PERCENT = 100;
const MIN_SPEED_PERCENT = 50;
const MAX_SPEED_PERCENT = 150;
const FRAME_DURATION = 1000 / 60;
const TURBO_INTERVAL_MS = 70;

const AUDIO_BUFFERING = 512;
const SAMPLE_COUNT = 4 * 1024;
const SAMPLE_MASK = SAMPLE_COUNT - 1;

const Controller = jsnes.Controller;
const Buttons = {
    up: Controller.BUTTON_UP,
    down: Controller.BUTTON_DOWN,
    left: Controller.BUTTON_LEFT,
    right: Controller.BUTTON_RIGHT,
    a: Controller.BUTTON_A,
    b: Controller.BUTTON_B,
    start: Controller.BUTTON_START,
    select: Controller.BUTTON_SELECT
};

const canvas = document.getElementById("nes-canvas");
const bootOverlay = document.getElementById("boot-overlay");
const statusText = document.getElementById("status-text");
const audioButton = document.getElementById("resume-audio");
const stickZone = document.getElementById("stick-zone");
const stickKnob = document.getElementById("stick-knob");
const dpadZone = document.getElementById("dpad-zone");
const modeToggleButton = document.getElementById("btn-mode-toggle");
const currentGameText = document.getElementById("current-game");
const openLibraryButton = document.getElementById("open-library");
const closeLibraryButton = document.getElementById("close-library");
const libraryOverlay = document.getElementById("library-overlay");
const gameSearchInput = document.getElementById("game-search");
const gameGrid = document.getElementById("game-grid");
const gameCount = document.getElementById("game-count");
const randomGameButton = document.getElementById("random-game");
const loadSelectedButton = document.getElementById("load-selected");
const librarySubtitle = document.getElementById("library-subtitle");
const pauseButton = document.getElementById("toggle-pause");
const saveStateButton = document.getElementById("save-state");
const loadStateButton = document.getElementById("load-state");
const openShortcutsButton = document.getElementById("open-shortcuts");
const closeShortcutsButton = document.getElementById("close-shortcuts");
const shortcutOverlay = document.getElementById("shortcut-overlay");
const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");

let canvasCtx = null;
let imageData = null;
let framebufferU8 = null;
let framebufferU32 = null;

let audioContext = null;
let scriptProcessor = null;
let masterGain = null;
const audioSamplesL = new Float32Array(SAMPLE_COUNT);
const audioSamplesR = new Float32Array(SAMPLE_COUNT);
let audioWriteCursor = 0;
let audioReadCursor = 0;

let romLoaded = false;
let animating = false;
const activeButtons = new Set();
let isPaused = false;
let isMuted = false;
let games = [];
let visibleGames = [];
let selectedGameFile = DEFAULT_ROM_FILE;
let currentGameFile = DEFAULT_ROM_FILE;
let speedPercent = DEFAULT_SPEED_PERCENT;
let speedMultiplier = 1;
let lastFrameTime = 0;
let frameAccumulator = 0;
let nes = null;
let loadRequestId = 0;
const turboTimers = new Map();

function createNesInstance() {
    return new jsnes.NES({
        onFrame(framebuffer24) {
            for (let i = 0; i < FRAMEBUFFER_SIZE; i += 1) {
                framebufferU32[i] = 0xff000000 | framebuffer24[i];
            }
        },
        onAudioSample(left, right) {
            audioSamplesL[audioWriteCursor] = left;
            audioSamplesR[audioWriteCursor] = right;
            audioWriteCursor = (audioWriteCursor + 1) & SAMPLE_MASK;
        }
    });
}

function setOverlay(text) {
    bootOverlay.textContent = text;
    bootOverlay.classList.remove("is-hidden");
}

function hideOverlay() {
    bootOverlay.classList.add("is-hidden");
}

function setStatus(text) {
    statusText.textContent = text;
}

function setCurrentGame(name) {
    currentGameText.textContent = name;
}

function getSaveKey(fileName) {
    return `${SAVE_KEY_PREFIX}${fileName.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0).toString(16)}`;
    // return `${SAVE_KEY_PREFIX}${encodeURIComponent(fileName)}`;

}

function clampSpeedPercent(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return DEFAULT_SPEED_PERCENT;
    }
    return Math.min(MAX_SPEED_PERCENT, Math.max(MIN_SPEED_PERCENT, Math.round(numeric)));
}

function persistSpeedPercent() {
    try {
        localStorage.setItem(SPEED_STORAGE_KEY, String(speedPercent));
    } catch (error) {
        console.warn("Persist speed failed:", error);
    }
}

function syncSpeedSliderFill() {
    const fill = ((speedPercent - MIN_SPEED_PERCENT) / (MAX_SPEED_PERCENT - MIN_SPEED_PERCENT)) * 100;
    speedSlider.style.setProperty("--speed-fill", `${fill}%`);
}

function updateSpeedUI() {
    speedSlider.value = String(speedPercent);
    speedValue.textContent = `${speedPercent}%`;
    syncSpeedSliderFill();
}

function applySpeedPercent(value, persist) {
    speedPercent = clampSpeedPercent(value);
    speedMultiplier = speedPercent / 100;
    updateSpeedUI();
    if (persist) {
        persistSpeedPercent();
    }
}

function readSavedSpeedPercent() {
    try {
        const raw = localStorage.getItem(SPEED_STORAGE_KEY);
        return raw ? clampSpeedPercent(raw) : DEFAULT_SPEED_PERCENT;
    } catch (error) {
        console.warn("Read speed failed:", error);
        return DEFAULT_SPEED_PERCENT;
    }
}

function readSavePayload(fileName) {
    try {
        const raw = localStorage.getItem(getSaveKey(fileName));
        if (!raw) {
            return null;
        }
        const payload = JSON.parse(raw);
        if (!payload || typeof payload !== "object" || !payload.state) {
            return null;
        }
        return payload;
    } catch (error) {
        console.warn("Read save failed:", error);
        return null;
    }
}

function updatePauseButton() {
    pauseButton.textContent = "暂停";
    pauseButton.classList.toggle("pause-active", isPaused);
}

function updateMuteButton() {
    audioButton.textContent = "静音";
    audioButton.classList.toggle("pause-active", isMuted);
}

function setMuted(muted) {
    isMuted = Boolean(muted);
    if (masterGain) {
        masterGain.gain.value = isMuted ? 0 : 1;
    }
    updateMuteButton();
}

function updateRuntimeButtons() {
    pauseButton.disabled = !romLoaded;
    saveStateButton.disabled = !romLoaded;
}

function updateSaveInfo() {
    const payload = readSavePayload(currentGameFile);
    if (!payload) {
        loadStateButton.disabled = true;
        return;
    }

    loadStateButton.disabled = !romLoaded;
}

function setPaused(paused) {
    if (!romLoaded) {
        isPaused = false;
    } else {
        isPaused = Boolean(paused);
    }
    if (isPaused) {
        releaseAllButtons();
        setStatus("Paused");
    } else if (romLoaded) {
        setStatus("Running");
    }
    updatePauseButton();
    updateRuntimeButtons();
}

function findGameTitleByFile(fileName) {
    const found = games.find((game) => game.file === fileName);
    return found ? found.title : fileName.replace(/\.[^/.]+$/u, "");
}

function togglePause() {
    if (!romLoaded) {
        return;
    }
    setPaused(!isPaused);
}

async function toggleMute() {
    await ensureAudio();
    setMuted(!isMuted);
}

function saveCurrentState() {
    if (!romLoaded) {
        return;
    }

    const payload = {
        version: SAVE_SCHEMA_VERSION,
        file: currentGameFile,
        title: findGameTitleByFile(currentGameFile),
        savedAt: new Date().toISOString(),
        state: nes.toJSON()
    };

    try {
        localStorage.setItem(getSaveKey(currentGameFile), JSON.stringify(payload));
        setStatus("Saved");
        updateSaveInfo();
    } catch (error) {
        console.error(error);
        // 存储已满，清空所有旧存档后重试
        if (error.name === "QuotaExceededError" || error.code === 22 || error.code === 1014) {
            console.log("Storage full, clearing all old saves...");
            clearAllSaves();
            try {
                localStorage.setItem(getSaveKey(currentGameFile), JSON.stringify(payload));
                setStatus("Saved");
                updateSaveInfo();
                console.log("Save succeeded after clearing old saves");
            } catch (retryError) {
                setStatus("Save Failed");
                alert("Save failed. Even after clearing old saves, the current game state is too large.");
            }
        } else {
            setStatus("Save Failed");
            alert("Save failed. Browser storage may be unavailable.");
        }
    }
}

function clearAllSaves() {
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(SAVE_KEY_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
        console.log(`Cleared ${keysToRemove.length} old save(s)`);
    } catch (error) {
        console.error("Failed to clear old saves:", error);
    }
}

async function loadCurrentState() {
    if (!romLoaded) {
        return;
    }

    const payload = readSavePayload(currentGameFile);
    if (!payload) {
        setStatus("No Save");
        return;
    }

    try {
        await ensureAudio();
        releaseAllButtons();
        setOverlay("Loading Save...");
        resetAudioBuffer();
        resetEmulatorTiming();
        nes.fromJSON(payload.state);
        romLoaded = true;
        updateRuntimeButtons();
        currentGameFile = payload.file || currentGameFile;
        selectedGameFile = currentGameFile;
        setSelectedGame(selectedGameFile, false);
        setCurrentGame(payload.title || findGameTitleByFile(currentGameFile));
        hideOverlay();
        setPaused(false);
        updateSaveInfo();
        setStatus("Save Loaded");
        startLoop();
    } catch (error) {
        hideOverlay();
        setStatus("Load Failed");
        console.error(error);
        alert("Load failed. The save data might be invalid.");
    }
}

function toRomPath(fileName) {
    return `./static/gameNes/${encodeURIComponent(fileName)}`;
}

function releaseAllButtons() {
    resetStick();
    Object.values(Buttons).forEach((button) => releaseButton(button));
}

function normalizeGameItem(item) {
    if (!item || typeof item.file !== "string") {
        return null;
    }

    const file = item.file.trim();
    if (!file || !/\.nes$/i.test(file)) {
        return null;
    }

    const fallbackTitle = file.replace(/\.[^/.]+$/u, "");
    const title = (typeof item.title === "string" ? item.title.trim() : "") || fallbackTitle;
    return { file, title };
}

function initCanvas() {
    canvasCtx = canvas.getContext("2d");
    imageData = canvasCtx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    const buffer = new ArrayBuffer(imageData.data.length);
    framebufferU8 = new Uint8ClampedArray(buffer);
    framebufferU32 = new Uint32Array(buffer);
    clearScreen();
}

function clearScreen() {
    if (!canvasCtx || !imageData || !framebufferU8) {
        return;
    }
    framebufferU8.fill(0);
    imageData.data.set(framebufferU8);
    canvasCtx.putImageData(imageData, 0, 0);
}

function onAudioProcess(event) {
    const output = event.outputBuffer;
    const length = output.length;
    const left = output.getChannelData(0);
    const right = output.getChannelData(1);

    if (!romLoaded || isPaused) {
        audioReadCursor = audioWriteCursor;
        left.fill(0);
        right.fill(0);
        return;
    }

    const available = (audioWriteCursor - audioReadCursor) & SAMPLE_MASK;
    const sampleCount = Math.min(length, available);

    for (let i = 0; i < sampleCount; i += 1) {
        const index = (audioReadCursor + i) & SAMPLE_MASK;
        left[i] = audioSamplesL[index];
        right[i] = audioSamplesR[index];
    }

    if (sampleCount < length) {
        left.fill(0, sampleCount);
        right.fill(0, sampleCount);
    }

    audioReadCursor = (audioReadCursor + sampleCount) & SAMPLE_MASK;
}

function initAudio() {
    if (audioContext) {
        return;
    }

    const AudioContextRef = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextRef) {
        setStatus("Audio unsupported");
        return;
    }

    audioContext = new AudioContextRef();
    scriptProcessor = audioContext.createScriptProcessor(AUDIO_BUFFERING, 0, 2);
    masterGain = audioContext.createGain();
    masterGain.gain.value = isMuted ? 0 : 1;
    scriptProcessor.onaudioprocess = onAudioProcess;
    scriptProcessor.connect(masterGain);
    masterGain.connect(audioContext.destination);
}

async function ensureAudio() {
    initAudio();
    if (!audioContext) {
        return;
    }

    if (audioContext.state === "suspended") {
        await audioContext.resume();
    }
    if (isPaused) {
        setStatus("Paused");
    } else if (romLoaded) {
        setStatus("Running");
    }
}

function renderLoop() {
    if (!romLoaded) {
        animating = false;
        return;
    }

    const now = performance.now();
    if (!lastFrameTime) {
        lastFrameTime = now;
    }

    const delta = Math.min(now - lastFrameTime, 100);
    lastFrameTime = now;

    if (!isPaused) {
        frameAccumulator += delta * speedMultiplier;
        let framesToRun = Math.floor(frameAccumulator / FRAME_DURATION);
        if (framesToRun > 5) {
            framesToRun = 5;
        }
        if (framesToRun > 0) {
            frameAccumulator -= framesToRun * FRAME_DURATION;
            for (let i = 0; i < framesToRun; i += 1) {
                nes.frame();
            }
        }
    }

    imageData.data.set(framebufferU8);
    canvasCtx.putImageData(imageData, 0, 0);
    window.requestAnimationFrame(renderLoop);
}

function startLoop() {
    if (animating) {
        return;
    }
    animating = true;
    window.requestAnimationFrame(renderLoop);
}

function decodeRom(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        const slice = bytes.subarray(i, i + chunk);
        binary += String.fromCharCode.apply(null, slice);
    }
    return binary;
}

function resetAudioBuffer() {
    audioWriteCursor = 0;
    audioReadCursor = 0;
    audioSamplesL.fill(0);
    audioSamplesR.fill(0);
}

function resetEmulatorTiming() {
    frameAccumulator = 0;
    lastFrameTime = 0;
}

function rebuildNes() {
    nes = createNesInstance();
    resetAudioBuffer();
    resetEmulatorTiming();
}

async function loadRom(path, title, fileName) {
    const requestId = ++loadRequestId;
    releaseAllButtons();
    isPaused = false;
    updatePauseButton();
    setOverlay("Loading ROM...");
    setStatus("Booting");
    romLoaded = false;
    updateRuntimeButtons();
    updateSaveInfo();
    clearScreen();
    rebuildNes();

    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`ROM load failed: ${response.status}`);
    }

    const romData = decodeRom(await response.arrayBuffer());
    if (requestId !== loadRequestId) {
        return;
    }

    nes.loadROM(romData);
    romLoaded = true;
    updateRuntimeButtons();
    currentGameFile = fileName || currentGameFile;
    setCurrentGame(title || "Unknown");
    hideOverlay();
    setStatus("Running");
    updateSaveInfo();
    startLoop();
}

function updateLibraryMeta() {
    gameCount.textContent = `${visibleGames.length} / ${games.length} 游戏`;
    const selected = games.find((game) => game.file === selectedGameFile);
    if (selected) {
        librarySubtitle.textContent = `当前选择: ${selected.title}`;
    } else {
        librarySubtitle.textContent = "请选择一款游戏畅玩吧...";
    }
}

function setSelectedGame(file, bringIntoView) {
    selectedGameFile = file;
    const cards = gameGrid.querySelectorAll(".game-card");
    cards.forEach((card) => {
        card.classList.toggle("is-selected", card.dataset.file === file);
    });

    if (bringIntoView) {
        const selectedCard = Array.from(cards).find((card) => card.dataset.file === file);
        if (selectedCard) {
            selectedCard.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
    }
    updateLibraryMeta();
}

function renderGameGrid(gameItems) {
    gameGrid.innerHTML = "";

    if (!gameItems.length) {
        const empty = document.createElement("div");
        empty.className = "empty-tip";
        empty.textContent = "No game found. Try another keyword.";
        gameGrid.appendChild(empty);
        updateLibraryMeta();
        return;
    }

    const fragment = document.createDocumentFragment();
    gameItems.forEach((game) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "game-card";
        card.dataset.file = game.file;
        if (game.file === selectedGameFile) {
            card.classList.add("is-selected");
        }

        const title = document.createElement("span");
        title.className = "game-title";
        title.textContent = game.title;

        const file = document.createElement("span");
        file.className = "game-file";
        file.textContent = game.file;

        card.appendChild(title);
        card.appendChild(file);
        fragment.appendChild(card);
    });
    gameGrid.appendChild(fragment);
    updateLibraryMeta();
}

function filterGames(keyword) {
    const text = keyword.trim().toLowerCase();
    if (!text) {
        visibleGames = [...games];
    } else {
        visibleGames = games.filter((game) => (
            game.title.toLowerCase().includes(text) || game.file.toLowerCase().includes(text)
        ));
    }

    if (visibleGames.length && !visibleGames.some((game) => game.file === selectedGameFile)) {
        selectedGameFile = visibleGames[0].file;
    }
    renderGameGrid(visibleGames);
}

function openLibrary() {
    libraryOverlay.classList.remove("is-hidden");
    libraryOverlay.setAttribute("aria-hidden", "false");
    gameSearchInput.focus();
}

function closeLibrary() {
    libraryOverlay.classList.add("is-hidden");
    libraryOverlay.setAttribute("aria-hidden", "true");
}

function openShortcuts() {
    shortcutOverlay.classList.remove("is-hidden");
    shortcutOverlay.setAttribute("aria-hidden", "false");
}

function closeShortcuts() {
    shortcutOverlay.classList.add("is-hidden");
    shortcutOverlay.setAttribute("aria-hidden", "true");
}

function isOverlayOpen() {
    return !libraryOverlay.classList.contains("is-hidden") || !shortcutOverlay.classList.contains("is-hidden");
}

function isTextInputTarget(target) {
    if (!target) {
        return false;
    }
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable === true;
}

async function loadSelectedGame() {
    const selected = games.find((game) => game.file === selectedGameFile);
    if (!selected) {
        return;
    }

    try {
        await ensureAudio();
        await loadRom(toRomPath(selected.file), selected.title, selected.file);
        closeLibrary();
    } catch (error) {
        romLoaded = false;
        updateRuntimeButtons();
        setOverlay(`ROM load failed: ${selected.file}`);
        setStatus("Error");
        console.error(error);
    }
}

async function initGameLibrary() {
    try {
        const response = await fetch(GAME_LIST_PATH, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`game-list load failed: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error("game-list format invalid");
        }

        games = data
            .map(normalizeGameItem)
            .filter(Boolean)
            .sort((a, b) => a.title.localeCompare(b.title, "zh-Hans-CN", {
                numeric: true,
                sensitivity: "base"
            }));
    } catch (error) {
        console.error(error);
        games = [{ file: DEFAULT_ROM_FILE, title: DEFAULT_ROM_FILE.replace(/\.[^/.]+$/u, "") }];
    }

    if (!games.length) {
        games = [{ file: DEFAULT_ROM_FILE, title: DEFAULT_ROM_FILE.replace(/\.[^/.]+$/u, "") }];
    }

    const defaultExists = games.some((game) => game.file === DEFAULT_ROM_FILE);
    selectedGameFile = defaultExists ? DEFAULT_ROM_FILE : games[0].file;
    visibleGames = [...games];
    renderGameGrid(visibleGames);
    setSelectedGame(selectedGameFile, false);
}

function pressButton(button, element) {
    if (!romLoaded || isPaused) {
        return;
    }
    if (!activeButtons.has(button)) {
        nes.buttonDown(PLAYER_ONE, button);
        activeButtons.add(button);
    }
    if (element) {
        element.classList.add("is-pressed");
    }
}

function releaseButton(button, element) {
    if (activeButtons.has(button)) {
        nes.buttonUp(PLAYER_ONE, button);
        activeButtons.delete(button);
    }
    if (element) {
        element.classList.remove("is-pressed");
    }
}

function setDirectional(up, down, left, right) {
    const state = { up, down, left, right };
    const directionKeys = ["up", "down", "left", "right"];
    directionKeys.forEach((key) => {
        if (state[key]) {
            pressButton(Buttons[key]);
        } else {
            releaseButton(Buttons[key]);
        }
    });
}

function releaseDirectional() {
    setDirectional(false, false, false, false);
}

function bindActionButton(element, button) {
    const press = async (event) => {
        event.preventDefault();
        await ensureAudio();
        pressButton(button, element);
    };

    const release = (event) => {
        event.preventDefault();
        releaseButton(button, element);
    };

    if (window.PointerEvent) {
        element.addEventListener("pointerdown", async (event) => {
            if (element.setPointerCapture) {
                try {
                    element.setPointerCapture(event.pointerId);
                } catch (error) {
                    console.debug("setPointerCapture failed:", error);
                }
            }
            await press(event);
        });
        element.addEventListener("pointerup", release);
        element.addEventListener("pointercancel", release);
        element.addEventListener("pointerleave", release);
        return;
    }

    element.addEventListener("touchstart", press, { passive: false });
    element.addEventListener("touchend", release, { passive: false });
    element.addEventListener("touchcancel", release, { passive: false });
    element.addEventListener("mousedown", press);
    element.addEventListener("mouseup", release);
    element.addEventListener("mouseleave", release);
}

function stopTurboButton(element, button) {
    const timer = turboTimers.get(element);
    if (timer) {
        window.clearInterval(timer);
        turboTimers.delete(element);
    }
    releaseButton(button, element);
}

function bindTurboButton(element, button) {
    const press = async (event) => {
        event.preventDefault();
        await ensureAudio();
        stopTurboButton(element, button);
        let pressed = false;
        const tick = () => {
            if (pressed) {
                releaseButton(button, element);
            } else {
                pressButton(button, element);
            }
            pressed = !pressed;
        };
        tick();
        turboTimers.set(element, window.setInterval(tick, TURBO_INTERVAL_MS));
    };

    const release = (event) => {
        event.preventDefault();
        stopTurboButton(element, button);
    };

    if (window.PointerEvent) {
        element.addEventListener("pointerdown", async (event) => {
            if (element.setPointerCapture) {
                try {
                    element.setPointerCapture(event.pointerId);
                } catch (error) {
                    console.debug("setPointerCapture failed:", error);
                }
            }
            await press(event);
        });
        element.addEventListener("pointerup", release);
        element.addEventListener("pointercancel", release);
        element.addEventListener("pointerleave", release);
        return;
    }

    element.addEventListener("touchstart", press, { passive: false });
    element.addEventListener("touchend", release, { passive: false });
    element.addEventListener("touchcancel", release, { passive: false });
    element.addEventListener("mousedown", press);
    element.addEventListener("mouseup", release);
    element.addEventListener("mouseleave", release);
}

let stickPointerId = null;
let usingMouseStick = false;

function readStickRadius() {
    return stickZone.clientWidth * 0.22;
}

function updateStick(clientX, clientY) {
    const rect = stickZone.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const radius = readStickRadius();
    const deadZone = radius * 0.32;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance > radius) {
        const scale = radius / distance;
        dx *= scale;
        dy *= scale;
    }

    stickKnob.style.transform = `translate(${dx}px, ${dy}px)`;

    const up = dy < -deadZone;
    const down = dy > deadZone;
    const left = dx < -deadZone;
    const right = dx > deadZone;
    setDirectional(up, down, left, right);
}

function resetStick() {
    stickKnob.style.transform = "translate(0, 0)";
    releaseDirectional();
    stickPointerId = null;
}

async function stickStart(clientX, clientY, pointerId) {
    stickPointerId = pointerId;
    await ensureAudio();
    updateStick(clientX, clientY);
}

function stickMove(clientX, clientY) {
    if (stickPointerId === null && !usingMouseStick) {
        return;
    }
    updateStick(clientX, clientY);
}

function stickEnd() {
    resetStick();
    usingMouseStick = false;
}

if (window.PointerEvent) {
    stickZone.addEventListener("pointerdown", async (event) => {
        event.preventDefault();
        if (stickZone.setPointerCapture) {
            try {
                stickZone.setPointerCapture(event.pointerId);
            } catch (error) {
                console.debug("stick setPointerCapture failed:", error);
            }
        }
        await stickStart(event.clientX, event.clientY, event.pointerId);
    });

    stickZone.addEventListener("pointermove", (event) => {
        if (event.pointerId !== stickPointerId) {
            return;
        }
        event.preventDefault();
        stickMove(event.clientX, event.clientY);
    });

    stickZone.addEventListener("pointerup", (event) => {
        if (event.pointerId !== stickPointerId) {
            return;
        }
        event.preventDefault();
        stickEnd();
    });

    stickZone.addEventListener("pointercancel", (event) => {
        if (event.pointerId !== stickPointerId) {
            return;
        }
        event.preventDefault();
        stickEnd();
    });

    stickZone.addEventListener("pointerleave", (event) => {
        if (event.pointerId !== stickPointerId) {
            return;
        }
        event.preventDefault();
        stickEnd();
    });
} else {
    stickZone.addEventListener("touchstart", async (event) => {
        event.preventDefault();
        const touch = event.changedTouches[0];
        await stickStart(touch.clientX, touch.clientY, "touch");
    }, { passive: false });

    stickZone.addEventListener("touchmove", (event) => {
        event.preventDefault();
        const touch = event.changedTouches[0];
        stickMove(touch.clientX, touch.clientY);
    }, { passive: false });

    stickZone.addEventListener("touchend", (event) => {
        event.preventDefault();
        stickEnd();
    }, { passive: false });

    stickZone.addEventListener("touchcancel", (event) => {
        event.preventDefault();
        stickEnd();
    }, { passive: false });

    stickZone.addEventListener("mousedown", async (event) => {
        event.preventDefault();
        usingMouseStick = true;
        await stickStart(event.clientX, event.clientY, "mouse");
    });

    window.addEventListener("mousemove", (event) => {
        if (!usingMouseStick) {
            return;
        }
        event.preventDefault();
        stickMove(event.clientX, event.clientY);
    });

    window.addEventListener("mouseup", (event) => {
        if (!usingMouseStick) {
            return;
        }
        event.preventDefault();
        stickEnd();
    });
}

bindActionButton(document.getElementById("btn-a"), Buttons.b);
bindActionButton(document.getElementById("btn-b"), Buttons.a);
bindTurboButton(document.getElementById("btn-c"), Buttons.a);
bindTurboButton(document.getElementById("btn-d"), Buttons.b);
bindActionButton(document.getElementById("btn-start"), Buttons.start);
bindActionButton(document.getElementById("btn-select"), Buttons.select);
pauseButton.addEventListener("click", () => {
    togglePause();
});
saveStateButton.addEventListener("click", () => {
    saveCurrentState();
});
loadStateButton.addEventListener("click", async () => {
    await loadCurrentState();
});

openLibraryButton.addEventListener("click", () => {
    openLibrary();
});

closeLibraryButton.addEventListener("click", () => {
    closeLibrary();
});

libraryOverlay.addEventListener("click", (event) => {
    if (event.target === libraryOverlay) {
        closeLibrary();
    }
});

openShortcutsButton.addEventListener("click", () => {
    openShortcuts();
});

closeShortcutsButton.addEventListener("click", () => {
    closeShortcuts();
});

shortcutOverlay.addEventListener("click", (event) => {
    if (event.target === shortcutOverlay) {
        closeShortcuts();
    }
});

gameSearchInput.addEventListener("input", (event) => {
    filterGames(event.target.value);
});

gameSearchInput.addEventListener("keydown", async (event) => {
    if (event.code === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        await loadSelectedGame();
    }
});

gameGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".game-card");
    if (!card) {
        return;
    }
    setSelectedGame(card.dataset.file, false);
});

gameGrid.addEventListener("dblclick", async (event) => {
    const card = event.target.closest(".game-card");
    if (!card) {
        return;
    }
    setSelectedGame(card.dataset.file, false);
    await loadSelectedGame();
});

loadSelectedButton.addEventListener("click", async () => {
    await loadSelectedGame();
});

randomGameButton.addEventListener("click", async () => {
    if (!visibleGames.length) {
        return;
    }
    const random = visibleGames[Math.floor(Math.random() * visibleGames.length)];
    setSelectedGame(random.file, true);
    await loadSelectedGame();
});

const keyboardMap = {
    KeyW: Buttons.up,
    KeyS: Buttons.down,
    KeyA: Buttons.left,
    KeyD: Buttons.right,
    KeyK: Buttons.a,
    KeyJ: Buttons.b,
    BracketRight: Buttons.start,
    BracketLeft: Buttons.select
};

window.addEventListener("keydown", async (event) => {
    if (isTextInputTarget(event.target)) {
        return;
    }

    if (event.code === "Escape") {
        if (!shortcutOverlay.classList.contains("is-hidden")) {
            event.preventDefault();
            closeShortcuts();
            return;
        }
        if (!libraryOverlay.classList.contains("is-hidden")) {
            event.preventDefault();
            closeLibrary();
            return;
        }
    }

    if (event.code === "Enter") {
        event.preventDefault();
        if (!event.repeat) {
            togglePause();
        }
        return;
    }

    if (event.code === "Minus") {
        event.preventDefault();
        if (!event.repeat) {
            saveCurrentState();
        }
        return;
    }

    if (event.code === "Equal") {
        event.preventDefault();
        if (!event.repeat) {
            await loadCurrentState();
        }
        return;
    }

    if (isOverlayOpen()) {
        return;
    }

    const button = keyboardMap[event.code];
    if (button === undefined) {
        return;
    }

    event.preventDefault();
    await ensureAudio();
    pressButton(button);
});

window.addEventListener("keyup", (event) => {
    if (isTextInputTarget(event.target)) {
        return;
    }

    if (isOverlayOpen()) {
        return;
    }

    const button = keyboardMap[event.code];
    if (button === undefined) {
        return;
    }

    event.preventDefault();
    releaseButton(button);
});

window.addEventListener("blur", () => {
    releaseAllButtons();
    resetEmulatorTiming();
});

audioButton.addEventListener("click", async () => {
    await toggleMute();
});

speedSlider.addEventListener("input", (event) => {
    applySpeedPercent(event.target.value, true);
});

window.addEventListener("pointerdown", () => {
    ensureAudio();
}, { once: true });

// D-pad 8-direction handling
const dpadButtons = dpadZone.querySelectorAll(".dpad-btn");
const activeDpadDirections = new Set();

function updateDpadDirectionState() {
    const up = activeDpadDirections.has("up");
    const down = activeDpadDirections.has("down");
    const left = activeDpadDirections.has("left");
    const right = activeDpadDirections.has("right");
    setDirectional(up, down, left, right);
}

function handleDpadPress(direction, element) {
    element.classList.add("is-pressed");
    activeDpadDirections.add(direction);
    updateDpadDirectionState();
}

function handleDpadRelease(direction, element) {
    element.classList.remove("is-pressed");
    activeDpadDirections.delete(direction);
    updateDpadDirectionState();
}

function bindDpadButton(element, direction) {
    const press = async (event) => {
        event.preventDefault();
        await ensureAudio();
        handleDpadPress(direction, element);
    };

    const release = (event) => {
        event.preventDefault();
        handleDpadRelease(direction, element);
    };

    if (window.PointerEvent) {
        element.addEventListener("pointerdown", async (event) => {
            if (element.setPointerCapture) {
                try {
                    element.setPointerCapture(event.pointerId);
                } catch (error) {
                    console.debug("dpad setPointerCapture failed:", error);
                }
            }
            await press(event);
        });
        element.addEventListener("pointerup", release);
        element.addEventListener("pointercancel", release);
        element.addEventListener("pointerleave", release);
        return;
    }

    element.addEventListener("touchstart", press, { passive: false });
    element.addEventListener("touchend", release, { passive: false });
    element.addEventListener("touchcancel", release, { passive: false });
    element.addEventListener("mousedown", press);
    element.addEventListener("mouseup", release);
    element.addEventListener("mouseleave", release);
}

// Bind all dpad buttons with their directions
dpadButtons.forEach((btn) => {
    const dir = btn.dataset.dir;
    if (dir) {
        bindDpadButton(btn, dir);
    }
});

// Mode toggle functionality
let isJoystickMode = true;

function updateControlMode() {
    if (isJoystickMode) {
        // Joystick mode: show stick-zone, hide dpad-zone, button shows "十字"
        stickZone.classList.remove("is-hidden");
        dpadZone.classList.add("is-hidden");
        modeToggleButton.textContent = "\u5341\u5b57"; // 十字
    } else {
        // D-pad mode: hide stick-zone, show dpad-zone, button shows "万向"
        stickZone.classList.add("is-hidden");
        dpadZone.classList.remove("is-hidden");
        modeToggleButton.textContent = "\u4e07\u5411"; // 万向
    }
}

modeToggleButton.addEventListener("click", () => {
    isJoystickMode = !isJoystickMode;
    updateControlMode();
    // Release all buttons when switching modes
    releaseAllButtons();
    activeDpadDirections.clear();
});

function updatePauseButton() {
    pauseButton.textContent = "\u6682\u505c";
    pauseButton.classList.toggle("pause-active", isPaused);
}

function updateMuteButton() {
    audioButton.textContent = "\u9759\u97f3";
    audioButton.classList.toggle("pause-active", isMuted);
}

async function boot() {
    initCanvas();
    applySpeedPercent(readSavedSpeedPercent(), false);
    updatePauseButton();
    updateMuteButton();
    updateRuntimeButtons();
    updateSaveInfo();
    rebuildNes();
    await initGameLibrary();
    const initialGame = games.find((game) => game.file === selectedGameFile) || games[0];

    try {
        await loadRom(toRomPath(initialGame.file), initialGame.title, initialGame.file);
    } catch (error) {
        romLoaded = false;
        updateRuntimeButtons();
        setOverlay(`ROM load failed. Check ./static/gameNes/${initialGame.file}`);
        setStatus("Error");
        console.error(error);
    }
}

boot();

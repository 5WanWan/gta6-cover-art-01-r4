// main.js — wires the Sunset Heist comic cover studio: photo picks, per-panel
// crop and position, caption editing, layouts, grades, sizes and PNG export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, comicize, SAMPLE_PHOTOS, GRADES, LAYOUTS, DEFAULT_SLOTS } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide 1920 × 1080' },
};

// The working state. slots[i] fills layout panel i.
const state = {
  layout: 'heist-grid',
  grade: 'sunset',
  title: 'SUNSET HEIST',
  subtitle: 'Vice City nights',
  tagline: 'TWO OUTLAWS · ONE LAST SCORE',
  strip: 'PALMS · NEON · NO RULES · COMING SOON',
  size: '1920x1080',
  selected: 0,
  slots: DEFAULT_SLOTS.map((src) => ({ src, zoom: 1, ox: 0, oy: 0 })),
};

// src -> { img, comic } (the comic canvas is re-made when the grade changes).
const images = new Map();
let uploadCount = 0;
let fontsReady = false;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function ensureFonts() {
  if (fontsReady) return;
  try {
    await Promise.all([
      document.fonts.load('400 100px Anton'),
      document.fonts.load('400 100px Pacifico'),
      document.fonts.ready,
    ]);
  } catch { /* fall back to system fonts */ }
  fontsReady = true;
}

async function addPhoto(src, img) {
  const comic = comicize(img, state.grade);
  images.set(src, { img, comic });
}

async function loadSamples() {
  for (const s of SAMPLE_PHOTOS) {
    if (!images.has(s.key)) {
      const img = await loadImage(s.src);
      await addPhoto(s.key, img);
    }
  }
}

function recomicizeAll() {
  for (const [src, rec] of images) {
    rec.comic = comicize(rec.img, state.grade);
  }
}

function previewSize() {
  const s = SIZES[state.size];
  const scale = Math.min(1, 960 / s.w, 720 / s.h);
  return { w: Math.round(s.w * scale), h: Math.round(s.h * scale) };
}

export function render() {
  const { w, h } = previewSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w; canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  drawCover(ctx, w, h, state, images);
  markSelectedPanel();
}

function markSelectedPanel() {
  // A thin white corner marker on the selected panel, drawn on the preview only.
  const layout = LAYOUTS[state.layout];
  const p = layout.panels[state.selected];
  if (!p) return;
  const ctx = canvas.getContext('2d');
  const x = p.x * canvas.width, y = p.y * canvas.height;
  const w = p.w * canvas.width, h = p.h * canvas.height;
  ctx.save();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
  ctx.restore();
}

// --- panel picking and dragging --------------------------------------------
function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const cx = ((clientX - r.left) / r.width) * canvas.width;
  const cy = ((clientY - r.top) / r.height) * canvas.height;
  const layout = LAYOUTS[state.layout];
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    if (cx >= p.x * canvas.width && cx <= (p.x + p.w) * canvas.width &&
        cy >= p.y * canvas.height && cy <= (p.y + p.h) * canvas.height) return i;
  }
  return -1;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  state.selected = i;
  syncPanelControls();
  const slot = state.slots[i];
  drag = { x: e.clientX, y: e.clientY, ox: slot.ox, oy: slot.oy, panel: LAYOUTS[state.layout].panels[i] };
  canvas.setPointerCapture(e.pointerId);
  render();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = canvas.getBoundingClientRect();
  const slot = state.slots[state.selected];
  const pw = drag.panel.w * r.width, ph = drag.panel.h * r.height;
  slot.ox = Math.max(-0.6, Math.min(0.6, drag.ox + (e.clientX - drag.x) / pw));
  slot.oy = Math.max(-0.6, Math.min(0.6, drag.oy + (e.clientY - drag.y) / ph));
  syncPanelControls();
  render();
});
canvas.addEventListener('pointerup', () => { drag = null; });

// --- controls ---------------------------------------------------------------
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const taglineInput = document.getElementById('tagline');
const stripInput = document.getElementById('strip');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panx');
const panYInput = document.getElementById('pany');
const panelLabel = document.getElementById('panel-label');

function syncPanelControls() {
  const slot = state.slots[state.selected];
  panelLabel.textContent = `Panel ${state.selected + 1} — ${slot.src}`;
  zoomInput.value = slot.zoom;
  panXInput.value = Math.round(slot.ox * 100);
  panYInput.value = Math.round(slot.oy * 100);
  document.querySelectorAll('#samples button').forEach((b) => {
    b.classList.toggle('active', b.dataset.src === slot.src);
  });
}

function bindText(input, key) {
  input.addEventListener('input', () => { state[key] = input.value; render(); });
}
bindText(titleInput, 'title');
bindText(subtitleInput, 'subtitle');
bindText(taglineInput, 'tagline');
bindText(stripInput, 'strip');

zoomInput.addEventListener('input', () => {
  state.slots[state.selected].zoom = Number(zoomInput.value);
  render();
});
panXInput.addEventListener('input', () => {
  state.slots[state.selected].ox = Number(panXInput.value) / 100;
  render();
});
panYInput.addEventListener('input', () => {
  state.slots[state.selected].oy = Number(panYInput.value) / 100;
  render();
});

// Sample photo thumbnails: click one to put it in the selected panel.
const samplesEl = document.getElementById('samples');
for (const s of SAMPLE_PHOTOS) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'thumb';
  b.dataset.src = s.key;
  const im = document.createElement('img');
  im.src = s.src; im.alt = s.label;
  const sp = document.createElement('span');
  sp.textContent = s.label;
  b.append(im, sp);
  b.addEventListener('click', async () => {
    state.slots[state.selected].src = s.key;
    state.slots[state.selected].zoom = 1;
    state.slots[state.selected].ox = 0;
    state.slots[state.selected].oy = 0;
    syncPanelControls();
    render();
  });
  samplesEl.append(b);
}

// Upload your own photo into the selected panel.
document.getElementById('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const key = `upload-${++uploadCount}`;
  const img = await loadImage(URL.createObjectURL(file));
  await addPhoto(key, img);
  state.slots[state.selected].src = key;
  state.slots[state.selected].zoom = 1;
  state.slots[state.selected].ox = 0;
  state.slots[state.selected].oy = 0;
  syncPanelControls();
  render();
  statusEl.textContent = `Your photo is in panel ${state.selected + 1}.`;
});

// Layout and grade pickers.
const layoutEl = document.getElementById('layouts');
for (const [key, l] of Object.entries(LAYOUTS)) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'pick';
  b.dataset.key = key;
  b.textContent = l.label;
  b.addEventListener('click', () => {
    state.layout = key;
    state.selected = 0;
    syncPickers();
    syncPanelControls();
    render();
  });
  layoutEl.append(b);
}
const gradeEl = document.getElementById('grades');
for (const [key, g] of Object.entries(GRADES)) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'pick';
  b.dataset.key = key;
  b.textContent = g.label;
  b.addEventListener('click', () => {
    state.grade = key;
    recomicizeAll();
    syncPickers();
    render();
  });
  gradeEl.append(b);
}
const sizeEl = document.getElementById('sizes');
for (const [key, s] of Object.entries(SIZES)) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'pick';
  b.dataset.key = key;
  b.textContent = s.label;
  b.addEventListener('click', () => {
    state.size = key;
    syncPickers();
    render();
  });
  sizeEl.append(b);
}

function syncPickers() {
  document.querySelectorAll('#layouts .pick').forEach((b) => b.classList.toggle('active', b.dataset.key === state.layout));
  document.querySelectorAll('#grades .pick').forEach((b) => b.classList.toggle('active', b.dataset.key === state.grade));
  document.querySelectorAll('#sizes .pick').forEach((b) => b.classList.toggle('active', b.dataset.key === state.size));
}

// Export the cover at the chosen size as a PNG download.
export function exportCover() {
  const s = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = s.w; off.height = s.h;
  drawCover(off.getContext('2d'), s.w, s.h, state, images);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `sunset-heist-${s.w}x${s.h}.png`;
      a.click();
      statusEl.textContent = `Saved sunset-heist-${s.w}x${s.h}.png`;
      resolve(blob);
    }, 'image/png');
  });
}
document.getElementById('export').addEventListener('click', exportCover);

// Expose the state for the screenshot scenes and for debugging.
window.__cover = { state, images, render, exportCover, loadSamples, ensureFonts };

const shot = new URLSearchParams(location.search).get('shot');
(async () => {
  await ensureFonts();
  await loadSamples();
  syncPickers();
  syncPanelControls();
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), {
      state, images, render, loadSamples, ensureFonts,
      setSize: (key) => { state.size = key; syncPickers(); },
    });
  } else {
    render();
  }
})();

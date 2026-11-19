// cover.js — the comic-book GTA-style cover renderer for Sunset Heist.
// Draws a multi-panel comic cover with bold poster lettering onto a canvas.
// Everything here is original: the layouts, the lettering and the comic treatment
// are drawn in code; the photos are the maker's own generated images or the
// user's own uploads. No Rockstar artwork, logo or font is used anywhere.

export const SAMPLE_PHOTOS = [
  { key: 'heist', label: 'Heist', src: 'samples/heist.jpg' },
  { key: 'chase', label: 'Chase', src: 'samples/chase.jpg' },
  { key: 'drive', label: 'Night drive', src: 'samples/drive.jpg' },
  { key: 'sunset', label: 'Sunset', src: 'samples/sunset.jpg' },
];

export const GRADES = {
  sunset: {
    label: 'Sunset',
    sat: 1.28, contrast: 1.14, tint: 'rgba(255, 94, 20, 0.10)',
    titleTop: '#ffe259', titleMid: '#ff8a2a', titleBottom: '#ff2e88',
    subtitle: '#ff5fa2', subtitleGlow: 'rgba(255, 47, 136, 0.85)',
  },
  neon: {
    label: 'Neon',
    sat: 1.38, contrast: 1.18, tint: 'rgba(255, 47, 165, 0.12)',
    titleTop: '#8ef6ff', titleMid: '#ff5fa2', titleBottom: '#b967ff',
    subtitle: '#7df9ff', subtitleGlow: 'rgba(60, 220, 255, 0.85)',
  },
  noir: {
    label: 'Noir',
    sat: 0.12, contrast: 1.38, tint: 'rgba(0, 0, 0, 0.08)',
    titleTop: '#ffffff', titleMid: '#d8d8d8', titleBottom: '#8a8a8a',
    subtitle: '#ffd23e', subtitleGlow: 'rgba(255, 210, 62, 0.85)',
  },
};

// Panel geometry is fractions of the cover (x, y, w, h), plus a slant (the top
// edge's right corner shifts by slant * panel width) and a rotation in degrees
// around the panel centre. titleTop is where the big title block starts.
export const LAYOUTS = {
  'heist-grid': {
    label: 'Heist grid',
    titleTop: 0.58, seal: { x: 0.88, y: 0.10 },
    panels: [
      { x: 0.0, y: 0.0, w: 0.60, h: 0.66, slant: 0.025, rot: 0 },
      { x: 0.60, y: 0.0, w: 0.40, h: 0.66, slant: -0.02, rot: 0 },
      { x: 0.0, y: 0.66, w: 0.42, h: 0.34, slant: 0.02, rot: 0 },
      { x: 0.42, y: 0.66, w: 0.58, h: 0.34, slant: 0, rot: 0 },
    ],
  },
  'hero-three': {
    label: 'Hero + three',
    titleTop: 0.40, seal: { x: 0.88, y: 0.10 },
    panels: [
      { x: 0.0, y: 0.0, w: 1.0, h: 0.52, slant: 0, rot: 0 },
      { x: 0.0, y: 0.52, w: 0.34, h: 0.48, slant: 0.03, rot: 0 },
      { x: 0.34, y: 0.52, w: 0.33, h: 0.48, slant: -0.02, rot: 0 },
      { x: 0.67, y: 0.52, w: 0.33, h: 0.48, slant: 0.02, rot: 0 },
    ],
  },
  'four-panel': {
    label: 'Four panel',
    titleTop: 0.55, seal: { x: 0.88, y: 0.10 },
    panels: [
      { x: 0.0, y: 0.0, w: 0.5, h: 0.5, slant: 0.03, rot: 0 },
      { x: 0.5, y: 0.0, w: 0.5, h: 0.5, slant: -0.03, rot: 0 },
      { x: 0.0, y: 0.5, w: 0.5, h: 0.5, slant: -0.02, rot: 0 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5, slant: 0.02, rot: 0 },
    ],
  },
  'full-bleed': {
    label: 'Full bleed',
    titleTop: 0.60, seal: { x: 0.88, y: 0.10 },
    panels: [
      { x: 0.0, y: 0.0, w: 1.0, h: 1.0, slant: 0, rot: 0 },
      { x: 0.60, y: 0.05, w: 0.34, h: 0.36, slant: 0, rot: 5 },
      { x: 0.06, y: 0.60, w: 0.32, h: 0.34, slant: 0, rot: -4 },
      { x: 0.42, y: 0.66, w: 0.28, h: 0.28, slant: 0, rot: 3 },
    ],
  },
  'tilted-snaps': {
    label: 'Tilted snaps',
    titleTop: 0.62, seal: { x: 0.88, y: 0.10 },
    panels: [
      { x: 0.0, y: 0.0, w: 1.0, h: 1.0, slant: 0, rot: 0 },
      { x: 0.05, y: 0.04, w: 0.50, h: 0.52, slant: 0, rot: -3 },
      { x: 0.52, y: 0.08, w: 0.43, h: 0.44, slant: 0, rot: 4 },
      { x: 0.30, y: 0.50, w: 0.44, h: 0.42, slant: 0, rot: -2 },
    ],
  },
};

export const DEFAULT_SLOTS = ['heist', 'chase', 'drive', 'sunset'];

// --- comic treatment -------------------------------------------------------
// Turns a photo into a cel-shaded comic print: posterized colours, boosted
// saturation and contrast, a warm/neon tint and a subtle halftone dot texture.
export function comicize(img, grade, maxW = 900) {
  const g = GRADES[grade] || GRADES.sunset;
  const scale = Math.min(1, maxW / img.naturalWidth);
  const w = Math.max(2, Math.round(img.naturalWidth * scale));
  const h = Math.max(2, Math.round(img.naturalHeight * scale));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h);
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    let r = p[i], gg = p[i + 1], b = p[i + 2];
    const avg = (r + gg + b) / 3;
    r = avg + (r - avg) * g.sat;
    gg = avg + (gg - avg) * g.sat;
    b = avg + (b - avg) * g.sat;
    r = (r - 128) * g.contrast + 128;
    gg = (gg - 128) * g.contrast + 128;
    b = (b - 128) * g.contrast + 128;
    // Posterize to five levels a channel: flat comic colour.
    p[i] = Math.max(0, Math.min(255, Math.round(r / 51) * 51));
    p[i + 1] = Math.max(0, Math.min(255, Math.round(gg / 51) * 51));
    p[i + 2] = Math.max(0, Math.min(255, Math.round(b / 51) * 51));
  }
  x.putImageData(d, 0, 0);
  // Grade tint.
  x.globalCompositeOperation = 'source-over';
  x.fillStyle = g.tint;
  x.fillRect(0, 0, w, h);
  // Halftone dots: a small repeating dot tile at low strength.
  const tile = document.createElement('canvas');
  tile.width = 9; tile.height = 9;
  const t = tile.getContext('2d');
  t.fillStyle = 'rgba(0,0,0,0.55)';
  t.beginPath(); t.arc(4.5, 4.5, 1.6, 0, Math.PI * 2); t.fill();
  const pat = x.createPattern(tile, 'repeat');
  x.globalAlpha = 0.16;
  x.fillStyle = pat;
  x.fillRect(0, 0, w, h);
  x.globalAlpha = 1;
  // Soft vignette so each panel reads as inked.
  const vg = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.28)');
  x.fillStyle = vg;
  x.fillRect(0, 0, w, h);
  return c;
}

// --- helpers ---------------------------------------------------------------
function panelPath(ctx, px, py, pw, ph, slant) {
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + pw + slant, py);
  ctx.lineTo(px + pw, py + ph);
  ctx.lineTo(px, py + ph);
  ctx.closePath();
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const sx = cx + Math.cos(ang) * rad;
    const sy = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function fitFont(ctx, text, family, weight, maxWidth, startSize) {
  let size = startSize;
  for (; size > 10; size -= 2) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  ctx.font = `${weight} ${size}px ${family}`;
  return size;
}

// --- the cover -------------------------------------------------------------
// state: { layout, grade, title, subtitle, tagline, strip, slots: [{src, zoom, ox, oy}] }
// images: Map src -> { comic } (a comicized canvas per photo)
export function drawCover(ctx, W, H, state, images) {
  const layout = LAYOUTS[state.layout] || LAYOUTS['heist-grid'];
  const grade = GRADES[state.grade] || GRADES.sunset;
  const border = Math.max(5, Math.round(W * 0.007));
  const gutter = Math.max(3, Math.round(W * 0.004));

  ctx.save();
  ctx.fillStyle = '#0b0b12';
  ctx.fillRect(0, 0, W, H);

  // 1. Comic panels.
  layout.panels.forEach((p, i) => {
    const slot = state.slots[i] || { src: DEFAULT_SLOTS[i % 4], zoom: 1, ox: 0, oy: 0 };
    const rec = images.get(slot.src);
    if (!rec) return;
    const px = p.x * W, py = p.y * H, pw = p.w * W, ph = p.h * H;
    const slant = (p.slant || 0) * pw;
    const cx = px + pw / 2, cy = py + ph / 2;
    ctx.save();
    if (p.rot) { ctx.translate(cx, cy); ctx.rotate((p.rot * Math.PI) / 180); ctx.translate(-cx, -cy); }
    panelPath(ctx, px, py, pw, ph, slant);
    ctx.clip();
    // Cover-fit the comic image, then zoom and pan it.
    const iw = rec.comic.width, ih = rec.comic.height;
    const base = Math.max(pw / iw, ph / ih);
    const s = base * (slot.zoom || 1);
    const dw = iw * s, dh = ih * s;
    const dx = px + (pw - dw) / 2 + (slot.ox || 0) * pw;
    const dy = py + (ph - dh) / 2 + (slot.oy || 0) * ph;
    ctx.drawImage(rec.comic, dx, dy, dw, dh);
    ctx.restore();
    // Bold black comic border + a thin white ink line inside it.
    ctx.save();
    if (p.rot) { ctx.translate(cx, cy); ctx.rotate((p.rot * Math.PI) / 180); ctx.translate(-cx, -cy); }
    panelPath(ctx, px + gutter / 2, py + gutter / 2, pw - gutter, ph - gutter, slant);
    ctx.lineWidth = border;
    ctx.strokeStyle = '#000';
    ctx.lineJoin = 'miter';
    ctx.stroke();
    ctx.lineWidth = Math.max(1.5, border * 0.18);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.stroke();
    ctx.restore();
  });

  // 2. Title block: tagline + stars, then the huge title, then the script subtitle.
  const titleTop = layout.titleTop * H;
  const titleZoneW = W * 0.94;
  const titleZoneX = W * 0.03;
  const titleZoneH = H * 0.30;

  // Tagline row: five gold stars + the tagline in spaced caps.
  const tagSize = Math.max(12, Math.round(H * 0.024));
  ctx.save();
  ctx.font = `${tagSize}px Anton, sans-serif`;
  ctx.textBaseline = 'middle';
  const tagText = (state.tagline || '').toUpperCase();
  const tagW = ctx.measureText(tagText).width;
  const starR = tagSize * 0.62;
  const starsW = 5 * starR * 2.1;
  const rowW = starsW + tagSize * 0.6 + tagW;
  let rx = (W - rowW) / 2;
  for (let i = 0; i < 5; i++) {
    const sx = rx + starR + i * starR * 2.1;
    drawStar(ctx, sx, titleTop + tagSize * 0.5, starR, '#ffd23e');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(1.5, tagSize * 0.08);
    ctx.beginPath();
    ctx.arc(sx, titleTop + tagSize * 0.5, starR, 0, Math.PI * 2);
    ctx.stroke();
  }
  rx += starsW + tagSize * 0.6;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = Math.max(2, tagSize * 0.12);
  ctx.strokeText(tagText, rx, titleTop + tagSize * 0.5);
  ctx.fillText(tagText, rx, titleTop + tagSize * 0.5);
  ctx.restore();

  // The huge title: gradient letters, thick black outline, hard drop shadow.
  const title = (state.title || 'SUNSET HEIST').toUpperCase();
  const titleY = titleTop + tagSize * 2.1;
  const titleMaxH = titleZoneH - tagSize * 2.3;
  let titleSize = Math.round(Math.min(titleMaxH, W * 0.17));
  ctx.save();
  ctx.transform(1, 0, -0.06, 1, W * 0.02, 0); // slight forward lean
  const fitted = fitFont(ctx, title, 'Anton, sans-serif', 400, titleZoneW, titleSize);
  titleSize = fitted;
  const tw = ctx.measureText(title).width;
  const tx = titleZoneX + (titleZoneW - tw) / 2;
  const ty = titleY + titleSize * 0.82;
  const grad = ctx.createLinearGradient(0, titleY, 0, titleY + titleSize);
  grad.addColorStop(0, grade.titleTop);
  grad.addColorStop(0.55, grade.titleMid);
  grad.addColorStop(1, grade.titleBottom);
  ctx.textBaseline = 'alphabetic';
  // Hard offset shadow.
  ctx.font = `${titleSize}px Anton, sans-serif`;
  ctx.fillStyle = 'rgba(20, 0, 30, 0.9)';
  ctx.fillText(title, tx + titleSize * 0.055, ty + titleSize * 0.06);
  // Thick black outline, then the gradient fill.
  ctx.lineWidth = Math.max(6, titleSize * 0.10);
  ctx.strokeStyle = '#000';
  ctx.lineJoin = 'round';
  ctx.strokeText(title, tx, ty);
  ctx.fillStyle = grad;
  ctx.fillText(title, tx, ty);
  // Thin bright rim on the top edge of the letters.
  ctx.lineWidth = Math.max(1.5, titleSize * 0.012);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.strokeText(title, tx, ty - titleSize * 0.02);
  ctx.restore();

  // Script subtitle, overlapping the title's lower right in neon.
  const sub = state.subtitle || 'Vice City nights';
  ctx.save();
  const subSize = Math.round(titleSize * 0.34);
  ctx.font = `${subSize}px Pacifico, cursive`;
  const sw = ctx.measureText(sub).width;
  const sx = tx + tw - sw - titleSize * 0.08;
  const sy = ty + subSize * 0.55;
  ctx.shadowColor = grade.subtitleGlow;
  ctx.shadowBlur = subSize * 0.45;
  ctx.lineWidth = Math.max(3, subSize * 0.10);
  ctx.strokeStyle = '#000';
  ctx.lineJoin = 'round';
  ctx.strokeText(sub, sx, sy);
  ctx.fillStyle = grade.subtitle;
  ctx.fillText(sub, sx, sy);
  ctx.restore();

  // 3. Bottom strip: a black band with the punchy line and a little sun.
  const stripH = Math.max(18, Math.round(H * 0.052));
  const stripY = H - stripH - Math.max(10, H * 0.012);
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, stripY, W, stripH);
  ctx.fillStyle = grade.titleTop;
  ctx.fillRect(0, stripY, W, Math.max(2, stripH * 0.08));
  const stripText = (state.strip || '').toUpperCase();
  const stripSize = Math.round(stripH * 0.44);
  fitFont(ctx, stripText, 'Anton, sans-serif', 400, W * 0.86, stripSize);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  const stw = ctx.measureText(stripText).width;
  ctx.fillText(stripText, (W - stw) / 2, stripY + stripH / 2 + stripSize * 0.06);
  // Little setting sun at the left of the strip.
  const sunR = stripH * 0.30;
  const sunX = W * 0.045, sunY = stripY + stripH / 2;
  ctx.fillStyle = grade.titleMid;
  ctx.beginPath(); ctx.arc(sunX, sunY, sunR, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.fillRect(sunX - sunR, sunY - 1, sunR * 2, 2);
  ctx.restore();

  // 4. Circular starburst seal.
  const seal = layout.seal;
  const scx = seal.x * W, scy = seal.y * H;
  const sr = Math.max(26, W * 0.038);
  ctx.save();
  ctx.translate(scx, scy);
  ctx.rotate(-0.12);
  ctx.beginPath();
  const spikes = 14;
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (i * Math.PI) / spikes - Math.PI / 2;
    const rad = i % 2 === 0 ? sr : sr * 0.82;
    const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd23e';
  ctx.fill();
  ctx.lineWidth = Math.max(2.5, sr * 0.07);
  ctx.strokeStyle = '#000';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, sr * 0.72, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1.5, sr * 0.04);
  ctx.stroke();
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const sealSize = Math.max(9, sr * 0.24);
  ctx.font = `${sealSize}px Anton, sans-serif`;
  ctx.fillText('ORIGINAL', 0, -sr * 0.28);
  ctx.fillText('COVER ART', 0, sr * 0.30);
  drawStar(ctx, 0, sr * 0.02, sr * 0.20, '#000');
  ctx.restore();

  // 5. Small print along the very bottom edge.
  ctx.save();
  const fineSize = Math.max(8, Math.round(H * 0.011));
  ctx.font = `${fineSize}px Anton, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'SUNSET HEIST · A COMIC COVER STUDIO PICTURE · STARRING YOU · SHOT ON YOUR OWN CAMERA · LETTERING AND SEAL ORIGINAL',
    W / 2, H - Math.max(5, H * 0.006),
  );
  ctx.restore();
  ctx.restore();
}

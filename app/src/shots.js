// shots.js — fixed scenes for screenshots: ?shot=editor shows the page with a
// sample photo; ?shot=cover shows the cover alone at the requested size.
// window.__shotReady is set once painted.
import { drawCover } from './cover.js';

function ready() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

function applyQuery(state, query) {
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('title')) state.title = query.get('title');
  if (query.get('subtitle')) state.subtitle = query.get('subtitle');
  if (query.get('tagline')) state.tagline = query.get('tagline');
  if (query.get('strip')) state.strip = query.get('strip');
}

export async function runShot(shot, query, api) {
  const { state, images, render } = api;
  applyQuery(state, query);
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('cover');
    const w = Number(query.get('w') || 1280);
    const h = Number(query.get('h') || 720);
    canvas.width = w;
    canvas.height = h;
    drawCover(canvas.getContext('2d'), w, h, state, images);
    ready();
    return;
  }
  // editor: the page as a person sees it, a sample photo already in.
  render();
  ready();
}

// Gera os SVGs estáticos do perfil em assets/svg/. Rode com: npm run build
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fonts, color, text, measure, wrap, icon, doc, glass, chip, arrowUpRight, delay, esc } from './lib/kit.mjs';

const out = new URL('../assets/svg/', import.meta.url);
mkdirSync(out, { recursive: true });
const save = (name, svg) => {
  writeFileSync(new URL(name, out), svg);
  console.log(`${name.padEnd(28)} ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`);
};
const r = n => Math.round(n * 100) / 100;

// ───────────────────────────── Digitação (SMIL) ─────────────────────────────
// Cada frase tem um clipPath cuja largura cresce caractere a caractere, usando
// a largura real de cada glifo. O cursor acompanha a mesma linha do tempo.
function typing({ id, x, y, phrases, font = fonts.mono, size = 14, fill = color.ink, cursor = color.teal }) {
  const typeStep = 0.055, deleteStep = 0.026, hold = 2.1, gap = 0.45;
  let t = 0;
  const tracks = [];
  const cursorEvents = [];
  for (const phrase of phrases) {
    const widths = [...phrase].map((_, k) => measure(phrase.slice(0, k + 1), font, size));
    const events = [[t, 0]];
    cursorEvents.push([t, 0]);
    widths.forEach((w, k) => { events.push([t + (k + 1) * typeStep, w]); cursorEvents.push([t + (k + 1) * typeStep, w]); });
    const typedEnd = t + widths.length * typeStep + hold;
    for (let k = widths.length - 2; k >= -1; k--) {
      const when = typedEnd + (widths.length - 1 - k) * deleteStep;
      const w = k >= 0 ? widths[k] : 0;
      events.push([when, w]);
      cursorEvents.push([when, w]);
    }
    t = typedEnd + widths.length * deleteStep + gap;
    tracks.push({ phrase, events });
  }
  const total = t;
  const anim = (attr, events, offset = 0) => {
    const keyed = [];
    if (events[0][0] > 0) keyed.push([0, offset]);
    for (const [when, value] of events) {
      const k = Math.min(when / total, 1);
      if (keyed.length && k <= keyed.at(-1)[0]) keyed.at(-1)[1] = value + offset;
      else keyed.push([k, value + offset]);
    }
    return `<animate attributeName="${attr}" dur="${total.toFixed(3)}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${keyed.map(([k]) => k.toFixed(5)).join(';')}" values="${keyed.map(([, v]) => r(v)).join(';')}"/>`;
  };
  const h = size * 1.5;
  let defs = '', body = '';
  tracks.forEach(({ phrase, events }, i) => {
    defs += `<clipPath id="${id}-c${i}"><rect x="${r(x)}" y="${r(y - size * 1.1)}" width="0" height="${r(h)}">${anim('width', events)}</rect></clipPath>`;
    body += `<g clip-path="url(#${id}-c${i})">${text(phrase, { font, size, x, y, fill }).svg}</g>`;
  });
  const cw = Math.max(2, size * 0.58);
  body += `<g class="blink"><rect x="${r(x)}" y="${r(y - size * 0.92)}" width="${r(cw)}" height="${r(size * 1.12)}" rx="1.5" fill="${cursor}" fill-opacity=".9">${anim('x', cursorEvents, x + 1.5)}</rect></g>`;
  return { defs, body };
}

// ───────────────────────────── Arte do herói ─────────────────────────────
// Três janelas de vidro flutuando sobre órbitas: editor, gráfico e deploy.
function heroArt(p) {
  const win = (x, y, w, h, rx = 14) => `
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="#0d1428" fill-opacity=".72"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#${p}-wveil)"/>
<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${rx - 0.5}" fill="none" stroke="url(#${p}-wedge)"/>
<rect x="${x + rx}" y="${y + 0.6}" width="${w - rx * 2}" height="1" fill="url(#${p}-wtop)"/>`;
  const shadow = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${p}-shadow)"/>`;
  const code = [
    [0, 64, color.violet], [1, 118, color.teal], [2, 92, color.peri], [2, 136, color.ink3],
    [1, 74, color.teal], [2, 112, '#f4a7bb'], [0, 38, color.violet],
  ];
  const bars = [34, 52, 40, 66, 48, 74, 58];
  const defs = `
<linearGradient id="${p}-wveil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset="1" stop-color="#fff" stop-opacity=".02"/></linearGradient>
<linearGradient id="${p}-wedge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".5" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="${color.teal}" stop-opacity=".30"/></linearGradient>
<linearGradient id="${p}-wtop" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="${p}-shadow"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<linearGradient id="${p}-bar" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${color.teal}"/><stop offset="1" stop-color="${color.peri}"/></linearGradient>
<radialGradient id="${p}-glow"><stop offset="0" stop-color="${color.teal}" stop-opacity=".9"/><stop offset="1" stop-color="${color.teal}" stop-opacity="0"/></radialGradient>
<path id="${p}-orbit1" d="M668 44a128 128 0 1 1 -0.1 0z"/>
<path id="${p}-orbit2" d="M668 4a168 168 0 1 0 0.1 0z"/>`;
  const body = `
<g opacity=".9">
  <circle cx="668" cy="172" r="128" fill="none" stroke="#fff" stroke-opacity=".08" stroke-dasharray="2 7"/>
  <circle cx="668" cy="172" r="168" fill="none" stroke="#fff" stroke-opacity=".045"/>
  <circle r="9" fill="url(#${p}-glow)"><animateMotion dur="18s" repeatCount="indefinite"><mpath href="#${p}-orbit1"/></animateMotion></circle>
  <circle r="3" fill="${color.teal}"><animateMotion dur="18s" repeatCount="indefinite"><mpath href="#${p}-orbit1"/></animateMotion></circle>
  <circle r="2.4" fill="${color.peri}"><animateMotion dur="27s" repeatCount="indefinite"><mpath href="#${p}-orbit2"/></animateMotion></circle>
</g>
<g class="float-a">
  ${shadow(678, 222, 120, 14)}
  ${win(560, 58, 236, 150)}
  <circle cx="579" cy="75" r="4" fill="#ff7a8a" fill-opacity=".85"/><circle cx="593" cy="75" r="4" fill="#ffd36e" fill-opacity=".85"/><circle cx="607" cy="75" r="4" fill="${color.green}" fill-opacity=".85"/>
  ${text('app/page.tsx', { font: fonts.mono, size: 9.5, x: 778, y: 78.5, fill: color.ink3, anchor: 'end' }).svg}
  <rect x="560" y="90" width="236" height="1" fill="#fff" fill-opacity=".07"/>
  ${code.map(([indent, w, c], i) => `<rect class="grow" ${delay(0.5 + i * 0.12)} x="${578 + indent * 14}" y="${104 + i * 14.5}" width="${w}" height="6" rx="3" fill="${c}" fill-opacity=".8"/>`).join('')}
</g>
<g class="float-c">
  ${shadow(578, 292, 64, 9)}
  ${win(516, 190, 124, 96, 12)}
  ${text('commits / semana', { font: fonts.mono, size: 8.5, x: 528, y: 207, fill: color.ink3 }).svg}
  ${bars.map((h, i) => `<rect class="breathe" style="animation-delay:-${(i * 0.47).toFixed(2)}s" x="${530 + i * 14.5}" y="${276 - h * 0.85}" width="9" height="${r(h * 0.85)}" rx="2.5" fill="url(#${p}-bar)" fill-opacity=".9"/>`).join('')}
</g>
<g class="float-b">
  ${shadow(726, 262, 86, 10)}
  ${win(640, 176, 172, 78, 12)}
  <circle cx="663" cy="200" r="11" fill="${color.green}" fill-opacity=".16"/>
  <path d="M658 200.5l3.6 3.6 6.6-7.2" fill="none" stroke="${color.green}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  ${text('Deploy concluído', { font: fonts.bodySemi, size: 12, x: 682, y: 199, fill: color.ink }).svg}
  ${text('main · build 41s', { font: fonts.mono, size: 9.5, x: 682, y: 213, fill: color.ink3 }).svg}
  <rect x="654" y="232" width="144" height="4" rx="2" fill="#fff" fill-opacity=".08"/>
  <rect class="grow" ${delay(0.9)} x="654" y="232" width="144" height="4" rx="2" fill="${color.green}" fill-opacity=".85"/>
</g>`;
  return { defs, body };
}

// Elementos comuns ao herói desktop e mobile.
function nameMark(p, x, y, size) {
  const name = text('Kanex', { font: fonts.display, size, x, y, fill: `url(#${p}-name)`, tracking: -0.025 });
  const dot = text('.', { font: fonts.display, size, x: x + name.width + size * 0.01, y, fill: color.teal });
  return {
    defs: `<linearGradient id="${p}-name" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e1e7ff"/><stop offset="1" stop-color="#b9c6ff"/></linearGradient>`,
    svg: name.svg + dot.svg,
  };
}

function statusChip(x, y, label, size = 12) {
  const w = measure(label, fonts.bodyMedium, size) + 44;
  return `<g class="rise" ${delay(0.05)}>
  <rect x="${x}" y="${y}" width="${r(w)}" height="28" rx="14" fill="#fff" fill-opacity=".06" stroke="#fff" stroke-opacity=".14"/>
  <circle class="pulse" cx="${x + 17}" cy="${y + 14}" r="4" fill="${color.green}"/>
  <circle cx="${x + 17}" cy="${y + 14}" r="4" fill="${color.green}"/>
  ${text(label, { font: fonts.bodyMedium, size, x: x + 30, y: y + 18.2, fill: color.ink }).svg}
</g>`;
}

function terminal(p, x, y, w, size, phrases) {
  const type = typing({ id: `${p}-type`, x: x + 40, y: y + 27.5, phrases, size, fill: color.ink });
  return {
    defs: type.defs,
    svg: `<g class="rise" ${delay(0.45)}>
  <rect x="${x}" y="${y}" width="${w}" height="44" rx="12" fill="#060a14" fill-opacity=".55" stroke="#fff" stroke-opacity=".12"/>
  <path d="M${x + 17} ${y + 16.5}l5.5 5.5-5.5 5.5" fill="none" stroke="${color.teal}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  ${type.body}
</g>`,
  };
}

const phrases = [
  'Next.js + TypeScript, do banco à interface',
  'Agendas, lojas e pagamentos via PIX',
  'Jogos 3D em Godot com plateia ao vivo',
  'IA no WhatsApp, com humano no controle',
  'Estudando Desenvolvimento de Sistemas',
];

function hero() {
  const W = 846, H = 340, p = 'h';
  const g = glass({ w: W, h: H, rx: 24, id: p, shineDelay: 2, blobs: [
    { cx: 760, cy: 40, r: 330, c: color.peri, o: 0.34, cls: 'drift-b' },
    { cx: 60, cy: 360, r: 340, c: color.teal, o: 0.22, cls: 'drift-a' },
    { cx: 560, cy: 300, r: 220, c: color.violet, o: 0.18, cls: 'drift-c' },
  ] });
  const art = heroArt(p);
  const name = nameMark(p, 44, 154, 94);
  const term = terminal(p, 46, 214, 432, 14, phrases);
  const stackIcons = ['TypeScript', 'NextJS-Dark', 'React-Dark', 'Python-Dark', 'Godot-Dark', 'PostgreSQL-Dark'];
  const svg = doc({
    w: W, h: H,
    title: 'Kanex — desenvolvedor full-stack',
    desc: 'Banner animado em vidro fosco: nome Kanex, função de desenvolvedor full-stack, frases digitadas sobre os projetos e uma composição de janelas flutuantes com editor, gráfico de commits e deploy concluído.',
    defs: g.defs + art.defs + name.defs + term.defs,
    body: `${g.back}
${art.body}
${statusChip(46, 42, 'Aberto a oportunidades e projetos')}
<g class="rise" ${delay(0.15)}>${name.svg}</g>
<g class="rise" ${delay(0.3)}>${text('Desenvolvedor full-stack · produto, web e games', { font: fonts.bodyMedium, size: 17, x: 47, y: 192, fill: color.ink2 }).svg}</g>
${term.svg}
<g class="rise" ${delay(0.6)}>
  ${stackIcons.map((n, i) => icon(n, 46 + i * 31, 282, 24, `hs${i}`)).join('')}
  ${text('stack principal', { font: fonts.mono, size: 10.5, x: 46 + stackIcons.length * 31 + 6, y: 298, fill: color.ink3 }).svg}
</g>
${g.front}`,
  });
  save('hero.svg', svg);
}

function heroMobile() {
  const W = 420, H = 560, p = 'm';
  const g = glass({ w: W, h: H, rx: 24, id: p, shineDelay: 2, blobs: [
    { cx: 380, cy: 20, r: 280, c: color.peri, o: 0.34, cls: 'drift-b' },
    { cx: 20, cy: 560, r: 300, c: color.teal, o: 0.24, cls: 'drift-a' },
    { cx: 260, cy: 430, r: 180, c: color.violet, o: 0.18, cls: 'drift-c' },
  ] });
  const art = heroArt(p);
  const name = nameMark(p, 26, 128, 78);
  const term = terminal(p, 26, 196, 368, 11.6, phrases);
  const svg = doc({
    w: W, h: H,
    title: 'Kanex — desenvolvedor full-stack',
    desc: 'Versão para celular do banner: nome Kanex, função, frases digitadas e janelas flutuantes de editor, gráfico e deploy.',
    defs: g.defs + art.defs + name.defs + term.defs,
    body: `${g.back}
${statusChip(26, 28, 'Aberto a oportunidades e projetos', 12)}
<g class="rise" ${delay(0.15)}>${name.svg}</g>
<g class="rise" ${delay(0.3)}>${text('Desenvolvedor full-stack', { font: fonts.bodyMedium, size: 17, x: 27, y: 162, fill: color.ink2 }).svg}${text('produto, web e games', { font: fonts.bodyMedium, size: 17, x: 27, y: 184, fill: color.ink3 }).svg}</g>
${term.svg}
<g transform="translate(-431 220) scale(.96)">${art.body}</g>
${g.front}`,
  });
  save('hero-mobile.svg', svg);
}

// ───────────────────────────── Navegação ─────────────────────────────
function navPill(slug, index, label) {
  const W = 132, H = 40, p = 'n';
  const svg = doc({
    w: W, h: H, title: label, desc: `Ir para a seção ${label}`,
    defs: `<linearGradient id="${p}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color.bg2}"/><stop offset="1" stop-color="${color.bg0}"/></linearGradient>
<linearGradient id="${p}-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="${color.teal}" stop-opacity=".4"/></linearGradient>
<linearGradient id="${p}-sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="${p}-clip"><rect width="${W}" height="${H}" rx="20"/></clipPath>`,
    body: `<rect width="${W}" height="${H}" rx="20" fill="url(#${p}-bg)"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="19.5" fill="none" stroke="url(#${p}-edge)"/>
<g clip-path="url(#${p}-clip)"><g class="shine" ${delay(1 + index * 0.35)}><rect x="0" y="-10" width="50" height="60" fill="url(#${p}-sh)" transform="skewX(-18)"/></g></g>
${(() => {
  const num = text(String(index).padStart(2, '0'), { font: fonts.mono, size: 10, x: 0, y: 0 });
  const lab = text(label, { font: fonts.bodySemi, size: 13.5, x: 0, y: 0 });
  const total = num.width + 8 + lab.width;
  const x0 = (W - total) / 2;
  return text(String(index).padStart(2, '0'), { font: fonts.mono, size: 10, x: x0, y: 24.2, fill: color.teal }).svg
    + text(label, { font: fonts.bodySemi, size: 13.5, x: x0 + num.width + 8, y: 25, fill: color.ink }).svg;
})()}`,
  });
  save(`nav-${slug}.svg`, svg);
}

// ───────────────────────────── Cabeçalhos de seção ─────────────────────────────
function sectionHeader(slug, kicker, title) {
  const W = 600, H = 92;
  for (const theme of ['dark', 'light']) {
    const ink = theme === 'dark' ? color.ink : '#0b1220';
    const accent = theme === 'dark' ? color.teal : '#0b8f7c';
    const k = text(kicker, { font: fonts.monoSemi, size: 11, x: W / 2, y: 22, fill: accent, anchor: 'middle', tracking: 0.22 });
    const lineW = 46, gapK = 14;
    const svg = doc({
      w: W, h: H, title, desc: `Seção ${kicker.toLowerCase()}: ${title}`,
      defs: `<linearGradient id="u" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${color.teal}"/><stop offset="1" stop-color="${color.peri}"/></linearGradient>
<linearGradient id="fl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${accent}" stop-opacity="0"/><stop offset="1" stop-color="${accent}" stop-opacity=".6"/></linearGradient>
<linearGradient id="fr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${accent}" stop-opacity=".6"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></linearGradient>
<linearGradient id="sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="uc"><rect x="${W / 2 - 36}" y="76" width="72" height="4" rx="2"/></clipPath>`,
      style: `.sweep{animation:sweep 4.5s ease-in-out infinite}@keyframes sweep{0%{transform:translateX(-40px)}60%,100%{transform:translateX(90px)}}`,
      body: `<g class="fade">
  <rect x="${r(W / 2 - k.width / 2 - gapK - lineW)}" y="17.5" width="${lineW}" height="1" fill="url(#fl)"/>
  ${k.svg}
  <rect x="${r(W / 2 + k.width / 2 + gapK)}" y="17.5" width="${lineW}" height="1" fill="url(#fr)"/>
</g>
<g class="rise" ${delay(0.12)}>${text(title, { font: fonts.display, size: 30, x: W / 2, y: 62, fill: ink, anchor: 'middle', tracking: -0.015 }).svg}</g>
<g class="fade" ${delay(0.3)}>
  <rect x="${W / 2 - 36}" y="76" width="72" height="4" rx="2" fill="url(#u)"/>
  <g clip-path="url(#uc)"><g class="sweep"><rect x="${W / 2 - 50}" y="76" width="30" height="4" fill="url(#sh)" opacity="${theme === 'dark' ? 0.8 : 0.9}"/></g></g>
</g>`,
    });
    save(`title-${slug}-${theme}.svg`, svg);
  }
}

// ───────────────────────────── Sobre: editor ─────────────────────────────
function aboutCode() {
  const W = 416, H = 304, p = 'c';
  const g = glass({ w: W, h: H, id: p, shineDelay: 1.2, blobs: [
    { cx: 400, cy: 10, r: 260, c: color.violet, o: 0.26, cls: 'drift-b' },
    { cx: 0, cy: 300, r: 240, c: color.teal, o: 0.16, cls: 'drift-a' },
  ] });
  const kw = color.violet, str = '#a8f0c6', prop = color.teal, pun = color.ink3, id = color.ink, ty = color.peri;
  const lines = [
    [['const ', kw], ['kanex', id], [' = {', pun]],
    [['  papel', prop], [': ', pun], ['"Dev full-stack"', str], [',', pun]],
    [['  base', prop], [': ', pun], ['"Brasil"', str], [',', pun]],
    [['  foco', prop], [': [', pun], ['"produto"', str], [', ', pun], ['"web"', str], [', ', pun], ['"games"', str], ['],', pun]],
    [['  entrega', prop], [': [', pun], ['"UI"', str], [', ', pun], ['"API"', str], [', ', pun], ['"banco"', str], [', ', pun], ['"deploy"', str], ['],', pun]],
    [['  estudando', prop], [': ', pun], ['"Desenv. de Sistemas"', str], [',', pun]],
    [['  ia', prop], [': ', pun], ['"agentes + revisão humana"', str], [',', pun]],
    [['} ', pun], ['satisfies ', kw], ['Dev', ty], [';', pun]],
  ];
  const size = 12.5, lh = 23.5, x0 = 52, y0 = 82;
  let code = '';
  let lastEnd = 0;
  lines.forEach((tokens, i) => {
    const y = y0 + i * lh;
    let x = x0, row = '';
    for (const [chunk, fill] of tokens) {
      const t = text(chunk, { font: fonts.mono, size, x, y, fill });
      row += t.svg;
      x += t.width;
    }
    lastEnd = x;
    const num = text(String(i + 1), { font: fonts.mono, size: 11, x: 34, y, fill: color.ink3, anchor: 'end' }).svg;
    code += `<g class="rise" ${delay(0.25 + i * 0.13)}>${num}${row}</g>`;
  });
  const lastY = y0 + (lines.length - 1) * lh;
  const svg = doc({
    w: W, h: H,
    title: 'kanex.ts — quem é o Kanex',
    desc: 'Editor de código em vidro mostrando um objeto TypeScript: papel dev full-stack, base no Brasil, foco em produto, web e games, entrega de UI, API, banco e deploy, estudando Desenvolvimento de Sistemas e uso de agentes de IA com revisão humana.',
    defs: g.defs,
    body: `${g.back}
<circle cx="26" cy="25" r="5" fill="#ff7a8a" fill-opacity=".85"/><circle cx="43" cy="25" r="5" fill="#ffd36e" fill-opacity=".85"/><circle cx="60" cy="25" r="5" fill="${color.green}" fill-opacity=".85"/>
<rect x="82" y="13" width="${r(measure('kanex.ts', fonts.mono, 11) + 40)}" height="24" rx="7" fill="#fff" fill-opacity=".07" stroke="#fff" stroke-opacity=".1"/>
<rect x="91" y="20" width="14" height="10" rx="2.5" fill="#3178c6"/>${text('TS', { font: fonts.monoSemi, size: 6.5, x: 98, y: 27.6, fill: '#fff', anchor: 'middle' }).svg}
${text('kanex.ts', { font: fonts.mono, size: 11, x: 112, y: 29, fill: color.ink }).svg}
${text('TypeScript', { font: fonts.mono, size: 10, x: W - 22, y: 29, fill: color.ink3, anchor: 'end' }).svg}
<rect x="0" y="48" width="${W}" height="1" fill="#fff" fill-opacity=".08"/>
${code}
<g class="blink"><rect x="${r(lastEnd + 3)}" y="${r(lastY - 11)}" width="7.5" height="14" rx="1.5" fill="${color.teal}" fill-opacity=".9"/></g>
<rect x="0" y="${H - 34}" width="${W}" height="1" fill="#fff" fill-opacity=".08"/>
<path d="M26 ${H - 22}v9M26 ${H - 13}a3 3 0 1 0 0 .01M33 ${H - 22}a3 3 0 1 0 0 .01M33 ${H - 19}c0 4-7 3-7 6" fill="none" stroke="${color.ink3}" stroke-width="1.3" stroke-linecap="round"/>
${text('main', { font: fonts.mono, size: 10, x: 42, y: H - 13.5, fill: color.ink2 }).svg}
<circle cx="92" cy="${H - 17}" r="3.5" fill="${color.green}"/>
${text('0 erros · tipado', { font: fonts.mono, size: 10, x: 100, y: H - 13.5, fill: color.ink2 }).svg}
${text('UTF-8 · LF', { font: fonts.mono, size: 10, x: W - 22, y: H - 13.5, fill: color.ink3, anchor: 'end' }).svg}
${g.front}`,
  });
  save('about-code.svg', svg);
}

// ───────────────────────────── Sobre: agora ─────────────────────────────
function aboutNow() {
  const W = 416, H = 304, p = 'w';
  const g = glass({ w: W, h: H, id: p, shineDelay: 1.6, blobs: [
    { cx: 420, cy: 300, r: 260, c: color.teal, o: 0.22, cls: 'drift-a' },
    { cx: 20, cy: 0, r: 220, c: color.peri, o: 0.22, cls: 'drift-b' },
  ] });
  const items = [
    ['CONSTRUINDO', 'Nexakeep: sites e agenda para pequenos negócios', color.teal],
    ['ESTUDANDO', 'Desenvolvimento de Sistemas · Senac', color.peri],
    ['EXPLORANDO', 'Godot 4 e Roblox Studio (Luau) para jogos', color.violet],
    ['APROFUNDANDO', 'Segurança, testes E2E com Playwright e CI/CD', '#f4a7bb'],
    ['NO FLUXO', 'Agentes de IA no dia a dia, com revisão humana', color.green],
  ];
  const top = 86, step = 41;
  const rows = items.map(([label, body, c], i) => {
    const y = top + i * step;
    return `<g class="rise" ${delay(0.3 + i * 0.14)}>
  ${i === 0 ? `<circle class="pulse" cx="34" cy="${y - 4}" r="5" fill="${c}"/>` : ''}
  <circle cx="34" cy="${y - 4}" r="9" fill="${c}" fill-opacity=".12"/>
  <circle cx="34" cy="${y - 4}" r="4.5" fill="${c}"/>
  ${text(label, { font: fonts.monoSemi, size: 9.5, x: 56, y: y - 0.5, fill: c, tracking: 0.12 }).svg}
  ${text(body, { font: fonts.bodyMedium, size: 13.5, x: 56, y: y + 17, fill: color.ink }).svg}
</g>`;
  }).join('');
  const svg = doc({
    w: W, h: H,
    title: 'Agora — no que o Kanex está trabalhando',
    desc: items.map(([a, b]) => `${a.toLowerCase()}: ${b}`).join('; '),
    defs: g.defs + `<linearGradient id="${p}-line" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color.teal}" stop-opacity=".7"/><stop offset=".6" stop-color="${color.peri}" stop-opacity=".35"/><stop offset="1" stop-color="${color.peri}" stop-opacity="0"/></linearGradient>`,
    body: `${g.back}
${text('AGORA', { font: fonts.monoSemi, size: 10.5, x: 24, y: 34, fill: color.teal, tracking: 0.2 }).svg}
${text('No que estou trabalhando', { font: fonts.display, size: 19, x: 24, y: 58, fill: color.ink }).svg}
<g class="fade" ${delay(0.2)}><rect x="33.25" y="${top - 4}" width="1.5" height="${step * (items.length - 1) + 30}" fill="url(#${p}-line)"/></g>
${rows}
${g.front}`,
  });
  save('about-now.svg', svg);
}

// ───────────────────────────── Projetos ─────────────────────────────
const projects = [
  { slug: 'karol', title: 'Studio Karol', letter: 'K', kicker: 'AGENDA · WHATSAPP · IA', a: '#f4a7bb', b: '#a94f78',
    desc: 'Site, agenda e entrada via PIX para uma profissional de beleza. A IA no WhatsApp propõe mudanças, mas só um toque humano altera a agenda.',
    chips: ['Next.js 16', 'Supabase', 'WhatsApp API', 'IA'] },
  { slug: 'confia', title: 'Confia?', letter: 'C', kicker: 'SEGURANÇA · ANTIGOLPE', a: '#5ee6a0', b: '#167a5a',
    desc: 'Verificação antigolpe: a pessoa envia link, perfil, print ou telefone e recebe uma análise em português explicando o motivo de cada conclusão.',
    chips: ['Next.js', 'TypeScript', 'PostgreSQL', 'VPS Linux'] },
  { slug: 'eurora', title: 'Eurora Love', letter: 'E', kicker: 'SAAS · EXPERIÊNCIAS', a: '#ff8fb1', b: '#c2416b',
    desc: 'SaaS para casais com cinco produtos integrados: página com QR Code e música, quiz, mensagem programada, presentes e textos gerados por IA.',
    chips: ['Next.js 16', 'Prisma', 'PostgreSQL', 'PIX'] },
  { slug: 'volker', title: 'VOLKER', letter: 'V', kicker: 'E-COMMERCE · PAGAMENTOS', a: '#ff5a6e', b: '#9e1430',
    desc: 'E-commerce completo: catálogo, carrinho, cupons, rastreio e painel admin, com sessões seguras, Mercado Pago e frete real via Melhor Envio.',
    chips: ['Next.js', 'Node.js', 'Prisma', 'Mercado Pago'] },
  { slug: 'jogi', title: 'JOGI', letter: 'J', kicker: 'GAME 3D · TEMPO REAL', a: '#7aa6ff', b: '#2f55c9',
    desc: 'Jogo 3D vertical para lives no TikTok e no Kwai: a plateia controla a corrida com curtidas, comentários e presentes, via ponte Python em tempo real.',
    chips: ['Godot 4', 'GDScript', 'Python', 'WebSocket'] },
  { slug: 'vitraya', title: 'Vitraya Studio', letter: 'v', kicker: 'LOCAL-FIRST · AUTOMAÇÃO', a: '#a99bff', b: '#5b3fd8',
    desc: 'App local-first para ofertas de afiliados: importação com fotos, artes e legendas, simulador de cupons e envio por Telegram e WhatsApp.',
    chips: ['React', 'Vite', 'SQLite', 'Telegram API'] },
];

function projectCard(pr, i) {
  const W = 416, H = 252, p = 'p';
  const g = glass({ w: W, h: H, id: p, shineDelay: 1.5 + i * 0.6, blobs: [
    { cx: 400, cy: 0, r: 250, c: pr.a, o: 0.30, cls: 'drift-b' },
    { cx: 0, cy: 260, r: 220, c: color.peri, o: 0.12, cls: 'drift-a' },
  ] });
  const lines = wrap(pr.desc, fonts.body, 13.5, 366);
  if (lines.length > 3) throw new Error(`Descrição longa demais em ${pr.slug}: ${lines.length} linhas`);
  let cx = 24;
  const chips = pr.chips.map((label, k) => {
    const c = chip(label, { x: cx, y: 196, h: 26, size: 11, padX: 11, cls: 'pop', style: delay(0.55 + k * 0.08) });
    cx += c.width + 7;
    return c.svg;
  });
  if (cx - 7 > W - 24) throw new Error(`Chips não cabem em ${pr.slug}`);
  const svg = doc({
    w: W, h: H,
    title: `${pr.title} — ${pr.kicker.toLowerCase()}`,
    desc: `${pr.desc} Tecnologias: ${pr.chips.join(', ')}.`,
    defs: g.defs + `<linearGradient id="${p}-mark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pr.a}"/><stop offset="1" stop-color="${pr.b}"/></linearGradient>
<linearGradient id="${p}-markhi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
    body: `${g.back}
<g class="pop" ${delay(0.1)}>
  <rect x="24" y="24" width="48" height="48" rx="14" fill="url(#${p}-mark)"/>
  <rect x="24" y="24" width="48" height="48" rx="14" fill="url(#${p}-markhi)"/>
  <rect x="24.5" y="24.5" width="47" height="47" rx="13.5" fill="none" stroke="#fff" stroke-opacity=".35"/>
  ${text(pr.letter, { font: fonts.display, size: 26, x: 48, y: 57, fill: '#fff', anchor: 'middle' }).svg}
</g>
<g class="rise" ${delay(0.18)}>
  ${text(pr.kicker, { font: fonts.monoSemi, size: 9.5, x: 86, y: 41, fill: pr.a, tracking: 0.12 }).svg}
  ${text(pr.title, { font: fonts.display, size: 23, x: 85, y: 66, fill: color.ink, tracking: -0.01 }).svg}
</g>
<g class="fade" ${delay(0.4)}>
  <circle cx="${W - 42}" cy="46" r="17" fill="#fff" fill-opacity=".06" stroke="#fff" stroke-opacity=".16"/>
  ${arrowUpRight(W - 42, 46, 5, color.ink)}
</g>
<g class="rise" ${delay(0.32)}>${lines.map((l, k) => text(l, { font: fonts.body, size: 13.5, x: 24, y: 112 + k * 21.5, fill: color.ink2 }).svg).join('')}</g>
${chips.join('')}
${g.front}`,
  });
  save(`project-${pr.slug}.svg`, svg);
}

// ───────────────────────────── Stack ─────────────────────────────
const stack = [
  { slug: 'languages', n: '01', title: 'Linguagens', blob: color.peri, items: [
    ['TypeScript', 'TypeScript'], ['JavaScript', 'JavaScript'], ['Python-Dark', 'Python'], ['Godot-Dark', 'GDScript'], ['Lua-Dark', 'Lua / Luau'],
    ['HTML', 'HTML'], ['CSS', 'CSS'], ['PostgreSQL-Dark', 'SQL'], ['Bash-Dark', 'Bash'], ['Powershell-Dark', 'PowerShell'],
  ] },
  { slug: 'web', n: '02', title: 'Web e dados', blob: color.teal, items: [
    ['NextJS-Dark', 'Next.js'], ['React-Dark', 'React'], ['TailwindCSS-Dark', 'Tailwind'], ['Vite-Dark', 'Vite'], ['NodeJS-Dark', 'Node.js'],
    ['Prisma', 'Prisma'], ['Supabase-Dark', 'Supabase'], ['PostgreSQL-Dark', 'PostgreSQL'], ['SQLite', 'SQLite'],
  ] },
  { slug: 'tools', n: '03', title: 'Infra e ferramentas', blob: color.violet, items: [
    ['Docker', 'Docker'], ['Nginx', 'Nginx'], ['Ubuntu-Dark', 'Ubuntu'], ['Vercel-Dark', 'Vercel'], ['GithubActions-Dark', 'Actions'],
    ['Git', 'Git'], ['Github-Dark', 'GitHub'], ['VSCode-Dark', 'VS Code'], ['Windows-Dark', 'Windows'], ['RobloxStudio', 'Roblox'],
  ] },
];

function stackTile(t, i) {
  const W = 416, H = 252, p = 's';
  const g = glass({ w: W, h: H, id: p, shineDelay: 2 + i * 0.7, blobs: [
    { cx: 410, cy: 10, r: 240, c: t.blob, o: 0.26, cls: 'drift-b' },
    { cx: 10, cy: 250, r: 200, c: color.teal, o: 0.12, cls: 'drift-a' },
  ] });
  const cols = 5, colW = (W - 48) / cols, size = 44;
  const cells = t.items.map(([iconName, label], k) => {
    const row = Math.floor(k / cols), col = k % cols;
    // Linhas incompletas ficam centralizadas.
    const inRow = Math.min(cols, t.items.length - row * cols);
    const cx = 24 + (cols - inRow) * colW / 2 + col * colW + colW / 2;
    const y = 76 + row * 86;
    return `<g class="pop" ${delay(0.25 + k * 0.06)}>
  ${icon(iconName, cx - size / 2, y, size, `${p}${k}`)}
  ${text(label, { font: fonts.bodyMedium, size: 11, x: cx, y: y + size + 17, fill: color.ink2, anchor: 'middle' }).svg}
</g>`;
  }).join('');
  const svg = doc({
    w: W, h: H,
    title: t.title,
    desc: `${t.title}: ${t.items.map(([, l]) => l).join(', ')}.`,
    defs: g.defs,
    body: `${g.back}
${text(t.n, { font: fonts.monoSemi, size: 10.5, x: 24, y: 40, fill: color.teal, tracking: 0.12 }).svg}
${text(t.title, { font: fonts.display, size: 19, x: 48, y: 41, fill: color.ink }).svg}
${text(`${t.items.length} itens`, { font: fonts.mono, size: 10, x: W - 24, y: 40, fill: color.ink3, anchor: 'end' }).svg}
${cells}
${g.front}`,
  });
  save(`stack-${t.slug}.svg`, svg);
}

function integrationsTile() {
  const W = 416, H = 252, p = 'i';
  const g = glass({ w: W, h: H, id: p, shineDelay: 4.2, blobs: [
    { cx: 410, cy: 250, r: 240, c: color.green, o: 0.16, cls: 'drift-a' },
    { cx: 0, cy: 0, r: 220, c: color.peri, o: 0.20, cls: 'drift-b' },
  ] });
  const groups = [
    ['#ffc46b', ['Mercado Pago', 'Asaas · PIX', 'Melhor Envio']],
    [color.teal, ['WhatsApp Cloud API', 'Evolution API', 'Telegram Bot API']],
    [color.violet, ['DeepSeek · LLM', 'Shopee Open API', 'WebSockets']],
    ['#7aa6ff', ['Playwright', 'pytest', 'PM2 · Nginx']],
  ];
  const legend = [['#ffc46b', 'pagamentos'], [color.teal, 'mensagens'], [color.violet, 'IA e dados'], ['#7aa6ff', 'testes e deploy']];
  // Empacotamento first-fit decreasing: as pílulas mais largas entram primeiro
  // e cada uma vai para a primeira linha onde couber.
  const h = 28, gap = 7, inner = W - 48, maxRows = 4;
  const items = groups.flatMap(([c, labels]) => labels.map(label => ({ c, label, w: measure(label, fonts.bodyMedium, 12) + 31 })));
  const rows = [];
  for (const item of [...items].sort((a, b) => b.w - a.w)) {
    const row = rows.find(rw => rw.used + gap + item.w <= inner);
    if (row) { row.items.push(item); row.used += gap + item.w; }
    else rows.push({ items: [item], used: item.w });
  }
  if (rows.length > maxRows) throw new Error(`Integrações não cabem no cartão (${rows.length} linhas)`);
  let k = 0, body = '';
  rows.forEach((row, ri) => {
    let x = 24;
    const y = 64 + ri * (h + gap);
    for (const { c, label, w } of row.items) {
      body += `<g class="pop" ${delay(0.25 + k++ * 0.05)}>
  <rect x="${r(x)}" y="${y}" width="${r(w)}" height="${h}" rx="${h / 2}" fill="#fff" fill-opacity=".055" stroke="#fff" stroke-opacity=".12"/>
  <circle cx="${r(x + 13)}" cy="${y + h / 2}" r="3.5" fill="${c}"/>
  ${text(label, { font: fonts.bodyMedium, size: 12, x: x + 22.5, y: y + 18.4, fill: color.ink }).svg}
</g>`;
      x += w + gap;
    }
  });
  let lx = 24;
  const leg = legend.map(([c, l]) => {
    const s = `<circle cx="${lx + 3.5}" cy="${H - 26}" r="3" fill="${c}"/>${text(l, { font: fonts.mono, size: 9.5, x: lx + 11, y: H - 22.6, fill: color.ink3 }).svg}`;
    lx += measure(l, fonts.mono, 9.5) + 26;
    return s;
  }).join('');
  const svg = doc({
    w: W, h: H,
    title: 'Integrações e APIs',
    desc: `Integrações já usadas em projetos: ${groups.flatMap(([, l]) => l).join(', ')}.`,
    defs: g.defs,
    body: `${g.back}
${text('04', { font: fonts.monoSemi, size: 10.5, x: 24, y: 40, fill: color.teal, tracking: 0.12 }).svg}
${text('Integrações e APIs', { font: fonts.display, size: 19, x: 48, y: 41, fill: color.ink }).svg}
${text('em produção e testes', { font: fonts.mono, size: 10, x: W - 24, y: 40, fill: color.ink3, anchor: 'end' }).svg}
${body}
<rect x="24" y="${H - 44}" width="${W - 48}" height="1" fill="#fff" fill-opacity=".07"/>
${leg}
${g.front}`,
  });
  save('stack-integrations.svg', svg);
}

// ───────────────────────────── Galeria (molduras de navegador) ─────────────────────────────
function browserFrame(slug, file, url, mime) {
  const path = new URL(`../assets/shots/${file}`, import.meta.url);
  if (!existsSync(path)) { console.warn(`(sem ${file}, moldura ignorada)`); return; }
  const data = readFileSync(path).toString('base64');
  const W = 416, bar = 34, imgH = Math.round(416 * 560 / 900), H = bar + imgH;
  const svg = doc({
    w: W, h: H, title: `Tela do projeto ${slug}`, desc: `Captura de tela de ${url} dentro de uma moldura de navegador.`,
    defs: `<clipPath id="fc"><rect width="${W}" height="${H}" rx="14"/></clipPath>`,
    body: `<g clip-path="url(#fc)">
<rect width="${W}" height="${H}" fill="#0c1324"/>
<circle cx="18" cy="17" r="4.5" fill="#ff7a8a"/><circle cx="33" cy="17" r="4.5" fill="#ffd36e"/><circle cx="48" cy="17" r="4.5" fill="${color.green}"/>
<rect x="70" y="8" width="${W - 140}" height="18" rx="9" fill="#fff" fill-opacity=".07"/>
${text(url, { font: fonts.mono, size: 9.5, x: W / 2, y: 20.5, fill: color.ink2, anchor: 'middle' }).svg}
<image class="fade" x="0" y="${bar}" width="${W}" height="${imgH}" preserveAspectRatio="xMidYMin slice" href="data:${mime};base64,${data}"/>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="13.5" fill="none" stroke="#fff" stroke-opacity=".14"/>`,
  });
  save(`shot-${slug}.svg`, svg);
}

// ───────────────────────────── Rodapé e contato ─────────────────────────────
function footer() {
  const W = 846, H = 230, p = 'f';
  const g = glass({ w: W, h: H, rx: 24, id: p, shine: false, grid: false, blobs: [
    { cx: 120, cy: 0, r: 300, c: color.peri, o: 0.2, cls: 'drift-b' },
    { cx: 760, cy: 40, r: 260, c: color.teal, o: 0.16, cls: 'drift-a' },
  ] });
  const wave = (amp, len, base) => {
    let d = `M0 ${base}`;
    for (let x = 0; x < W * 2; x += len) d += ` q${len / 4} ${-amp} ${len / 2} 0 t${len / 2} 0`;
    return d + ` V${H} H0Z`;
  };
  const svg = doc({
    w: W, h: H,
    title: 'Vamos construir algo juntos?',
    desc: 'Rodapé com ondas animadas em azul-petróleo e lilás, convite para contato e abertura a projetos, parcerias e oportunidades.',
    defs: g.defs + `<linearGradient id="${p}-w1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${color.teal}"/><stop offset="1" stop-color="${color.peri}"/></linearGradient>
<linearGradient id="${p}-w2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${color.peri}"/><stop offset="1" stop-color="${color.violet}"/></linearGradient>
<linearGradient id="${p}-title" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#e3e8ff"/><stop offset="1" stop-color="${color.teal}"/></linearGradient>`,
    style: `.wave1{animation:wv 14s linear infinite}.wave2{animation:wv 22s linear infinite reverse}.wave3{animation:wv 30s linear infinite}@keyframes wv{to{transform:translateX(-${W}px)}}`,
    body: `${g.back}
<g clip-path="url(#${p}-clip)">
  <path class="wave3" d="${wave(10, 211.5, 176)}" fill="url(#${p}-w2)" fill-opacity=".10"/>
  <path class="wave2" d="${wave(14, 282, 188)}" fill="url(#${p}-w1)" fill-opacity=".14"/>
  <path class="wave1" d="${wave(9, 423, 202)}" fill="url(#${p}-w1)" fill-opacity=".22"/>
</g>
<g class="rise">${text('VAMOS CONVERSAR', { font: fonts.monoSemi, size: 11, x: W / 2, y: 54, fill: color.teal, anchor: 'middle', tracking: 0.24 }).svg}</g>
<g class="rise" ${delay(0.12)}>${text('Vamos construir algo juntos?', { font: fonts.display, size: 38, x: W / 2, y: 100, fill: `url(#${p}-title)`, anchor: 'middle', tracking: -0.02 }).svg}</g>
<g class="rise" ${delay(0.24)}>${text('Aberto a projetos, parcerias e oportunidades. Respondo por e-mail.', { font: fonts.body, size: 15, x: W / 2, y: 132, fill: color.ink2, anchor: 'middle' }).svg}</g>
${g.front}`,
  });
  save('footer.svg', svg);
}

function contactPill(slug, label, glyph, w) {
  const H = 46, p = 'k';
  const lab = text(label, { font: fonts.bodySemi, size: 13.5, x: 0, y: 0 });
  const W = w ?? Math.ceil(lab.width + 96);
  const glyphs = {
    mail: `<rect x="20" y="16" width="20" height="14" rx="3" fill="none" stroke="${color.teal}" stroke-width="1.6"/><path d="M21 18l9 6.5 9-6.5" fill="none" stroke="${color.teal}" stroke-width="1.6" stroke-linejoin="round"/>`,
    repo: `<path d="M22 15h13a3 3 0 0 1 3 3v13H25a3 3 0 0 1-3-3z" fill="none" stroke="${color.teal}" stroke-width="1.6" stroke-linejoin="round"/><path d="M22 28a3 3 0 0 1 3-3h13" fill="none" stroke="${color.teal}" stroke-width="1.6"/>`,
  };
  const svg = doc({
    w: W, h: H, title: label, desc: label,
    defs: `<linearGradient id="${p}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color.bg2}"/><stop offset="1" stop-color="${color.bg0}"/></linearGradient>
<linearGradient id="${p}-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color.teal}" stop-opacity=".6"/><stop offset=".5" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="${color.peri}" stop-opacity=".55"/></linearGradient>
<linearGradient id="${p}-sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="${p}-clip"><rect width="${W}" height="${H}" rx="23"/></clipPath>`,
    body: `<rect width="${W}" height="${H}" rx="23" fill="url(#${p}-bg)"/>
<g clip-path="url(#${p}-clip)"><g class="shine" ${delay(1.5)}><rect x="0" y="-10" width="70" height="70" fill="url(#${p}-sh)" transform="skewX(-18)"/></g></g>
<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="22.25" fill="none" stroke="url(#${p}-edge)" stroke-width="1.5"/>
${glyphs[glyph]}
${text(label, { font: fonts.bodySemi, size: 13.5, x: 50, y: 28, fill: color.ink }).svg}
${arrowUpRight(W - 24, 23, 4.5, color.ink2)}`,
  });
  save(`contact-${slug}.svg`, svg);
}

// ───────────────────────────── Execução ─────────────────────────────
hero();
heroMobile();
[['sobre', 'Sobre'], ['projetos', 'Projetos'], ['stack', 'Stack'], ['atividade', 'Atividade'], ['contato', 'Contato']]
  .forEach(([slug, label], i) => navPill(slug, i + 1, label));
sectionHeader('sobre', '01 · SOBRE', 'Quem está por trás do código');
sectionHeader('projetos', '02 · PROJETOS', 'Projetos em destaque');
sectionHeader('stack', '03 · STACK', 'Linguagens e ferramentas');
sectionHeader('atividade', '04 · ATIVIDADE', 'Ritmo no GitHub');
aboutCode();
aboutNow();
projects.forEach(projectCard);
stack.forEach(stackTile);
integrationsTile();
browserFrame('eurora', 'eurora.jpg', 'eurora.site', 'image/jpeg');
browserFrame('volker', 'velkor.jpg', 'volker · loja', 'image/jpeg');
browserFrame('vitraya', 'vitraya.jpg', '127.0.0.1:4317 · vitraya studio', 'image/jpeg');
footer();
contactPill('email', 'kainarodrigues684@gmail.com', 'mail');
contactPill('repos', 'Todos os repositórios', 'repo');

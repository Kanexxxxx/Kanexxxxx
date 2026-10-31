// Gera os SVGs estáticos do perfil em assets/svg/. Rode com: npm run build
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fonts, color, text, measure, wrap, icon, doc, glass, chip, arrowUpRight, delay, tapAt, tapLayers } from './lib/kit.mjs';
import { tech, techChip, techIcon, legible, categories, writeCategory, updateReadmeBlock, registerLanguage } from './lib/tech.mjs';

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
  return {
    defs: `<linearGradient id="${p}-name" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e1e7ff"/><stop offset="1" stop-color="#b9c6ff"/></linearGradient>`,
    svg: name.svg,
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
  'WhatsApp automatizado, com confirmação',
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
// As pílulas "tocam" em sequência, da esquerda para a direita, como uma onda.
function navPill(slug, index, label) {
  const W = 132, H = 40, p = 'n';
  const tap = tapLayers({ id: p, at: 1.4 + index * 0.3, cx: W / 2, cy: H / 2, ripple: 74, clip: `${p}-clip`,
    edge: { x: 0.75, y: 0.75, w: W - 1.5, h: H - 1.5, rx: 19.25 } });
  const num = text(String(index).padStart(2, '0'), { font: fonts.mono, size: 10, x: 0, y: 0 });
  const lab = text(label, { font: fonts.bodySemi, size: 13.5, x: 0, y: 0 });
  const x0 = (W - (num.width + 8 + lab.width)) / 2;
  const svg = doc({
    w: W, h: H, title: label, desc: `Ir para a seção ${label}`,
    defs: `<linearGradient id="${p}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color.bg2}"/><stop offset="1" stop-color="${color.bg0}"/></linearGradient>
<linearGradient id="${p}-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="${color.teal}" stop-opacity=".4"/></linearGradient>
<linearGradient id="${p}-sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="${p}-clip"><rect width="${W}" height="${H}" rx="20"/></clipPath>${tap.defs}`,
    body: `<g class="press-vb" ${tap.t}>
<rect width="${W}" height="${H}" rx="20" fill="url(#${p}-bg)"/>
${tap.ripple}
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="19.5" fill="none" stroke="url(#${p}-edge)"/>
<g clip-path="url(#${p}-clip)"><g class="shine" ${delay(3 + index * 0.35)}><rect x="0" y="-10" width="50" height="60" fill="url(#${p}-sh)" transform="skewX(-18)"/></g></g>
${tap.edge}
${text(String(index).padStart(2, '0'), { font: fonts.mono, size: 10, x: x0, y: 24.2, fill: color.teal }).svg}
${text(label, { font: fonts.bodySemi, size: 13.5, x: x0 + num.width + 8, y: 25, fill: color.ink }).svg}
</g>`,
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
    [['  padrão', prop], [': [', pun], ['"tipado"', str], [', ', pun], ['"testado"', str], [', ', pun], ['"documentado"', str], ['],', pun]],
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
    desc: 'Editor de código em vidro mostrando um objeto TypeScript: papel dev full-stack, base no Brasil, foco em produto, web e games, entrega de UI, API, banco e deploy, estudando Desenvolvimento de Sistemas, com código tipado, testado e documentado.',
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

// ───────────────────────────── Projetos ─────────────────────────────
const projects = [
  { slug: 'karol', repo: 'Karol', title: 'Studio Karol', logo: 'karol.png', kicker: 'AGENDA · WHATSAPP · IA', a: '#e4c27a', b: '#96702b',
    desc: 'Site, agenda e entrada via PIX para uma profissional de beleza. O assistente no WhatsApp propõe mudanças, mas só um toque humano altera a agenda.',
    chips: [['nextjs'], ['supabase'], ['whatsapp'], ['deepseek']] },
  { slug: 'confia', repo: 'Confia-', title: 'Confia?', logo: 'confia.svg', kicker: 'SEGURANÇA · ANTIGOLPE', a: '#5ee6a0', b: '#16a37f',
    desc: 'Verificação antigolpe: a pessoa envia link, perfil, print ou telefone e recebe uma análise em português explicando o motivo de cada conclusão.',
    chips: [['nextjs'], ['typescript'], ['postgresql'], ['drizzle', 'Drizzle']] },
  { slug: 'eurora', repo: 'Eurora', title: 'Eurora Love', logo: 'eurora.svg', kicker: 'SAAS · EXPERIÊNCIAS', a: '#ff6f9a', b: '#f6c986',
    desc: 'SaaS para casais com cinco produtos integrados: página com QR Code e música, quiz, mensagem programada, presentes e textos gerados por IA.',
    chips: [['nextjs'], ['prisma'], ['postgresql'], ['pix']] },
  { slug: 'volker', repo: 'Velkor_3', title: 'VOLKER', logo: 'volker.svg', kicker: 'E-COMMERCE · PAGAMENTOS', a: '#ff4d64', b: '#9e1430',
    desc: 'E-commerce completo: catálogo, carrinho, cupons, rastreio e painel admin, com sessões seguras, Mercado Pago e frete real via Melhor Envio.',
    chips: [['nextjs'], ['node'], ['prisma'], ['mercadopago']] },
  { slug: 'jogi', repo: 'JOGI', title: 'JOGI', logo: 'jogi.svg', kicker: 'GAME 3D · TEMPO REAL', a: '#6c9bff', b: '#ffd23f',
    desc: 'Jogo 3D vertical para lives no TikTok e no Kwai: a plateia controla a corrida com curtidas, comentários e presentes, via ponte Python em tempo real.',
    chips: [['godot', 'Godot 4'], ['gdscript'], ['python'], ['websocket']] },
  { slug: 'vitraya', repo: 'Vitraya', title: 'Vitraya Studio', logo: 'vitraya.svg', kicker: 'LOCAL-FIRST · AUTOMAÇÃO', a: '#8f80ff', b: '#baffd2',
    desc: 'App local-first para ofertas de afiliados: importação com fotos, artes e legendas, simulador de cupons e envio por Telegram e WhatsApp.',
    chips: [['react'], ['vite'], ['sqlite'], ['telegram']] },
];

// Logo do JOGI (o repositório não tem uma): pista em perspectiva no azul-cobalto
// do jogo, J em itálico e o raio amarelo do turbo.
function jogiLogo() {
  const j = text('J', { font: fonts.display, size: 40, x: 0, y: 0 });
  const svg = doc({
    w: 64, h: 64, title: 'JOGI', desc: 'Logo do JOGI: pista azul em perspectiva, letra J e raio de turbo amarelo.',
    defs: `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f8cff"/><stop offset="1" stop-color="#1a3aa8"/></linearGradient>
<linearGradient id="hi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="c"><rect width="64" height="64" rx="16"/></clipPath>`,
    body: `<g clip-path="url(#c)">
<rect width="64" height="64" fill="url(#bg)"/>
<path d="M14 64L28.5 34h7L50 64z" fill="#fff" fill-opacity=".14"/>
<path d="M31.4 37h1.2v4h-1.2zM31.2 45h1.6v5.5h-1.6zM30.9 54h2.2v8h-2.2z" fill="#fff" fill-opacity=".55"/>
<rect width="64" height="64" fill="url(#hi)"/>
</g>
<g transform="translate(${(29 - j.width / 2).toFixed(2)} 44) skewX(-10)">${text('J', { font: fonts.display, size: 40, x: 2, y: 2, fill: '#0f2a6b', attrs: 'fill-opacity=".55"' }).svg}${text('J', { font: fonts.display, size: 40, x: 0, y: 0, fill: '#fff' }).svg}</g>
<path d="M47 8l-8.5 13.5h6.2L40.5 33 52 17.5h-6.5L49.6 8z" fill="#ffd23f" stroke="#0f2a6b" stroke-opacity=".35" stroke-width="1"/>
<rect x=".75" y=".75" width="62.5" height="62.5" rx="15.25" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.5"/>`,
  });
  writeFileSync(new URL('../assets/logos/jogi.svg', import.meta.url), svg.replace(/<style>[\s\S]*?<\/style>\n/, ''));
}

const logoData = file => {
  const buf = readFileSync(new URL(`../assets/logos/${file}`, import.meta.url));
  return `data:${file.endsWith('.png') ? 'image/png' : 'image/svg+xml'};base64,${buf.toString('base64')}`;
};

// Card de projeto: cabeçalho com logo real, descrição, tecnologias com ícones
// e rodapé com o repositório e o botão "Ver projeto".
function projectCard(pr, i) {
  const W = 416, H = 292, p = 'p';
  const g = glass({ w: W, h: H, id: p, shineDelay: 1.5 + i * 0.6, blobs: [
    { cx: 400, cy: 0, r: 260, c: pr.a, o: 0.28, cls: 'drift-b' },
    { cx: 0, cy: 300, r: 230, c: pr.b, o: 0.12, cls: 'drift-a' },
  ] });
  const lines = wrap(pr.desc, fonts.body, 13.5, 372);
  if (lines.length > 3) throw new Error(`Descrição longa demais em ${pr.slug}: ${lines.length} linhas`);
  const at = 2.4 + i * 1.25;

  // Tecnologias: depois de cada "clique" uma onda de luz percorre os chips.
  let cx = 22;
  const chips = pr.chips.map(([key, label], k) => {
    const c = techChip(key, { x: cx, y: 176, label, prefix: `c${k}`, cls: 'pop', style: delay(0.55 + k * 0.08) });
    const glow = `<rect class="edge" ${tapAt(at + 0.35 + k * 0.12)} x="${cx}" y="176" width="${c.width.toFixed(2)}" height="26" rx="13" fill="#fff" fill-opacity=".06" stroke="${legible(tech[key].hex)}" stroke-width="1.4"/>`;
    cx += c.width + 5;
    return c.svg + glow;
  });
  if (cx - 5 > W - 22) throw new Error(`Chips não cabem em ${pr.slug}: ${(cx - 5).toFixed(0)}px`);

  // Botão "Ver projeto": gradiente do projeto, luz correndo pela borda e toque.
  const label = 'Ver projeto';
  const bw = Math.ceil(measure(label, fonts.bodySemi, 13) + 62), bh = 36;
  const bx = W - 22 - bw, by = H - 22 - bh, bcx = bx + bw - 22, bcy = by + bh / 2;
  const tap = tapLayers({ id: p, at, cx: bcx, cy: bcy, ripple: 340, ringR: 13, accent: pr.a, clip: `${p}-clip`,
    edge: { x: 0.75, y: 0.75, w: W - 1.5, h: H - 1.5, rx: 21.25 } });
  const repoText = `Kanexxxxx/${pr.repo}`;

  const svg = doc({
    w: W, h: H,
    title: `${pr.title} — ${pr.kicker.toLowerCase()}`,
    desc: `${pr.desc} Tecnologias: ${pr.chips.map(([k, l]) => l ?? tech[k].name).join(', ')}. Abre o repositório no GitHub.`,
    defs: g.defs + tap.defs + `<clipPath id="${p}-logo"><rect x="22" y="22" width="56" height="56" rx="16"/></clipPath>
<radialGradient id="${p}-halo"><stop offset="0" stop-color="${pr.a}" stop-opacity=".55"/><stop offset="1" stop-color="${pr.a}" stop-opacity="0"/></radialGradient>
<linearGradient id="${p}-btn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pr.a}" stop-opacity=".34"/><stop offset="1" stop-color="${pr.b}" stop-opacity=".18"/></linearGradient>
<linearGradient id="${p}-btnedge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="${pr.a}" stop-opacity=".45"/><stop offset="1" stop-color="${pr.b}" stop-opacity=".6"/></linearGradient>
<linearGradient id="${p}-div" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
    style: `.run{stroke-dasharray:14 86;animation:run 4.2s linear infinite}@keyframes run{to{stroke-dashoffset:-100}}`,
    body: `<g class="press-soft" ${tap.t}>
${g.back}
${tap.ripple}
<g class="pop" ${delay(0.1)}>
  <circle cx="50" cy="50" r="46" fill="url(#${p}-halo)"/>
  <rect x="22" y="22" width="56" height="56" rx="16" fill="#0b1224"/>
  <image x="22" y="22" width="56" height="56" clip-path="url(#${p}-logo)" preserveAspectRatio="xMidYMid slice" href="${logoData(pr.logo)}"/>
  <rect x="22.5" y="22.5" width="55" height="55" rx="15.5" fill="none" stroke="#fff" stroke-opacity=".28"/>
  <rect class="edge" ${tap.t} x="21.5" y="21.5" width="57" height="57" rx="16.5" fill="none" stroke="${pr.a}" stroke-width="1.5"/>
</g>
<g class="rise" ${delay(0.18)}>
  ${text(pr.kicker, { font: fonts.monoSemi, size: 9.5, x: 94, y: 44, fill: legible(pr.a), tracking: 0.12 }).svg}
  ${text(pr.title, { font: fonts.display, size: 24, x: 93, y: 72, fill: color.ink, tracking: -0.01 }).svg}
</g>
<g class="rise" ${delay(0.32)}>${lines.map((l, k) => text(l, { font: fonts.body, size: 13.5, x: 22, y: 112 + k * 21.5, fill: color.ink2 }).svg).join('')}</g>
${chips.join('')}
<rect x="22" y="${by - 14}" width="${W - 44}" height="1" fill="url(#${p}-div)"/>
<g class="fade" ${delay(0.5)}>
  ${techIcon('github', 22, by + bh / 2 - 7, 14, 'gh')}
  ${text(repoText, { font: fonts.mono, size: 10.5, x: 42, y: by + bh / 2 + 3.8, fill: color.ink3 }).svg}
</g>
${tap.ring}
<g class="press" ${tap.t}>
  <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="#0b1224" fill-opacity=".6"/>
  <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="url(#${p}-btn)"/>
  <rect x="${bx + 0.5}" y="${by + 0.5}" width="${bw - 1}" height="${bh - 1}" rx="${bh / 2 - 0.5}" fill="none" stroke="url(#${p}-btnedge)"/>
  <rect class="run" pathLength="100" x="${bx + 0.5}" y="${by + 0.5}" width="${bw - 1}" height="${bh - 1}" rx="${bh / 2 - 0.5}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.4" stroke-linecap="round"/>
  ${text(label, { font: fonts.bodySemi, size: 13, x: bx + 16, y: by + bh / 2 + 4.6, fill: '#fff' }).svg}
  <circle cx="${bcx}" cy="${bcy}" r="12" fill="#fff" fill-opacity=".16"/>
  <g class="nudge" ${tap.t}>${arrowUpRight(bcx, bcy, 4.2, '#fff')}</g>
</g>
${g.front}
${tap.edge}
</g>`,
  });
  save(`project-${pr.slug}.svg`, svg);
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

// Botão em pílula: contato e abertura das seções recolhíveis. O ripple nasce
// no ícone, a borda acende e a seta (ou a divisa) dá um empurrão.
function pillButton(file, label, glyph, { at, trailing = 'arrow' }) {
  const H = 46, p = 'k';
  const lab = text(label, { font: fonts.bodySemi, size: 13.5, x: 0, y: 0 });
  const W = Math.ceil(lab.width + 96);
  const s = `fill="none" stroke="${color.teal}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"`;
  const glyphs = {
    mail: `<rect x="20" y="16" width="20" height="14" rx="3" ${s}/><path d="M21 18l9 6.5 9-6.5" ${s}/>`,
    repo: `<path d="M22 15h13a3 3 0 0 1 3 3v13H25a3 3 0 0 1-3-3z" ${s}/><path d="M22 28a3 3 0 0 1 3-3h13" ${s}/>`,
    gallery: `<rect x="20" y="15" width="20" height="16" rx="3" ${s}/><path d="M22.5 28l5-5 3.5 3.5 2.5-2.5 4 4" ${s}/><circle cx="35" cy="19.8" r="1.6" fill="${color.teal}"/>`,
    folder: `<path d="M20 18.5a2 2 0 0 1 2-2h5l2.2 2.5H38a2 2 0 0 1 2 2V29a2 2 0 0 1-2 2H22a2 2 0 0 1-2-2z" ${s}/>`,
    cube: `<path d="M30 14l9 5v10l-9 5-9-5V19z" ${s}/><path d="M21 19l9 5 9-5M30 24v10" ${s}/>`,
  };
  const tap = tapLayers({ id: p, at, cx: 30, cy: H / 2, ripple: W + 40, clip: `${p}-clip`,
    edge: { x: 0.75, y: 0.75, w: W - 1.5, h: H - 1.5, rx: 22.25 } });
  const tail = trailing === 'arrow'
    ? `<g class="nudge" ${tap.t}>${arrowUpRight(W - 24, 23, 4.5, color.ink2)}</g>`
    : `<g class="nudge-down" ${tap.t}><path d="M${W - 29} 20.5l5 5 5-5" fill="none" stroke="${color.ink2}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  const svg = doc({
    w: W, h: H, title: label, desc: label,
    defs: `<linearGradient id="${p}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color.bg2}"/><stop offset="1" stop-color="${color.bg0}"/></linearGradient>
<linearGradient id="${p}-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color.teal}" stop-opacity=".6"/><stop offset=".5" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="${color.peri}" stop-opacity=".55"/></linearGradient>
<linearGradient id="${p}-sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="${p}-clip"><rect width="${W}" height="${H}" rx="23"/></clipPath>${tap.defs}`,
    body: `<g class="press-vb" ${tap.t}>
<rect width="${W}" height="${H}" rx="23" fill="url(#${p}-bg)"/>
${tap.ripple}
<g clip-path="url(#${p}-clip)"><g class="shine" ${delay(at + 3)}><rect x="0" y="-10" width="70" height="70" fill="url(#${p}-sh)" transform="skewX(-18)"/></g></g>
<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="22.25" fill="none" stroke="url(#${p}-edge)" stroke-width="1.5"/>
${tap.edge}
${glyphs[glyph]}
${text(label, { font: fonts.bodySemi, size: 13.5, x: 50, y: 28, fill: color.ink }).svg}
${tail}
</g>`,
  });
  save(`${file}.svg`, svg);
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
jogiLogo();
projects.forEach(projectCard);
// Stack: um cartão clicável por tecnologia. As linguagens vêm de
// assets/languages.json, mantido pela Action (scripts/sync-languages.mjs).
const synced = existsSync(new URL('../assets/languages.json', import.meta.url))
  ? JSON.parse(readFileSync(new URL('../assets/languages.json', import.meta.url), 'utf8')).languages
  : [];
for (const l of synced) if (!tech[l.key]) registerLanguage(l.name, l.hex);
categories.forEach((cat, ci) => {
  const keys = cat.keys ?? synced.map(l => l.key);
  writeCategory(cat, keys, ci * 12);
  updateReadmeBlock(cat.slug, keys);
  console.log(`stack ${cat.slug.padEnd(21)} ${keys.length} cartões`);
});
footer();
pillButton('contact-email', 'kainarodrigues684@gmail.com', 'mail', { at: 2.2 });
pillButton('contact-repos', 'Todos os repositórios', 'repo', { at: 2.9 });
pillButton('btn-telas', 'Ver telas dos projetos', 'gallery', { at: 3.2, trailing: 'chevron' });
pillButton('btn-outros', 'Outros repositórios', 'folder', { at: 3.9, trailing: 'chevron' });

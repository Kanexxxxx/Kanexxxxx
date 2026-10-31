// Primitivas compartilhadas pelos SVGs do perfil: fontes convertidas em vetor,
// cartões de vidro, ícones com ids isolados e animações com respeito a
// prefers-reduced-motion. Nenhum SVG depende de fonte ou serviço externo.
import { readFileSync } from 'node:fs';
import opentype from 'opentype.js';

const root = new URL('../../', import.meta.url);
const load = file => {
  const buffer = readFileSync(new URL(`assets/fonts/${file}`, root));
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
};

export const fonts = {
  display: load('space-grotesk-700.ttf'),
  displayMedium: load('space-grotesk-500.ttf'),
  body: load('inter-400.ttf'),
  bodyMedium: load('inter-500.ttf'),
  bodySemi: load('inter-600.ttf'),
  mono: load('jetbrains-mono-400.ttf'),
  monoSemi: load('jetbrains-mono-600.ttf'),
};

export const color = {
  bg0: '#05080f',
  bg1: '#0a1122',
  bg2: '#0f1a33',
  ink: '#eef2fb',
  ink2: '#aab5cc',
  ink3: '#6f7b96',
  line: '#ffffff',
  teal: '#77ebd7',
  peri: '#9aa9ff',
  violet: '#c6a6ff',
  green: '#5ee6a0',
};

export const esc = s => String(s)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const r = n => Math.round(n * 100) / 100;

function glyphsFor(font, str) {
  for (const ch of str) {
    if (ch.trim() && font.charToGlyphIndex(ch) === 0) {
      throw new Error(`Glifo ausente em ${font.names.fontFamily.en}: "${ch}" (U+${ch.codePointAt(0).toString(16)}) em "${str}"`);
    }
  }
  return font.stringToGlyphs(str);
}

/** Largura do texto em px, com kerning e espaçamento extra (em). */
export function measure(str, font, size, tracking = 0) {
  const glyphs = glyphsFor(font, str);
  const scale = size / font.unitsPerEm;
  let width = 0;
  glyphs.forEach((glyph, i) => {
    width += glyph.advanceWidth * scale;
    if (i < glyphs.length - 1) width += font.getKerningValue(glyph, glyphs[i + 1]) * scale + tracking * size;
  });
  return width;
}

// Cada glifo vira um <path> em unidades da fonte, definido uma única vez por
// documento e reutilizado com <use>. doc() descarrega o registro em <defs>.
const glyphRegistry = new Map();
const fontKeys = new Map();
function glyphRef(font, glyph) {
  if (!fontKeys.has(font)) fontKeys.set(font, `f${fontKeys.size}`);
  const key = `${fontKeys.get(font)}g${glyph.index}`;
  if (!glyphRegistry.has(key)) {
    glyphRegistry.set(key, `<path id="${key}" d="${glyph.getPath(0, 0, font.unitsPerEm).toPathData(0)}"/>`);
  }
  return key;
}
function takeGlyphDefs() {
  const defs = [...glyphRegistry.values()].join('');
  glyphRegistry.clear();
  return defs;
}

/** Converte texto em vetor. anchor: start | middle | end.
 *  Preenchimentos sólidos reutilizam glifos; gradientes viram um <path> único,
 *  para o gradiente cobrir a palavra inteira e não cada letra. */
export function text(str, { font = fonts.body, size = 14, x = 0, y = 0, fill = color.ink, anchor = 'start', tracking = 0, attrs = '' } = {}) {
  const width = measure(str, font, size, tracking);
  let cursor = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  const glyphs = glyphsFor(font, str);
  const scale = size / font.unitsPerEm;
  const solid = !fill.startsWith('url(');
  let d = '', uses = '';
  glyphs.forEach((glyph, i) => {
    if (glyph.getPath(0, 0, font.unitsPerEm).commands.length) {
      if (solid) uses += `<use href="#${glyphRef(font, glyph)}" transform="matrix(${+scale.toPrecision(5)} 0 0 ${+scale.toPrecision(5)} ${r(cursor)} ${r(y)})"/>`;
      else d += glyph.getPath(cursor, y, size).toPathData(2);
    }
    cursor += glyph.advanceWidth * scale;
    if (i < glyphs.length - 1) cursor += font.getKerningValue(glyph, glyphs[i + 1]) * scale + tracking * size;
  });
  const extra = attrs ? ' ' + attrs : '';
  const svg = solid ? (uses ? `<g fill="${fill}"${extra}>${uses}</g>` : '') : (d ? `<path d="${d}" fill="${fill}"${extra}/>` : '');
  return { svg, width };
}

/** Quebra um parágrafo em linhas que cabem em maxWidth. */
export function wrap(str, font, size, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of str.split(/\s+/)) {
    const attempt = line ? `${line} ${word}` : word;
    if (measure(attempt, font, size) <= maxWidth || !line) line = attempt;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

/** Ícone do skill-icons embutido, com ids prefixados para não colidir. */
export function icon(name, x, y, size, prefix) {
  let src = readFileSync(new URL(`assets/icons/${name}.svg`, root), 'utf8');
  src = src.replace(/<\?xml[^>]*>/, '')
    .replace(/\bid="([^"]+)"/g, `id="${prefix}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`)
    .replace(/(xlink:href|href)="#([^"]+)"/g, `$1="#${prefix}-$2"`);
  return src.replace(/<svg\b([^>]*)>/, (match, attributes) => {
    const viewBox = attributes.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 256 256';
    return `<svg x="${r(x)}" y="${r(y)}" width="${size}" height="${size}" viewBox="${viewBox}" fill="none">`;
  });
}

/** CSS de animação comum. Todo estado final é o estado natural do elemento:
 *  com movimento reduzido, nada fica invisível. */
export const baseStyle = `
.rise{animation:rise .8s cubic-bezier(.16,.84,.3,1) both}
@keyframes rise{from{opacity:0;transform:translateY(10px)}}
.fade{animation:fade 1s ease-out both}
@keyframes fade{from{opacity:0}}
.pop{transform-box:fill-box;transform-origin:center;animation:pop .6s cubic-bezier(.2,1.4,.4,1) both}
@keyframes pop{from{opacity:0;transform:scale(.7)}}
.drift-a,.drift-b,.drift-c{transform-box:fill-box;transform-origin:center}
.drift-a{animation:driftA 16s ease-in-out infinite alternate}
.drift-b{animation:driftB 21s ease-in-out infinite alternate}
.drift-c{animation:driftC 26s ease-in-out infinite alternate}
@keyframes driftA{to{transform:translate(46px,-22px) scale(1.12)}}
@keyframes driftB{to{transform:translate(-52px,24px) scale(.9)}}
@keyframes driftC{to{transform:translate(28px,30px) scale(1.18)}}
.shine{animation:shine 9s cubic-bezier(.45,0,.2,1) infinite}
@keyframes shine{0%{transform:translateX(-140%)}18%,100%{transform:translateX(260%)}}
.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 2.2s ease-out infinite}
@keyframes pulse{0%{opacity:.7;transform:scale(1)}80%,100%{opacity:0;transform:scale(2.8)}}
.blink{animation:blink 1.05s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
.float-a{animation:floatA 7s ease-in-out infinite alternate}
.float-b{animation:floatB 9s ease-in-out infinite alternate}
.float-c{animation:floatC 8s ease-in-out infinite alternate}
@keyframes floatA{to{transform:translateY(-9px)}}
@keyframes floatB{to{transform:translateY(8px)}}
@keyframes floatC{to{transform:translateY(-6px)}}
.grow{transform-box:fill-box;transform-origin:left center;animation:grow 1.4s cubic-bezier(.16,.84,.3,1) both}
@keyframes grow{from{transform:scaleX(0)}}
.rise-y{transform-box:fill-box;transform-origin:center bottom;animation:riseY 1.2s cubic-bezier(.16,.84,.3,1) both}
@keyframes riseY{from{transform:scaleY(0)}}
.draw{stroke-dasharray:1;animation:draw 2.4s cubic-bezier(.4,0,.2,1) both}
@keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
.breathe{transform-box:fill-box;transform-origin:center bottom;animation:breathe 3.6s ease-in-out infinite alternate}
@keyframes breathe{to{transform:scaleY(.55)}}
.flow{animation:flow 6s linear infinite}
@keyframes flow{to{stroke-dashoffset:-48}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`;

export const delay = s => `style="animation-delay:${r(s)}s"`;

/** Documento SVG completo, acessível (title/desc) e responsivo. */
export function doc({ w, h, title, desc, defs = '', style = '', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<defs>${defs}${takeGlyphDefs()}</defs>
<style>${baseStyle}${style}</style>
${body}
</svg>
`;
}

/**
 * Cartão de vidro: fundo noturno, auroras em movimento, véu translúcido,
 * borda com gradiente, brilho interno no topo e reflexo que atravessa o cartão.
 * Retorna { defs, back, front } para o conteúdo ficar entre as camadas.
 */
export function glass({ w, h, rx = 22, id = 'g', blobs, shine = true, shineDelay = 0, grid = true }) {
  const auroras = blobs ?? [
    { cx: w * 0.92, cy: h * 0.08, r: Math.max(w, h) * 0.55, c: color.peri, o: 0.30, cls: 'drift-b' },
    { cx: w * 0.05, cy: h * 1.0, r: Math.max(w, h) * 0.55, c: color.teal, o: 0.20, cls: 'drift-a' },
  ];
  const defs = `
<clipPath id="${id}-clip"><rect width="${w}" height="${h}" rx="${rx}"/></clipPath>
<linearGradient id="${id}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color.bg2}"/><stop offset=".55" stop-color="${color.bg1}"/><stop offset="1" stop-color="${color.bg0}"/></linearGradient>
<linearGradient id="${id}-veil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".075"/><stop offset=".5" stop-color="#fff" stop-opacity=".025"/><stop offset="1" stop-color="#fff" stop-opacity=".045"/></linearGradient>
<linearGradient id="${id}-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset=".35" stop-color="#fff" stop-opacity=".07"/><stop offset=".75" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="${color.peri}" stop-opacity=".35"/></linearGradient>
<linearGradient id="${id}-top" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".38"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="${id}-shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".09"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<pattern id="${id}-dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r="1" fill="#c9d6ff" fill-opacity=".09"/></pattern>
<radialGradient id="${id}-fadegrid" cx=".5" cy=".35" r=".75"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<mask id="${id}-gridmask"><rect width="${w}" height="${h}" fill="url(#${id}-fadegrid)"/></mask>
${auroras.map((b, i) => `<radialGradient id="${id}-a${i}"><stop offset="0" stop-color="${b.c}" stop-opacity="${b.o}"/><stop offset=".45" stop-color="${b.c}" stop-opacity="${b.o * 0.35}"/><stop offset="1" stop-color="${b.c}" stop-opacity="0"/></radialGradient>`).join('')}`;
  const back = `<g clip-path="url(#${id}-clip)">
<rect width="${w}" height="${h}" fill="url(#${id}-bg)"/>
${auroras.map((b, i) => `<circle class="${b.cls ?? ''}" cx="${r(b.cx)}" cy="${r(b.cy)}" r="${r(b.r)}" fill="url(#${id}-a${i})"/>`).join('')}
${grid ? `<rect width="${w}" height="${h}" fill="url(#${id}-dots)" mask="url(#${id}-gridmask)"/>` : ''}
<rect width="${w}" height="${h}" fill="url(#${id}-veil)"/>
</g>`;
  const front = `<g clip-path="url(#${id}-clip)">
${shine ? `<g class="shine" ${delay(shineDelay)}><rect x="0" y="-20" width="${r(w * 0.42)}" height="${h + 40}" fill="url(#${id}-shine)" transform="skewX(-18)"/></g>` : ''}
<rect x="${rx}" y=".6" width="${w - rx * 2}" height="1" fill="url(#${id}-top)"/>
</g>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${rx - 0.5}" fill="none" stroke="url(#${id}-edge)"/>`;
  return { defs, back, front };
}

/** Pílula translúcida com texto (chips de tecnologia, status, etc.). */
export function chip(label, { x, y, font = fonts.mono, size = 11, padX = 10, h = 24, fill = '#ffffff', fillOpacity = 0.06, stroke = '#ffffff', strokeOpacity = 0.12, ink = color.ink2, cls = '', style = '' } = {}) {
  const width = measure(label, font, size) + padX * 2;
  const t = text(label, { font, size, x: x + padX, y: y + h / 2 + size * 0.36, fill: ink });
  return {
    width,
    svg: `<g${cls ? ` class="${cls}"` : ''}${style ? ' ' + style : ''}><rect x="${r(x)}" y="${r(y)}" width="${r(width)}" height="${h}" rx="${h / 2}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-opacity="${strokeOpacity}"/>${t.svg}</g>`,
  };
}

/** Seta "abrir" (↗) desenhada em vetor, pois não existe no subconjunto latino das fontes. */
export function arrowUpRight(cx, cy, s = 6, stroke = color.ink) {
  return `<path d="M${r(cx - s)} ${r(cy + s)}L${r(cx + s)} ${r(cy - s)}M${r(cx - s * 0.35)} ${r(cy - s)}H${r(cx + s)}V${r(cy + s * 0.35)}" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
}

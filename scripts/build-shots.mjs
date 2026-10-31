// Monta as telas da galeria: cada captura (assets/shots/src) ganha moldura de
// navegador (computador) ou de iPhone (celular) e vira WebP com transparência.
// As capturas foram feitas com os projetos rodando localmente, em 2x.
// Rode com: npm run shots
import sharp from 'sharp';
import { fonts, color, text, doc } from './lib/kit.mjs';

const dir = new URL('../assets/shots/', import.meta.url);
const path = name => new URL(name, dir).pathname.replace(/^\/([A-Za-z]:)/, '$1');

export const shots = [
  { slug: 'karol', label: 'Studio Karol — página inicial' },
  { slug: 'eurora', label: 'Eurora Love — produtos' },
  { slug: 'volker', label: 'VOLKER — vitrine' },
  { slug: 'confia', label: 'Confia? — verificação' },
  { slug: 'vitraya', label: 'Vitraya Studio — catálogo' },
];

async function desktop({ slug, label }) {
  const src = sharp(path(`src/${slug}-d.jpg`));
  const { width: sw, height: sh } = await src.metadata();
  const W = 1692, bar = 72, pad = 2, R = 28;
  const iw = W - pad * 2, ih = Math.round(iw * sh / sw), H = bar + ih + pad;
  const frame = doc({
    w: W, h: H, title: label, desc: label,
    defs: `<linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18223d"/><stop offset="1" stop-color="#0d1428"/></linearGradient>
<linearGradient id="edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".5" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="${color.teal}" stop-opacity=".35"/></linearGradient>`,
    body: `<rect width="${W}" height="${H}" rx="${R}" fill="url(#bar)"/>
<circle cx="40" cy="36" r="9" fill="#ff7a8a"/><circle cx="70" cy="36" r="9" fill="#ffd36e"/><circle cx="100" cy="36" r="9" fill="${color.green}"/>
<rect x="${W / 2 - 300}" y="16" width="600" height="40" rx="20" fill="#fff" fill-opacity=".07" stroke="#fff" stroke-opacity=".08" stroke-width="2"/>
<path d="M${W / 2 - 270} 30v-3a6 6 0 0 1 12 0v3" fill="none" stroke="${color.ink3}" stroke-width="2.4"/><rect x="${W / 2 - 273}" y="30" width="18" height="13" rx="3" fill="${color.ink3}"/>
${text(label, { font: fonts.bodyMedium, size: 21, x: W / 2, y: 43, fill: color.ink2, anchor: 'middle' }).svg}
<rect x="${W - 150}" y="26" width="20" height="20" rx="5" fill="none" stroke="${color.ink3}" stroke-width="2"/><path d="M${W - 106} 26h20v20h-20z M${W - 106} 33h20" fill="none" stroke="${color.ink3}" stroke-width="2"/>`,
  });
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${iw}" height="${ih}"><path d="M0 0H${iw}V${ih - R + pad}a${R - pad} ${R - pad} 0 0 1-${R - pad} ${R - pad}H${R - pad}a${R - pad} ${R - pad} 0 0 1-${R - pad}-${R - pad}z"/></svg>`);
  const screen = await src.resize(iw, ih).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const border = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${R - 1}" fill="none" stroke="url(#e)" stroke-width="2"/><defs><linearGradient id="e" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".5" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="${color.teal}" stop-opacity=".35"/></linearGradient></defs></svg>`);
  await sharp(Buffer.from(frame)).composite([{ input: screen, left: pad, top: bar }, { input: border }])
    .webp({ quality: 80, alphaQuality: 90, effort: 6 }).toFile(path(`${slug}-desktop.webp`));
  return `${slug}-desktop.webp ${W}x${H}`;
}

async function mobile({ slug, label }) {
  const src = sharp(path(`src/${slug}-m.jpg`));
  const { width: sw, height: sh } = await src.metadata();
  const sw2 = 780, sh2 = Math.round(sw2 * sh / sw), status = 108, bez = 26, R = 112;
  const W = sw2 + bez * 2, H = status + sh2 + bez * 2 + 30;
  const sx = bez, sy = bez;
  const frame = doc({
    w: W, h: H, title: label, desc: label,
    defs: `<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a4258"/><stop offset=".5" stop-color="#151a28"/><stop offset="1" stop-color="#2c3346"/></linearGradient>`,
    body: `<rect width="${W}" height="${H}" rx="${R + bez}" fill="url(#metal)"/>
<rect x="5" y="5" width="${W - 10}" height="${H - 10}" rx="${R + bez - 5}" fill="#05070d"/>
<rect x="${sx}" y="${sy}" width="${sw2}" height="${H - bez * 2}" rx="${R}" fill="#0b0f1a"/>
${text('9:41', { font: fonts.bodySemi, size: 30, x: sx + 92, y: sy + 66, fill: '#fff', anchor: 'middle' }).svg}
<rect x="${W / 2 - 118}" y="${sy + 22}" width="236" height="66" rx="33" fill="#000"/>
<g fill="#fff"><rect x="${W - 196}" y="${sy + 50}" width="6" height="12" rx="2"/><rect x="${W - 186}" y="${sy + 46}" width="6" height="16" rx="2"/><rect x="${W - 176}" y="${sy + 42}" width="6" height="20" rx="2"/><rect x="${W - 166}" y="${sy + 38}" width="6" height="24" rx="2"/></g>
<rect x="${W - 140}" y="${sy + 40}" width="46" height="22" rx="7" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.5"/><rect x="${W - 136}" y="${sy + 44}" width="34" height="14" rx="4" fill="#fff"/>
<rect x="${W / 2 - 100}" y="${H - bez - 26}" width="200" height="8" rx="4" fill="#fff" fill-opacity=".55"/>`,
  });
  const screen = await src.resize(sw2, sh2).png().toBuffer();
  const glare = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect x="${sx}" y="${sy}" width="${sw2}" height="${H - bez * 2}" rx="${R}" fill="url(#g)"/></svg>`);
  await sharp(Buffer.from(frame)).composite([{ input: screen, left: sx, top: sy + status }, { input: glare }])
    .webp({ quality: 80, alphaQuality: 90, effort: 6 }).toFile(path(`${slug}-mobile.webp`));
  return `${slug}-mobile.webp ${W}x${H}`;
}

for (const shot of shots) console.log(await desktop(shot), '·', await mobile(shot));

// Gera os cartões dinâmicos em dist/: números do GitHub com relógio da
// sincronização, linguagens, progresso dos projetos, cobrinha e calendário 3D
// em molduras de vidro. Roda a cada 3 horas (.github/workflows/profile.yml). Se a API falhar, o
// script sai com erro e a branch output mantém a última versão válida.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fonts, color, text, measure, doc, glass, delay } from './lib/kit.mjs';

const config = JSON.parse(readFileSync(new URL('../profile.config.json', import.meta.url), 'utf8'));

const user = process.env.GITHUB_USER ?? config.user;
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('Defina GITHUB_TOKEN para consultar a API do GitHub.');

const dist = new URL('../dist/', import.meta.url);
mkdirSync(dist, { recursive: true });
const save = (name, svg) => {
  writeFileSync(new URL(name, dist), svg);
  console.log(`${name.padEnd(16)} ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`);
};
const r = n => Math.round(n * 100) / 100;
const fmt = n => n.toLocaleString('pt-BR');

async function graphql(query, variables) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'User-Agent': 'kanex-profile' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`GitHub GraphQL HTTP ${response.status}`);
  const json = await response.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const { user: profile } = await graphql(`query($login: String!) {
  user(login: $login) {
    createdAt
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      contributionCalendar { totalContributions weeks { contributionDays { contributionCount date } } }
    }
    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false) {
      nodes { name languages(first: 20, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } } }
    }
  }
}`, { login: user });

const collection = profile.contributionsCollection;
const calendar = collection.contributionCalendar;
const weeks = calendar.weeks.map(w => w.contributionDays.reduce((n, d) => n + d.contributionCount, 0));
const days = calendar.weeks.flatMap(w => w.contributionDays);
let longest = 0, run = 0;
for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
const repos = profile.repositories.nodes.filter(repo => repo.name !== user);
const now = new Date();
const zone = { timeZone: 'America/Sao_Paulo' };
const updated = new Intl.DateTimeFormat('pt-BR', { ...zone, day: '2-digit', month: '2-digit', year: 'numeric' }).format(now);
const hhmm = new Intl.DateTimeFormat('pt-BR', { ...zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
const [hour, minute] = hhmm.split(':').map(Number);

// Tempo desde a criação da conta no GitHub ("no GitHub há 1 ano e 11 meses").
const created = new Date(profile.createdAt);
let months = (now.getUTCFullYear() - created.getUTCFullYear()) * 12 + now.getUTCMonth() - created.getUTCMonth();
if (now.getUTCDate() < created.getUTCDate()) months--;
const years = Math.floor(months / 12), restMonths = months % 12;
const since = [years && `${years} ${years === 1 ? 'ano' : 'anos'}`, restMonths && `${restMonths} ${restMonths === 1 ? 'mês' : 'meses'}`].filter(Boolean).join(' e ') || 'menos de um mês';

// Relógio analógico parado na hora da sincronização (Brasília); só o ponteiro
// de segundos gira, como sinal de que o cartão é vivo.
function clock(cx, cy, rad) {
  const ha = (hour % 12 + minute / 60) * 30, ma = minute * 6;
  const hand = (deg, len, w, c) => `<line x1="${cx}" y1="${cy}" x2="${r(cx + len * Math.sin(deg * Math.PI / 180))}" y2="${r(cy - len * Math.cos(deg * Math.PI / 180))}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  return `<g>
  <circle cx="${cx}" cy="${cy}" r="${rad}" fill="#fff" fill-opacity=".06" stroke="${color.teal}" stroke-opacity=".7" stroke-width="1.2"/>
  ${[0, 90, 180, 270].map(d => `<circle cx="${r(cx + (rad - 2.6) * Math.sin(d * Math.PI / 180))}" cy="${r(cy - (rad - 2.6) * Math.cos(d * Math.PI / 180))}" r=".7" fill="${color.ink3}"/>`).join('')}
  ${hand(ha, rad * 0.5, 1.6, color.ink)}${hand(ma, rad * 0.75, 1.2, color.ink)}
  <g class="spin" style="transform-origin:${cx}px ${cy}px">${hand(0, rad * 0.8, 0.8, color.teal)}</g>
  <circle cx="${cx}" cy="${cy}" r="1.3" fill="${color.teal}"/>
</g>`;
}
const clockStyle = '.spin{animation:spin 60s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}';

// ───────────────────────────── Números ─────────────────────────────
function stats() {
  const W = 416, H = 252, p = 'n';
  const g = glass({ w: W, h: H, id: p, shineDelay: 1.4, blobs: [
    { cx: 410, cy: 0, r: 250, c: color.teal, o: 0.22, cls: 'drift-b' },
    { cx: 0, cy: 260, r: 220, c: color.peri, o: 0.18, cls: 'drift-a' },
  ] });
  const kpis = [
    [calendar.totalContributions, 'contribuições'],
    [collection.totalCommitContributions, 'commits'],
    [collection.totalPullRequestContributions, 'pull requests'],
    [repos.length, 'repositórios'],
  ];
  const colW = (W - 48) / kpis.length;
  const cells = kpis.map(([value, label], i) => {
    const cx = 24 + i * colW + colW / 2;
    return `<g class="rise" ${delay(0.2 + i * 0.1)}>
  ${text(fmt(value), { font: fonts.display, size: 30, x: cx, y: 104, fill: `url(#${p}-num)`, anchor: 'middle', tracking: -0.02 }).svg}
  ${text(label, { font: fonts.bodyMedium, size: 11, x: cx, y: 123, fill: color.ink2, anchor: 'middle' }).svg}
</g>${i ? `<rect x="${r(24 + i * colW)}" y="80" width="1" height="46" fill="#fff" fill-opacity=".08"/>` : ''}`;
  }).join('');

  // Curva suave (Catmull-Rom → Bézier) das contribuições por semana.
  const top = 150, bottom = 222, left = 24, right = W - 24;
  const max = Math.max(1, ...weeks);
  const pts = weeks.map((v, i) => [left + (right - left) * i / (weeks.length - 1), bottom - (bottom - top) * v / max]);
  let line = `M${r(pts[0][0])} ${r(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1] ?? pts[i], pts[i], pts[i + 1], pts[i + 2] ?? pts[i + 1]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, Math.min(bottom, p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, Math.min(bottom, p2[1] - (p3[1] - p1[1]) / 6)];
    line += ` C${r(c1[0])} ${r(c1[1])} ${r(c2[0])} ${r(c2[1])} ${r(p2[0])} ${r(p2[1])}`;
  }
  const area = `${line} L${right} ${bottom} L${left} ${bottom}Z`;
  const last = pts.at(-1);
  const peak = Math.max(...weeks);

  const svg = doc({
    w: W, h: H,
    title: 'GitHub em números', style: clockStyle,
    desc: `Sincronizado em ${updated} às ${hhmm} (Brasília). Últimos 12 meses: ${fmt(calendar.totalContributions)} contribuições, ${fmt(collection.totalCommitContributions)} commits, ${fmt(collection.totalPullRequestContributions)} pull requests e ${repos.length} repositórios públicos. Maior sequência: ${longest} dias. Gráfico de contribuições por semana.`,
    defs: g.defs + `<linearGradient id="${p}-num" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${color.teal}"/></linearGradient>
<linearGradient id="${p}-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color.teal}" stop-opacity=".32"/><stop offset="1" stop-color="${color.teal}" stop-opacity="0"/></linearGradient>
<linearGradient id="${p}-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${color.teal}"/><stop offset="1" stop-color="${color.peri}"/></linearGradient>`,
    body: `${g.back}
${text('GITHUB', { font: fonts.monoSemi, size: 10.5, x: 24, y: 40, fill: color.teal, tracking: 0.12 }).svg}
${text('Em números', { font: fonts.display, size: 19, x: 78, y: 41, fill: color.ink }).svg}
${clock(W - 24 - measure(`sync ${hhmm} · ${updated.slice(0, 5)}`, fonts.mono, 10) - 14, 36.5, 8.5)}
${text(`sync ${hhmm} · ${updated.slice(0, 5)}`, { font: fonts.mono, size: 10, x: W - 24, y: 40, fill: color.ink2, anchor: 'end' }).svg}
${cells}
<g class="fade" ${delay(0.6)}>
  ${[0.5, 1].map(f => `<rect x="${left}" y="${r(bottom - (bottom - top) * f)}" width="${right - left}" height="1" fill="#fff" fill-opacity=".05"/>`).join('')}
  <path d="${area}" fill="url(#${p}-area)"/>
</g>
<path class="draw" ${delay(0.5)} pathLength="1" d="${line}" fill="none" stroke="url(#${p}-line)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<g class="fade" ${delay(2.6)}>
  <circle class="pulse" cx="${r(last[0])}" cy="${r(last[1])}" r="3.5" fill="${color.peri}"/>
  <circle cx="${r(last[0])}" cy="${r(last[1])}" r="3.5" fill="${color.peri}"/>
</g>
${text(`no GitHub há ${since}`, { font: fonts.mono, size: 9.5, x: 24, y: H - 14, fill: color.ink3 }).svg}
${text(`maior sequência: ${longest} ${longest === 1 ? 'dia' : 'dias'}`, { font: fonts.mono, size: 9.5, x: W - 24, y: H - 14, fill: color.ink3, anchor: 'end' }).svg}
${g.front}`,
  });
  save('stats.svg', svg);
}

// ───────────────────────────── Linguagens ─────────────────────────────
function languages() {
  const W = 416, H = 252, p = 'l';
  const label = { PLpgSQL: 'PL/pgSQL', GDShader: 'Godot Shader' };
  const totals = new Map();
  for (const repo of repos) for (const { size, node } of repo.languages.edges) {
    const entry = totals.get(node.name) ?? { size: 0, color: node.color ?? '#8b949e' };
    entry.size += size;
    totals.set(node.name, entry);
  }
  const all = [...totals].sort((a, b) => b[1].size - a[1].size);
  const sum = all.reduce((n, [, e]) => n + e.size, 0);
  if (!sum) throw new Error('Sem dados de linguagens; mantendo a versão anterior.');
  const g = glass({ w: W, h: H, id: p, shineDelay: 2.2, blobs: [
    { cx: 410, cy: 0, r: 250, c: color.violet, o: 0.22, cls: 'drift-b' },
    { cx: 0, cy: 260, r: 220, c: color.teal, o: 0.14, cls: 'drift-a' },
  ] });
  const barX = 24, barW = W - 48, barY = 76;
  let offset = 0;
  const segments = all.map(([, e]) => {
    const w = barW * e.size / sum;
    const seg = `<rect class="grow" style="animation-delay:${r(0.3 + offset / barW * 0.9)}s;animation-duration:${r(Math.max(0.25, w / barW * 1.4))}s;animation-timing-function:linear" x="${r(barX + offset)}" y="${barY}" width="${r(w + 0.6)}" height="10" fill="${e.color}"/>`;
    offset += w;
    return seg;
  }).join('');
  const top = all.slice(0, 8);
  const colW = barW / 2;
  const legend = top.map(([name, e], i) => {
    const x = barX + (i % 2) * colW + (i % 2 ? 12 : 0);
    const y = 122 + Math.floor(i / 2) * 27;
    const pct = 100 * e.size / sum;
    return `<g class="rise" ${delay(0.5 + i * 0.07)}>
  <circle cx="${x + 5}" cy="${y - 4}" r="4.5" fill="${e.color}"/>
  ${text(label[name] ?? name, { font: fonts.bodyMedium, size: 12.5, x: x + 17, y, fill: color.ink }).svg}
  ${text(`${pct < 0.1 ? '<0,1' : pct.toFixed(1).replace('.', ',')}%`, { font: fonts.mono, size: 11, x: x + colW - 12 - (i % 2 ? 0 : 12), y, fill: color.ink2, anchor: 'end' }).svg}
</g>`;
  }).join('');
  const svg = doc({
    w: W, h: H,
    title: 'Linguagens nos repositórios públicos',
    desc: `Proporção de código por linguagem: ${top.map(([n, e]) => `${label[n] ?? n} ${(100 * e.size / sum).toFixed(1)}%`).join(', ')}.`,
    defs: g.defs + `<clipPath id="${p}-bar"><rect x="${barX}" y="${barY}" width="${barW}" height="10" rx="5"/></clipPath>`,
    body: `${g.back}
${text('CÓDIGO', { font: fonts.monoSemi, size: 10.5, x: 24, y: 40, fill: color.teal, tracking: 0.12 }).svg}
${text('Linguagens', { font: fonts.display, size: 19, x: 80, y: 41, fill: color.ink }).svg}
${text(`${all.length} identificadas`, { font: fonts.mono, size: 10, x: W - 24, y: 40, fill: color.ink3, anchor: 'end' }).svg}
<rect x="${barX}" y="${barY}" width="${barW}" height="10" rx="5" fill="#fff" fill-opacity=".06"/>
<g clip-path="url(#${p}-bar)">${segments}</g>
${legend}
${text(`% em bytes nos ${repos.length} repositórios públicos`, { font: fonts.mono, size: 9.5, x: 24, y: H - 14, fill: color.ink3 }).svg}
${text(`sync ${hhmm} · ${updated}`, { font: fonts.mono, size: 9.5, x: W - 24, y: H - 14, fill: color.ink3, anchor: "end" }).svg}
${g.front}`,
  });
  save('languages.svg', svg);
}

// ───────────────────────────── Cobrinha em vidro ─────────────────────────────
// Recebe o SVG gerado pelo Platane/snk e o coloca dentro de um cartão de vidro.
function snake(dots) {
  const raw = new URL('snake-raw.svg', dist);
  if (!existsSync(raw)) { console.warn('snake-raw.svg ausente; cobrinha não gerada.'); return; }
  const src = readFileSync(raw, 'utf8');
  const open = src.match(/<svg\b[^>]*>/);
  const viewBox = open?.[0].match(/viewBox="([^"]+)"/)?.[1];
  if (!open || !viewBox) throw new Error('SVG da cobrinha inesperado.');
  const inner = src.slice(open.index + open[0].length, src.lastIndexOf('</svg>'));
  const [, , vw, vh] = viewBox.split(/\s+/).map(Number);
  const W = 846, p = 'k', areaW = W - 40, areaH = areaW * vh / vw, H = Math.round(64 + areaH + 12);
  const g = glass({ w: W, h: H, rx: 24, id: p, shineDelay: 3, grid: false, blobs: [
    { cx: 800, cy: 0, r: 320, c: color.peri, o: 0.2, cls: 'drift-b' },
    { cx: 40, cy: H, r: 300, c: color.teal, o: 0.14, cls: 'drift-a' },
  ] });
  let lx = W - 24 - measure('mais', fonts.mono, 10);
  const legend = [text('mais', { font: fonts.mono, size: 10, x: lx, y: 40, fill: color.ink3 }).svg];
  for (let i = dots.length - 1; i >= 0; i--) {
    lx -= 15;
    legend.push(`<rect x="${lx}" y="30" width="11" height="11" rx="2.5" fill="${dots[i]}" stroke="#fff" stroke-opacity=".08"/>`);
  }
  legend.push(text('menos', { font: fonts.mono, size: 10, x: lx - 6, y: 40, fill: color.ink3, anchor: 'end' }).svg);
  const svg = doc({
    w: W, h: H,
    title: 'Cobrinha das contribuições',
    desc: 'Animação de uma cobrinha percorrendo e comendo os quadrados do gráfico de contribuições do GitHub nos últimos 12 meses.',
    defs: g.defs,
    body: `${g.back}
${text('CONTRIBUIÇÕES', { font: fonts.monoSemi, size: 10.5, x: 24, y: 40, fill: color.teal, tracking: 0.12 }).svg}
${text('Cada quadrado é um dia de código', { font: fonts.display, size: 19, x: 138, y: 41, fill: color.ink }).svg}
${legend.join('')}
<svg x="20" y="58" width="${r(areaW)}" height="${r(areaH)}" viewBox="${viewBox}">${inner}</svg>
${g.front}`,
  });
  save('snake.svg', svg);
}

stats();
languages();
snake((process.env.SNAKE_DOTS ?? '#141c30,#134a4c,#1f7f72,#3fc0aa,#77ebd7').split(','));

// ───────────────────────────── Progresso dos projetos ─────────────────────────────
// Cada porcentagem vem de um documento do próprio repositório (regras em
// profile.config.json): etapas ✅ de um plano ou linhas ✅ de uma tabela de estado.
async function readRepoFile(repo, branch, file) {
  const res = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/${file}?ref=${branch}`, {
    headers: { Authorization: `bearer ${token}`, Accept: 'application/vnd.github.raw', 'User-Agent': 'kanex-profile' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${repo}/${file}: HTTP ${res.status}`);
  return res.text();
}

function measureProgress(rule, md) {
  const lines = md.split('\n');
  if (rule.rule === 'headings') {
    const steps = lines.filter(l => new RegExp(`^#{2,3} .*${rule.match} \\d+`).test(l));
    return { done: steps.filter(l => l.includes('✅')).length, total: steps.length };
  }
  if (rule.rule === 'table-section') {
    const start = lines.findIndex(l => new RegExp(`^#{2,3} ${rule.section}\\s*$`).test(l));
    const rows = [];
    for (let i = start + 1; i < lines.length && !/^#{1,3} /.test(lines[i]); i++) {
      if (lines[i].startsWith('|') && !/^\|\s*-/.test(lines[i])) rows.push(lines[i]);
    }
    const body = rows.slice(1);
    return { done: body.filter(l => l.includes('✅')).length, total: body.length };
  }
  throw new Error(`Regra desconhecida: ${rule.rule}`);
}

async function progress() {
  const items = [];
  for (const item of config.progress) {
    let value = item.manual;
    if (!value) {
      try { value = measureProgress(item, await readRepoFile(item.repo, item.branch, item.file)); }
      catch (error) { console.warn(`progresso de ${item.name}: ${error.message}; usando o último valor conhecido`); value = item.fallback; }
    }
    if (!value?.total) continue;
    items.push({ ...item, ...value, pct: Math.round(100 * value.done / value.total) });
  }
  const W = 416, H = 304, p = 'g';
  const g = glass({ w: W, h: H, id: p, shineDelay: 1.6, blobs: [
    { cx: 420, cy: 300, r: 260, c: color.teal, o: 0.2, cls: 'drift-a' },
    { cx: 20, cy: 0, r: 230, c: color.peri, o: 0.22, cls: 'drift-b' },
  ] });
  const top = 88, step = 47, barW = W - 48;
  const rows = items.map((it, i) => {
    const y = top + i * step;
    const fillW = Math.max(6, barW * it.pct / 100);
    return `<g class="rise" ${delay(0.3 + i * 0.12)}>
  <circle cx="29" cy="${y - 4.5}" r="4" fill="${it.color}"/>
  ${text(it.name, { font: fonts.bodySemi, size: 13.5, x: 40, y, fill: color.ink }).svg}
  ${text(`${it.done} de ${it.total} ${it.unit}`, { font: fonts.mono, size: 10, x: W - 70, y: y - 0.5, fill: color.ink3, anchor: 'end' }).svg}
  ${text(`${it.pct}%`, { font: fonts.display, size: 16, x: W - 24, y: y + 0.5, fill: color.ink, anchor: 'end' }).svg}
  <rect x="24" y="${y + 9}" width="${barW}" height="7" rx="3.5" fill="#fff" fill-opacity=".07"/>
  <g clip-path="url(#${p}-bar${i})">
    <rect class="grow" style="animation-delay:${(0.5 + i * 0.15).toFixed(2)}s;animation-duration:1.6s" x="24" y="${y + 9}" width="${r(fillW)}" height="7" rx="3.5" fill="url(#${p}-fill${i})"/>
    <g class="shine" style="animation-delay:${(3 + i * 0.6).toFixed(1)}s"><rect x="24" y="${y + 5}" width="60" height="15" fill="url(#${p}-sh)"/></g>
  </g>
</g>`;
  }).join('');
  const defs = items.map((it, i) => `<linearGradient id="${p}-fill${i}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${it.color}" stop-opacity=".55"/><stop offset="1" stop-color="${it.color}"/></linearGradient>
<clipPath id="${p}-bar${i}"><rect x="24" y="${top + i * step + 9}" width="${r(Math.max(6, barW * it.pct / 100))}" height="7" rx="3.5"/></clipPath>`).join('');
  const studyY = H - 30;
  const svg = doc({
    w: W, h: H,
    title: 'Agora — progresso dos projetos',
    desc: `${items.map(it => `${it.name}: ${it.pct}% (${it.done} de ${it.total} ${it.unit})`).join('; ')}. Estudando Desenvolvimento de Sistemas no Senac. Sincronizado em ${updated} às ${hhmm}.`,
    defs: g.defs + defs + `<linearGradient id="${p}-sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
    style: clockStyle,
    body: `${g.back}
${text('AGORA', { font: fonts.monoSemi, size: 10.5, x: 24, y: 34, fill: color.teal, tracking: 0.2 }).svg}
${text('Progresso dos projetos', { font: fonts.display, size: 19, x: 24, y: 58, fill: color.ink }).svg}
${clock(W - 24 - measure(`sync ${hhmm}`, fonts.mono, 10) - 14, 30.5, 8.5)}
${text(`sync ${hhmm}`, { font: fonts.mono, size: 10, x: W - 24, y: 34, fill: color.ink2, anchor: 'end' }).svg}
${rows}
<rect x="24" y="${studyY - 22}" width="${W - 48}" height="1" fill="#fff" fill-opacity=".08"/>
<g class="rise" ${delay(0.9)}>
  <path d="M24 ${studyY - 6}l10-5 10 5-10 5z M28 ${studyY - 4}v5c0 1.6 2.7 3 6 3s6-1.4 6-3v-5" fill="none" stroke="${color.peri}" stroke-width="1.4" stroke-linejoin="round"/>
  ${text('ESTUDANDO', { font: fonts.monoSemi, size: 9.5, x: 52, y: studyY - 7, fill: color.peri, tracking: 0.12 }).svg}
  ${text('Desenvolvimento de Sistemas · Senac', { font: fonts.bodyMedium, size: 13, x: 52, y: studyY + 9, fill: color.ink }).svg}
</g>
${g.front}`,
  });
  save('now.svg', svg);
}

// ───────────────────────────── Calendário 3D em vidro ─────────────────────────────
// Recebe o SVG do github-profile-3d-contrib (fundo transparente) e o coloca
// num cartão de vidro, flutuando devagar.
function calendar3d() {
  const raw = new URL('../profile-3d-contrib/profile-kanex.svg', import.meta.url);
  if (!existsSync(raw)) { console.warn('calendário 3D ausente; cartão não gerado.'); return; }
  const src = readFileSync(raw, 'utf8');
  const open = src.match(/<svg\b[^>]*>/);
  const vb = open?.[0].match(/viewBox="([^"]+)"/)?.[1] ?? (() => {
    const w = open[0].match(/width="([\d.]+)/)?.[1], h = open[0].match(/height="([\d.]+)/)?.[1];
    return w && h ? `0 0 ${w} ${h}` : null;
  })();
  if (!vb) throw new Error('SVG do calendário 3D inesperado.');
  const inner = src.slice(open.index + open[0].length, src.lastIndexOf('</svg>'));
  const [, , vw, vh] = vb.split(/[\s,]+/).map(Number);
  const W = 846, p = 'c', areaW = W - 40, areaH = areaW * vh / vw, H = Math.round(62 + areaH + 14);
  const g = glass({ w: W, h: H, rx: 24, id: p, shineDelay: 4, blobs: [
    { cx: 120, cy: 0, r: 340, c: color.peri, o: 0.2, cls: 'drift-b' },
    { cx: 760, cy: H, r: 320, c: color.teal, o: 0.16, cls: 'drift-a' },
  ] });
  const svg = doc({
    w: W, h: H,
    title: 'Calendário de contribuições em 3D',
    desc: `Calendário isométrico das contribuições dos últimos 12 meses, com radar de atividade e linguagens. Sincronizado em ${updated} às ${hhmm}.`,
    defs: g.defs,
    style: clockStyle + '.bob{animation:bob 9s ease-in-out infinite alternate}@keyframes bob{to{transform:translateY(-6px)}}@media (prefers-reduced-motion:reduce){.bob{animation:none}}',
    body: `${g.back}
${text('CALENDÁRIO 3D', { font: fonts.monoSemi, size: 10.5, x: 24, y: 40, fill: color.teal, tracking: 0.12 }).svg}
${text('Contribuições em perspectiva', { font: fonts.display, size: 19, x: 140, y: 41, fill: color.ink }).svg}
${clock(W - 24 - measure(`sync ${hhmm} · ${updated}`, fonts.mono, 10) - 14, 36.5, 8.5)}
${text(`sync ${hhmm} · ${updated}`, { font: fonts.mono, size: 10, x: W - 24, y: 40, fill: color.ink2, anchor: 'end' }).svg}
<g class="bob"><svg x="20" y="58" width="${r(areaW)}" height="${r(areaH)}" viewBox="${vb}">${inner}</svg></g>
${g.front}`,
  });
  save('calendar-3d.svg', svg);
}

await progress();
calendar3d();

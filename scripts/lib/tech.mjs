// Catálogo de tecnologias: nome, papel, ícone oficial, cor da marca e site
// oficial. Usado pelos chips dos projetos e pelos cartões clicáveis do Stack.
// Ícones: Simple Icons (CC0) e Devicon (MIT), em assets/brand.\n// Linguagens usam marcas originais coloridas do Devicon para melhor reconhecimento.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fonts, color, text, measure, doc, tapLayers, arrowUpRight } from './kit.mjs';

const brandDir = new URL('../../assets/brand/', import.meta.url);

export const tech = {
  // Linguagens
  typescript: { name: 'TypeScript', sub: 'linguagem', icon: 'dev:typescript', hex: '#3178C6', url: 'https://www.typescriptlang.org' },
  javascript: { name: 'JavaScript', sub: 'linguagem', icon: 'dev:javascript', hex: '#F7DF1E', url: 'https://developer.mozilla.org/pt-BR/docs/Web/JavaScript' },
  python: { name: 'Python', sub: 'linguagem', icon: 'dev:python', hex: '#3776AB', url: 'https://www.python.org' },
  gdscript: { name: 'GDScript', sub: 'Godot', icon: 'dev:godot', hex: '#478CBF', url: 'https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/index.html' },
  lua: { name: 'Lua / Luau', sub: 'Roblox', icon: 'dev:lua', hex: '#000080', url: 'https://luau.org' },
  html: { name: 'HTML', sub: 'marcação', icon: 'dev:html5', hex: '#E34F26', url: 'https://developer.mozilla.org/pt-BR/docs/Web/HTML' },
  css: { name: 'CSS', sub: 'estilo', icon: 'dev:css3', hex: '#663399', url: 'https://developer.mozilla.org/pt-BR/docs/Web/CSS' },
  sql: { name: 'SQL', sub: 'PL/pgSQL', icon: 'dev:postgresql', hex: '#4169E1', url: 'https://www.postgresql.org/docs/current/plpgsql.html' },
  bash: { name: 'Shell', sub: 'Bash', icon: 'dev:bash', hex: '#4EAA25', url: 'https://www.gnu.org/software/bash/' },
  powershell: { name: 'PowerShell', sub: 'automação', icon: 'dev:powershell', hex: '#5391FE', url: 'https://learn.microsoft.com/powershell/' },
  // Web e dados
  nextjs: { name: 'Next.js', sub: 'framework', icon: 'si:nextdotjs', hex: '#000000', url: 'https://nextjs.org' },
  react: { name: 'React', sub: 'interface', icon: 'si:react', hex: '#61DAFB', url: 'https://react.dev' },
  tailwind: { name: 'Tailwind CSS', sub: 'estilo', icon: 'si:tailwindcss', hex: '#06B6D4', url: 'https://tailwindcss.com' },
  vite: { name: 'Vite', sub: 'build', icon: 'si:vite', hex: '#9135FF', url: 'https://vite.dev' },
  node: { name: 'Node.js', sub: 'runtime', icon: 'si:nodedotjs', hex: '#5FA04E', url: 'https://nodejs.org' },
  prisma: { name: 'Prisma', sub: 'ORM', icon: 'si:prisma', hex: '#2D3748', url: 'https://www.prisma.io' },
  drizzle: { name: 'Drizzle ORM', sub: 'ORM', icon: 'si:drizzle', hex: '#C5F74F', url: 'https://orm.drizzle.team' },
  supabase: { name: 'Supabase', sub: 'backend', icon: 'si:supabase', hex: '#3FCF8E', url: 'https://supabase.com' },
  postgresql: { name: 'PostgreSQL', sub: 'banco de dados', icon: 'si:postgresql', hex: '#4169E1', url: 'https://www.postgresql.org' },
  sqlite: { name: 'SQLite', sub: 'banco local', icon: 'si:sqlite', hex: '#003B57', url: 'https://sqlite.org' },
  zod: { name: 'Zod', sub: 'validação', icon: 'si:zod', hex: '#408AFF', url: 'https://zod.dev' },
  // Infra, deploy e testes
  docker: { name: 'Docker', sub: 'containers', icon: 'si:docker', hex: '#2496ED', url: 'https://www.docker.com' },
  nginx: { name: 'NGINX', sub: 'proxy reverso', icon: 'si:nginx', hex: '#009639', url: 'https://nginx.org' },
  ubuntu: { name: 'Ubuntu', sub: 'servidor VPS', icon: 'si:ubuntu', hex: '#E95420', url: 'https://ubuntu.com' },
  pm2: { name: 'PM2', sub: 'processos', icon: 'si:pm2', hex: '#2B037A', url: 'https://pm2.keymetrics.io' },
  letsencrypt: { name: "Let's Encrypt", sub: 'SSL', icon: 'si:letsencrypt', hex: '#003A70', url: 'https://letsencrypt.org' },
  vercel: { name: 'Vercel', sub: 'deploy', icon: 'si:vercel', hex: '#000000', url: 'https://vercel.com' },
  githubactions: { name: 'GitHub Actions', sub: 'CI/CD', icon: 'si:githubactions', hex: '#2088FF', url: 'https://github.com/features/actions' },
  git: { name: 'Git', sub: 'versionamento', icon: 'si:git', hex: '#F03C2E', url: 'https://git-scm.com' },
  github: { name: 'GitHub', sub: 'código', icon: 'si:github', hex: '#181717', url: 'https://github.com' },
  vscode: { name: 'VS Code', sub: 'editor', icon: 'dev:vscode', hex: '#2F80ED', url: 'https://code.visualstudio.com' },
  playwright: { name: 'Playwright', sub: 'testes E2E', icon: 'dev:playwright', hex: '#45BA4B', url: 'https://playwright.dev' },
  vitest: { name: 'Vitest', sub: 'testes', icon: 'si:vitest', hex: '#6E9F18', url: 'https://vitest.dev' },
  pytest: { name: 'pytest', sub: 'testes Python', icon: 'si:pytest', hex: '#0A9EDC', url: 'https://docs.pytest.org' },
  godot: { name: 'Godot Engine', sub: 'games 3D', icon: 'si:godotengine', hex: '#478CBF', url: 'https://godotengine.org' },
  roblox: { name: 'Roblox Studio', sub: 'games', icon: 'si:robloxstudio', hex: '#00A2FF', url: 'https://create.roblox.com' },
  // Integrações e APIs
  whatsapp: { name: 'WhatsApp', sub: 'Cloud API', icon: 'si:whatsapp', hex: '#25D366', url: 'https://developers.facebook.com/docs/whatsapp/cloud-api' },
  evolution: { name: 'Evolution API', sub: 'WhatsApp', icon: 'glyph:chat', hex: '#5EE6A0', url: 'https://doc.evolution-api.com' },
  telegram: { name: 'Telegram', sub: 'Bot API', icon: 'si:telegram', hex: '#26A5E4', url: 'https://core.telegram.org/bots/api' },
  mercadopago: { name: 'Mercado Pago', sub: 'pagamentos', icon: 'si:mercadopago', hex: '#00B1EA', url: 'https://www.mercadopago.com.br/developers' },
  asaas: { name: 'Asaas', sub: 'PIX e cartão', icon: 'glyph:card', hex: '#5B8CFF', url: 'https://docs.asaas.com' },
  pix: { name: 'Pix', sub: 'pagamentos', icon: 'si:pix', hex: '#77B6A8', url: 'https://www.bcb.gov.br/estabilidadefinanceira/pix' },
  melhorenvio: { name: 'Melhor Envio', sub: 'frete', icon: 'glyph:box', hex: '#FFB84D', url: 'https://docs.melhorenvio.com.br' },
  deepseek: { name: 'DeepSeek', sub: 'LLM', icon: 'si:deepseek', hex: '#5786FE', url: 'https://api-docs.deepseek.com' },
  shopee: { name: 'Shopee', sub: 'Open API', icon: 'si:shopee', hex: '#EE4D2D', url: 'https://affiliate.shopee.com.br' },
  resend: { name: 'Resend', sub: 'e-mail', icon: 'si:resend', hex: '#000000', url: 'https://resend.com' },
  gmail: { name: 'Gmail SMTP', sub: 'e-mail', icon: 'si:gmail', hex: '#EA4335', url: 'https://nodemailer.com/usage/using-gmail/' },
  websocket: { name: 'WebSockets', sub: 'tempo real', icon: 'glyph:sync', hex: '#9AA9FF', url: 'https://developer.mozilla.org/pt-BR/docs/Web/API/WebSockets_API' },
};

// Linguagens detectadas pelo GitHub → chave do catálogo.
export const languageKeys = {
  TypeScript: 'typescript', JavaScript: 'javascript', Python: 'python', GDScript: 'gdscript', Lua: 'lua', Luau: 'lua',
  HTML: 'html', CSS: 'css', PLpgSQL: 'sql', SQL: 'sql', Shell: 'bash', PowerShell: 'powershell',
};

// Glifos neutros para serviços sem logo pública no Simple Icons.
const glyphs = {
  chat: '<path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M17 9h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v2l-3-2h-3"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 9.5h19M15.5 15h3"/>',
  box: '<path d="M12 2.8l8.5 4.7v9L12 21.2l-8.5-4.7v-9z"/><path d="M3.5 7.5l8.5 4.7 8.5-4.7M12 12.2v9"/>',
  sync: '<path d="M4 8.5h14.5M15 5l3.5 3.5L15 12M20 15.5H5.5M9 12l-3.5 3.5L9 19"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
};

// ───── Contraste: clareia cores de marca escuras até ficarem legíveis no vidro.
const channel = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const luminance = hex => { const [r, g, b] = hex.match(/\w\w/g).map(h => channel(parseInt(h, 16))); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (hex, t) => '#' + hex.match(/\w\w/g).map(h => Math.round(parseInt(h, 16) + (255 - parseInt(h, 16)) * t).toString(16).padStart(2, '0')).join('');
export function legible(hex, bg = '#111b35', min = 5.2) {
  let c = hex.toLowerCase(), t = 0;
  while (ratio(c, bg) < min && t < 1) { t += 0.06; c = mix(hex, Math.min(t, 1)); }
  return c;
}

/** Ícone da tecnologia em (x, y) com lado `s`. */
export function techIcon(key, x, y, s, prefix) {
  const t = tech[key] ?? { icon: 'glyph:code', hex: '#9AA9FF' };
  const [kind, name] = t.icon.split(':');
  const fill = legible(t.hex);
  if (kind === 'si') {
    const src = readFileSync(new URL(`${name}.svg`, brandDir), 'utf8');
    const d = src.match(/<path d="([^"]+)"/)[1];
    return `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 24 24"><path d="${d}" fill="${fill}"/></svg>`;
  }
  if (kind === 'dev') {
    let src = readFileSync(new URL(`devicon-${name}.svg`, brandDir), 'utf8');
    src = src.replace(/<\?xml[^>]*>/, '')
      .replace(/\bid="([^"]+)"/g, `id="${prefix}-$1"`)
      .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`)
      .replace(/(xlink:href|href)="#([^"]+)"/g, `$1="#${prefix}-$2"`);
    return src.replace(/<svg\b([^>]*)>/, (m, a) => `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="${a.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 128 128'}">`);
  }
  return `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${fill}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${glyphs[name] ?? glyphs.code}</svg>`;
}

/** Pílula de tecnologia usada dentro dos cards de projeto. */
export function techChip(key, { x, y, label, prefix, h = 26, size = 11, cls = '', style = '' }) {
  const t = tech[key];
  const name = label ?? t.name;
  const tint = legible(t.hex);
  const w = h + measure(name, fonts.bodySemi, size) + 10;
  return {
    width: w,
    svg: `<g${cls ? ` class="${cls}"` : ''}${style ? ' ' + style : ''}>
  <rect x="${x}" y="${y}" width="${w.toFixed(2)}" height="${h}" rx="${h / 2}" fill="${tint}" fill-opacity=".10" stroke="${tint}" stroke-opacity=".32"/>
  <rect x="${x + 5}" y="${y + 5}" width="${h - 10}" height="${h - 10}" rx="${(h - 10) / 2}" fill="#0b1224" fill-opacity=".75"/>
  ${techIcon(key, x + 8, y + 8, h - 16, prefix)}
  ${text(name, { font: fonts.bodySemi, size, x: x + h, y: y + h / 2 + size * 0.36, fill: color.ink }).svg}
</g>`,
  };
}

/**
 * Cartão clicável de uma tecnologia (cada um é uma imagem própria, com link
 * para o site oficial no README). Simula o clique em onda, cartão a cartão.
 */
export function techTile(key, { at, order = 0 }) {
  const t = tech[key] ?? { name: key, sub: 'linguagem', hex: '#9AA9FF' };
  const W = 164, H = 64, p = 't';
  const tint = legible(t.hex);
  let size = 13.5;
  while (measure(t.name, fonts.bodySemi, size) > W - 62 - 14 && size > 10.5) size -= 0.25;
  const tap = tapLayers({ id: p, at, cx: 32, cy: 32, ripple: 190, ringR: 0, accent: tint, clip: `${p}-clip`, duration: 12,
    edge: { x: 0.75, y: 0.75, w: W - 1.5, h: H - 1.5, rx: 15.25 } });
  return doc({
    w: W, h: H, title: `${t.name} — ${t.sub}`, desc: `${t.name} (${t.sub}). Abre o site oficial.`,
    defs: `<clipPath id="${p}-clip"><rect width="${W}" height="${H}" rx="16"/></clipPath>
<linearGradient id="${p}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color.bg2}"/><stop offset="1" stop-color="${color.bg0}"/></linearGradient>
<radialGradient id="${p}-glow" cx=".18" cy=".5" r=".75"><stop offset="0" stop-color="${tint}" stop-opacity=".22"/><stop offset="1" stop-color="${tint}" stop-opacity="0"/></radialGradient>
<linearGradient id="${p}-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".5" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="${tint}" stop-opacity=".45"/></linearGradient>
<linearGradient id="${p}-top" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>${tap.defs}`,
    body: `<g class="fade" style="animation-delay:${(0.15 + order * 0.04).toFixed(2)}s">
<rect width="${W}" height="${H}" rx="16" fill="url(#${p}-bg)"/>
<rect width="${W}" height="${H}" rx="16" fill="url(#${p}-glow)"/>
<rect width="${W}" height="${H}" rx="16" fill="#fff" fill-opacity=".03"/>
${tap.ripple}
<rect x="12" y="12" width="40" height="40" rx="12" fill="${tint}" fill-opacity=".12" stroke="${tint}" stroke-opacity=".35"/>
${techIcon(key, 21, 21, 22, `${p}i`)}
${text(t.name, { font: fonts.bodySemi, size, x: 62, y: 30, fill: color.ink }).svg}
${text(t.sub, { font: fonts.mono, size: 9.5, x: 62, y: 46, fill: color.ink3 }).svg}
<g class="nudge" ${tap.t}>${arrowUpRight(W - 15, 15, 3.2, color.ink3)}</g>
<rect x="16" y=".6" width="${W - 32}" height="1" fill="url(#${p}-top)"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="15.5" fill="none" stroke="url(#${p}-edge)"/>
${tap.edge}
</g>`,
  });
}

/** Bloco do README com cartões clicáveis de uma categoria. */
export function tilesMarkdown(keys, dir = './assets/svg/tech') {
  return keys.map(k => `<a href="${tech[k]?.url ?? `https://github.com/topics/${encodeURIComponent(k)}`}"><img src="${dir}/${k}.svg" width="164" alt="${tech[k]?.name ?? k}"></a>`).join('\n');
}

export const hasIcon = key => {
  const t = tech[key];
  if (!t) return false;
  const [kind, name] = t.icon.split(':');
  return kind === 'glyph' || existsSync(new URL(kind === 'si' ? `${name}.svg` : `devicon-${name}.svg`, brandDir));
};

// ───── Stack: categorias, cabeçalhos, cartões e blocos do README.
export const categories = [
  { slug: 'languages', n: '01', title: 'Linguagens', note: 'sincronizado com o GitHub' },
  { slug: 'web', n: '02', title: 'Web e dados', keys: ['nextjs', 'react', 'tailwind', 'vite', 'node', 'supabase', 'postgresql', 'prisma', 'drizzle', 'sqlite', 'zod'] },
  { slug: 'infra', n: '03', title: 'Infra, deploy e testes', keys: ['docker', 'nginx', 'ubuntu', 'pm2', 'letsencrypt', 'vercel', 'githubactions', 'git', 'github', 'vscode', 'playwright', 'vitest', 'pytest', 'godot', 'roblox'] },
  { slug: 'integrations', n: '04', title: 'Integrações e APIs', keys: ['whatsapp', 'evolution', 'telegram', 'mercadopago', 'asaas', 'pix', 'melhorenvio', 'deepseek', 'shopee', 'resend', 'gmail', 'websocket'] },
];

const root = new URL('../../', import.meta.url);
const tileDir = new URL('assets/svg/tech/', root);

/** Cabeçalho em pílula de cada categoria do Stack. */
export function categoryHeader({ slug, n, title, note }, count) {
  const H = 36, p = 'h';
  const right = `${count} ${count === 1 ? 'item' : 'itens'}${note ? ` · ${note}` : ''}`;
  const wNum = measure(n, fonts.monoSemi, 10.5), wTitle = measure(title, fonts.bodySemi, 13.5), wRight = measure(right, fonts.mono, 10);
  const W = Math.ceil(18 + wNum + 10 + wTitle + 14 + 1 + 14 + wRight + 18);
  let x = 18;
  const parts = [
    text(n, { font: fonts.monoSemi, size: 10.5, x, y: 22, fill: color.teal, tracking: 0.08 }).svg,
    text(title, { font: fonts.bodySemi, size: 13.5, x: (x += wNum + 10), y: 23, fill: color.ink }).svg,
    `<rect x="${(x += wTitle + 14).toFixed(1)}" y="11" width="1" height="14" fill="#fff" fill-opacity=".14"/>`,
    note ? `<circle class="pulse" cx="${(x + 14 + 4).toFixed(1)}" cy="18" r="3" fill="${color.green}"/><circle cx="${(x + 14 + 4).toFixed(1)}" cy="18" r="3" fill="${color.green}"/>` : '',
    text(right, { font: fonts.mono, size: 10, x: x + 14 + (note ? 12 : 0), y: 21.6, fill: color.ink3 }).svg,
  ];
  const w = W + (note ? 12 : 0);
  return doc({
    w, h: H, title, desc: `${title}: ${right}`,
    defs: `<linearGradient id="${p}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color.bg2}"/><stop offset="1" stop-color="${color.bg0}"/></linearGradient>
<linearGradient id="${p}-edge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${color.teal}" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="${color.peri}" stop-opacity=".45"/></linearGradient>`,
    body: `<g class="fade"><rect width="${w}" height="${H}" rx="18" fill="url(#${p}-bg)"/><rect x=".5" y=".5" width="${w - 1}" height="${H - 1}" rx="17.5" fill="none" stroke="url(#${p}-edge)"/>${parts.join('')}</g>`,
  });
}

/** Gera os cartões e o cabeçalho de uma categoria. `startOrder` encadeia a onda de toques. */
export function writeCategory(cat, keys, startOrder = 0) {
  mkdirSync(tileDir, { recursive: true });
  keys.forEach((key, i) => {
    const order = startOrder + i;
    writeFileSync(new URL(`${key}.svg`, tileDir), techTile(key, { at: 3 + order * 0.22, order: i }));
  });
  writeFileSync(new URL(`stack-head-${cat.slug}.svg`, new URL('assets/svg/', root)), categoryHeader(cat, keys.length));
  return startOrder + keys.length;
}

/** Substitui o conteúdo entre <!-- STACK:SLUG:START --> e <!-- STACK:SLUG:END --> no README. */
export function updateReadmeBlock(slug, keys) {
  const file = new URL('README.md', root);
  const readme = readFileSync(file, 'utf8');
  const tag = slug.toUpperCase();
  const re = new RegExp(`(<!-- STACK:${tag}:START -->)[\\s\\S]*?(<!-- STACK:${tag}:END -->)`);
  if (!re.test(readme)) throw new Error(`Marcadores STACK:${tag} ausentes no README.`);
  const next = readme.replace(re, `$1\n${tilesMarkdown(keys)}\n$2`);
  if (next !== readme) writeFileSync(file, next);
  return next !== readme;
}

/** Registra uma linguagem sem cartão próprio no catálogo, com a cor do GitHub. */
export function registerLanguage(name, hex) {
  const key = 'lang-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (!tech[key]) tech[key] = { name, sub: 'linguagem', icon: 'glyph:code', hex: hex ?? '#9AA9FF', url: `https://github.com/topics/${encodeURIComponent(name.toLowerCase())}` };
  return key;
}

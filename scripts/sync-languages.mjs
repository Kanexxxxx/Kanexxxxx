// Sincroniza a categoria "Linguagens" do Stack com o GitHub: lê as linguagens
// dos repositórios públicos, gera um cartão clicável para cada uma (inclusive
// linguagens novas, com a cor oficial do GitHub) e reescreve o bloco do README.
// Roda na Action; quando algo muda, a Action faz commit na main.
import { readFileSync, writeFileSync } from 'node:fs';
import { categories, languageKeys, registerLanguage, writeCategory, updateReadmeBlock } from './lib/tech.mjs';

const root = new URL('../', import.meta.url);
const config = JSON.parse(readFileSync(new URL('profile.config.json', root), 'utf8'));
const user = process.env.GITHUB_USER ?? config.user;
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('Defina GITHUB_TOKEN para consultar a API do GitHub.');

const response = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${token}`, 'User-Agent': 'kanex-profile' },
  body: JSON.stringify({
    query: `query($login: String!) { user(login: $login) { repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false) {
      nodes { name languages(first: 30) { edges { size node { name color } } } } } } }`,
    variables: { login: user },
  }),
  signal: AbortSignal.timeout(30000),
});
if (!response.ok) throw new Error(`GitHub GraphQL HTTP ${response.status}`);
const json = await response.json();
if (json.errors) throw new Error(JSON.stringify(json.errors));

const totals = new Map();
for (const repo of json.data.user.repositories.nodes.filter(r => r.name !== user)) {
  for (const { size, node } of repo.languages.edges) {
    const entry = totals.get(node.name) ?? { bytes: 0, hex: node.color };
    entry.bytes += size;
    totals.set(node.name, entry);
  }
}
const sum = [...totals.values()].reduce((n, e) => n + e.bytes, 0);
if (!sum) throw new Error('Sem dados de linguagens; mantendo a versão anterior.');

const ignore = new Set(config.ignoreLanguages);
const detected = [...totals]
  .filter(([name, e]) => !ignore.has(name) && e.bytes / sum >= config.minLanguageShare)
  .sort((a, b) => b[1].bytes - a[1].bytes)
  .map(([name, e]) => ({ name, bytes: e.bytes, hex: e.hex }));
for (const name of config.extraLanguages) {
  if (!detected.some(l => l.name === name)) detected.push({ name, bytes: 0, hex: null, extra: true });
}

const seen = new Set();
const languages = [];
for (const l of detected) {
  const key = languageKeys[l.name] ?? registerLanguage(l.name, l.hex);
  if (seen.has(key)) continue;
  seen.add(key);
  languages.push({ ...l, key });
}
const keys = languages.map(l => l.key);

writeCategory(categories[0], keys, 0);
const changed = updateReadmeBlock('languages', keys);
writeFileSync(new URL('assets/languages.json', root), JSON.stringify({ languages }, null, 2) + '\n');
console.log(`${keys.length} linguagens: ${languages.map(l => l.name).join(', ')}${changed ? ' (README atualizado)' : ''}`);

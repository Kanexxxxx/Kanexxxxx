import { writeFile } from 'node:fs/promises';
const owner = 'Kanexxxxx';
async function github(path) {
  const response = await fetch(`https://api.github.com/${path}`, {
    headers: {Accept:'application/vnd.github+json', 'User-Agent':'Kanex-profile',
      ...(process.env.GITHUB_TOKEN ? {Authorization:`Bearer ${process.env.GITHUB_TOKEN}`} : {})},
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`GitHub HTTP ${response.status}; assets anteriores preservados.`);
  return response.json();
}
const repos = [];
for (let page=1;;page++) {
  const items = await github(`users/${owner}/repos?type=owner&per_page=100&page=${page}`);
  repos.push(...items.filter(r=>!r.private&&!r.fork&&r.name!==owner));
  if (items.length<100) break;
}
const repositories=[];
for (const repo of repos) repositories.push({name:repo.name,url:repo.html_url,
  languages:await github(`repos/${repo.full_name}/languages`),stars:repo.stargazers_count,forks:repo.forks_count});
const date = new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date());
await writeFile(new URL('../assets/public-metrics.json',import.meta.url),JSON.stringify({date,repositories},null,2)+'\n');
await import('./render-metrics.mjs');

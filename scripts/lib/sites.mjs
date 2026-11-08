// Public entry points only. Private application source stays private.
import {readFileSync, writeFileSync} from 'node:fs';
import {fonts, color, text, doc, glass, arrowUpRight, tapLayers} from './kit.mjs';

export const sites = [
  {slug:'aprendiz',name:'Aprendiz+',url:'https://souaprendiz.com/',domain:'souaprendiz.com',logo:'aprendiz.svg',accent:'#FFA66B',sub:'Preparação para o primeiro emprego'},
  {slug:'eurora',name:'Eurora Love',url:'https://eurora.site/',domain:'eurora.site',logo:'eurora.svg',accent:'#FF92B5',sub:'Experiências e presentes para casais'},
  {slug:'volker',name:'VOLKER',url:'https://volkerr.com.br/',domain:'volkerr.com.br',logo:'volker.svg',accent:'#FF647B',sub:'Streetwear e sneakers'},
  {slug:'nexakeep',name:'Nexakeep CRM',url:'https://nexakeep.site/',domain:'nexakeep.site',logo:'nexakeep.svg',accent:'#A7B4FF',sub:'Gestão de clientes e projetos · com login'},
  {slug:'prumo',name:'Prumo',url:'https://prumo-two-psi.vercel.app/',domain:'prumo-two-psi.vercel.app',logo:'prumo.png',accent:'#77EBD7',sub:'Finanças da família · com login'},
];

export function writeSites() {
  for (const [i, s] of sites.entries()) {
    const w=416,h=128,p='site';
    const g=glass({w,h,id:p,rx:20,blobs:[{cx:400,cy:0,r:220,c:s.accent,o:.16}]});
    const tap=tapLayers({id:p,at:2+i*.7,cx:382,cy:42,ripple:380,accent:s.accent,clip:`${p}-clip`,edge:{x:.75,y:.75,w:w-1.5,h:h-1.5,rx:19.25}});
    const mime=s.logo.endsWith('.png')?'image/png':'image/svg+xml';
    const data=readFileSync(new URL(`../../assets/logos/${s.logo}`,import.meta.url)).toString('base64');
    const svg=doc({w,h,title:`${s.name} — abrir site`,desc:`${s.sub}. Acesse ${s.domain}.`,
      defs:g.defs+tap.defs,
      body:`${g.back}${tap.ripple}
<rect x="18" y="18" width="48" height="48" rx="13" fill="#0B1224" stroke="#fff" stroke-opacity=".15"/>
<image x="22" y="22" width="40" height="40" preserveAspectRatio="xMidYMid meet" href="data:${mime};base64,${data}"/>
${text(s.name,{font:fonts.display,size:21,x:80,y:39,fill:color.ink}).svg}
${text(s.domain,{font:fonts.mono,size:10,x:80,y:58,fill:s.accent}).svg}
${text(s.sub,{font:fonts.body,size:11.5,x:20,y:93,fill:color.ink2}).svg}
${text('Abrir site',{font:fonts.bodySemi,size:10.5,x:20,y:114,fill:s.accent}).svg}
<circle cx="382" cy="40" r="15" fill="${s.accent}" fill-opacity=".12"/>
${arrowUpRight(382,40,5,s.accent)}${g.front}${tap.edge}`});
    writeFileSync(new URL(`../../assets/svg/site-${s.slug}.svg`,import.meta.url),svg);
  }
  const file=new URL('../../README.md',import.meta.url);
  const readme=readFileSync(file,'utf8');
  const links=sites.map(s=>`<a href="${s.url}"><img src="./assets/svg/site-${s.slug}.svg" width="416" alt="${s.name} — abrir ${s.domain}. ${s.sub}."></a>`).join(' ');
  writeFileSync(file,readme.replace(/(<!-- SITES:START -->)[\s\S]*?(<!-- SITES:END -->)/,`$1\n${links}\n$2`));
}

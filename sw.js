/* Nosso Dinheiro — service worker (versão organizada em arquivos) */
const VERSAO='nosso-dinheiro-v4.2.0';
const CASCA=['./','./index.html','./style.css','./app.js','./libs/xlsx.full.min.js','./libs/chart.umd.min.js','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(VERSAO);
 await Promise.all(CASCA.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>null)));await self.skipWaiting()})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const n=await caches.keys();
 await Promise.all(n.map(x=>(x===VERSAO?null:caches.delete(x))));await self.clients.claim()})())});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 if(e.request.mode==='navigate'){e.respondWith((async()=>{
   try{const r=await fetch(e.request);const c=await caches.open(VERSAO);c.put('./index.html',r.clone());return r}
   catch(_){return (await caches.match('./index.html'))||(await caches.match('./'))||Response.error()}})());return}
 e.respondWith((async()=>{const hit=await caches.match(e.request);if(hit)return hit;
  try{const r=await fetch(e.request);if(r&&r.status===200){const c=await caches.open(VERSAO);c.put(e.request,r.clone())}return r}
  catch(_){return Response.error()}})());
});

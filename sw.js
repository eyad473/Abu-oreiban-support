/* Stage 4: cache only public application shell; never cache API or private responses. */
const CACHE='abu-oreiban-residents-stage4-shell-v1';
const PREFIX='abu-oreiban-residents-';
const SHELL=['./index.html','./manifest.webmanifest'];
const shellURL=new URL('./index.html',self.registration.scope).href;
const manifestURL=new URL('./manifest.webmanifest',self.registration.scope).href;
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(async cache=>{
  // Keep a usable prior cache if a new shell cannot be fetched.
  await cache.addAll(SHELL.map(path=>new Request(path,{cache:'reload'})));
 }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||request.cache==='no-store')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 const isShellNavigation=request.mode==='navigate' && (url.pathname===new URL('./',self.registration.scope).pathname || url.pathname===new URL('./index.html',self.registration.scope).pathname);
 if(isShellNavigation){
  event.respondWith(fetch(request).then(response=>{
   if(response.ok&&response.type==='basic'){
    const copy=response.clone();
    event.waitUntil(caches.open(CACHE).then(cache=>cache.put(shellURL,copy)));
   }
   return response;
  }).catch(async()=> (await caches.match(shellURL)) || Response.error()));
  return;
 }
 if(url.href===manifestURL){
  event.respondWith(fetch(request).then(response=>{
   if(response.ok&&response.type==='basic'){
    const copy=response.clone();
    event.waitUntil(caches.open(CACHE).then(cache=>cache.put(manifestURL,copy)));
   }
   return response;
  }).catch(async()=> (await caches.match(manifestURL)) || Response.error()));
 }
 // All other requests bypass service-worker caching (including API and user data).
});

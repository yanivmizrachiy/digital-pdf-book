const CACHE="pdf-library-v1";
const CORE=["./","./index.html","./viewer.html","./data/books.json"];
self.addEventListener("install",(e)=>e.waitUntil((async()=>{
  const c=await caches.open(CACHE); await c.addAll(CORE); self.skipWaiting();
})()));
self.addEventListener("activate",(e)=>e.waitUntil((async()=>{
  const keys=await caches.keys(); await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  self.clients.claim();
})()));
self.addEventListener("fetch",(e)=>{
  const req=e.request; const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const hit=await c.match(req);
    if(hit) return hit;
    try{
      const fresh=await fetch(req);
      const ct=fresh.headers.get("content-type")||"";
      if(fresh.ok && (ct.includes("text/")||ct.includes("application/pdf")||ct.includes("application/json"))) c.put(req,fresh.clone());
      return fresh;
    }catch(err){
      if(req.mode==="navigate") return (await c.match("./index.html")) || new Response("Offline",{status:200});
      return hit || new Response("Offline",{status:503});
    }
  })());
});

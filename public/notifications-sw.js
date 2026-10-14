self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const path=event.notification.data?.href;
 const url=new URL(typeof path==='string'&&path.startsWith('/')&&!path.startsWith('//')?path:'/',self.location.origin);
 if(url.origin!==self.location.origin)return;
 event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows=>{for(const client of windows){if(new URL(client.url).origin===url.origin){await client.navigate(url.href);return client.focus();}}return clients.openWindow(url.href);}));
});

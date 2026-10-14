export type SystemNotice={id:string;kind:string;date:string;href:string;title?:string};
export function newSystemNotices(items:SystemNotice[],previous:Set<string>,preferences:Record<string,boolean>,seen:string[],since:number){
 return items.filter(item=>!previous.has(item.id)&&preferences[item.kind]===true&&!seen.includes(item.id)&&Date.parse(item.date)>=since&&/^\/(?!\/)[^\\]*$/.test(item.href)).slice(0,3);
}
export async function showSystemNotice(title:string,body:string,id:string,href:string){
 if(!('Notification' in window)||Notification.permission!=='granted')return;
 const options:NotificationOptions={body,tag:id,icon:'/assets/site/icon-192.png',data:{href}};
 try{if('serviceWorker' in navigator){const registration=await navigator.serviceWorker.register('/notifications-sw.js',{scope:'/'});if(!registration.active)await navigator.serviceWorker.ready;await registration.showNotification(title,options);return;}}catch{}
 const notification=new Notification(title,options);notification.onclick=()=>{window.focus();window.location.assign(href);notification.close();};
}

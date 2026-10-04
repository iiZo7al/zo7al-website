import "server-only";
import { webhookUrl } from "./creator-applications";
export async function notifyDiscord(kind: "support" | "event" | "order", reference: string, fields: Record<string, string>) {
  const webhook = webhookUrl((kind === "support" ? process.env.DISCORD_SUPPORT_WEBHOOK_URL : (kind === "event" ? process.env.DISCORD_EVENT_WEBHOOK_URL : undefined)) || process.env.DISCORD_APPLICATION_WEBHOOK_URL);
  if (!webhook) throw new Error("UNAVAILABLE");
  const response = await fetch(webhook, { method:"POST",redirect:"error",signal:AbortSignal.timeout(10000),headers:{"Content-Type":"application/json"},body:JSON.stringify({
    username:"Zo7al Network",
    allowed_mentions:{parse:[]},
    embeds:[{ author:{name:"Zo7al Network",url:"https://zo7al.is-a.dev"},title:kind === "support" ? "📨 Support & Reports" : kind === "event" ? "📅 Event Registration" : "🛒 Store Checkout",color:kind === "support" ? 0xff9e42 : kind === "event" ? 0x47d8c0 : 0xffcc55,
      thumbnail:{url:"https://zo7al.is-a.dev/assets/site/server-logo.png"},
      fields:Object.entries(fields).flatMap(([name,value])=>(value.trim().match(/[\s\S]{1,1000}/g)??["—"]).map((part,index)=>({name:(index?name+" ("+(index+1)+")":name).slice(0,256),value:part,inline:false}))),
      footer:{text:"Zo7al Network • Reference: "+reference},timestamp:new Date().toISOString() }]
  }) });
  const receipt = response.ok ? await response.json().catch(()=>null) : null;
  if (typeof receipt?.id !== "string" || !/^\d+$/.test(receipt.id)) throw new Error("DELIVERY_FAILED");
  return receipt.id as string;
}

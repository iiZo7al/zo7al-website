import type {PlatformItem,MetricKey} from './dashboard';
const text=(html:string)=>html.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(?:x([a-f0-9]+)|(\d+));/gi,(_,hex,dec)=>String.fromCodePoint(parseInt(hex??dec,hex?16:10))).replace(/\s+/g,' ').trim();
function number(value:string,decimal=false){const m=value.replace(/,/g,'').trim().match(/^(\d+(?:\.\d+)?)([KMB])?$/i);if(!m)return null;const n=Number(m[1])*({K:1000,M:1000000,B:1000000000}[m[2]?.toUpperCase()??'']??1);return (decimal?Number.isFinite(n)&&n<=Number.MAX_SAFE_INTEGER:Number.isSafeInteger(n))&&n>=0?n:null;}
/** Creator cards mix all-time totals and 24h metrics: keep the periods distinct. */
export function parseFortniteGGCreator(html:string):PlatformItem[]{
 if(html.length>2000000)throw Error('INVALID_UPSTREAM');
 const items:PlatformItem[]=[];
 for(const match of html.matchAll(/<a\b[^>]*href=['"]\/island\/(\d{4}-\d{4}-\d{4})['"][^>]*>([\s\S]*?)<\/a>/gi)){
  const title=match[2].match(/<h3\b[^>]*class=['"][^'"]*island-title[^'"]*['"][^>]*>([\s\S]*?)<\/h3>/i);if(!title)continue;
  const metrics:PlatformItem['metrics']={};
  for(const stat of match[2].matchAll(/<span>([^<]+)<\/span>\s*([^<]*)/gi)){
   const statNames:Record<string,MetricKey>={'Players Now':'players','All-Time Peak':'peakPlayers','Minutes Played':'minutesPlayed','24h Plays':'plays','24h Players':'uniquePlayers','24h Avg Playtime':'averagePlaytime'};const key=statNames[stat[1]];if(key)metrics[key]=number(text(stat[2]),key==='averagePlaytime');
  }
  if(!Object.keys(metrics).length)continue;
  items.push({id:match[1],title:text(title[1]).slice(0,200),url:'https://fortnite.gg/island/'+match[1],metrics});
 }
 if(!items.length)throw Error('INVALID_UPSTREAM');return items;
}

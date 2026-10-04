export function mapPlayerCount(map:{maxPlayers?:number;description?:string}):number|null {
  if(Number.isInteger(map.maxPlayers)&&Number(map.maxPlayers)>0&&Number(map.maxPlayers)<=100)return Number(map.maxPlayers);
  const match=map.description?.match(/\b(\d{1,3})[- ]?(?:players?|لاعب)/i);
  const count=match?Number(match[1]):null;
  return count&&count<=100?count:null;
}

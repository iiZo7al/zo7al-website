export function parseFavorites(raw:string|null): string[] {
  try { const data:unknown=JSON.parse(raw??"[]");return Array.isArray(data)?[...new Set(data.filter((v):v is string=>typeof v==="string"&&/^(map|modrinth|curseforge):[a-zA-Z0-9_-]{1,100}$/.test(v)))].slice(0,200):[]; }catch{return [];}
}

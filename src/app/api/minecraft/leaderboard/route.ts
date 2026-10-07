import { siteDatabase } from '@/lib/server/site-db';
import { isUUID } from '@/lib/data/community';
import { NETWORK_PROFILE_ID,NETWORK_PROFILE_NAME,visiblePlayerStats } from '@/lib/data/player-statistics';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const params=new URL(request.url).searchParams,stat=params.get('stat')??'playtimeSeconds',server=params.get('server')??NETWORK_PROFILE_ID;
 if(!['streak','kills','playtimeSeconds'].includes(stat)||server!==NETWORK_PROFILE_ID&&!isUUID(server))return Response.json({error:'INVALID'},{status:400});
 try{
  const db=await siteDatabase();
  const [bridges,scores]=await Promise.all([
   db.query('SELECT id,name,visible_stats AS "visibleStats" FROM minecraft_profile_bridges WHERE enabled ORDER BY created_at'),
   db.query(`WITH selected AS (
     SELECT p.uuid,p.username,p.captured_at,p.updated_at,CASE WHEN jsonb_typeof(p.stats->$1)='number' THEN (p.stats->>$1)::numeric END AS value
     FROM minecraft_player_profiles p JOIN minecraft_profile_bridges b ON b.id=p.bridge_id
     WHERE b.enabled AND ($2::uuid IS NULL OR b.id=$2::uuid) AND (b.visible_stats IS NULL OR b.visible_stats ? $1)
   ), totals AS (SELECT uuid,${stat==='streak'?'max':'sum'}(value) AS value FROM selected WHERE value>=0 AND value<=1e12 GROUP BY uuid), identities AS (
     SELECT DISTINCT ON(p.uuid) p.uuid,p.username FROM minecraft_player_profiles p JOIN minecraft_profile_bridges b ON b.id=p.bridge_id AND b.enabled ORDER BY p.uuid,p.captured_at DESC,p.updated_at DESC
   ) SELECT i.username,t.value::double precision AS value FROM totals t JOIN identities i ON i.uuid=t.uuid ORDER BY t.value DESC,i.username ASC LIMIT 25`,[stat,server===NETWORK_PROFILE_ID?null:server]),
  ]);
  const servers=[{id:NETWORK_PROFILE_ID,name:NETWORK_PROFILE_NAME,stats:[...new Set(bridges.rows.flatMap(b=>visiblePlayerStats(b.visibleStats)))]},...bridges.rows.map(b=>({id:b.id,name:b.name,stats:visiblePlayerStats(b.visibleStats)}))];
  return Response.json({rows:scores.rows,servers,stat,server,available:true},{headers:{'Cache-Control':'public,max-age=30'}});
 }catch{return Response.json({rows:[],servers:[],available:false},{status:503,headers:{'Cache-Control':'no-store'}});}
}

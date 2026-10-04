import "server-only";
import { siteDatabase } from "./site-db";
import { readConnections } from "./dashboard-connections";
import { cachedPlatform } from "./dashboard-platforms";
import { platformIds, type DashboardInsights, type DashboardSummary } from "../data/dashboard";

export async function dashboardInsights(): Promise<DashboardInsights> {
  const db = await siteDatabase();
  const [summary,activity,connections] = await Promise.all([
    db.query<DashboardSummary>(`SELECT
      (SELECT count(*)::int FROM site_requests) AS requests,
      (SELECT count(*)::int FROM site_requests WHERE status IN ('pending','open','reviewing')) AS pending,
      (SELECT count(*)::int FROM site_requests WHERE kind='application') AS applications,
      (SELECT count(*)::int FROM site_requests WHERE kind='support') AS support,
      (SELECT count(*)::int FROM site_requests WHERE kind='event') AS registrations,
      (SELECT count(*)::int FROM site_orders) AS orders,
      (SELECT count(*)::int FROM site_content) AS content,
      (SELECT count(*)::int FROM site_content WHERE published) AS published,
      (SELECT count(*)::int FROM site_content WHERE NOT published) AS drafts`),
    db.query(`WITH days AS (
        SELECT generate_series((timezone('Asia/Riyadh',now())::date-27)::timestamp,
          timezone('Asia/Riyadh',now())::date::timestamp,interval '1 day')::date AS day
      ), requests AS (
        SELECT timezone('Asia/Riyadh',created_at)::date AS day,count(*)::int AS count
        FROM site_requests WHERE created_at >= now()-interval '29 days' GROUP BY 1
      ), orders AS (
        SELECT timezone('Asia/Riyadh',created_at)::date AS day,count(*)::int AS count
        FROM site_orders WHERE created_at >= now()-interval '29 days' GROUP BY 1
      ) SELECT to_char(days.day,'YYYY-MM-DD') AS day,
        COALESCE(requests.count,0) AS requests,COALESCE(orders.count,0) AS orders
      FROM days LEFT JOIN requests USING(day) LEFT JOIN orders USING(day) ORDER BY days.day`),
    readConnections(),
  ]);
  const platforms = await Promise.all(platformIds.map(id => cachedPlatform(id,id === "youtube" || id === "curseforge" ? connections[id] : undefined)));
  return { summary: summary.rows[0], activity: activity.rows, platforms, generatedAt: new Date().toISOString() };
}

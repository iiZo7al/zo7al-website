import {localizedPageMetadata} from "@/lib/server/page-metadata";
import Dashboard from "@/components/dashboard/Dashboard";
import "@/components/dashboard/dashboard.css";
export async function generateMetadata(){return localizedPageMetadata("dashboard.dashboard",undefined,{index:false,follow:false});}
export default function DashboardPage() { return <main className="dashboard-root" data-accent="home"><Dashboard/></main>; }

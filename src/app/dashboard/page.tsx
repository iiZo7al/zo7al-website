import type { Metadata } from "next";
import Dashboard from "@/components/dashboard/Dashboard";
import "@/components/dashboard/dashboard.css";
export const metadata: Metadata = { title:"Dashboard", robots:{ index:false, follow:false } };
export default function DashboardPage() { return <main className="dashboard-root" data-accent="home"><Dashboard/></main>; }

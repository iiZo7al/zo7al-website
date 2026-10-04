import type { Metadata } from "next";
import AdminPanel from "@/components/hub/AdminPanel";
export const metadata:Metadata={title:"Administration",robots:{index:false,follow:false}};
export default function Page(){return <main className="hub-admin"><AdminPanel/></main>;}

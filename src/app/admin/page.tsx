import {localizedPageMetadata} from "@/lib/server/page-metadata";
import { redirect } from "next/navigation";
export async function generateMetadata(){return localizedPageMetadata("dashboard.dashboard",undefined,{index:false,follow:false});}
export default function Page(){redirect("/dashboard");}

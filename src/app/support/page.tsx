import { redirect } from "next/navigation";
export default async function Page({searchParams}:{searchParams:Promise<{order?:string}>}){const {order}=await searchParams;redirect("/minecraft"+(order?"?order="+encodeURIComponent(order.slice(0,128)):"")+"#support");}

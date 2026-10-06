import { redirect } from "next/navigation";
export const metadata={robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{type?:string}>}){const {type}=await searchParams;redirect("/requests?tab="+(type==="event"?"events":type==="application"?"applications":type==="order"?"orders":"support"));}

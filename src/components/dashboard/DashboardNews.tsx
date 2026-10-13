"use client";
import DashboardManagement from './DashboardManagement';
import type {DashboardData,Mutate} from './types';
export default function DashboardNews({data,busy,mutate}:{data:DashboardData;busy:boolean;mutate:Mutate;onExpired:()=>void}) { return <DashboardManagement tab="news" data={data} busy={busy} mutate={mutate}/>; }

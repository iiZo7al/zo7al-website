export const MILESTONES = ["firstFlight","score10000","stars10","score100000"] as const;
export type Milestone=typeof MILESTONES[number];
export function runMilestones(score:number,stars:number):Milestone[] {
  if(!Number.isSafeInteger(score)||score<0||!Number.isSafeInteger(stars)||stars<0)return [];
  const result:Milestone[]=["firstFlight"];
  if(score>=10000)result.push("score10000");
  if(stars>=10)result.push("stars10");
  if(score>=100000)result.push("score100000");
  return result;
}
export function dailyChallenge(date=new Date()) {
  const day=new Date(date.getTime()+3*3600000).toISOString().slice(0,10);
  const seed=[...day].reduce((n,c)=>n+c.charCodeAt(0),0);
  return {day,metric:seed%2?"stars" as const:"score" as const,target:seed%2?10:15000};
}

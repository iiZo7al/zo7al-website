// Public API URL only. Database credentials and signing secrets stay on Neon.
const SPACE_API = "https://br-steep-star-a580g5uk-spacerun.compute.c-1.us-east-2.aws.neon.tech";
export const spaceApi = (path: "start" | "finish" | "leaderboard") => `${SPACE_API}/${path}`;

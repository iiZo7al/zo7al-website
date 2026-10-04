import {randomBytes,scryptSync} from "node:crypto";
import {writeFileSync} from "node:fs";
import {resolve} from "node:path";

const output=resolve(process.argv[2]??".env.admin.local");
const password=randomBytes(32).toString("base64url");
const salt=randomBytes(16).toString("hex");
const hash="scrypt:"+salt+":"+scryptSync(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024}).toString("hex");
const session=randomBytes(48).toString("base64url");
const content=`# Zo7al administration — private setup
# Login password (keep this file private):
# ${password}
#
# Add these two environment variables to the website hosting settings.
# Keep the existing DISCORD_APPLICATION_WEBHOOK_URL.
# Also configure DATABASE_URL for admin content and private tracking.
# After redeploying, press Ctrl + K, type /admin, and use the password above.
#
ZO7AL_ADMIN_PASSWORD_HASH=${hash}
ZO7AL_ADMIN_SESSION_SECRET=${session}
`;
try {
  writeFileSync(output,content,{mode:0o600,flag:"wx"});
  console.log("Private admin setup written to "+output);
} catch {
  console.error("Could not create the private setup file. Choose a new output path.");
  process.exitCode=1;
}

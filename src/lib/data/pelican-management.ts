/** Client API operations, based on pelican/panel routes/api-client.php.
 * The browser selects an operation, never an arbitrary upstream URL or method. */
export type PelicanOperation = {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, string>;
  body?: Record<string, unknown> | string;
  response?: "json" | "text";
  signed?: "upload" | "download";
  client?: boolean;
};
export const pelicanTabs = ["console", "files", "backups", "schedules", "databases", "users", "network", "startup", "settings", "activity", "account"] as const;
export type PelicanTab = typeof pelicanTabs[number];
export const pelicanPermissions = [
  "websocket.connect", "control.console", "control.start", "control.stop", "control.restart",
  "file.read", "file.read-content", "file.create", "file.update", "file.delete", "file.archive", "file.sftp",
  "backup.read", "backup.create", "backup.delete", "backup.download", "backup.restore",
  "schedule.read", "schedule.create", "schedule.update", "schedule.delete",
  "user.read", "user.create", "user.update", "user.delete",
  "database.read", "database.create", "database.update", "database.delete", "database.view-password",
  "allocation.read", "allocation.create", "allocation.update", "allocation.delete", "activity.read",
  "mount.read", "mount.update", "startup.read", "startup.update", "startup.docker-image",
  "settings.rename", "settings.description", "settings.reinstall", "settings.change-icon",
] as const;
export const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
export const attributes = (value: unknown) => object(object(value).attributes);
export const collection = (value: unknown) => Array.isArray(object(value).data) ? (object(value).data as unknown[]).map(attributes) : [];
export const string = (value: unknown) => typeof value === "string" ? value : "";
const invalid = (): never => { throw Error("INVALID"); };
const text = (value: unknown, max = 255, empty = false): string => {
  if (typeof value !== "string" || value.length > max || (!empty && !value.trim()) || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) return invalid();
  return value;
};
const id = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? String(value) : typeof value === "string" && /^[1-9]\d{0,14}$/.test(value) ? value : invalid();
const uuid = (value: unknown) => typeof value === "string" && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value) ? value : invalid();
const bool = (value: unknown, fallback = false) => value === undefined ? fallback : typeof value === "boolean" ? value : invalid();
const confirmed = (value: unknown) => { if (value !== true) invalid(); };
export function filePath(value: unknown): string {
  const path = text(value, 4096);
  let decoded=path;
  for(let i=0;i<4;i++) {
    if (/[\\\x00-\x1f\x7f]/.test(decoded) || decoded.split("/").some(part => part === ".." || part === ".")) return invalid();
    try {const next=decodeURIComponent(decoded);if(next===decoded)break;decoded=next;}catch{break;}
  }
  if (/%(?:2e|2f|5c|00)/i.test(decoded)) return invalid();
  return "/" + path.split("/").filter(Boolean).join("/");
}
export function fileName(value: unknown): string {
  const name = text(value, 255);
  if (name.includes("/") || name.includes("\\") || name === "." || name === ".." || /[\x00-\x1f\x7f]/.test(name)) return invalid();
  filePath(name);
  return name;
}
const paths = (value: unknown): string[] => Array.isArray(value) && value.length > 0 && value.length <= 500 ? value.map(item => filePath(item).slice(1)) : invalid();
const page = (value: unknown) => value === undefined || value === "" ? "1" : id(value);
export function pelicanRead(resource: unknown, input: Record<string, unknown> = {}): PelicanOperation | null {
  try {
    switch (resource) {
      case "servers": return { endpoint:"", method:"GET", client:true, query:{ page:page(input.page), per_page:"100" } };
      case "files": return { endpoint:"/files/list", method:"GET", query:{ directory:filePath(input.directory ?? "/") } };
      case "fileContents": return { endpoint:"/files/contents", method:"GET", query:{ file:filePath(input.file) }, response:"text" };
      case "backups": return { endpoint:"/backups", method:"GET", query:{ page:page(input.page), per_page:"50" } };
      case "backup": return { endpoint:"/backups/"+uuid(input.id), method:"GET" };
      case "schedules": return { endpoint:"/schedules", method:"GET" };
      case "schedule": return { endpoint:"/schedules/"+id(input.id), method:"GET" };
      case "databases": return { endpoint:"/databases", method:"GET", ...(input.password === "true" ? {query:{include:"password"}} : {}) };
      case "users": return { endpoint:"/users", method:"GET" };
      case "user": return { endpoint:"/users/"+uuid(input.id), method:"GET" };
      case "network": return { endpoint:"/network/allocations", method:"GET" };
      case "startup": return { endpoint:"/startup", method:"GET" };
      case "settings": return { endpoint:"", method:"GET" };
      case "activity": return { endpoint:"/activity", method:"GET", query:{page:page(input.page),per_page:"50",sort:"-timestamp",include:"actor",...(input.filter ? {"filter[event]":text(input.filter,100)} : {})} };
      case "account": return {endpoint:"/account",method:"GET",client:true};
      case "permissions": return {endpoint:"/permissions",method:"GET",client:true};
      case "apiKeys": return {endpoint:"/account/api-keys",method:"GET",client:true};
      case "sshKeys": return {endpoint:"/account/ssh-keys",method:"GET",client:true};
      case "accountActivity": return {endpoint:"/account/activity",method:"GET",client:true,query:{page:page(input.page),per_page:"50",sort:"-timestamp"}};
      default: return null;
    }
  } catch { return null; }
}
function scheduleBody(input: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { name:text(input.name), is_active:bool(input.is_active,true), only_when_online:bool(input.only_when_online) };
  for (const key of ["minute", "hour", "day_of_month", "month", "day_of_week"]) {
    const value = text(input[key],100);
    if (!/^[0-9*,/\-]+$/.test(value)) invalid();
    result[key] = value;
  }
  return result;
}
function taskBody(input: Record<string, unknown>): Record<string, unknown> {
  if (!["command","power","backup","delete_files"].includes(String(input.taskAction))) invalid();
  const offset = input.time_offset ?? 0;
  if (typeof offset !== "number" || !Number.isInteger(offset) || offset < 0 || offset > 900) invalid();
  const payload = text(input.payload ?? "",16000,input.taskAction === "backup");
  if (input.taskAction === "power" && !["start","stop","restart","kill"].includes(payload)) invalid();
  if (input.taskAction === "command" && (payload.length > 1000 || /[\r\n]/.test(payload))) invalid();
  const result: Record<string, unknown> = { action:input.taskAction,payload,time_offset:offset,continue_on_failure:bool(input.continue_on_failure) };
  if (input.sequence_id !== undefined) result.sequence_id = Number(id(input.sequence_id));
  return result;
}
function permissions(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > pelicanPermissions.length || value.some(item => !pelicanPermissions.includes(item))) invalid();
  return [...new Set(value as string[])];
}
export function pelicanWrite(action: unknown, value: unknown): PelicanOperation | null {
  const v = object(value), root = () => filePath(v.root ?? "/");
  const post = (endpoint: string, body: Record<string, unknown> = {}): PelicanOperation => ({ endpoint,method:"POST",body });
  const remove = (endpoint: string): PelicanOperation => { confirmed(v.confirm);return {endpoint,method:"DELETE"}; };
  try {
    switch (action) {
      case "fileSave": {
        const content=text(v.content,1000000,true);if(new TextEncoder().encode(content).length>1000000)invalid();
        return {endpoint:"/files/write",method:"POST",query:{file:filePath(v.file)},body:content,response:"text"};
      }
      case "fileDownload": return {endpoint:"/files/download",method:"GET",query:{file:filePath(v.file)},signed:"download"};
      case "fileUpload": return {endpoint:"/files/upload",method:"GET",signed:"upload"};
      case "fileRename": return {endpoint:"/files/rename",method:"PUT",body:{root:root(),files:[{from:filePath(v.from).slice(1),to:filePath(v.to).slice(1)}]}};
      case "fileCopy": return post("/files/copy",{location:filePath(v.file)});
      case "fileDelete": confirmed(v.confirm);return post("/files/delete",{root:root(),files:paths(v.files)});
      case "fileFolder": return post("/files/create-folder",{root:root(),name:fileName(v.name)});
      case "fileCompress": {
        const extension = v.extension ?? "tar.gz";
        if (!["zip","tgz","tar.gz","txz","tar.xz","tbz2","tar.bz2"].includes(String(extension))) invalid();
        return post("/files/compress",{root:root(),files:paths(v.files),extension,...(v.name ? {name:fileName(v.name)} : {})});
      }
      case "fileDecompress": return post("/files/decompress",{root:root(),file:filePath(v.file).slice(1)});
      case "fileChmod": {
        if (typeof v.mode !== "string" || !/^[0-7]{3,4}$/.test(v.mode)) invalid();
        return post("/files/chmod",{root:root(),files:paths(v.files).map(file => ({file,mode:v.mode}))});
      }
      case "filePull": {
        const url = new URL(text(v.url,4096));
        if (url.protocol !== "https:" || url.username || url.password || url.hash) invalid();
        return post("/files/pull",{url:url.href,directory:filePath(v.directory ?? "/"),foreground:false,use_header:bool(v.use_header),...(v.filename ? {filename:fileName(v.filename)} : {})});
      }
      case "backupCreate": return post("/backups",{name:text(v.name ?? "",255,true),ignored:text(v.ignored ?? "",16000,true),is_locked:bool(v.is_locked)});
      case "backupRename": return {endpoint:"/backups/"+uuid(v.id)+"/rename",method:"PUT",body:{name:text(v.name)}};
      case "backupLock": return post("/backups/"+uuid(v.id)+"/lock");
      case "backupRestore": confirmed(v.confirm);return post("/backups/"+uuid(v.id)+"/restore",{truncate:bool(v.truncate)});
      case "backupDelete": return remove("/backups/"+uuid(v.id));
      case "backupDownload": return {endpoint:"/backups/"+uuid(v.id)+"/download",method:"GET",signed:"download"};
      case "databaseCreate": {
        const database = text(v.database,48), remote = text(v.remote ?? "%",255);
        if (!/^[\w-]{3,48}$/.test(database)) invalid();
        return post("/databases",{database,remote});
      }
      case "databaseRotate": confirmed(v.confirm);return post("/databases/"+id(v.id)+"/rotate-password");
      case "databaseDelete": return remove("/databases/"+id(v.id));
      case "scheduleCreate": return post("/schedules",scheduleBody(v));
      case "scheduleUpdate": return post("/schedules/"+id(v.id),scheduleBody(v));
      case "scheduleExecute": confirmed(v.confirm);return post("/schedules/"+id(v.id)+"/execute");
      case "scheduleDelete": return remove("/schedules/"+id(v.id));
      case "taskCreate": return post("/schedules/"+id(v.scheduleId)+"/tasks",taskBody(v));
      case "taskUpdate": return post("/schedules/"+id(v.scheduleId)+"/tasks/"+id(v.id),taskBody(v));
      case "taskDelete": return remove("/schedules/"+id(v.scheduleId)+"/tasks/"+id(v.id));
      case "userCreate": {
        confirmed(v.confirm);const email = text(v.email);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid();
        return post("/users",{email,permissions:permissions(v.permissions)});
      }
      case "userUpdate": confirmed(v.confirm);return post("/users/"+uuid(v.id),{permissions:permissions(v.permissions)});
      case "userDelete": return remove("/users/"+uuid(v.id));
      case "networkCreate": return post("/network/allocations");
      case "networkNotes": return post("/network/allocations/"+id(v.id),{notes:text(v.notes ?? "",1000,true)});
      case "networkPrimary": confirmed(v.confirm);return post("/network/allocations/"+id(v.id)+"/primary");
      case "networkDelete": return remove("/network/allocations/"+id(v.id));
      case "startupUpdate": return {endpoint:"/startup/variable",method:"PUT",body:{key:text(v.key,100),value:text(v.value ?? "",16000,true)}};
      case "dockerImage": return {endpoint:"/settings/docker-image",method:"PUT",body:{docker_image:text(v.docker_image,500)}};
      case "serverRename": return post("/settings/rename",{name:text(v.name)});
      case "serverDescription": return post("/settings/description",{description:text(v.description ?? "",4000,true)});
      case "serverReinstall": confirmed(v.confirm);return post("/settings/reinstall");
      case "accountUsername": confirmed(v.confirm);return {endpoint:"/account/username",method:"PUT",client:true,body:{username:text(v.username,64)}};
      case "accountEmail": {
        confirmed(v.confirm);const email=text(v.email);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))invalid();
        return {endpoint:"/account/email",method:"PUT",client:true,body:{email}};
      }
      case "accountPassword": {
        confirmed(v.confirm);const password=text(v.password,128);if(password.length<16||password!==v.password_confirmation)invalid();
        return {endpoint:"/account/password",method:"PUT",client:true,body:{password,password_confirmation:password}};
      }
      case "apiKeyCreate": {
        confirmed(v.confirm);const ips=text(v.allowed_ips??"",6400,true).split(/[\s,]+/).filter(Boolean);
        if(ips.length>50||ips.some(ip=>ip.length>128||!/^([\da-fA-F:.]+)(\/\d{1,3})?$/.test(ip)))invalid();
        return {endpoint:"/account/api-keys",method:"POST",client:true,body:{description:text(v.description),allowed_ips:ips}};
      }
      case "apiKeyDelete": {
        confirmed(v.confirm);const key=text(v.identifier,64);if(!/^[A-Za-z0-9]{8,64}$/.test(key))invalid();
        return {endpoint:"/account/api-keys/"+key,method:"DELETE",client:true};
      }
      case "sshKeyCreate": {
        confirmed(v.confirm);const key=text(v.public_key,16000);
        if(!/^(ssh-(rsa|ed25519)|ecdsa-sha2-nistp\d+) [A-Za-z0-9+/=]+(?: [^\r\n]*)?$/.test(key))invalid();
        return {endpoint:"/account/ssh-keys",method:"POST",client:true,body:{name:text(v.name),public_key:key}};
      }
      case "sshKeyDelete": {
        confirmed(v.confirm);const key=text(v.fingerprint,128);if(!/^[A-Za-z0-9+/:=_-]{8,128}$/.test(key))invalid();
        return {endpoint:"/account/ssh-keys/"+encodeURIComponent(key),method:"DELETE",client:true};
      }
      default: return null;
    }
  } catch { return null; }
}
/** Defense in depth for callers outside the management route. */
export function allowedPelicanEndpoint(endpoint: string, method: string, client = false): boolean {
  if (client) {
    if(method==="GET")return ["","/permissions","/account","/account/activity","/account/api-keys","/account/ssh-keys"].includes(endpoint);
    if(method==="PUT")return ["/account/username","/account/email","/account/password"].includes(endpoint);
    if(method==="POST")return ["/account/api-keys","/account/ssh-keys"].includes(endpoint);
    return method==="DELETE"&&(/^\/account\/api-keys\/[A-Za-z0-9]{8,64}$/.test(endpoint)||/^\/account\/ssh-keys\/(?:[A-Za-z0-9_-]|%[0-9A-F]{2}){8,384}$/i.test(endpoint));
  }
  const numeric = "[1-9]\\d{0,14}", guid = "[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}";
  const patterns: Record<string,string[]> = {
    GET:["", "/resources", "/websocket", "/activity", "/files/(list|contents|download|upload)", "/databases", "/schedules(?:/"+numeric+")?", "/users(?:/"+guid+")?", "/backups(?:/"+guid+"(?:/download)?)?", "/network/allocations", "/startup"],
    POST:["/command", "/power", "/files/(copy|write|compress|decompress|delete|create-folder|chmod|pull)", "/databases(?:/"+numeric+"/rotate-password)?", "/schedules(?:/"+numeric+"(?:/execute|/tasks(?:/"+numeric+")?)?)?", "/users(?:/"+guid+")?", "/backups(?:/"+guid+"/(lock|restore))?", "/network/allocations(?:/"+numeric+"(?:/primary)?)?", "/settings/(rename|description|reinstall)"],
    PUT:["/files/rename", "/backups/"+guid+"/rename", "/startup/variable", "/settings/docker-image"],
    DELETE:["/databases/"+numeric, "/schedules/"+numeric+"(?:/tasks/"+numeric+")?", "/users/"+guid, "/backups/"+guid, "/network/allocations/"+numeric],
  };
  return (patterns[method] ?? []).some(pattern => new RegExp("^"+pattern+"$","i").test(endpoint));
}

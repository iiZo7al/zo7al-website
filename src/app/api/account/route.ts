import { AccountError, accountConfigured, accountHeaders, accountOrigin, accountSession, accountRequiresMFA, accountView, authRequest, clearAccount, requestCookie, requireAccount, setAccountTokens, startAccountFlow, ACCOUNT_ACCESS, type AuthUser } from '@/lib/server/account-auth';
import { ACCOUNT_PROVIDERS, accountEmail, accountPassword, safeAccountName } from '@/lib/data/account';
import { readJSON } from '@/lib/server/site-security';
import { limitAttempt } from '@/lib/server/site-content';
import { siteDatabase } from '@/lib/server/site-db';
import { LOCALES } from '@/i18n/config';
export const runtime='nodejs';
export const dynamic='force-dynamic';
function failed(error:unknown,headers:Headers) { return Response.json({error:error instanceof AccountError?error.code:'UNAVAILABLE'},{status:error instanceof AccountError?error.status:503,headers}); }
export async function GET(request:Request) {
  const headers=accountHeaders();
  try {
    if (!accountConfigured()) return Response.json({configured:false,account:null,providers:[],email:false},{headers});
    const [session,settings]=await Promise.all([accountSession(request,headers),authRequest('/settings')]);
    const mfaRequired=!!session&&accountRequiresMFA(session.user,session.access);
    return Response.json({configured:true,account:session&&!mfaRequired?await accountView(session.user):null,mfaRequired,mfaEnabled:process.env.ZO7AL_ACCOUNT_MFA_ENABLED==='true'||!!session?.user.factors?.some(f=>f.factor_type==='totp'&&f.status==='verified'),providers:ACCOUNT_PROVIDERS.filter(p=>settings.external?.[p]),email:settings.external?.email===true},{headers});
  } catch(error){return failed(error,headers);}
}
export async function POST(request:Request) {
  const headers=accountHeaders();
  try {
    if(!accountOrigin(request))throw new AccountError('INVALID',403);
    if(!accountConfigured())throw new AccountError('CONFIGURATION',503);
    const body=await readJSON(request,4096) as Record<string,unknown>;
    if(!body||typeof body.action!=='string')throw new AccountError('INVALID');
    const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()??'unknown';
    if(!await limitAttempt('account:'+ip,20,900))throw new AccountError('RATE_LIMIT',429);
    if(['signin','signup','recover'].includes(body.action)) {
      const email=accountEmail(body.email);if(!email)throw new AccountError('INVALID');
      if(body.action==='signin') {
        if(typeof body.password!=='string'||body.password.length>128)throw new AccountError('CREDENTIALS');
        const tokens=await authRequest('/token?grant_type=password','POST',{email,password:body.password});
        const user=await authRequest('/user','GET',undefined,tokens.access_token) as AuthUser;
        setAccountTokens(tokens,headers);
        return Response.json({ok:true,mfaRequired:accountRequiresMFA(user,tokens.access_token!)},{headers});
      }
      if(body.action==='signup'&&!accountPassword(body.password))throw new AccountError('PASSWORD');
      const flow=await startAccountFlow(request,headers,body.action,body.next);
      const result=await authRequest((body.action==='signup'?'/signup':'/recover')+'?redirect_to='+encodeURIComponent(flow.redirectTo),'POST',{email,...(body.action==='signup'?{password:body.password}:{}),code_challenge:flow.code_challenge,code_challenge_method:flow.code_challenge_method});
      if(result.access_token)setAccountTokens(result,headers);
      return Response.json({ok:true,message:result.access_token?'SIGNED_IN':'EMAIL_SENT'},{headers});
    }
    if(['oauth','link'].includes(body.action)) {
      if(!ACCOUNT_PROVIDERS.some(provider=>provider===body.provider))throw new AccountError('INVALID');
      const settings=await authRequest('/settings');if(!settings.external?.[String(body.provider)])throw new AccountError('PROVIDER');
      const user=body.action==='link'?await requireAccount(request):null;
      const flow=await startAccountFlow(request,headers,body.action,body.next,user?.id??null);
      const params=new URLSearchParams({provider:String(body.provider),redirect_to:flow.redirectTo,code_challenge:flow.code_challenge,code_challenge_method:flow.code_challenge_method,...(body.action==='link'?{skip_http_redirect:'true'}:{})});
      if(body.provider==='azure')params.set('scopes','email');
      const url=body.action==='link'?(await authRequest('/user/identities/authorize?'+params,'GET',undefined,requestCookie(request,ACCOUNT_ACCESS))).url:process.env.SUPABASE_URL!.replace(/\/$/,'')+'/auth/v1/authorize?'+params;
      if(!url||new URL(url).protocol!=='https:')throw new AccountError('PROVIDER');
      return Response.json({url},{headers});
    }
    if(body.action==='signout') {
      const access=requestCookie(request,ACCOUNT_ACCESS);
      if(access) { try { await authRequest('/logout?scope=local','POST',{},access); } catch(error) { if(!(error instanceof AccountError)||error.code!=='AUTH_EXPIRED')throw error; } }
      clearAccount(headers);return Response.json({ok:true},{headers});
    }
    const user=await requireAccount(request);
    if(body.action==='settings') {
      const name=safeAccountName(body.name);if(!name||!LOCALES.includes(String(body.locale) as typeof LOCALES[number]))throw new AccountError('INVALID');
      await accountView(user);
      await (await siteDatabase()).query('UPDATE site_accounts SET name=$2,locale=$3,updated_at=now() WHERE id=$1',[user.id,name,body.locale]);
      return Response.json({ok:true},{headers});
    }
    if(body.action==='password') {
      if(!accountPassword(body.password))throw new AccountError('PASSWORD');
      // Supabase's secure password change/reauthentication policy remains authoritative.
      await authRequest('/user','PUT',{password:body.password,...(typeof body.nonce==='string'?{nonce:body.nonce}:{})},requestCookie(request,ACCOUNT_ACCESS));
      return Response.json({ok:true},{headers});
    }
    if(body.action==='reauthenticate') { await authRequest('/reauthenticate','GET',undefined,requestCookie(request,ACCOUNT_ACCESS));return Response.json({ok:true,message:'EMAIL_SENT'},{headers}); }
    if(body.action==='unlink') {
      const identity=user.identities?.find(v=>(v.identity_id??v.id)===body.identityId);
      if(!identity||(user.identities?.length??0)<2)throw new AccountError('INVALID');
      await authRequest('/user/identities/'+encodeURIComponent(identity.identity_id??identity.id),'DELETE',undefined,requestCookie(request,ACCOUNT_ACCESS));
      return Response.json({ok:true},{headers});
    }
    throw new AccountError('INVALID');
  } catch(error){return failed(error,headers);}
}

const API_ORIGIN='https://xbraid-public-rankings-2026.hirotoyoda16.chatgpt.site';
export function serverResetDelay(data){const next=Date.parse(data.nextResetAt),now=Date.parse(data.serverNow);if(!Number.isFinite(next)||!Number.isFinite(now)||next<=now)return 1000;return Math.min(86401000,Math.max(1000,next-now+150));}
/** Per-attempt capability stays in memory; no account, cookie or persistent login is used. */
export function createRankingClient({fetcher=fetch,uuid=()=>crypto.randomUUID(),origin=API_ORIGIN}={}){
 const capabilities=new Map();
 async function call(path,method,body,token){
  const response=await fetcher(origin+path,{method,credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{Accept:'application/json',...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json().catch(()=>null);
  if(!response.ok){const error=new Error(data?.error?.message||data?.message||'ランキングに接続できませんでした。時間をおいて再度お試しください。');error.status=response.status;error.code=data?.error?.code;throw error;}
  return data;
 }
 async function issue(original){
  let id=original;
  for(let attempt=0;attempt<2;attempt++){
   try{const data=await call('/api/attempts','POST',{attemptId:id});if(data?.attemptId!==id||typeof data.token!=='string'||!data.token)throw new Error('登録の準備ができませんでした。');return {attemptId:id,token:data.token};}
   catch(error){if(attempt===1||error.status===429||error.status===403||error.status===400)throw error;id=uuid();}
  }
 }
 function ensure(id){if(!capabilities.has(id)){const pending=issue(id).catch(error=>{capabilities.delete(id);throw error;});capabilities.set(id,pending);}return capabilities.get(id);}
 async function request(method='GET',payload){
  const id=payload?.attemptId;
  let capability;
  if(method==='POST')capability=await ensure(id);
  else if(id){if(!capabilities.has(id))throw new Error('この参加の管理情報が見つかりません。記録は今日の共有ランキングから確認できます。');capability=await capabilities.get(id);}
  const body=method==='GET'?undefined:{...payload,...(capability?{attemptId:capability.attemptId}:{})};
  const query=method==='GET'&&capability?`?attemptId=${encodeURIComponent(capability.attemptId)}`:'';
  const data=await call('/api/rankings'+query,method,body,capability?.token);
  if(!data||!Array.isArray(data.entries))throw new Error('ランキングを読み込めませんでした。');
  if(method==='DELETE'&&id)capabilities.delete(id);
  return data;
 }
 return {request,forget(){capabilities.clear();}};
}
const client=createRankingClient();
export const rankingRequest=(method,payload)=>client.request(method,payload);
export const forgetRankingCapabilities=()=>client.forget();

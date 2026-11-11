import {rankingRequest,serverResetDelay} from './ranking-api.mjs?v=20261111.4-gh';
export function createLeaderboard({doc=document,request=rankingRequest,setTimer=setTimeout,clearTimer=clearTimeout}={}){
 const $=id=>doc.getElementById(id);let data={entries:[],ownEntry:null,scope:null,day:null},status='ランキングを読み込み中…',error=false,resetTimer=null,generation=0,pending=null,activeAttempt=null,participation=0,savePromise=null,completed=null;
 function render(){
  const scope=data.scope==='preview'?'ローカル検証用ランキング':'今日の共有ランキング';
  for(const id of ['rankingScope','rankingDialogScope'])$(id).textContent=scope;
  for(const id of ['rankingDay','rankingDialogDay'])$(id).textContent=data.day?`${data.day.replaceAll('-','/')} · 日本時間`:'サーバーの日付を確認中';
  for(const id of ['rankingList','leaderboardDialogList']){const list=$(id);list.replaceChildren();if(!data.entries.length){const row=doc.createElement('li');row.className='empty';row.textContent=error?'読み込みできません。下の更新ボタンで再試行できます。':'今日の記録はまだありません。\n最初のキャッチを目指そう！';list.append(row);}else for(const entry of data.entries.slice(0,10)){const row=doc.createElement('li'),place=doc.createElement('span'),name=doc.createElement('strong'),value=doc.createElement('span'),unit=doc.createElement('small');place.className='ranking-place';place.textContent=String(entry.rank);name.className='ranking-nickname';name.textContent=entry.nickname;value.className='ranking-value';value.textContent=(entry.ms/1000).toFixed(3);unit.textContent='秒';value.append(unit);row.append(place,name,value);list.append(row);}}
  for(const id of ['rankingStatus','rankingDialogStatus']){$(id).textContent=status;$(id).dataset.error=String(error);}
  $('rankingDelete').hidden=!activeAttempt;$('rankingSaveRetry').hidden=!pending;
 }
 function apply(next){data=next;clearTimer(resetTimer);resetTimer=setTimer(()=>{activeAttempt=null;data={...data,entries:[],ownEntry:null,day:null};status='日付が変わりました。今日のランキングを更新中…';render();refresh();},serverResetDelay(next));}
 async function refresh(){const token=++generation;error=false;status='ランキングを更新中…';render();try{const next=await request('GET');if(token!==generation)return;apply(next);status=next.scope==='preview'?'これはローカル検証用の記録です。本番には保存されません。':'毎日0:00（日本時間）にリセット。参加1回ごとに、2回中の最速タイムを登録。';}catch(e){if(token!==generation)return;error=true;status=e.message;}render();}
 async function save(payload){const context=participation;pending=null;error=false;status='今日のランキングへ登録中…';render();try{const next=await request('POST',payload);generation++;apply(next);if(context===participation)activeAttempt=payload.attemptId;status=next.scope==='preview'?'検証用ランキングに登録しました。本番の記録には入りません。':next.updated?'今日のランキングに記録を保存しました。':'この参加の記録は登録済みです。';}catch(e){error=true;status=e.message;if(context===participation)pending=payload;}render();}
 function complete(player,bestMs){completed={player,bestMs};if(bestMs===null){status='釣り上げ成功がないため、今回はランキング登録なし。';error=false;render();return;}if(!player?.consent){status='今回は共有ランキングへ登録していません。';error=false;render();return;}savePromise=save({attemptId:player.attemptId,nickname:player.nickname,bestMs:Math.round(Number((bestMs/1000).toFixed(3))*1000),consent:true});}
 for(const id of ['rankingRefresh','rankingDialogRefresh'])$(id).addEventListener('click',refresh);
 $('rankingSaveRetry').addEventListener('click',()=>{if(pending)savePromise=save(pending);});
 $('rankingDelete').addEventListener('click',async()=>{if(!activeAttempt||!confirm('この参加で登録したニックネームとタイムを削除しますか？ほかの参加記録は消えません。この操作は取り消せません。'))return;const attemptId=activeAttempt;try{const next=await request('DELETE',{attemptId});generation++;apply(next);activeAttempt=null;pending=null;if(completed)completed={...completed,deleted:true};error=false;status='この参加の登録を削除しました。';}catch(e){error=true;status=e.message;}render();});
 doc.addEventListener('visibilitychange',()=>{if(!doc.hidden)refresh();});
 async function presentation(){
  const context=participation;await savePromise;
  const item=completed;
  let state=item?.bestMs==null?'no_score':!item.player?.consent||item.deleted?'unregistered':activeAttempt?'saved':'error';
  try{const next=await request('GET',state==='saved'?{attemptId:activeAttempt}:undefined);if(context!==participation)return {status:'error',entries:[],ownAttempt:null,message:'参加が切り替わりました。'};generation++;apply(next);error=false;render();return {...next,status:state,nickname:item?.player?.nickname||'',bestMs:item?.bestMs??null,ownAttempt:state==='saved'?next.ownAttempt:null,message:state==='error'?status:''};}
  catch(e){error=true;status=e.message;render();return {status:'error',entries:[],ownAttempt:null,day:data.day,scope:data.scope,message:e.message};}
 }
 render();return {refresh,complete,presentation,destroy(){clearTimer(resetTimer);},resetPending(){participation++;activeAttempt=null;pending=null;completed=null;savePromise=null;render();}};
}

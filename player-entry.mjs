export function normalizeNickname(value){
 const controls=value=>/[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u.test(value.replace(/[\u200c\u200d]/gu,''));
 if(typeof value!=='string'||value.length>1024||controls(value))return {error:'ニックネームは1〜16文字で入力してください。制御文字は使えません。'};
 const nickname=value.normalize('NFKC').replace(/\p{Zs}+/gu,' ').trim();
 const count=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(nickname)].length:[...nickname].length;
 if(!nickname||count>16||!/[\p{L}\p{N}\p{S}\p{P}]/u.test(nickname))return {error:'ニックネームは1〜16文字で入力してください。'};
 if(controls(nickname)||/[<>]/u.test(nickname)||/(?:@|:\/\/|www\.|(?:[\p{L}\p{N}-]+\.)+[\p{L}]{2,})/iu.test(nickname))return {error:'本名・連絡先ではなく、ニックネームをご利用ください。'};
 return {nickname};
}
export function createPlayerEntry({doc=document}={}){
 const dialog=doc.createElement('dialog');dialog.className='player-entry';dialog.id='playerEntry';dialog.setAttribute('aria-labelledby','playerEntryTitle');
 dialog.innerHTML=`<button type="button" class="dialog-close" aria-label="名前入力を閉じる">×</button><span class="eyebrow">READY TO FISH?</span><h2 id="playerEntryTitle">名前を決めて、<br>海へ出よう！</h2><p class="player-entry-lead">ゲームで使うニックネームを入力してください。</p><form><label class="nickname-label" for="nicknameInput">ニックネーム <small>1〜16文字</small></label><input id="nicknameInput" name="nickname" type="text" maxlength="40" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="例：つりマスター" required aria-describedby="nicknameNote nicknameError"><p id="nicknameNote" class="nickname-note">本名・メールアドレス・電話番号は入力しないでください。</p><p id="nicknameError" class="nickname-error" role="alert" hidden></p><label class="ranking-consent"><input id="rankingConsent" type="checkbox"><span>ニックネームと最速タイムを<br><strong>当日の共有ランキングへ登録する</strong></span></label><p class="consent-note">登録すると、ニックネームとタイムがインターネット上に公開されます。<br>チェックなしでも遊べます。参加1回ごとに記録を登録。<br>毎日0:00（日本時間）にリセット。</p><details class="ranking-privacy"><summary>保存内容について</summary><p>同意した場合だけ、ニックネーム・タイム・日付・参加識別子を公開版専用サーバーに保存します。メールアドレスやログイン情報は収集しません。記録を管理するランダムな情報は、この画面を開いている間だけ保持します。結果画面の上部「BEST」から今回の記録を削除できます。終了・再読み込み後はこの操作ができなくなります。日本時間で日付が変わると以前の記録は非表示になり、サーバー上の期限切れデータは順次削除されます。不正利用防止のため、日替わりの接続元識別情報をサーバーで一時使用します。端末の自己ベストはこのブラウザ内だけに保存します。</p></details><button class="primary-button player-start" type="submit">この名前でスタート <span aria-hidden="true">→</span></button></form>`;
 doc.body.append(dialog);const input=dialog.querySelector('#nicknameInput'),consent=dialog.querySelector('#rankingConsent'),error=dialog.querySelector('#nicknameError');let onStart=null,restoreFocus=null;
 function close(){if(dialog.open)dialog.close();onStart=null;restoreFocus?.focus?.({preventScroll:true});}
 dialog.querySelector('.dialog-close').addEventListener('click',close);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.querySelector('form').addEventListener('submit',event=>{event.preventDefault();const checked=normalizeNickname(input.value);if(checked.error){error.textContent=checked.error;error.hidden=false;input.focus();return;}const start=onStart;const player={nickname:checked.nickname,consent:consent.checked};dialog.close();onStart=null;start?.(player);});
 input.addEventListener('input',()=>{error.hidden=true;});
 return {open({nickname='',onStart:start}={}){restoreFocus=doc.activeElement;onStart=start;input.value=nickname;consent.checked=false;error.hidden=true;dialog.showModal();input.focus({preventScroll:true});},close};
}

/** Verified official REAL dtex X8 artwork; this is a sample event product selection. */
export function createProductSpotlight({doc=document}={}) {
  const dialog=doc.createElement('dialog');let onFinish=null;
  dialog.id='productSpotlight';dialog.className='product-spotlight';
  dialog.setAttribute('aria-labelledby','spotlightTitle');
  dialog.setAttribute('aria-describedby','spotlightNote');
  dialog.innerHTML=`
    <div class="spotlight-shell">
      <button class="spotlight-close" aria-label="新商品紹介を閉じる">×</button>
      <div class="spotlight-brand"><img src="assets/xbraid-official.svg?v=20261111.4-gh" alt="XBRAID" width="630" height="94"></div>
      <p class="spotlight-eyebrow">NEW PRODUCT · SAMPLE</p>
      <h2 id="spotlightTitle"><small>XBRAID 新商品紹介</small>REAL dtex <em>X8</em></h2>
      <p class="spotlight-japanese">リアルデシテックスX8</p>
      <div class="spotlight-product">
        <span class="spotlight-orbit orbit-one"></span><span class="spotlight-orbit orbit-two"></span>
        <span class="spotlight-spark spark-one">✦</span><span class="spotlight-spark spark-two">✧</span>
        <img class="spotlight-official-product" src="assets/realdtex/realdtex.png?v=20261111.4-gh" alt="REAL dtex X8の公式商品パッケージ" width="700" height="700">
        <span class="spotlight-tag">NEW<br><b>REAL dtex X8</b></span>
      </div>
      <div class="spotlight-description"><span class="spotlight-placeholder-label">新商品紹介サンプル</span><p id="spotlightNote">ライトゲーム向けの8本組PEライン。<br>今回の紹介商品は仮採用です。</p><a class="spotlight-official-link" href="https://xbraidygk.jp/products/realdtex/" target="_blank" rel="noopener noreferrer">公式で商品を見る ↗</a></div>
      <button class="spotlight-result" autofocus>終了して待機画面へ <span aria-hidden="true">→</span></button>
    </div>`;
  doc.body.append(dialog);
  const closeButton=dialog.querySelector('.spotlight-close');
  const resultButton=dialog.querySelector('.spotlight-result');
  function close(){onFinish=null;if(dialog.open)dialog.close();doc.body.classList.remove('product-spotlight-open');}
  function dismiss(){const callback=onFinish;onFinish=null;close();callback?.();}
  function open({onFinish:finish,continueLabel}={}){if(dialog.open)return;onFinish=finish||null;resultButton.innerHTML=(continueLabel||(onFinish?'終了して待機画面へ':'結果画面に戻る'))+' <span aria-hidden="true">→</span>';dialog.showModal();doc.body.classList.add('product-spotlight-open');resultButton.focus({preventScroll:true});}
  closeButton.addEventListener('click',dismiss);resultButton.addEventListener('click',dismiss);
  dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
  dialog.addEventListener('close',()=>{if(!dialog.open){const callback=onFinish;onFinish=null;doc.body.classList.remove('product-spotlight-open');if(callback)callback();else doc.getElementById('retryButton')?.focus({preventScroll:true});}});
  return Object.freeze({open,close,isOpen:()=>dialog.open});
}

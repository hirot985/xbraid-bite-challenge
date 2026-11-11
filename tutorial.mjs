import {getPose,transformArmPoint} from './motion.mjs?v=20261111.4-gh';
import {ROUND_COUNT} from './challenge.mjs?v=20261111.4-gh';
import {FIGHT_START_DISTANCE} from './engine.mjs?v=20261111.4-gh';
import { getTutorialFrame } from './tutorial-timeline.mjs?v=20261111.4-gh';
export { getTutorialFrame, tutorialPhaseStart, TUTORIAL_PHASES } from './tutorial-timeline.mjs?v=20261111.4-gh';

const asset = path => new URL(`./assets/${path}`, import.meta.url).href;
const COPY = Object.freeze({
  waiting: { title: 'まずは、アタリを待とう。', bubble: 'しゃくって、さそって…\nBite! はいつ来るかな？', detail: 'まだタップしないでね。合図の前に押すと「お手つき」！', cue: 'アタリ待ち…' },
  bite: { title: 'Bite! が出たら、すぐタップ！', bubble: '合図から1秒以内に\n画面をタップ！', detail: 'Bite! から最初のタップまでが、あなたの反応タイム。', cue: 'Bite!' },
  reel: { title: 'ヒットしたら、連打で巻こう！', bubble: 'タップ！ タップ！\n0mまで巻き取ろう！', detail: '画面のどこでも連打。ゲージが左の0mに近づけば成功！', cue: '連打で巻き取り！' },
  catch: { title: '釣れたら、連打をストップ！', bubble: '釣り上げ成功！\n手を止めて「結果を見る」', detail: '0mで釣れたら連打を止めて、「結果を見る」を押してね。巻き取り時間はスコアに含みません。', cue: 'STOP TAPPING' },
  slack: { title: 'もし、連打を止めたら…', bubble: 'あれれ… タップしないと\n魚がどんどん遠くへ！', detail: `別の例：${FIGHT_START_DISTANCE}mから放置。100mまで離れると逃げてしまうよ。`, cue: 'タップなしの例' },
  escape: { title: '100mで逃走。この回は対象外。', bubble: '逃げちゃった！\n最後まで連打がだいじ！', detail: '反応が速くても、釣り上げられなければスコアには入りません。', cue: 'ESCAPE…' },
  summary: { title: `${ROUND_COUNT}回チャレンジして、最速を！`, bubble: '速くタップして、\n最後まで釣り上げよう！', detail: '次はニックネームの入力です。準備ができたらどうぞ！', cue: 'READY?', next: '名前を入力してスタート →' },
});
let nextId = 0;

/**
 * const tutorial = createTutorial(); // Also link ./tutorial.css in your page.
 * tutorial.open({ onStart: () => requestPlayerName(), onComplete: markTutorialComplete, onClose: () => {} });
 * The full automatic timeline is required. Only its summary enables Start.
 * onComplete fires once per open, only when the timeline reaches the summary.
 * Final Start closes first and invokes onStart once; Esc/×/close never do.
 * open() while already open is a no-op. replay() restarts the required timeline.
 * No localStorage is written, and no game clock or real pointer input is used.
 */
export function createTutorial() {
  const doc = document, win = doc.defaultView || window;
  const id = `xbraid-tutorial-${++nextId}`;
  const dialog = doc.createElement('dialog');
  dialog.className = 'xbt-dialog';
  dialog.setAttribute('aria-labelledby', `${id}-title`);
  dialog.setAttribute('aria-describedby', `${id}-desc`);
  dialog.innerHTML = `
    <div class="xbt-shell">
      <header class="xbt-header">
        <div><span class="xbt-eyebrow">HOW TO PLAY</span><h2 id="${id}-title">20秒でわかる、遊び方。</h2></div>
        <button type="button" class="xbt-close" data-tutorial="close" aria-label="遊び方を閉じる">×</button>
      </header>
      <p class="xbt-desc" id="${id}-desc">操作不要。最後まで見てから、名前を入力してスタート。</p>
      <ol class="xbt-steps" aria-label="遊び方のステップ">
        <li>1 待つ</li><li>2 タップ</li><li>3 連打</li><li>4 注意</li><li>5 本番</li>
      </ol>
      <div class="xbt-scene" aria-hidden="true" data-phase="waiting">
        <img class="xbt-ocean" src="${asset('ocean-background.png?v=20261111.4-gh')}" alt="" draggable="false">
        <div class="xbt-angler"><img class="xbt-sprite" src="${asset('angler-sprite.png?v=20261111.4-gh')}" alt="" draggable="false"><img class="xbt-arms" src="${asset('angler-arms-source.png?v=20261111.4-gh')}" alt="" draggable="false"><svg class="xbt-rod" viewBox="0 0 1024 1536"><path/><path class="xbt-rod-shine"/><g>${Array.from({length:5},()=>'<path class="xbt-guide"/>').join('')}</g></svg><span class="xbt-cap-patch"><img src="${asset('xbraid-official.svg?v=20261111.4-gh')}" alt="" draggable="false"></span></div>
        <svg class="xbt-line" viewBox="0 0 320 250" preserveAspectRatio="none"><path d="M224 24 Q242 85 254 190"/></svg>
        <span class="xbt-jig"></span><span class="xbt-ripple"></span>
        <div class="xbt-bubble"></div>
        <span class="xbt-demo">DEMO <b>操作不要</b></span>
        <div class="xbt-fish"><img src="${asset('fish/tai.png?v=20261111.4-gh')}" alt="" draggable="false"></div>
        <div class="xbt-cue"></div>
        <div class="xbt-finger" data-mode="once">
          <span class="xbt-tap-ring"></span>
          <svg viewBox="0 0 80 110"><path d="M26 50V15c0-12 17-12 17 0v28c6-5 13-1 13 5 6-4 13 0 13 6 6-2 10 2 10 9l-3 21c-2 10-9 16-20 16H40c-10 0-15-5-19-12L8 66c-5-9 7-18 14-9l4 6V50Z" fill="#ffe1a5" stroke="#794c32" stroke-width="4" stroke-linejoin="round"/><path d="M42 47v18m14-14v16m13-9v13" fill="none" stroke="#ce9465" stroke-width="3" stroke-linecap="round"/></svg>
          <span class="xbt-hand-label">TAP!</span>
        </div>
        <div class="xbt-reaction"><span>反応の例</span><strong>0.350<small>秒</small></strong></div>
        <div class="xbt-escape-mark">×</div>
      </div>
      <div class="xbt-meter" hidden>
        <div class="xbt-meter-head"><span>魚までの距離 <small>デモ・早送り</small></span><strong>${FIGHT_START_DISTANCE} <small>m</small></strong></div>
        <div class="xbt-meter-track"><i></i><b></b></div>
        <div class="xbt-meter-ends"><span>0m 釣り上げ！</span><span>100m 逃げる</span></div>
      </div>
      <div class="xbt-summary" hidden>
        <div class="xbt-rounds">${Array.from({length:ROUND_COUNT},(_,i)=>`<span>${i+1}回目</span>`).join('')}</div>
        <p>釣り上げ成功した回の<br><strong>いちばん速いBite反応</strong>がスコア！</p>
        <small>巻き取り時間は含みません · 全2回ミスなら記録なし</small>
      </div>
      <div class="xbt-explanation" role="status" aria-live="polite" aria-atomic="true"><h3></h3><p></p></div>
      <footer class="xbt-footer">
        <button type="button" class="xbt-replay" data-tutorial="replay" aria-label="遊び方のデモを最初からもう一度見る">↻ もう一度</button>
        <button type="button" class="xbt-next" data-tutorial="next" disabled>デモ再生中…</button>
      </footer>
    </div>`;
  doc.body.append(dialog);
  const $ = selector => dialog.querySelector(selector);
  const ui = {
    arms: $('.xbt-arms'), rod: $('.xbt-rod'), scene: $('.xbt-scene'), bubble: $('.xbt-bubble'), cue: $('.xbt-cue'), angler: $('.xbt-angler'),
    jig: $('.xbt-jig'), line: $('.xbt-line path'), fish: $('.xbt-fish'), finger: $('.xbt-finger'),
    handLabel: $('.xbt-hand-label'), reaction: $('.xbt-reaction'), meter: $('.xbt-meter'),
    meterNumber: $('.xbt-meter-head strong'), meterFill: $('.xbt-meter-track i'), meterMarker: $('.xbt-meter-track b'),
    summary: $('.xbt-summary'), heading: $('.xbt-explanation h3'), detail: $('.xbt-explanation p'),
    next: $('[data-tutorial="next"]'), steps: [...dialog.querySelectorAll('.xbt-steps li')],
  };
  const media = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  let opened = false, options = null, frameId = null, origin = 0, offset = 0;
  let waitingMs = 3500, lastPhase = '', restoreFocus = null, paused = false;
  let readyToStart = false, completionNotified = false;
  const now = () => win.performance.now();
  const stop = () => { if (frameId !== null) win.cancelAnimationFrame(frameId); frameId = null; };
  const currentTime = () => offset + (paused ? 0 : now() - origin);
  function render(ms) {
    const frame = getTutorialFrame(ms, { waitingMs, reducedMotion: Boolean(media?.matches) });
    const copy = COPY[frame.phase];
    if (frame.phase !== lastPhase) {
      lastPhase = frame.phase;
      ui.scene.dataset.phase = frame.phase;
      ui.bubble.textContent = copy.bubble;
      ui.cue.textContent = copy.cue;
      ui.heading.textContent = copy.title;
      ui.detail.textContent = copy.detail;
      ui.next.textContent = frame.complete ? copy.next : 'デモ再生中…';
      ui.next.disabled = !readyToStart;
      ui.next.classList.toggle('xbt-start', frame.complete);
      ui.summary.hidden = !frame.complete;
      ui.meter.hidden = frame.distance === null;
      ui.steps.forEach((step, index) => {
        step.dataset.active = String(index === frame.step);
        if (index === frame.step) step.setAttribute('aria-current', 'step');
        else step.removeAttribute('aria-current');
      });
    }
    ui.scene.dataset.tapped = String(frame.tapped);
    ui.scene.dataset.pulse = String(frame.tapPulse);
    ui.scene.dataset.reduced = String(Boolean(media?.matches));
    const rig=getPose(['reel','slack'].includes(frame.phase)?'fighting':frame.phase==='waiting'?'waiting':'ready',frame.phaseElapsedMs,Boolean(media?.matches));
    ui.arms.style.setProperty('--arm-r',`${rig.angle}deg`);ui.rod.style.setProperty('--arm-r',`${rig.angle}deg`);
    for(const path of ui.rod.querySelectorAll('path:not(.xbt-guide)'))path.setAttribute('d',`M423 650C${rig.rodC1X} ${rig.rodC1Y} ${rig.rodC2X} ${rig.rodC2Y} ${rig.rodTipX} ${rig.rodTipY}`);
    for(const [index,guide] of [...ui.rod.querySelectorAll('.xbt-guide')].entries()){
      const t=[.04,.25,.48,.73,.96][index],u=1-t;
      const x=u*u*u*423+3*u*u*t*rig.rodC1X+3*u*t*t*rig.rodC2X+t*t*t*rig.rodTipX;
      const y=u*u*u*650+3*u*u*t*rig.rodC1Y+3*u*t*t*rig.rodC2Y+t*t*t*rig.rodTipY;
      const vx=3*u*u*(rig.rodC1X-423)+6*u*t*(rig.rodC2X-rig.rodC1X)+3*t*t*(rig.rodTipX-rig.rodC2X);
      const vy=3*u*u*(rig.rodC1Y-650)+6*u*t*(rig.rodC2Y-rig.rodC1Y)+3*t*t*(rig.rodTipY-rig.rodC2Y);
      const length=Math.hypot(vx,vy)||1,nx=-vy/length*10,ny=vx/length*10;
      guide.setAttribute('d',`M${x-nx} ${y-ny}L${x+nx} ${y+ny}`);
    }
    ui.jig.style.top = `${frame.jigY / 2.5}%`;
    ui.jig.style.opacity = frame.phase === 'waiting' && frame.jigY < 194 ? '1' : '0';
    ui.jig.style.clipPath = `inset(0 0 ${Math.max(0, Math.min(100, (frame.jigY + 24 - 194) / 24 * 100))}% 0)`;
    ui.finger.hidden = !frame.finger;
    ui.finger.dataset.mode = frame.fingerMode;
    ui.handLabel.textContent = frame.fingerMode === 'idle' ? 'STOP' : frame.fingerMode === 'repeat' ? '連打！' : 'TAP!';
    ui.fish.hidden = !frame.fishVisible;
    ui.fish.style.top = `${frame.fishY / 2.5}%`;
    ui.fish.style.transform = `translate(-50%, -50%) rotate(${frame.fishAngle}deg)`;
    ui.reaction.hidden = !(frame.tapped || ['reel', 'catch'].includes(frame.phase));
    const lineEndY = frame.fishVisible ? frame.fishY - 52 : Math.min(194, frame.jigY);
    const tip=transformArmPoint(rig,rig.rodTipX,rig.rodTipY);
    const ar=ui.angler.getBoundingClientRect(),sr=ui.scene.getBoundingClientRect();
    const tx=((ar.left-sr.left)+tip.x/1024*ar.width)/sr.width*320,ty=((ar.top-sr.top)+tip.y/1536*ar.height)/sr.height*250;
    ui.line.setAttribute('d', `M${tx} ${ty} Q${(tx+254)/2} ${(ty+lineEndY)/2} 254 ${lineEndY}`);
    if (frame.distance !== null) {
      ui.meterNumber.innerHTML = `${frame.distance} <small>m</small>`;
      ui.meterFill.style.width = `${frame.distance}%`;
      ui.meterMarker.style.left = `${frame.distance}%`;
      ui.meter.dataset.danger = String(frame.distance >= 80);
      ui.meter.setAttribute('aria-label', `デモの魚までの距離${frame.distance}メートル。0で釣り上げ、100で逃げます。`);
    }
    return frame;
  }
  function tick() {
    frameId = null;
    if (!opened || paused) return;
    const frame = render(currentTime());
    if (frame.complete) {
      readyToStart = true;
      ui.next.disabled = false;
      if (!completionNotified) {
        completionNotified = true;
        options?.onComplete?.();
      }
    } else if (opened && !paused) frameId = win.requestAnimationFrame(tick);
  }
  function replay() {
    if (!opened) return;
    waitingMs = 3000 + Math.round(Math.random() * 1200);
    stop();
    readyToStart = false;
    lastPhase = '';
    offset = 0; origin = now();
    render(0);
    if (!paused) frameId = win.requestAnimationFrame(tick);
  }
  function finish(start) {
    if (!opened || (start && !readyToStart)) return;
    opened = false; stop();
    const callback = start ? options?.onStart : options?.onClose;
    options = null;
    if (dialog.open) dialog.close();
    if (restoreFocus?.isConnected && typeof restoreFocus.focus === 'function') restoreFocus.focus({ preventScroll: true });
    restoreFocus = null;
    callback?.();
  }
  function open({ onStart, onComplete, onClose } = {}) {
    if (opened) return;
    if (typeof onStart !== 'function') throw new TypeError('createTutorial.open requires an onStart callback');
    options = { onStart, onComplete, onClose };
    completionNotified = false;
    restoreFocus = doc.activeElement;
    opened = true; paused = doc.hidden;
    try { dialog.showModal(); }
    catch (error) { opened = false; options = null; restoreFocus = null; throw error; }
    replay();
    $('[data-tutorial="close"]').focus({ preventScroll: true });
  }
  function onVisibility() {
    if (!opened) return;
    if (doc.hidden && !paused) { offset = currentTime(); paused = true; stop(); }
    else if (!doc.hidden && paused) { paused = false; origin = now(); tick(); }
  }
  dialog.addEventListener('click', event => {
    const button = event.target.closest?.('[data-tutorial]');
    if (!button || !dialog.contains(button)) return;
    const action = button.dataset.tutorial;
    if (action === 'close') finish(false);
    else if (action === 'replay') replay();
    else if (action === 'next' && readyToStart && lastPhase === 'summary') finish(true);
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); finish(false); });
  // Guard programmatic native dialog.close(), while ignoring delayed close events
  // from our own finish() if a consumer immediately reopens the same tutorial.
  dialog.addEventListener('close', () => { if (opened && !dialog.open) finish(false); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish(false); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button')].filter(button => !button.hidden && !button.disabled && button.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  doc.addEventListener('visibilitychange', onVisibility);
  const onMotionChange = () => { if (opened) render(currentTime()); };
  media?.addEventListener?.('change', onMotionChange);
  return Object.freeze({
    open, close: () => finish(false), isOpen: () => opened, replay,
    destroy() { finish(false); stop(); doc.removeEventListener('visibilitychange', onVisibility); media?.removeEventListener?.('change', onMotionChange); dialog.remove(); },
  });
}

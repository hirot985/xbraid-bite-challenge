/** A result-only ranking presentation. The caller supplies the current attempt rank. */
export function createRankingReveal({ doc = document } = {}) {
  const win = doc.defaultView || globalThis;
  let root = null;
  let generation = 0;
  let timers = [];
  let previousFocus = null;
  let callbacks = {};
  let continued = false;
  let locked = true;
  let frame = null;
  const make = (tag, className, text) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  };
  const later = (fn, ms, token) => {
    timers.push(win.setTimeout(() => { if (root && generation === token) fn(); }, ms));
  };
  const validRank = rank => Number.isSafeInteger(rank) && rank > 0;
  const time = ms => typeof ms === 'number' && Number.isFinite(ms) && ms >= 0 ? `${(ms / 1000).toFixed(3)}秒` : '記録なし';
  function close() {
    generation++;
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = null;
    timers.forEach(id => win.clearTimeout(id));
    timers = [];
    if (!root) return;
    const old = root;
    root = null;
    if (old.open && typeof old.close === 'function') old.close();
    old.remove();
    previousFocus?.focus?.({ preventScroll: true });
    callbacks = {};
  }
  function dismiss() {
    if (locked || !root) return;
    const callback = callbacks.onClose;
    close();
    callback?.();
  }
  async function open({ getData, onContinue, onClose } = {}) {
    close();
    const token = generation;
    callbacks = { onContinue, onClose };
    continued = false;
    locked = true;
    previousFocus = doc.activeElement;
    root = make('dialog', 'ranking-reveal');
    root.setAttribute('aria-label', '今日のランキング結果');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('closedby', 'none');
    root.tabIndex = -1;
    const panel = make('div', 'ranking-reveal__panel');
    const header = make('header', 'ranking-reveal__header');
    header.append(make('span', 'ranking-reveal__brand', 'XBRAID CHALLENGE'));
    const exit = make('button', 'ranking-reveal__close', '×');
    exit.type = 'button';
    exit.disabled = true;
    exit.setAttribute('aria-label', '終了して待機画面へ');
    exit.addEventListener('click', dismiss);
    header.append(exit);
    const context = make('p', 'ranking-reveal__context', 'TODAY’S RANKING');
    const announce = make('section', 'ranking-reveal__announce');
    announce.setAttribute('aria-live', 'polite');
    announce.setAttribute('aria-atomic', 'true');
    announce.append(make('h2', 'ranking-reveal__state', '順位を確認中…'));
    const board = make('section', 'ranking-reveal__board');
    board.hidden = true;
    const footer = make('footer', 'ranking-reveal__footer');
    const hint = make('p', 'ranking-reveal__hint', '今日のチャレンジをチェック');
    const next = make('button', 'ranking-reveal__next', '終了して待機画面へ');
    next.type = 'button';
    next.disabled = true;
    next.addEventListener('click', () => {
      if (locked || next.disabled || continued || !root || generation !== token) return;
      continued = true;
      const callback = callbacks.onContinue;
      close();
      callback?.();
    });
    footer.append(hint, next);
    panel.append(header, context, announce, board, footer);
    root.append(panel);
    root.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); dismiss(); }
      if (locked && ['Tab', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) { event.preventDefault(); return; }
      if (event.key === 'Tab') {
        const last = next.disabled ? exit : next;
        if (event.shiftKey && doc.activeElement === exit) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); exit.focus(); }
      }
    });
    doc.body.append(root);
    if (typeof root.showModal === 'function') root.showModal();
    else root.setAttribute('open', '');
    root.focus({ preventScroll: true });
    let data;
    try { data = await getData(); }
    catch { data = { status: 'error' }; }
    if (!root || token !== generation) return;
    data = data || { status: 'error' };
    const own = data.status === 'saved' && validRank(data.ownAttempt?.rank) ? data.ownAttempt : null;
    context.textContent = `${data.day ? `${data.day} · ` : ''}今日のランキング${data.scope === 'preview' ? '（プレビュー）' : ''}`;
    announce.replaceChildren();
    if (own) {
      announce.append(make('p', 'ranking-reveal__eyebrow', 'あなたの順位'));
      const rank = make('h2', 'ranking-reveal__rank');
      rank.append(make('strong', '', own.rank), make('span', '', '位'));
      announce.append(rank, make('p', 'ranking-reveal__name', own.nickname || data.nickname || 'あなた'));
      announce.append(make('p', 'ranking-reveal__time', time(own.ms)));
      if (own.rank > 10) announce.append(make('p', 'ranking-reveal__outside', 'TOP10圏外'));
    } else {
      const labels = { unregistered: 'ランキング未登録', no_score: '記録なし', saved: '今日の順位はありません', error: '順位を確認できません' };
      announce.append(make('p', 'ranking-reveal__eyebrow', 'YOUR RESULT'));
      announce.append(make('h2', 'ranking-reveal__state', labels[data.status] || labels.error));
      if (data.message) announce.append(make('p', 'ranking-reveal__message', data.message));
    }
    board.append(make('h2', 'ranking-reveal__board-title', '今日の TOP 10'));
    const scroll = make('div', 'ranking-reveal__scroll');
    scroll.tabIndex = 0;
    scroll.setAttribute('role', 'region');
    scroll.setAttribute('aria-label', '今日のランキング一覧。スクロールできます');
    const list = make('ol', 'ranking-reveal__list');
    // Never pad or seed the leaderboard. Its numeric labels are supplied ranks.
    const entries = (Array.isArray(data.entries) ? data.entries : [])
      .filter(entry => entry && validRank(entry.rank) && entry.rank <= 10)
      .sort((a, b) => a.rank - b.rank).slice(0, 10);
    let ownRow = null;
    function row(entry, isOwn) {
      const item = make('li', `ranking-reveal__row${isOwn ? ' ranking-reveal__row--own' : ''}`);
      item.value = entry.rank;
      item.append(make('b', 'ranking-reveal__place', `${entry.rank}位`));
      const name = make('span', 'ranking-reveal__row-name', entry.nickname || 'ゲスト');
      if (isOwn) name.append(make('small', '', 'あなた'));
      item.append(name, make('strong', 'ranking-reveal__score', time(entry.ms)));
      if (isOwn) ownRow = item;
      return item;
    }
    entries.forEach(entry => {
      // Same rank alone may be a tie; never identify a different player's row as yours.
      const isOwn = !!own && entry.rank === own.rank && entry.nickname === own.nickname && entry.ms === own.ms;
      list.append(row(entry, isOwn));
    });
    scroll.append(list);
    if (!entries.length) {
      scroll.append(make('p', 'ranking-reveal__empty', data.status === 'error' ? 'ランキングを取得できませんでした' : '今日のランキングはまだありません'));
      if (data.status === 'error' && data.message) scroll.append(make('p', 'ranking-reveal__message', data.message));
    }
    if (own && !ownRow) {
      scroll.append(make('p', 'ranking-reveal__separator', own.rank > 10 ? 'あなたの記録 · TOP10圏外' : 'あなたの記録'));
      const separate = make('ol', 'ranking-reveal__list');
      separate.append(row(own, true));
      scroll.append(separate);
    }
    board.append(scroll);
    hint.textContent = '3秒後、今日のランキングへ';
    const unlock = () => {
      // This runs only after the last frame has physically placed the list at #1.
      scroll.scrollTop = 0;
      scroll.setAttribute('data-running', 'false');
      locked = false;
      next.disabled = false;
      exit.disabled = false;
      hint.textContent = 'スクロールしてランキングをチェック';
    };
    for (const eventName of ['wheel', 'touchmove']) {
      scroll.addEventListener(eventName, event => { if (locked) event.preventDefault(); }, { passive: false });
    }
    later(() => {
      announce.hidden = true;
      board.hidden = false;
      const reduced = win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const desired = ownRow && own.rank !== 1 ? Math.max(0, ownRow.offsetTop - (scroll.clientHeight - ownRow.offsetHeight) / 2) : 0;
      const start = Math.min(desired, Math.max(0, scroll.scrollHeight - scroll.clientHeight));
      if (reduced || start <= 0) { unlock(); return; }
      scroll.setAttribute('data-running', 'true');
      scroll.scrollTop = start;
      hint.textContent = '1位までランキング発表中…';
      const started = win.performance.now();
      const duration = 2400;
      const animate = timestamp => {
        frame = null;
        if (!root || generation !== token) return;
        const progress = Math.min(1, Math.max(0, (timestamp - started) / duration));
        // Cubic ease-out: a clear climb with a gentle landing on the first place.
        scroll.scrollTop = start * (1 - progress) ** 3;
        if (progress >= 1) unlock();
        else frame = win.requestAnimationFrame(animate);
      };
      frame = win.requestAnimationFrame(animate);
    }, 3000, token);
  }
  return { open, close, isOpen: () => !!root };
}

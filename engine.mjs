export const SINKING_MS = 1600;
export const LANDING_MS = 1000;
export const RESPONSE_WINDOW_MS = 1000;
// A steady 4 taps/s lands a fish in about 9.75s; 5–6 taps/s in 4–6s.
// Keep the rules time-based and predictable so a short pause is recoverable.
export const FIGHT_START_DISTANCE = 64;
export const FIGHT_ESCAPE_DISTANCE = 100;
export const FIGHT_DRIFT_PER_SECOND = 10;
export const REEL_PER_TAP = 4;
export const FIGHT_TICK_MS = 50;
export const FIGHT_GRACE_MS = 600;
const ACTIVE_STATES = new Set(['sinking', 'waiting', 'bite', 'fighting', 'landed']);

export class FishingGame {
  constructor({now=()=>performance.now(), random=()=>Math.random(), schedule=(fn,ms)=>setTimeout(fn,ms), cancel=id=>clearTimeout(id), frame=fn=>requestAnimationFrame(fn), cancelFrame=id=>cancelAnimationFrame(id), onChange=()=>{}}={}) {
    Object.assign(this,{now,random,schedule,cancel,frame,cancelFrame,onChange});
    this.state='ready'; this.result=null; this.token=0;
    this.timer=this.expiry=this.raf=null; this.biteAt=null; this.landedAt=null;
    this.reactionMs=null; this.fight=null;
  }
  clear() {
    this.cancel(this.timer); this.cancel(this.expiry); this.cancelFrame(this.raf);
    this.timer=this.expiry=this.raf=null; this.token++;
  }
  isCurrent(token,state) { return token===this.token && this.state===state; }
  start() {
    if(ACTIVE_STATES.has(this.state)) return;
    this.clear(); this.result=null; this.biteAt=null; this.landedAt=null; this.reactionMs=null; this.fight=null; this.state='sinking';
    const token=this.token;
    this.onChange(this);
    if(!this.isCurrent(token,'sinking')) return;
    this.timer=this.schedule(()=>{
      if(!this.isCurrent(token,'sinking')) return;
      this.timer=null; this.state='waiting'; this.onChange(this);
      if(!this.isCurrent(token,'waiting')) return;
      this.timer=this.schedule(()=>{
        if(!this.isCurrent(token,'waiting')) return;
        this.timer=null;
        this.raf=this.frame(()=>{
          if(!this.isCurrent(token,'waiting')) return;
          this.raf=null; this.biteAt=this.now(); this.state='bite'; this.onChange(this);
          if(!this.isCurrent(token,'bite')) return;
          this.expiry=this.schedule(()=>{
            if(this.isCurrent(token,'bite')) this.finish('miss');
          },RESPONSE_WINDOW_MS);
        });
      },1700+this.random()*3300);
    },SINKING_MS);
  }
  tap() {
    if(this.state==='waiting') this.finish('early');
    else if(this.state==='bite') {
      const ms=Math.max(0,this.now()-this.biteAt);
      if(ms<=RESPONSE_WINDOW_MS) this.beginFight(ms);
      else this.finish('miss');
    } else if(this.state==='fighting') {
      // Apply elapsed time first: a delayed timer must not let an escaped fish
      // be rescued by a late tap.
      this.advanceFight();
      if(this.state!=='fighting') return;
      this.fight=Object.freeze({...this.fight,
        distance:Math.max(0,this.fight.distance-REEL_PER_TAP),
        taps:this.fight.taps+1
      });
      if(this.fight.distance===0) this.finish('catch',this.reactionMs);
    }
  }
  beginFight(ms) {
    this.clear();
    // Reaction time is independent of how long reeling or landing takes.
    this.reactionMs=ms;
    const startedAt=this.now();
    this.fight=Object.freeze({distance:FIGHT_START_DISTANCE,taps:0,startedAt,
      lastUpdatedAt:startedAt,graceUntil:startedAt+FIGHT_GRACE_MS});
    this.state='fighting';
    const token=this.token;
    this.onChange(this);
    if(this.isCurrent(token,'fighting')) this.scheduleFightTick(token);
  }
  advanceFight() {
    if(this.state!=='fighting') return;
    const lastUpdatedAt=Math.max(this.fight.lastUpdatedAt,this.now());
    const elapsed=Math.max(0,lastUpdatedAt-this.fight.graceUntil);
    // Calculate from elapsed time and total taps, not timer count, so slow
    // frames and delayed timers do not change the rules or accumulate drift.
    const distance=Math.max(0,Math.min(FIGHT_ESCAPE_DISTANCE,
      FIGHT_START_DISTANCE+FIGHT_DRIFT_PER_SECOND*elapsed/1000-REEL_PER_TAP*this.fight.taps));
    this.fight=Object.freeze({...this.fight,distance,lastUpdatedAt});
    if(distance===FIGHT_ESCAPE_DISTANCE) this.finish('escape',this.reactionMs);
  }
  scheduleFightTick(token) {
    this.timer=this.schedule(()=>{
      if(!this.isCurrent(token,'fighting')) return;
      this.timer=null;
      this.advanceFight();
      if(this.isCurrent(token,'fighting')) this.scheduleFightTick(token);
    },FIGHT_TICK_MS);
  }
  finish(outcome,ms=null) {
    this.clear();
    this.result=Object.freeze({outcome,ms});
    this.state=outcome==='catch'?'landed':'result';
    this.landedAt=outcome==='catch'?this.now():null;
    this.onChange(this);
  }
  revealResult() {
    // Landing is a stable screen. Only an explicit action after the visual
    // finishes can reveal the result; reeling taps never advance this state.
    if(this.state!=='landed'||this.now()<this.landedAt+LANDING_MS) return false;
    this.clear(); this.state='result'; this.onChange(this);
    return true;
  }
  reset() {
    this.clear(); this.state='ready'; this.result=null; this.biteAt=null; this.landedAt=null; this.reactionMs=null; this.fight=null; this.onChange(this);
  }
}
export function cleanScores(raw){return Array.isArray(raw)?raw.filter(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=RESPONSE_WINDOW_MS).sort((a,b)=>a-b).slice(0,3):[];}
export function addScore(scores,ms){return cleanScores([...scores,ms]);}
export function formatSeconds(ms){return (ms/1000).toFixed(3);}
export function bestOfRounds(rounds){const valid=rounds.filter(r=>r.outcome==='catch'&&typeof r.ms==='number'&&Number.isFinite(r.ms)&&r.ms>=0&&r.ms<=RESPONSE_WINDOW_MS).map(r=>r.ms);return valid.length?Math.min(...valid):null;}

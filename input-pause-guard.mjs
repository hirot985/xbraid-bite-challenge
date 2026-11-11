/**
 * Stops carried-over taps from advancing a newly displayed screen.
 *
 * begin(minDelayMs = 1700, quietMs = 650) starts a new lock. Readiness requires
 * both the minimum display time and a quiet interval since begin/the last poke.
 * poke() returns true and extends the quiet interval only while locked; once
 * ready it returns false, so a deliberate action is not consumed or relocked.
 * ready() returns a boolean and catches up even if the timer was delayed.
 * clear() cancels the lock and restores readiness. onChange(guard) runs on
 * begin and whenever readiness changes, allowing disabled buttons to update
 * without another input. It is safe to clear/restart from that callback.
 *
 * Inject a monotonic now() clock, schedule(fn, milliseconds), cancel(id), and
 * onChange for deterministic testing. No motion preference bypasses this guard.
 */
export class InputPauseGuard {
  constructor({now=()=>performance.now(),schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id),onChange=()=>{}}={}) {
    Object.assign(this,{now,schedule,cancel,onChange});
    this.timer=null; this.token=0; this.locked=false;
    this.minUntil=null; this.quietUntil=null; this.quietMs=0;
  }
  begin(minDelayMs=1700,quietMs=650) {
    if(!Number.isFinite(minDelayMs)||minDelayMs<0||!Number.isFinite(quietMs)||quietMs<0) {
      throw new TypeError('Input pause delays must be finite, non-negative milliseconds');
    }
    this.cancelTimer();
    const now=this.now();
    this.minUntil=now+minDelayMs; this.quietUntil=now+quietMs; this.quietMs=quietMs;
    this.locked=minDelayMs>0||quietMs>0;
    if(this.locked) this.scheduleCheck();
    this.onChange(this);
  }
  poke() {
    if(this.ready()) return false;
    this.quietUntil=this.now()+this.quietMs;
    this.scheduleCheck();
    return true;
  }
  ready() {
    if(this.locked&&this.now()>=Math.max(this.minUntil,this.quietUntil)) this.unlock();
    return !this.locked;
  }
  clear() {
    const changed=this.locked;
    this.cancelTimer();
    this.locked=false; this.minUntil=this.quietUntil=null; this.quietMs=0;
    if(changed) this.onChange(this);
  }
  cancelTimer() {
    if(this.timer!==null) this.cancel(this.timer);
    this.timer=null; this.token++;
  }
  scheduleCheck() {
    this.cancelTimer();
    const token=this.token;
    this.timer=this.schedule(()=>{
      if(token!==this.token||!this.locked) return;
      this.timer=null;
      // An early callback must not unlock the screen or lose its wakeup.
      if(this.now()<Math.max(this.minUntil,this.quietUntil)) this.scheduleCheck();
      else this.unlock();
    },Math.max(0,Math.max(this.minUntil,this.quietUntil)-this.now()));
  }
  unlock() {
    this.cancelTimer(); this.locked=false; this.onChange(this);
  }
}

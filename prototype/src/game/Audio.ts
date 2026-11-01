/** Lightweight original synthesized placeholder SFX. Replace with mixed, licensed sound design. */
export class AudioFx {
  enabled=true;
  private ctx:AudioContext | null=null;
  unlock(){
    if(!this.enabled) return;
    try {this.ctx ??=new AudioContext(); if(this.ctx.state==='suspended')void this.ctx.resume();} catch{ /* no audio */ }
  }
  tone(kind:'gate'|'hit'|'shot'|'win'|'lose'){
    if(!this.enabled || !this.ctx) return;
    const ctx=this.ctx, now=ctx.currentTime;
    const oscillator=ctx.createOscillator(), gain=ctx.createGain();
    oscillator.type=kind==='shot'?'triangle':'sine';
    const start={gate:540,hit:110,shot:660,win:450,lose:165}[kind];
    oscillator.frequency.setValueAtTime(start,now);
    oscillator.frequency.exponentialRampToValueAtTime(kind==='win'?880:kind==='hit'?55:start*1.22,now+0.12);
    gain.gain.setValueAtTime(kind==='shot'?0.009:0.045,now);
    gain.gain.exponentialRampToValueAtTime(0.0001,now+0.16);
    oscillator.connect(gain).connect(ctx.destination); oscillator.start(now); oscillator.stop(now+0.17);
  }
}

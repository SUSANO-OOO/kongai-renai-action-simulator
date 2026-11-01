/** Continuous X steering. Three perceived lanes, no lane snapping. */
export class DragInput {
  targetX=0;
  private pointerId:number | null=null;
  private startClientX=0;
  private startX=0;
  private readonly maxX=4.08;
  constructor(private canvas:HTMLCanvasElement){
    canvas.addEventListener('pointerdown', this.down);
    canvas.addEventListener('pointermove', this.move);
    canvas.addEventListener('pointerup', this.up);
    canvas.addEventListener('pointercancel', this.up);
    canvas.addEventListener('lostpointercapture', this.up);
  }
  private down=(e:PointerEvent)=>{
    if(this.pointerId!==null) return;
    this.pointerId=e.pointerId; this.startClientX=e.clientX; this.startX=this.targetX;
    try{this.canvas.setPointerCapture(e.pointerId);}catch{}
    e.preventDefault();
  };
  private move=(e:PointerEvent)=>{
    if(e.pointerId!==this.pointerId)return;
    const pixels=this.canvas.clientWidth;
    const dx=(e.clientX-this.startClientX)/Math.max(1,pixels);
    this.targetX=Math.max(-this.maxX,Math.min(this.maxX,this.startX+dx*10.3));
    e.preventDefault();
  };
  private up=(e:PointerEvent)=>{if(e.pointerId===this.pointerId)this.pointerId=null;};
  reset(){this.pointerId=null;this.targetX=0;}
  dispose(){
    this.canvas.removeEventListener('pointerdown',this.down);this.canvas.removeEventListener('pointermove',this.move);
    this.canvas.removeEventListener('pointerup',this.up);this.canvas.removeEventListener('pointercancel',this.up);
    this.canvas.removeEventListener('lostpointercapture',this.up);
  }
}

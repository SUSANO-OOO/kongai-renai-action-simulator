import * as THREE from 'three';
import type {GateChoice, StageDefinition, StageEvent, SkinId, Quality} from './types';
import {SKIN_COLORS} from './save';
import {approximateTroopLog10} from './format';

const LANE_X = 3;
const HERO_Z = 5;
const MAX_VISUAL = 360;
const BAD='#ff6a7e', GOOD='#53ebd4', GOLD='#fac57e', WET='#c47682';

interface RenderedEvent { group:THREE.Group; event:StageEvent; hpBar?:THREE.Mesh; }
interface Projectile {mesh:THREE.Mesh; active:boolean; speed:number; life:number;}
const clamp=(a:number,b:number,c:number)=>Math.max(b,Math.min(c,a));

function material(color:string, emissive='#000000', opacity=1):THREE.MeshStandardMaterial{
  return new THREE.MeshStandardMaterial({color,roughness:.45,metalness:.08,emissive,emissiveIntensity:.25,transparent:opacity<1,opacity});
}
function mesh(geometry:THREE.BufferGeometry, color:string, emissive='#000000',opacity=1):THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>{
  return new THREE.Mesh(geometry,material(color,emissive,opacity));
}
function labelSprite(text:string, fill:string, width=2.2, height=.72):THREE.Sprite {
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;
  const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='rgba(20,17,32,.84)';ctx.beginPath();ctx.roundRect(8,10,496,140,22);ctx.fill();
  ctx.strokeStyle=fill;ctx.lineWidth=7;ctx.stroke();
  ctx.shadowColor=fill;ctx.shadowBlur=10;ctx.fillStyle='#ffffff';
  ctx.font='800 72px system-ui,-apple-system,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(text,256,79,478);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthWrite:false,transparent:true}));
  sprite.scale.set(width,height,1); return sprite;
}
function gateText(choice:GateChoice):string{
  switch(choice.action){
    case 'multiply': return `×${choice.value}`;
    case 'add':return `+${choice.value}`;
    case 'subtract':return `−${choice.value}`;
    case 'divide':return `÷${choice.value}`;
    case 'attack':return `ATK +${choice.value}`;
    case 'rapid':return `RAPID +${choice.value}`;
    case 'shield':return `SHIELD +${choice.value}`;
  }
}
function gateColor(choice:GateChoice):string{
  if(choice.action==='multiply'||choice.action==='add')return '#36bfff';
  if(choice.action==='subtract'||choice.action==='divide')return '#fa3c54';
  if(choice.action==='shield')return '#9ceab1';
  return GOLD;
}

/** 3D prototype renderer. All geometry is real WebGL geometry; final GLB modelling is still pending. */
export class Render3D {
  readonly scene=new THREE.Scene();
  readonly camera=new THREE.PerspectiveCamera(58,1,.1,300);
  readonly renderer:THREE.WebGLRenderer;
  private world=new THREE.Group();
  private actor=new THREE.Group();
  private actorShell!:THREE.Mesh;
  private actorTail:THREE.Mesh[]=[];
  private crowdHeads!:THREE.InstancedMesh;
  private crowdTails!:THREE.InstancedMesh;
  private events=new Map<string,RenderedEvent>();
  private projects:Projectile[]=[];
  private particleSystem!:THREE.InstancedMesh;
  private lights:THREE.PointLight[]=[];
  private quality:Quality='normal';
  private skin:SkinId='teal';
  private motionReduced=false;
  private width=1;private height=1;
  private dummy=new THREE.Object3D();
  private densityPrevious=-1;
  private markerMeshes:THREE.Mesh[]=[];
  private ribs:THREE.Mesh[]=[];
  private glowRings:THREE.Mesh[]=[];

  constructor(private canvas:HTMLCanvasElement){
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.35;
    this.scene.background=new THREE.Color('#170d1a');
    this.scene.fog=new THREE.FogExp2('#351326',.021);
    this.camera.position.set(0,9.25,18.4);
    this.camera.lookAt(0,.7,-22);
    const ambient=new THREE.HemisphereLight('#d5d7ef','#45192b',1.9);this.scene.add(ambient);
    const key=new THREE.DirectionalLight('#f6f4fe',2.15);key.position.set(-5,12,8);this.scene.add(key);
    const left=new THREE.PointLight('#f15783',36,38);left.position.set(-5,3,-6);this.scene.add(left);
    const right=new THREE.PointLight('#72d1cc',22,36);right.position.set(5,4,-16);this.scene.add(right);
    this.lights.push(left,right);
    this.scene.add(this.world);this.scene.add(this.actor);
    this.createActor();this.createCrowd();this.createProjectiles();this.createParticles();
    window.addEventListener('resize',this.resize);
    this.resize();
  }

  setQuality(q:Quality){this.quality=q;this.resize();this.densityPrevious=-1;}
  setReducedMotion(v:boolean){this.motionReduced=v;}
  setSkin(skin:SkinId){
    this.skin=skin;
    const newColor=new THREE.Color(SKIN_COLORS[skin]);
    (this.actorShell.material as THREE.MeshStandardMaterial).color.copy(newColor);
    (this.crowdHeads.material as THREE.MeshStandardMaterial).color.copy(newColor);
    (this.crowdTails.material as THREE.MeshStandardMaterial).color.copy(newColor);
    for(const tail of this.actorTail)(tail.material as THREE.MeshStandardMaterial).color.copy(newColor);
  }
  private resize=()=>{
    this.width=this.canvas.clientWidth||window.innerWidth;
    this.height=this.canvas.clientHeight||window.innerHeight;
    const dpr=window.devicePixelRatio||1;
    this.renderer.setPixelRatio(Math.min(this.quality==='low'?1:this.quality==='normal'?1.5:2,dpr));
    this.renderer.setSize(this.width,this.height,false);
    this.camera.aspect=this.width/this.height;
    this.camera.fov=clamp(54+(.48-this.camera.aspect)*5,52,62);
    this.camera.updateProjectionMatrix();
  };

  load(stage:StageDefinition){
    this.cleanupWorld();
    this.world=new THREE.Group();this.scene.add(this.world);
    this.scene.background=new THREE.Color(stage.colors.shadow);
    this.scene.fog=new THREE.FogExp2(stage.colors.shadow,.024);
    this.createTrack(stage);
    this.events.clear();
    for(const ev of stage.events){
      const item=this.createEvent(ev);
      this.world.add(item.group);
      this.events.set(ev.id,item);
    }
    this.densityPrevious=-1;
    this.actor.position.set(0,0,HERO_Z);
  }

  private cleanupWorld(){
    this.world.traverse(child=>{
      if(child instanceof THREE.Mesh){
        child.geometry.dispose();
        const materials=Array.isArray(child.material)?child.material:[child.material];
        for(const m of materials)m.dispose();
      } else if(child instanceof THREE.Sprite){
        child.material.map?.dispose();child.material.dispose();
      }
    });
    this.scene.remove(this.world);this.markerMeshes=[];this.ribs=[];this.glowRings=[];
  }

  private createTrack(stage:StageDefinition){
    // Sculpted floor mesh instead of a flat billboard. Alternating lateral ridges keep 3 lanes visible.
    const geo=new THREE.PlaneGeometry(9.7,230,20,80);
    geo.rotateX(-Math.PI/2);
    const pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),z=pos.getZ(i);
      const lateral=.085*Math.sin(x*3.3)+.04*Math.sin(x*8.1+z*.31);
      pos.setY(i,lateral + .035*Math.sin(z*.39+x*1.8));
    }
    geo.computeVertexNormals();
    const floor=mesh(geo,stage.colors.tissue);
    floor.position.z=-47;floor.material.roughness=.3;floor.material.metalness=.04;this.world.add(floor);

    const under=mesh(new THREE.BoxGeometry(10.1,.5,230),stage.colors.shadow);under.position.set(0,-.39,-47);this.world.add(under);
    // Vertical soft tissue walls with polygonal thickness / glancing highlights.
    for(const sign of [-1,1]){
      const vertices:number[]=[],indices:number[]=[];
      const columns=50, rows=8;
      for(let iz=0;iz<=columns;iz++){
        const z=43-(230*iz/columns);
        for(let iy=0;iy<=rows;iy++){
          const y=iy/rows*5.5;
          const x=sign*(4.81+Math.sin(z*.11+y*1.23)*.17+(.28*Math.sin(y/5.5*Math.PI)));
          vertices.push(x,y+0.09*Math.sin(z*.2+y),z);
        }
      }
      for(let iz=0;iz<columns;iz++)for(let iy=0;iy<rows;iy++){
        const a=iz*(rows+1)+iy,b=a+rows+1;
        indices.push(a,b,a+1,b,b+1,a+1);
      }
      const wallGeo=new THREE.BufferGeometry();
      wallGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
      wallGeo.setIndex(indices);wallGeo.computeVertexNormals();
      const wallMat=material(stage.colors.tissue);wallMat.side=THREE.DoubleSide;wallMat.roughness=.65;
      const wall=new THREE.Mesh(wallGeo,wallMat);this.world.add(wall);
      const lip=mesh(new THREE.CylinderGeometry(.24,.32,230,7),stage.colors.tissue);
      lip.rotation.x=Math.PI/2;lip.position.set(sign*4.73,.23,-47);this.world.add(lip);
    }
    // Readable three-groove pattern, but steering remains continuous in X.
    for(const x of [-1.5,1.5]){
      const curvePoints:THREE.Vector3[]=[];
      for(let i=0;i<=48;i++){
        const z=38-i*4.65;
        curvePoints.push(new THREE.Vector3(x+Math.sin(z*.09)*.032,.08,z));
      }
      const marker=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curvePoints),120,.035,4,false),'#dfb8bd');
      marker.material.transparent=true;marker.material.opacity=.37;
      this.world.add(marker);this.markerMeshes.push(marker);
    }
    // Mobile-friendly rhythmic biological rib silhouettes instead of a heavy shader.
    const torusGeo=new THREE.TorusGeometry(4.72,.14,5,30,Math.PI);
    for(let i=0;i<17;i++){
      const rib=mesh(torusGeo.clone(),'#ca7183');rib.rotation.x=Math.PI/2;rib.position.set(0,3.2,-135+i*13.5);
      rib.material.transparent=true;rib.material.opacity=.25;
      this.world.add(rib);this.ribs.push(rib);
    }
    for(let i=0;i<20;i++){
      const x= (i%2===0?-1:1)*4.53;
      const z=-145+i*10;
      const lobe=mesh(new THREE.SphereGeometry(.32,9,6),WET);
      lobe.scale.set(.6,1.3,.9);lobe.position.set(x,.7+Math.sin(i*2)*.3,z);
      this.world.add(lobe);this.glowRings.push(lobe);
    }
  }

  private createActor(){
    const head=mesh(new THREE.SphereGeometry(.38,18,12),SKIN_COLORS[this.skin]);
    head.scale.set(.8,1.1,1.15);head.position.set(0,.92,-.1);head.material.roughness=.25;head.material.metalness=.13;
    this.actorShell=head;this.actor.add(head);
    const core=mesh(new THREE.SphereGeometry(.12,12,8),'#effffc','#87ffdc');
    core.scale.set(.75,.9,.5);core.position.set(.11,1.04,-.44);this.actor.add(core);
    const crest=mesh(new THREE.TorusGeometry(.29,.018,6,28),'#ecfff5');crest.rotation.y=.22;crest.position.set(0,1.02,-.22);this.actor.add(crest);
    const tailMat=material(SKIN_COLORS[this.skin]);
    for(let i=0;i<6;i++){
      const seg=new THREE.Mesh(new THREE.CylinderGeometry(.065-(i*.008),.052-(i*.007),.38,6),tailMat.clone());
      this.actor.add(seg);this.actorTail.push(seg);
    }
    const halo=mesh(new THREE.TorusGeometry(.53,.025,6,36),SKIN_COLORS[this.skin],'#67d8c7',.4);
    halo.rotation.x=Math.PI/2;halo.position.set(0,.15,0);this.actor.add(halo);
  }
  private createCrowd(){
    const head=new THREE.SphereGeometry(.145,9,7);head.scale(.85,1.15,1.12);
    const tail=new THREE.CylinderGeometry(.023,.01,.32,4);
    this.crowdHeads=new THREE.InstancedMesh(head,material(SKIN_COLORS[this.skin]),MAX_VISUAL);
    this.crowdTails=new THREE.InstancedMesh(tail,material(SKIN_COLORS[this.skin]),MAX_VISUAL);
    this.crowdHeads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.crowdTails.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.crowdHeads,this.crowdTails);
    this.crowdHeads.count=0;this.crowdTails.count=0;
  }
  private createParticles(){
    this.particleSystem=new THREE.InstancedMesh(new THREE.SphereGeometry(.035,5,4),material('#e8b3c1'),95);
    this.particleSystem.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.particleSystem);
  }
  private createProjectiles(){
    const geometry=new THREE.SphereGeometry(.085,8,6);
    const mat=material('#b7fff1','#39edd0');mat.emissiveIntensity=2.2;
    for(let i=0;i<30;i++){
      const piece=new THREE.Mesh(geometry,mat);piece.visible=false;piece.scale.set(.7,.7,2.8);
      this.scene.add(piece);this.projects.push({mesh:piece,active:false,speed:50,life:0});
    }
  }
  fire(fromX:number,targetX:number){
    const bullet=this.projects.find(p=>!p.active);if(!bullet)return;
    bullet.active=true;bullet.mesh.visible=true;bullet.mesh.position.set(fromX+((Math.random()-.5)*.22),.9,HERO_Z-1);
    bullet.mesh.userData.vx=(targetX-fromX)*.085;
    bullet.life=1.3;
  }

  private createEvent(event:StageEvent):RenderedEvent{
    const group=new THREE.Group();
    if(event.type==='gate_row'){
      for(const choice of event.choices){
        const x=choice.lane*LANE_X,color=gateColor(choice);
        const opacity=.20;
        const materialBack=new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false});
        const panel=new THREE.Mesh(new THREE.PlaneGeometry(2.82,2.35),materialBack);
        panel.position.set(x,1.22,0);group.add(panel);
        const frameMat=material(color,color);frameMat.emissiveIntensity=1.0;
        for(const dir of [-1,1]){
          const column=new THREE.Mesh(new THREE.BoxGeometry(.07,2.44,.15),frameMat.clone());
          column.position.set(x+dir*1.41,1.22,0);group.add(column);
        }
        const top=new THREE.Mesh(new THREE.BoxGeometry(2.82,.08,.15),frameMat.clone());
        top.position.set(x,2.46,0);group.add(top);
        const txt=labelSprite(gateText(choice),color,2.35,.74);txt.position.set(x,2.94,.08);group.add(txt);
        const floorStripe=new THREE.Mesh(new THREE.BoxGeometry(2.7,.02,.45),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.32}));
        floorStripe.position.set(x,.13,-.05);group.add(floorStripe);
      }
    } else if(event.type==='obstacle'){
      group.position.x=event.lane*LANE_X;
      const kind=event.kind;
      if(kind==='membrane'||kind==='pulsing'){
        const wall=mesh(new THREE.SphereGeometry(1,18,12),kind==='pulsing'?'#bc596e':'#ba718a');
        wall.scale.set(event.width/2,1.15,.51);wall.position.y=1.11;wall.material.roughness=.29;group.add(wall);
        for(let i=0;i<5;i++){
          const vein=mesh(new THREE.TorusGeometry(.31+i*.12,.02,4,32),'#eaadc0');
          vein.scale.x=1.38;vein.position.y=.5+i*.28;vein.rotation.y=.25;group.add(vein);
        }
      }else if(kind==='spike'){
        for(let i=0;i<8;i++){
          const cone=mesh(new THREE.ConeGeometry(.17,.85,7),'#f6a28c');
          cone.rotation.z=Math.PI/2;cone.position.set(-1.05+(i%4)*.7,.43+Math.floor(i/4)*.8,(i%2)*.24);group.add(cone);
        }
      }else if(kind==='rotor'){
        const hub=mesh(new THREE.SphereGeometry(.32,12,8),'#bf7180');hub.position.y=1.2;group.add(hub);
        for(const angle of [0,Math.PI/2]){
          const bar=mesh(new THREE.CylinderGeometry(.17,.17,3.4,9),'#ec8c8e');bar.rotation.z=angle;bar.position.y=1.2;bar.userData.rotor=true;group.add(bar);
        }
      }else if(kind==='mucus'){
        for(let i=0;i<5;i++){
          const blob=mesh(new THREE.SphereGeometry(.43,11,9),'#c6e4bf','#437e65',.72);
          blob.position.set(-1.15+i*.54,.38+Math.sin(i*3)*.18,Math.cos(i*4)*.18);group.add(blob);
        }
      }else if(kind==='current'){
        for(let i=0;i<8;i++){
          const points=[];
          for(let k=0;k<12;k++)points.push(new THREE.Vector3(-1.5+k*.28,.16+.02*Math.sin(k),Math.sin(k*.43+i*.36)*.26+i*.23-1.0));
          const line=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,.026,5,false),'#cbe8fa');group.add(line);
        }
      }
      const marker=labelSprite({membrane:'MEMBRANE',pulsing:'PULSE',spike:'SPIKES',rotor:'ROTOR',mucus:'SLOW ZONE',current:'CURRENT'}[kind],BAD,2.25,.51);
      marker.position.y=3.45;group.add(marker);
    } else {
      group.position.x=event.lane*LANE_X;
      const boss=event.type==='boss';
      const enemyKind=event.type==='enemy'?event.enemy:event.boss;
      const count=boss?18:enemyKind==='swarm'?14:enemyKind==='scout'?8:10;
      const red=enemyKind.includes('immune')?'#a9dc96':enemyKind.includes('armor')?'#d89fce':'#ff7183';
      const heads=new THREE.InstancedMesh(new THREE.SphereGeometry(boss?.34:.22,9,8),material(red),count);
      const tails=new THREE.InstancedMesh(new THREE.CylinderGeometry(.025,.013,boss?.8:.48,5),material(red),count);
      const dummy=new THREE.Object3D();
      for(let i=0;i<count;i++){
        const x=(i%5-2)*(boss?.34:.31),z=(Math.floor(i/5))*.53;
        dummy.position.set(x, boss?.96:.81,z);dummy.scale.set(1,1.2,1.2);dummy.updateMatrix();heads.setMatrixAt(i,dummy.matrix);
        dummy.position.set(x, boss?.8:.66,z+.33);dummy.rotation.x=Math.PI/2;dummy.scale.set(1,1,1);dummy.updateMatrix();tails.setMatrixAt(i,dummy.matrix);dummy.rotation.x=0;
      }
      group.add(heads,tails);
      if(boss){
        const aura=mesh(new THREE.TorusGeometry(1.25,.055,7,40),'#ffb8a8','#fc7276');aura.rotation.x=Math.PI/2;aura.position.set(0,.13,0);group.add(aura);
        const crown=mesh(new THREE.ConeGeometry(.57,.74,7),GOLD);crown.position.y=2.05;group.add(crown);
      }
      const name=boss?{rival_captain:'RIVAL CAPTAIN',immune_sentinel:'IMMUNE SENTINEL',crowned_rival:'CROWNED RIVAL'}[enemyKind]??'BOSS':enemyKind.toUpperCase();
      const label=labelSprite(name,boss?GOLD:BAD,boss?2.6:1.75,boss?.65:.54);label.position.y=boss?3.7:2.65;group.add(label);
      const hpBg=mesh(new THREE.PlaneGeometry(boss?2.7:1.5,.09),'#34202d');hpBg.position.set(0,boss?3.27:2.34,.05);group.add(hpBg);
      const hpFill=mesh(new THREE.PlaneGeometry(boss?2.65:1.45,.07),boss?GOLD:BAD);hpFill.position.set(0,boss?3.27:2.34,.06);group.add(hpFill);
      return {group,event,hpBar:hpFill};
    }
    return {group,event};
  }

  update(distance:number,playerX:number,troops:bigint,now:number,dt:number,remainingHp:Map<string,number>,running:boolean){
    const sway=this.motionReduced?.12:1;
    const previousX=this.actor.position.x;
    this.actor.position.x=playerX;
    this.actor.position.y=(running?Math.sin(now*5)*.07:.065*Math.sin(now*2))*sway;
    this.actor.rotation.z=clamp((playerX-previousX)*.07,-.15,.15);
    for(let i=0;i<this.actorTail.length;i++){
      const seg=this.actorTail[i];
      const u=i+.5;
      seg.position.set(Math.sin(now*8-i*.54)*(.06+i*.025)*sway,.83-.018*i,.35+u*.29);
      seg.rotation.set(Math.PI/2,.12*Math.sin(now*8-i*.45)*sway,0);
    }
    this.updateCrowd(playerX,troops,now,sway);
    this.updateParticles(distance,now);
    for(const eventView of this.events.values()){
      const ev=eventView.event;
      const relative=ev.at-distance;
      eventView.group.position.z=HERO_Z-relative;
      eventView.group.visible=relative < 142 && relative > -18 && (remainingHp.get(ev.id)??1)>0;
      if(!eventView.group.visible)continue;
      if(ev.type==='obstacle'){
        if(ev.kind==='pulsing')eventView.group.scale.x=.7+.31*(1+Math.sin(now*3.6+ev.at*.2))*.5;
        if(ev.kind==='rotor')eventView.group.rotation.z=now*1.9;
        if(ev.kind==='mucus')eventView.group.scale.y=1+.055*Math.sin(now*2.4);
      }
      if((ev.type==='enemy'||ev.type==='boss')&&eventView.hpBar){
        const ratio=clamp((remainingHp.get(ev.id)??ev.hp)/ev.hp,0,1);
        eventView.hpBar.scale.x=Math.max(.001,ratio);
      }
    }
    for(const p of this.projects){
      if(!p.active)continue;
      p.mesh.position.z -= p.speed*dt;
      p.mesh.position.x += Number(p.mesh.userData.vx??0)*dt*25;
      p.life -=dt;
      if(p.life<=0||p.mesh.position.z < -80){p.active=false;p.mesh.visible=false;}
    }
    this.camera.position.x += (playerX*.12-this.camera.position.x)*Math.min(1,dt*3);
    this.camera.lookAt(this.camera.position.x*.2,.8,-23);
    if(this.lights.length){this.lights[0].intensity=32+4*Math.sin(now*2.8);}
    this.renderer.render(this.scene,this.camera);
  }
  private updateCrowd(playerX:number,troops:bigint,now:number,motion:number){
    let count=0;
    if(troops>1n){
      if(troops<=BigInt(MAX_VISUAL))count=Number(troops-1n);
      else count=clamp(Math.floor(85+approximateTroopLog10(troops)*34),MAX_VISUAL/4,MAX_VISUAL);
    }
    if(this.quality==='low')count=Math.min(count,145);
    if(count!==this.densityPrevious)this.densityPrevious=count;
    this.crowdHeads.count=count;this.crowdTails.count=count;
    for(let i=0;i<count;i++){
      const row=Math.floor(Math.sqrt(i)),column=i-row*row;
      const spreadX=(column-row)*.30;
      const baseX=clamp(playerX+spreadX,-4.16,4.16);
      const baseZ=HERO_Z+1.05+row*.39+((i%7)*.05);
      const s=.78+((i*17)%11)/55;
      const swing=Math.sin(now*8.2+i*1.7)*.055*motion;
      this.dummy.position.set(baseX+swing,.54+Math.sin(now*7+i)*.045*motion,baseZ);
      this.dummy.rotation.set(0,0,0);this.dummy.scale.setScalar(s);this.dummy.updateMatrix();
      this.crowdHeads.setMatrixAt(i,this.dummy.matrix);
      this.dummy.position.set(baseX+swing*.9,.52,baseZ+.30);
      this.dummy.rotation.set(Math.PI/2,.14*Math.sin(now*8-i*.8)*motion,0);
      this.dummy.scale.setScalar(s);this.dummy.updateMatrix();this.crowdTails.setMatrixAt(i,this.dummy.matrix);
    }
    this.crowdHeads.instanceMatrix.needsUpdate=true;this.crowdTails.instanceMatrix.needsUpdate=true;
  }
  private updateParticles(distance:number,now:number){
    const count=this.quality==='low'?36:95;
    this.particleSystem.count=count;
    for(let i=0;i<count;i++){
      const x=Math.sin(i*12.98)*4.7;
      const z=40-((i*7.17+distance*.7)%138);
      const y=.45+((i*3.129)%3.4)+Math.sin(now*.9+i)*.13;
      this.dummy.position.set(x,y,z);
      this.dummy.rotation.set(0,0,0);
      this.dummy.scale.setScalar(.5+(i%5)*.25);this.dummy.updateMatrix();
      this.particleSystem.setMatrixAt(i,this.dummy.matrix);
    }
    this.particleSystem.instanceMatrix.needsUpdate=true;
  }
  getLaneX(lane:number){return lane*LANE_X;}
  dispose(){
    window.removeEventListener('resize',this.resize);
    this.cleanupWorld();
    for(const p of this.projects){this.scene.remove(p.mesh);p.mesh.geometry.dispose();(p.mesh.material as THREE.Material).dispose();}
    this.crowdHeads.geometry.dispose();(this.crowdHeads.material as THREE.Material).dispose();
    this.crowdTails.geometry.dispose();(this.crowdTails.material as THREE.Material).dispose();
    this.particleSystem.geometry.dispose();(this.particleSystem.material as THREE.Material).dispose();
    this.renderer.dispose();
  }
}